// ═══════════════════════════════════════════════════════════════
// UniVibe — Frontend AI Brain (Recommendation Learning)
// Handles all intelligence locally in the browser for offline use.
// ═══════════════════════════════════════════════════════════════

const LocalAI = {
    CONFIG: {
        epsilon: 0.15,
        epsilonDecay: 0.999,
        epsilonMin: 0.05,
        learningRate: 0.1,
        discountFactor: 0.95,
        rewardWeights: {
            click: 1.0,
            view: 0.5,
            search: 0.3,
            rating_positive: 2.0,
            rating_neutral: 0.5,
            rating_negative: -1.0,
            recommend_click: 1.5,
            watchlist: 1.2,
            dwell: 0.8,
            ignore: -0.2,
        }
    },

    // ── Database Simulation ──
    db: {
        getQTable() {
            return JSON.parse(localStorage.getItem('univibe_qtable') || '{}');
        },
        saveQTable(table) {
            localStorage.setItem('univibe_qtable', JSON.stringify(table));
        },
        getInteractions() {
            return JSON.parse(localStorage.getItem('univibe_interactions') || '[]');
        },
        saveInteraction(interaction) {
            const history = this.getInteractions();
            history.unshift({ ...interaction, created_at: new Date().toISOString() });
            localStorage.setItem('univibe_interactions', JSON.stringify(history.slice(0, 500)));
        }
    },

    // ── State Encoding ──
    encodeState(userAge, recentInteractions = []) {
        let dominantGenre = 'general';
        let dominantExperience = 'any';

        if (recentInteractions.length > 0) {
            const genreCounts = {};
            const expCounts = {};
            recentInteractions.slice(0, 10).forEach(i => {
                if (i.genre) genreCounts[i.genre] = (genreCounts[i.genre] || 0) + 1;
                if (i.experience) expCounts[i.experience] = (expCounts[i.experience] || 0) + 1;
            });
            dominantGenre = Object.entries(genreCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'general';
            dominantExperience = Object.entries(expCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'any';
        }

        const hour = new Date().getHours();
        const timeSlot = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : hour < 21 ? 'evening' : 'night';
        return `${dominantGenre}|${dominantExperience}|${timeSlot}`;
    },

    // ── Learning ──
    learn(movieId, eventType, eventValue = '', context = {}) {
        const reward = this.calculateReward(eventType, eventValue);
        const interactions = this.db.getInteractions();
        const userAge = parseInt(localStorage.getItem('univibe_age')) || 18;
        const stateKey = this.encodeState(userAge, interactions);

        // Log interaction
        this.db.saveInteraction({ movie_id: movieId, event_type: eventType, ...context });

        // Update Q-Table
        const qTable = this.db.getQTable();
        const key = `${stateKey}|${movieId}`;
        const currentQ = qTable[key]?.q || 0.0;
        const visits = qTable[key]?.v || 0;

        // Simplified TD Update
        const newQ = currentQ + this.CONFIG.learningRate * (reward - currentQ);

        qTable[key] = { q: newQ, v: visits + 1 };
        this.db.saveQTable(qTable);

        return { reward, newQ, stateKey };
    },

    calculateReward(eventType, value) {
        const weights = this.CONFIG.rewardWeights;
        if (eventType === 'rating') {
            const r = parseInt(value);
            return r >= 4 ? weights.rating_positive : r === 3 ? weights.rating_neutral : weights.rating_negative;
        }
        return weights[eventType] || 0;
    },

    // ── Recommendations ──
    getRecommendations(count = 8) {
        const interactions = this.db.getInteractions();
        const userAge = parseInt(localStorage.getItem('univibe_age')) || 99;
        const stateKey = this.encodeState(userAge, interactions);
        const qTable = this.db.getQTable();

        const rated = new Set(JSON.parse(localStorage.getItem('univibe_ratings') || '[]').map(r => r.movieId));
        const candidates = MOVIES.filter(m => userAge >= m.age_limit);

        const scored = candidates.map(movie => {
            let score = 0;
            let reason = 'Trending';

            // Q-Value matches
            const qData = qTable[`${stateKey}|${movie.movie_id}`];
            if (qData) {
                score += qData.q * 3;
                reason = 'learned from your behavior';
            }

            // Baseline quality
            score += (movie.popularity_score * 0.5) + (movie.rating_percent / 100);

            return { movie, score, reason: '🤖 ' + reason };
        });

        // Sort deterministically by highest score, using popularity and rating as tiebreakers to prevent random ordering
        return scored
            .sort((a, b) => (b.score - a.score) || (b.movie.popularity_score - a.movie.popularity_score) || (b.movie.rating_percent - a.movie.rating_percent))
            .slice(0, count)
            .map(s => s.movie);
    },

    getUserLearningStats() {
        const interactions = this.db.getInteractions();
        const qTable = this.db.getQTable();
        const ratings = JSON.parse(localStorage.getItem('univibe_ratings') || '[]');
        const watchlist = JSON.parse(localStorage.getItem('univibe_watchlist') || '[]');

        const qValues = Object.values(qTable).map(v => v.q);
        const totalInteractions = interactions.length;
        const avgQValue = qValues.length > 0 ? qValues.reduce((a, b) => a + b, 0) / qValues.length : 0;
        const maxQValue = qValues.length > 0 ? Math.max(...qValues) : 0;

        // 1. Timeline (grouped by day for the last 7 days)
        const timelineLabels = [];
        const timelineData = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            timelineLabels.push(d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }));
            timelineData.push(interactions.filter(int => int.created_at?.startsWith(dateStr)).length);
        }

        // 2. Genre Breakdown (Heatmap format)
        const genreBreakdown = {};
        interactions.forEach(i => {
            if (!i.genre) return;
            if (!genreBreakdown[i.genre]) genreBreakdown[i.genre] = { view: 0, click: 0, rating: 0, recommend_click: 0 };
            if (genreBreakdown[i.genre][i.event_type] !== undefined) genreBreakdown[i.genre][i.event_type]++;
        });

        // 3. Q-Distribution (histogram bins)
        const bins = [0, 1, 2, 3, 4, 5];
        const qCounts = bins.map(b => qValues.filter(q => q >= b && q < b + 1).length);

        // 4. Rating Distribution
        const ratingDist = [0, 0, 0, 0, 0];
        ratings.forEach(r => {
            if (r.rating >= 1 && r.rating <= 5) ratingDist[r.rating - 1]++;
        });

        // 5. Source Breakdown (Fake some diversity if limited)
        const sourceBreakdown = { rl: 0, content: 0, popular: 0, explore: 0, hybrid: 0 };
        interactions.forEach(i => {
            if (i.event_type === 'recommend_click') sourceBreakdown.rl++;
            else if (i.event_type === 'view') sourceBreakdown.content++;
        });
        if (sourceBreakdown.rl === 0) sourceBreakdown.popular = totalInteractions;

        // 6. State Details
        const stateMap = {};
        Object.entries(qTable).forEach(([key, val]) => {
            const s = key.split('|')[0];
            if (!stateMap[s]) stateMap[s] = { state: s, movieCount: 0, totalQ: 0 };
            stateMap[s].movieCount++;
            stateMap[s].totalQ += val.q;
        });
        const stateDetails = Object.values(stateMap).map(s => ({
            ...s,
            avgQ: (s.totalQ / s.movieCount).toFixed(2)
        }));

        const summary = {
            totalInteractions,
            totalQEntries: qValues.length,
            uniqueStates: stateDetails.length,
            totalRatings: ratings.length,
            avgQValue: avgQValue.toFixed(2),
            maxQValue: maxQValue.toFixed(2),
            modelMaturity: totalInteractions < 5 ? 'cold_start' : totalInteractions < 20 ? 'learning' : 'mature'
        };

        // 7. Activity Breakdown (Needed for profile page)
        const activityBreakdown = { view: 0, click: 0, rating: 0, recommend_click: 0, watchlist: 0 };
        interactions.forEach(i => { if (activityBreakdown[i.event_type] !== undefined) activityBreakdown[i.event_type]++; });

        return {
            summary,
            timeline: { labels: timelineLabels, datasets: [{ label: 'Interactions', data: timelineData }] },
            genreBreakdown,
            qDistribution: { labels: bins, counts: qCounts },
            ratingDistribution: ratingDist,
            sourceBreakdown,
            stateDetails,
            topMovieQ: Object.entries(qTable).sort((a, b) => b[1].q - a[1].q).slice(0, 10).map(([k, v]) => {
                const id = parseInt(k.split('|').pop());
                const m = MOVIES.find(movie => movie.movie_id === id);
                return { title: m?.title || 'Unknown', maxQ: v.q };
            }),
            activityBreakdown,
            config: this.CONFIG
        };
    }
};
