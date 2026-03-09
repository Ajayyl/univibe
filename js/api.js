// UniVibe — API Client
// Handles all HTTP requests to the backend, including auth token management

const API = {
    BASE_URL: window.location.origin,
    TOKEN_KEY: 'univibe_auth_token',
    USER_KEY: 'univibe_user',

    // ──────────────────────────────────
    // TOKEN MANAGEMENT
    // ──────────────────────────────────
    getToken() {
        return localStorage.getItem(this.TOKEN_KEY);
    },

    setToken(token) {
        localStorage.setItem(this.TOKEN_KEY, token);
    },

    removeToken() {
        localStorage.removeItem(this.TOKEN_KEY);
        localStorage.removeItem(this.USER_KEY);
    },

    getUser() {
        try {
            return JSON.parse(localStorage.getItem(this.USER_KEY));
        } catch (e) {
            return null;
        }
    },

    setUser(user) {
        localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    },

    isLoggedIn() {
        return !!this.getToken();
    },

    // ──────────────────────────────────
    // HTTP HELPERS
    // ──────────────────────────────────
    async request(endpoint, options = {}) {
        const url = `${this.BASE_URL}${endpoint}`;
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };

        const token = this.getToken();
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        try {
            const response = await fetch(url, {
                ...options,
                headers
            });

            const data = await response.json();

            // Handle expired tokens
            if (response.status === 401) {
                this.removeToken();
                window.dispatchEvent(new CustomEvent('univibe:auth-expired'));
            }

            return { ok: response.ok, status: response.status, data };
        } catch (err) {
            console.error('[API Error]', err);
            return { ok: false, status: 0, data: { error: 'Network error. Is the server running?' } };
        }
    },

    async get(endpoint) {
        return this.request(endpoint, { method: 'GET' });
    },

    async post(endpoint, body) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(body)
        });
    },

    async put(endpoint, body) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(body)
        });
    },

    // ──────────────────────────────────
    // AUTH ENDPOINTS
    // ──────────────────────────────────
    async register(username, email, password, displayName, age) {
        const res = await this.post('/api/auth/register', {
            username, email, password, displayName, age
        });
        if (res.ok) {
            this.setToken(res.data.token);
            this.setUser(res.data.user);
        }
        return res;
    },

    async login(usernameOrEmail, password) {
        const res = await this.post('/api/auth/login', {
            usernameOrEmail, password
        });
        if (res.ok) {
            this.setToken(res.data.token);
            this.setUser(res.data.user);
        }
        return res;
    },

    logout() {
        this.removeToken();
        window.dispatchEvent(new CustomEvent('univibe:logout'));
    },

    async getProfile() {
        const res = await this.get('/api/auth/me');
        if (res.ok) {
            this.setUser(res.data.user);
        }
        return res;
    },

    async updateProfile(updates) {
        const res = await this.put('/api/auth/profile', updates);
        if (res.ok) {
            this.setUser(res.data.user);
        }
        return res;
    },

    // ──────────────────────────────────
    // TRACKING ENDPOINTS
    // ──────────────────────────────────
    async trackInteraction(movieId, eventType, eventValue, context) {
        if (!this.isLoggedIn()) return { ok: false };
        return this.post('/api/track', {
            movieId, eventType, eventValue, context
        });
    },

    async trackSearch(query, resultCount, selectedMovieId) {
        if (!this.isLoggedIn()) return { ok: false };
        return this.post('/api/track/search', {
            query, resultCount, selectedMovieId
        });
    },

    async rateMovie(movieId, rating) {
        return this.post('/api/rate', { movieId, rating });
    },

    async getMovieRating(movieId) {
        return this.get(`/api/rate/${movieId}`);
    },

    // ──────────────────────────────────
    // RL RECOMMENDATION ENDPOINTS
    // ──────────────────────────────────
    async getRecommendations(count = 8) {
        return this.get(`/api/recommendations?count=${count}`);
    },

    async getLearningStats() {
        return this.get('/api/recommendations/stats');
    },

    // ──────────────────────────────────
    // HISTORY ENDPOINTS
    // ──────────────────────────────────
    async getHistory(limit = 50) {
        return this.get(`/api/history?limit=${limit}`);
    },

    async getSearchHistory(limit = 20) {
        return this.get(`/api/history/searches?limit=${limit}`);
    },

    async getRatings() {
        return this.get('/api/ratings');
    },

    // ──────────────────────────────────
    // WATCHLIST ENDPOINTS
    // ──────────────────────────────────
    async addToWatchlist(movieId) {
        return this.post('/api/watchlist/add', { movieId });
    },

    async removeFromWatchlist(movieId) {
        return this.request(`/api/watchlist/remove/${movieId}`, { method: 'DELETE' });
    },

    async getWatchlist() {
        return this.get('/api/watchlist');
    },

    async checkWatchlist(movieId) {
        return this.get(`/api/watchlist/${movieId}`);
    }
};
