// UniVibe — Reinforcement Learning Engine
// Contextual Multi-Armed Bandit with Epsilon-Greedy Strategy
// 
// Architecture:
//   STATE  = encoded user context (preferred genres + experience + recent interactions)
//   ACTION = movie_id to recommend
//   REWARD = user feedback signal (click=+1, view=+0.5, rating=rating-3, ignore=-0.2)
//
// The RL agent learns which movies to recommend in which contexts
// by updating Q-values using temporal difference learning.

const { stmts, db } = require('./database');

// ──────────────────────────────────
// HYPERPARAMETERS
// ──────────────────────────────────
const CONFIG = {
    epsilon: 0.15,            // Exploration rate (15% random exploration)
    epsilonDecay: 0.999,      // Gradual reduction of exploration
    epsilonMin: 0.05,         // Minimum exploration rate
    learningRate: 0.1,        // Alpha: how fast Q-values update
    discountFactor: 0.95,     // Gamma: weight of future rewards
    rewardWeights: {
        click: 1.0,             // User clicked on recommended movie
        view: 0.5,              // User viewed movie detail page
        search: 0.3,            // User searched for a movie
        rating_positive: 2.0,   // User rated >= 4 stars
        rating_neutral: 0.5,    // User rated 3 stars
        rating_negative: -1.0,  // User rated <= 2 stars
        recommend_click: 1.5,   // User clicked a recommendation
        watchlist: 1.2,         // User added movie to watch later
        dwell: 0.8,             // User spent significant time on detail
        ignore: -0.2,           // Recommendation was shown but not clicked
    }
};

// ──────────────────────────────────
// STATE ENCODING
// ──────────────────────────────────

/**
 * Encode the user's current context into a state key.
 * State = primary genre preference + experience preference + time of day.
 * This creates a human-readable state key like "Action|intense|evening"
 */
function encodeState(userProfile, recentInteractions = []) {
    // Extract dominant genre from recent activity or profile
    let dominantGenre = 'general';
    let dominantExperience = 'any';

    // Check recent interactions for patterns
    if (recentInteractions.length > 0) {
        const genreCounts = {};
        const expCounts = {};

        recentInteractions.forEach(interaction => {
            if (interaction.context_genre) {
                genreCounts[interaction.context_genre] = (genreCounts[interaction.context_genre] || 0) + 1;
            }
            if (interaction.context_experience) {
                expCounts[interaction.context_experience] = (expCounts[interaction.context_experience] || 0) + 1;
            }
        });

        // Find most common genre
        const topGenre = Object.entries(genreCounts).sort((a, b) => b[1] - a[1])[0];
        if (topGenre) dominantGenre = topGenre[0];

        // Find most common experience
        const topExp = Object.entries(expCounts).sort((a, b) => b[1] - a[1])[0];
        if (topExp) dominantExperience = topExp[0];
    }

    // Fall back to profile preferences
    if (dominantGenre === 'general' && userProfile.preferred_genres) {
        try {
            const genres = JSON.parse(userProfile.preferred_genres);
            if (genres.length > 0) dominantGenre = genres[0];
        } catch (e) { /* ignore */ }
    }

    if (dominantExperience === 'any' && userProfile.preferred_experience) {
        dominantExperience = userProfile.preferred_experience;
    }

    // Time context (morning, afternoon, evening, night)
    const hour = new Date().getHours();
    let timeSlot;
    if (hour >= 5 && hour < 12) timeSlot = 'morning';
    else if (hour >= 12 && hour < 17) timeSlot = 'afternoon';
    else if (hour >= 17 && hour < 21) timeSlot = 'evening';
    else timeSlot = 'night';

    return `${dominantGenre}|${dominantExperience}|${timeSlot}`;
}

// ──────────────────────────────────
// REWARD CALCULATION
// ──────────────────────────────────

/**
 * Calculate reward signal from a user interaction.
 * Positive interactions (clicks, good ratings) → positive reward.
 * Negative signals (ignores, bad ratings) → negative reward.
 */
function calculateReward(eventType, eventValue = '') {
    switch (eventType) {
        case 'click':
            return CONFIG.rewardWeights.click;
        case 'view':
            return CONFIG.rewardWeights.view;
        case 'search':
            return CONFIG.rewardWeights.search;
        case 'recommend_click':
            return CONFIG.rewardWeights.recommend_click;
        case 'dwell':
            return CONFIG.rewardWeights.dwell;
        case 'watchlist':
            return CONFIG.rewardWeights.watchlist;
        case 'rating': {
            const rating = parseInt(eventValue);
            if (rating >= 4) return CONFIG.rewardWeights.rating_positive;
            if (rating === 3) return CONFIG.rewardWeights.rating_neutral;
            return CONFIG.rewardWeights.rating_negative;
        }
        default:
            return 0;
    }
}

// ──────────────────────────────────
// Q-VALUE UPDATE (TD Learning)
// ──────────────────────────────────

/**
 * Update Q-value for a state-action pair using Temporal Difference learning.
 * 
 * Q(s, a) ← Q(s, a) + α * [R + γ * max Q(s', a') - Q(s, a)]
 * 
 * Where:
 *   α = learning rate
 *   R = immediate reward
 *   γ = discount factor
 *   max Q(s', a') = best expected future reward (estimated from Q-table)
 */
function updateQValue(userUid, stateKey, movieId, reward) {
    const existing = stmts.getQValue.get(userUid, stateKey, movieId);

    let currentQ = existing ? existing.q_value : 0.0;
    let visitCount = existing ? existing.visit_count : 0;

    // Estimate future value (max Q for any action in this state)
    const bestFuture = stmts.getTopQValues.all(userUid, stateKey, 1);
    const maxFutureQ = bestFuture.length > 0 ? bestFuture[0].q_value : 0;

    // TD Update Formula
    const tdTarget = reward + CONFIG.discountFactor * maxFutureQ;
    const tdError = tdTarget - currentQ;
    const newQ = currentQ + CONFIG.learningRate * tdError;

    stmts.upsertQValue.run({
        user_uid: userUid,
        state_key: stateKey,
        movie_id: movieId,
        q_value: newQ,
        visit_count: visitCount + 1,
        last_reward: reward
    });

    return { oldQ: currentQ, newQ, tdError, reward };
}

// ──────────────────────────────────
// RECOMMENDATION GENERATION
// ──────────────────────────────────

/**
 * Generate RL-powered recommendations for a user.
 * Uses epsilon-greedy strategy:
 *   - With probability ε: EXPLORE (random movies from candidate pool)
 *   - With probability 1-ε: EXPLOIT (highest Q-value movies)
 *
 * Falls back to content-based scoring when Q-table is sparse.
 * 
 * @param {string} userUid - User unique ID
 * @param {Array} allMovies - Full movie catalogue
 * @param {number} count - Number of recommendations
 * @param {Object} userProfile - User profile data
 * @returns {Array} recommendations with scores and reasons
 */
function getRecommendations(userUid, allMovies, count = 8, userProfile = null) {
    if (!userProfile) {
        userProfile = stmts.getUserByUid.get(userUid);
    }
    if (!userProfile) return [];

    // Get recent interactions for state encoding
    const recentInteractions = stmts.getUserInteractions.all(userUid, 50);
    const stateKey = encodeState(userProfile, recentInteractions);

    // Get learned Q-values for this state
    const learnedValues = stmts.getTopQValues.all(userUid, stateKey, 100);
    const qMap = new Map();
    learnedValues.forEach(v => qMap.set(v.movie_id, v));

    // Get user ratings for preference awareness
    const userRatings = stmts.getUserRatings.all(userUid);
    const ratedMovies = new Set(userRatings.map(r => r.movie_id));
    const positiveRatedMovies = userRatings.filter(r => r.rating >= 4).map(r => r.movie_id);

    // Get interaction history to detect patterns
    const interactionCounts = stmts.getMovieInteractionCounts.all(userUid);
    const viewedMovies = new Set();
    interactionCounts.forEach(ic => {
        if (ic.event_type === 'view' || ic.event_type === 'click') {
            viewedMovies.add(ic.movie_id);
        }
    });

    // Age filter
    const userAge = userProfile.age || 99;
    const candidates = allMovies.filter(m => userAge >= m.age_limit);

    // Score each candidate
    const scored = candidates.map(movie => {
        let similarityScore = 0;
        let preferenceScore = 0;
        let reasons = [];
        let source = 'hybrid';

        // 1. RL PREFERENCE SCORE (Learned behavior)
        const qEntry = qMap.get(movie.movie_id);
        if (qEntry && qEntry.visit_count > 0) {
            preferenceScore += qEntry.q_value * 2.5; // Strong preference from RL
            reasons.push('learned from your behavior');
            source = 'rl';
        }

        // 2. INTERACTION HISTORY (Search & Click history)
        const hasDirectHistory = interactionCounts.some(ic => 
            ic.movie_id === movie.movie_id && ['click', 'search', 'rating', 'watchlist'].includes(ic.event_type)
        );
        if (hasDirectHistory) {
            preferenceScore += 1.2; 
            reasons.push('based on your search/rating history');
        }

        // 3. CONTENT SIMILARITY SCORE (Matches preferences)
        if (userProfile.preferred_genres) {
            try {
                const preferredGenres = JSON.parse(userProfile.preferred_genres);
                const sharedGenres = movie.genre.filter(g => preferredGenres.includes(g));
                if (sharedGenres.length > 0) {
                    similarityScore += sharedGenres.length * 0.8;
                    reasons.push(`matches your genre interests`);
                }
            } catch (e) { /* ignore */ }
        }

        if (userProfile.preferred_experience && movie.experience_type === userProfile.preferred_experience) {
            similarityScore += 0.6;
            reasons.push(`fits the vibe you love`);
        }

        // 4. QUALITY BASELINE
        const qualityScore = (movie.popularity_score * 0.3) + (movie.rating_percent / 100 * 0.3);
        
        // HYBRID CALCULATION: final_score = similarity_score + preference_score + quality
        const finalScore = similarityScore + preferenceScore + qualityScore;

        if (reasons.length === 0) {
            reasons.push('recommended high-quality content');
        }

        return {
            movie,
            score: finalScore,
            similarityScore,
            preferenceScore,
            source,
            reason: '🤖 ' + reasons[0].charAt(0).toUpperCase() + reasons[0].slice(1),
            allReasons: reasons,
            qValue: qEntry ? qEntry.q_value : null,
            visitCount: qEntry ? qEntry.visit_count : 0
        };
    });

    // Epsilon-greedy selection
    const totalCount = Math.min(count, scored.length);
    const results = [];
    const sortedByScore = [...scored].sort((a, b) => b.score - a.score);

    // Calculate adaptive epsilon based on data size
    const totalVisits = learnedValues.reduce((sum, v) => sum + v.visit_count, 0);
    const adaptiveEpsilon = Math.max(
        CONFIG.epsilonMin,
        CONFIG.epsilon * Math.pow(CONFIG.epsilonDecay, totalVisits)
    );

    for (let i = 0; i < totalCount; i++) {
        if (Math.random() < adaptiveEpsilon && scored.length > 0) {
            // EXPLORE: pick a random movie
            const randIdx = Math.floor(Math.random() * Math.min(scored.length, 30));
            const pick = scored.splice(randIdx, 1)[0];
            if (pick) {
                pick.reason = '🔮 Exploring new territory for you';
                pick.source = 'explore';
                results.push(pick);
            }
        } else if (sortedByScore.length > 0) {
            // EXPLOIT: pick best scoring movie not already selected
            const pick = sortedByScore.find(s => !results.includes(s));
            if (pick) {
                results.push(pick);
            }
        }
    }

    // Remove duplicates and sort by final score
    const seen = new Set();
    const unique = results.filter(r => {
        if (seen.has(r.movie.movie_id)) return false;
        seen.add(r.movie.movie_id);
        return true;
    });

    return unique.slice(0, count);
}

// ──────────────────────────────────
// LEARNING FROM INTERACTIONS
// ──────────────────────────────────

/**
 * Process a user interaction and update the RL model.
 * Called whenever a user interacts with a movie.
 */
function learn(userUid, movieId, eventType, eventValue = '', context = {}) {
    const userProfile = stmts.getUserByUid.get(userUid);
    if (!userProfile) return null;

    // Log the interaction
    stmts.logInteraction.run({
        user_uid: userUid,
        movie_id: movieId,
        event_type: eventType,
        event_value: eventValue,
        context_genre: context.genre || '',
        context_experience: context.experience || '',
        context_source: context.source || '',
        duration_ms: context.duration || 0
    });

    // Calculate reward
    const reward = calculateReward(eventType, eventValue);

    // Get state & update Q-value
    const recentInteractions = stmts.getUserInteractions.all(userUid, 50);
    const stateKey = encodeState(userProfile, recentInteractions);
    const update = updateQValue(userUid, stateKey, movieId, reward);

    return {
        stateKey,
        movieId,
        reward,
        ...update
    };
}

/**
 * Get analytics about a user's learning progress.
 */
function getUserLearningStats(userUid) {
    const qValues = stmts.getAllUserQValues.all(userUid);
    const topGenres = stmts.getUserTopGenres.all(userUid);
    const topMovies = stmts.getUserTopMovies.all(userUid);
    const activityStats = stmts.getUserActivityStats.all(userUid);

    const totalInteractions = activityStats.reduce((sum, s) => sum + s.cnt, 0);
    const avgQValue = qValues.length > 0
        ? qValues.reduce((sum, q) => sum + q.q_value, 0) / qValues.length
        : 0;

    return {
        totalInteractions,
        uniqueStatesLearned: new Set(qValues.map(q => q.state_key)).size,
        totalQEntries: qValues.length,
        avgQValue: Math.round(avgQValue * 100) / 100,
        topGenres: topGenres.map(g => ({ genre: g.context_genre, count: g.cnt })),
        topMovies: topMovies.map(m => ({ movieId: m.movie_id, interactions: m.cnt })),
        activityBreakdown: activityStats.reduce((acc, s) => { acc[s.event_type] = s.cnt; return acc; }, {}),
        modelMaturity: totalInteractions < 5 ? 'cold_start'
            : totalInteractions < 20 ? 'learning'
                : totalInteractions < 50 ? 'improving'
                    : 'mature'
    };
}

module.exports = {
    getRecommendations,
    learn,
    encodeState,
    calculateReward,
    updateQValue,
    getUserLearningStats,
    CONFIG
};
