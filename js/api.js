// UniVibe — Local API Mock (Serverless)
// Handles all data locally in the browser to work on GitHub Pages & Offline.

const API = {
    // ── Local Storage Keys ──
    USER_KEY: 'univibe_user_local',
    RATINGS_KEY: 'univibe_ratings',
    WATCHLIST_KEY: 'univibe_watchlist',

    // ── Auth ──
    isLoggedIn() {
        return !!localStorage.getItem(this.USER_KEY);
    },

    getUser() {
        return JSON.parse(localStorage.getItem(this.USER_KEY) || 'null');
    },

    async login(username, password) {
        const user = {
            username,
            display_name: username,
            age: 18,
            avatar_emoji: '👤',
            user_uid: 'USER-' + Date.now(),
            created_at: new Date().toISOString(),
            preferred_genres: [],
            preferred_experience: 'any'
        };
        localStorage.setItem(this.USER_KEY, JSON.stringify(user));
        localStorage.setItem('univibe_age', user.age);
        return { ok: true, data: { user } };
    },

    async register(username, email, password, displayName, age) {
        const user = {
            username,
            display_name: displayName,
            email,
            age: parseInt(age),
            avatar_emoji: '✨',
            user_uid: 'USER-' + Date.now(),
            created_at: new Date().toISOString(),
            preferred_genres: [],
            preferred_experience: 'any'
        };
        localStorage.setItem(this.USER_KEY, JSON.stringify(user));
        localStorage.setItem('univibe_age', age);
        return { ok: true, data: { user } };
    },

    async updateProfile(updates) {
        const user = { ...this.getUser(), ...updates };
        localStorage.setItem(this.USER_KEY, JSON.stringify(user));
        if (updates.age) localStorage.setItem('univibe_age', updates.age);
        return { ok: true, data: { user } };
    },

    logout() {
        localStorage.removeItem(this.USER_KEY);
        window.dispatchEvent(new CustomEvent('univibe:logout'));
    },

    // ── Interaction Tracking (Now uses local brain) ──
    async trackInteraction(movieId, eventType, eventValue, context) {
        return LocalRL.learn(movieId, eventType, eventValue, context);
    },

    async trackSearch(query, resultCount) {
        // Log locally
    },

    // ── Ratings ──
    async rateMovie(movieId, rating) {
        const movie = MOVIES.find(m => m.movie_id === movieId);
        const ratings = JSON.parse(localStorage.getItem(this.RATINGS_KEY) || '[]');
        const existing = ratings.findIndex(r => r.movieId === movieId);
        if (existing > -1) ratings[existing].rating = rating;
        else ratings.push({ movieId, rating });
        localStorage.setItem(this.RATINGS_KEY, JSON.stringify(ratings));

        this.trackInteraction(movieId, 'rating', rating, {
            genre: movie?.genre[0],
            experience: movie?.experience_type
        });
        return { ok: true };
    },

    async getMovieRating(movieId) {
        const ratings = JSON.parse(localStorage.getItem(this.RATINGS_KEY) || '[]');
        const r = ratings.find(r => r.movieId === movieId);
        return { ok: true, data: { rating: r ? r.rating : null } };
    },

    // ── Watchlist ──
    async addToWatchlist(movieId) {
        const movie = MOVIES.find(m => m.movie_id === movieId);
        let list = JSON.parse(localStorage.getItem(this.WATCHLIST_KEY) || '[]');
        if (!list.includes(movieId)) list.push(movieId);
        localStorage.setItem(this.WATCHLIST_KEY, JSON.stringify(list));
        this.trackInteraction(movieId, 'watchlist', 'add', {
            genre: movie?.genre[0],
            experience: movie?.experience_type
        });
        return { ok: true };
    },

    async removeFromWatchlist(movieId) {
        let list = JSON.parse(localStorage.getItem(this.WATCHLIST_KEY) || '[]');
        list = list.filter(id => id !== movieId);
        localStorage.setItem(this.WATCHLIST_KEY, JSON.stringify(list));
        return { ok: true };
    },

    async checkWatchlist(movieId) {
        const list = JSON.parse(localStorage.getItem(this.WATCHLIST_KEY) || '[]');
        return { inWatchlist: list.includes(movieId) };
    },

    async getWatchlist() {
        const list = JSON.parse(localStorage.getItem(this.WATCHLIST_KEY) || '[]');
        return { ok: true, data: { watchlist: list.map(id => ({ movie_id: id })) } };
    },

    // ── AI Recommendations (Now sourced from local brain) ──
    async getRecommendations(count = 8) {
        const recs = LocalRL.getRecommendations(count);
        return {
            ok: true,
            data: {
                recommendations: recs.map(m => ({
                    movie_id: m.movie_id,
                    reason: '🤖 AI matched your vibe',
                    source: 'LocalRL'
                }))
            }
        };
    },

    async getHistory() {
        const history = LocalRL.db.getInteractions();
        return { ok: true, data: { interactions: history } };
    },

    async getSearchHistory() { return { ok: true, data: { searches: [] } }; },
    async getLearningStats() {
        const history = LocalRL.db.getInteractions();
        return { ok: true, data: { stats: { totalInteractions: history.length, modelMaturity: 'mature', topGenres: [] } } };
    },

    // ── Generic GET (for legacy calls) ──
    async get(url) {
        if (url.includes('/api/dashboard')) {
            const dashboard = LocalRL.getUserLearningStats();
            return { ok: true, data: { dashboard } };
        }
        if (url.includes('/api/watchlist')) return this.getWatchlist();
        if (url.includes('/api/history')) return this.getHistory();
        return { ok: false, error: 'Route not found locally' };
    }
};
