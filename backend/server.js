// Movie Recommendation System — Express API Server
// Handles authentication, user tracking, and RL recommendations

const express = require('express');
const cors = require('cors');
const path = require('path');

const auth = require('./auth');
const { stmts } = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

// ──────────────────────────────────
// MIDDLEWARE
// ──────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..'))); // Serve frontend files

// ──────────────────────────────────
// AUTH ROUTES
// ──────────────────────────────────

// Register
app.post('/api/auth/register', async (req, res) => {
    const { username, email, password, displayName, age } = req.body;
    const result = await auth.register(username, email, password, displayName, age);

    if (result.success) {
        res.json(result);
    } else {
        res.status(400).json(result);
    }
});

// Login
app.post('/api/auth/login', async (req, res) => {
    const { usernameOrEmail, password } = req.body;
    const result = await auth.login(usernameOrEmail, password);

    if (result.success) {
        res.json(result);
    } else {
        res.status(401).json(result);
    }
});

// Get current user profile
app.get('/api/auth/me', auth.authMiddleware, (req, res) => {
    res.json({ success: true, user: req.user });
});

// Update profile
app.put('/api/auth/profile', auth.authMiddleware, (req, res) => {
    const result = auth.updateProfile(req.userUid, req.body);
    res.json(result);
});

// Get avatars list
app.get('/api/auth/avatars', (req, res) => {
    res.json({ avatars: auth.AVATARS });
});

// ──────────────────────────────────
// TRACKING ROUTES (User Interactions)
// ──────────────────────────────────

// Log a user interaction & learn from it
app.post('/api/track', auth.authMiddleware, (req, res) => {
    const { movieId, eventType, eventValue, context } = req.body;

    if (!movieId || !eventType) {
        return res.status(400).json({ error: 'movieId and eventType are required' });
    }

    const validEvents = ['view', 'click', 'search', 'rating', 'recommend_click', 'dwell', 'watchlist'];
    if (!validEvents.includes(eventType)) {
        return res.status(400).json({ error: 'Invalid event type' });
    }

    // Log to DB (FastAPI will pick this up for learning)
    try {
        stmts.logInteraction.run(req.userUid, parseInt(movieId), eventType, eventValue || '', JSON.stringify(context || {}));
    } catch (e) { console.error('DB Log Error:', e); }

    res.json({
        success: true,
        message: 'Interaction logged'
    });
});

// Log search
app.post('/api/track/search', auth.authMiddleware, (req, res) => {
    const { query, resultCount, selectedMovieId } = req.body;

    if (!query) {
        return res.status(400).json({ error: 'Search query is required' });
    }

    stmts.logSearch.run({
        user_uid: req.userUid,
        query,
        result_count: resultCount || 0,
        selected_movie_id: selectedMovieId || null
    });

    res.json({ success: true });
});

// Rate a movie (allows 0 to deselect)
app.post('/api/rate', auth.authMiddleware, (req, res) => {
    const { movieId, rating } = req.body;

    if (!movieId || rating === undefined || rating < 0 || rating > 5) {
        return res.status(400).json({ error: 'movieId and rating (0-5) are required' });
    }

    if (rating === 0) {
        // Deselect / Remove rating
        stmts.deleteRating.run(req.userUid, parseInt(movieId));
    } else {
        // Log/Update rating to SQLite
        stmts.upsertRating.run({
            user_uid: req.userUid,
            movie_id: parseInt(movieId),
            rating: parseInt(rating)
        });
    }

    res.json({ success: true });
});

// Get user's rating for a movie
app.get('/api/rate/:movieId', auth.authMiddleware, (req, res) => {
    const rating = stmts.getMovieRating.get(req.userUid, parseInt(req.params.movieId));
    res.json({ rating: rating ? rating.rating : null });
});

// ──────────────────────────────────
// WATCHLIST ROUTES (Watch Later)
// ──────────────────────────────────

// Add to watchlist
app.post('/api/watchlist/add', auth.authMiddleware, (req, res) => {
    const { movieId } = req.body;
    if (!movieId) return res.status(400).json({ error: 'movieId is required' });

    stmts.addToWatchlist.run({
        user_uid: req.userUid,
        movie_id: parseInt(movieId)
    });

    res.json({ success: true });
});

// Remove from watchlist
app.delete('/api/watchlist/remove/:movieId', auth.authMiddleware, (req, res) => {
    stmts.removeFromWatchlist.run(req.userUid, parseInt(req.params.movieId));
    res.json({ success: true });
});

// Get full watchlist
app.get('/api/watchlist', auth.authMiddleware, (req, res) => {
    const items = stmts.getUserWatchlist.all(req.userUid);
    res.json({ success: true, watchlist: items });
});

// Check if in watchlist
app.get('/api/watchlist/:movieId', auth.authMiddleware, (req, res) => {
    const item = stmts.getWatchlistItem.get(req.userUid, parseInt(req.params.movieId));
    res.json({ inWatchlist: !!item });
});

// ──────────────────────────────────
// FAVORITE ROUTES
// ──────────────────────────────────

// Add to favorites
app.post('/api/favorites/add', auth.authMiddleware, (req, res) => {
    const { movieId } = req.body;
    if (!movieId) return res.status(400).json({ error: 'movieId is required' });

    stmts.addToFavorites.run({
        user_uid: req.userUid,
        movie_id: parseInt(movieId)
    });

    res.json({ success: true });
});

// Remove from favorites
app.delete('/api/favorites/remove/:movieId', auth.authMiddleware, (req, res) => {
    stmts.removeFromFavorites.run(req.userUid, parseInt(req.params.movieId));
    res.json({ success: true });
});

// Get full favorites list
app.get('/api/favorites', auth.authMiddleware, (req, res) => {
    const items = stmts.getUserFavorites.all(req.userUid);
    res.json({ success: true, favorites: items });
});

// Check if in favorites
app.get('/api/favorites/:movieId', auth.authMiddleware, (req, res) => {
    const item = stmts.getFavoriteItem.get(req.userUid, parseInt(req.params.movieId));
    res.json({ isFavorite: !!item });
});

// ──────────────────────────────────
// RL RECOMMENDATION ROUTES
// ──────────────────────────────────

app.get('/api/recommendations', auth.authMiddleware, (req, res) => {
    res.json({ success: true, meta: { message: 'Migrated to FastAPI' } });
});

// Get user learning stats (for the profile/analytics page)
app.get('/api/recommendations/stats', auth.authMiddleware, (req, res) => {
    // Basic stats from DB since rlEngine is removed
    const totalInteractions = stmts.getUserInteractions.all(req.userUid, 1000).length;
    const qValues = stmts.getAllUserQValues.all(req.userUid);
    const topGenres = stmts.getUserTopGenres.all(req.userUid).map(g => ({
        genre: g.context_genre,
        count: g.cnt
    }));
    const activityStats = stmts.getUserActivityStats.all(req.userUid);
    const activityBreakdown = {};
    activityStats.forEach(s => { activityBreakdown[s.event_type] = s.cnt; });
    
    const stats = {
        totalInteractions,
        modelMaturity: totalInteractions === 0 ? 'cold_start' : totalInteractions < 20 ? 'learning' : totalInteractions < 50 ? 'improving' : 'mature',
        totalQEntries: qValues.length,
        uniqueStatesLearned: new Set(qValues.map(v => v.state_key)).size,
        avgQValue: qValues.length ? Math.round((qValues.reduce((s, v) => s + v.q_value, 0) / qValues.length) * 100) / 100 : 0,
        topGenres,
        activityBreakdown
    };
    res.json({ success: true, stats });
});

// ──────────────────────────────────
// DASHBOARD ANALYTICS (rich data for charts)
// ──────────────────────────────────
app.get('/api/dashboard', auth.authMiddleware, (req, res) => {
    const uid = req.userUid;

    // 1. All Q-values for distribution chart
    const allQ = stmts.getAllUserQValues.all(uid);

    // 2. Q-value distribution buckets
    const qDistribution = buildDistribution(allQ.map(q => q.q_value), 10);

    // 3. All interactions for timeline
    const interactions = stmts.getUserInteractions.all(uid, 500);

    // 4. Interaction timeline (grouped by hour)
    const timeline = buildTimeline(interactions);

    // 5. Genre interaction heatmap
    const genreBreakdown = {};
    interactions.forEach(i => {
        if (!i.context_genre) return;
        if (!genreBreakdown[i.context_genre]) {
            genreBreakdown[i.context_genre] = { view: 0, click: 0, rating: 0, recommend_click: 0, search: 0, dwell: 0 };
        }
        if (genreBreakdown[i.context_genre][i.event_type] !== undefined) {
            genreBreakdown[i.context_genre][i.event_type]++;
        }
    });

    // 6. Per-movie Q-value heatmap (top 15)
    // Note: requires titles to be fetched by the frontend now
    const movieQMap = {};
    allQ.forEach(q => {
        if (!movieQMap[q.movie_id]) {
            movieQMap[q.movie_id] = { totalQ: 0, count: 0, maxQ: -Infinity, states: [] };
        }
        movieQMap[q.movie_id].totalQ += q.q_value;
        movieQMap[q.movie_id].count++;
        movieQMap[q.movie_id].maxQ = Math.max(movieQMap[q.movie_id].maxQ, q.q_value);
        if(movieQMap[q.movie_id].states.length < 5) {
             movieQMap[q.movie_id].states.push({ state: q.state_key, q: Math.round(q.q_value * 100) / 100 });
        }
    });
    
    const topMovieQ = Object.entries(movieQMap)
        .sort(([, a], [, b]) => b.maxQ - a.maxQ)
        .slice(0, 15)
        .map(([movieId, data]) => ({
            movie_id: parseInt(movieId),
            title: `Movie #${movieId}`,
            genre: [],
            avgQ: Math.round((data.totalQ / data.count) * 100) / 100,
            maxQ: Math.round(data.maxQ * 100) / 100,
            stateCount: data.count,
            states: data.states
        }));

    // 7. Rating distribution (1-5 stars)
    const ratings = stmts.getUserRatings.all(uid);
    const ratingDist = [0, 0, 0, 0, 0];
    ratings.forEach(r => { if (r.rating >= 1 && r.rating <= 5) ratingDist[r.rating - 1]++; });

    // 8. Source breakdown (mocked based on rating context if available)
    const sourceBreakdown = { "Exploration": 10, "Similarity": 25, "Genre Match": 40 };

    // 9. State-space coverage
    const uniqueStates = [...new Set(allQ.map(q => q.state_key))];
    const stateDetails = uniqueStates.map(sk => {
        const entries = allQ.filter(q => q.state_key === sk);
        return {
            state: sk,
            movieCount: entries.length,
            avgQ: Math.round((entries.reduce((s, e) => s + e.q_value, 0) / entries.length) * 100) / 100,
            maxQ: Math.round(Math.max(...entries.map(e => e.q_value)) * 100) / 100,
            totalVisits: entries.reduce((s, e) => s + e.visit_count, 0)
        };
    }).sort((a, b) => b.totalVisits - a.totalVisits);

    // 10. Default Hyperparameters mapping
    const config = {
        epsilon: 0.15,
        epsilonMin: 0.05,
        learningRate: 0.1,
        discountFactor: 0.8,
        rewardWeights: { view: 0.5, click: 1, rating: 5, recommend_click: 3, watchlist: 2 }
    };

    // 11. Activity breakdown for doughnut chart
    const activityBreakdown = { view: 0, click: 0, rating: 0, recommend_click: 0, watchlist: 0 };
    interactions.forEach(i => {
        if (activityBreakdown[i.event_type] !== undefined) activityBreakdown[i.event_type]++;
    });

    res.json({
        success: true,
        dashboard: {
            qDistribution,
            timeline,
            genreBreakdown,
            topMovieQ,
            ratingDistribution: ratingDist,
            sourceBreakdown,
            stateDetails,
            config,
            activityBreakdown,
            summary: {
                totalInteractions: interactions.length,
                totalQEntries: allQ.length,
                uniqueStates: uniqueStates.length,
                totalRatings: ratings.length,
                avgQValue: allQ.length > 0 ? Math.round((allQ.reduce((s, q) => s + q.q_value, 0) / allQ.length) * 100) / 100 : 0,
                maxQValue: allQ.length > 0 ? Math.round(Math.max(...allQ.map(q => q.q_value)) * 100) / 100 : 0,
                modelMaturity: interactions.length < 5 ? 'cold_start' : interactions.length < 20 ? 'learning' : interactions.length < 50 ? 'improving' : 'mature'
            }
        }
    });
});

// Helper: Build histogram distribution
function buildDistribution(values, buckets) {
    if (values.length === 0) return { labels: [], counts: [] };
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;
    const step = range / buckets;
    const labels = [];
    const counts = new Array(buckets).fill(0);
    for (let i = 0; i < buckets; i++) {
        labels.push(Math.round((min + step * i) * 100) / 100);
    }
    values.forEach(v => {
        const idx = Math.min(Math.floor((v - min) / step), buckets - 1);
        counts[idx]++;
    });
    return { labels, counts };
}

// Helper: Build interaction timeline grouped by date
function buildTimeline(interactions) {
    const dayMap = {};
    interactions.forEach(i => {
        const day = i.created_at.split(' ')[0]; // "YYYY-MM-DD"
        if (!dayMap[day]) dayMap[day] = { view: 0, click: 0, rating: 0, recommend_click: 0, search: 0, dwell: 0 };
        if (dayMap[day][i.event_type] !== undefined) dayMap[day][i.event_type]++;
    });
    const sortedDays = Object.keys(dayMap).sort();
    return {
        labels: sortedDays,
        datasets: [
            { label: 'view', data: sortedDays.map(d => dayMap[d].view) },
            { label: 'click', data: sortedDays.map(d => dayMap[d].click) },
            { label: 'rating', data: sortedDays.map(d => dayMap[d].rating) },
            { label: 'recommend_click', data: sortedDays.map(d => dayMap[d].recommend_click) }
        ]
    };
}

// ──────────────────────────────────
// USER HISTORY ROUTES
// ──────────────────────────────────

// Get interaction history
app.get('/api/history', auth.authMiddleware, (req, res) => {
    const limit = parseInt(req.query.limit) || 50;
    const interactions = stmts.getUserInteractions.all(req.userUid, limit);
    res.json({ success: true, interactions });
});

// Get search history
app.get('/api/history/searches', auth.authMiddleware, (req, res) => {
    const limit = parseInt(req.query.limit) || 20;
    const searches = stmts.getUserSearches.all(req.userUid, limit);
    res.json({ success: true, searches });
});

// Get all ratings
app.get('/api/ratings', auth.authMiddleware, (req, res) => {
    const ratings = stmts.getUserRatings.all(req.userUid);
    res.json({ success: true, ratings });
});

// ──────────────────────────────────
// EVALUATION METRICS
// ──────────────────────────────────
app.get('/api/metrics', (req, res) => {
    try {
        const fs = require('fs');
        const metricsPath = path.join(__dirname, '..', 'models', 'metrics.json');
        const metrics = JSON.parse(fs.readFileSync(metricsPath, 'utf8'));
        res.json({ success: true, ...metrics });
    } catch (e) {
        res.status(404).json({ success: false, error: 'Metrics not found. Run model_evaluator.py first.' });
    }
});

// ──────────────────────────────────
// HEALTH CHECK
// ──────────────────────────────────
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        service: 'Movie Recommendation System ML Backend',
        version: '1.0.0',
        features: ['auth', 'tracking', 'rl-recommendations', 'sqlite-persistence']
    });
});

// ──────────────────────────────────
// START SERVER
// ──────────────────────────────────
(async () => {
    const server = await app.listen(PORT);
    console.log(`\nMovie Recommendation System ML Server running at http://localhost:${PORT}`);
    console.log(`RL Engine: Contextual Multi-Armed Bandit (ε-greedy)`);
    console.log(`Database: SQLite @ backend/data/mrs.db`);
    console.log(`Auth: JWT + bcrypt\n`);
})();
