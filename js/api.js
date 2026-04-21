const API = {
    // ── Local Storage Keys ──
    USER_KEY: 'mrs_user_local',
    TOKEN_KEY: 'mrs_auth_token',
    RATINGS_KEY: 'mrs_ratings',
    WATCHLIST_KEY: 'mrs_watchlist',
    FAVORITES_KEY: 'mrs_favorites',
    BASE_URL: `http://${window.location.hostname}:3000/api`,
    ML_API_BASE: `http://${window.location.hostname}:8000`,

    // ── Auth ──
    isLoggedIn() {
        return !!localStorage.getItem(this.USER_KEY);
    },

    getUser() {
        return JSON.parse(localStorage.getItem(this.USER_KEY) || 'null');
    },

    getToken() {
        return localStorage.getItem(this.TOKEN_KEY);
    },

    getHeaders() {
        const token = this.getToken();
        return {
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : ''
        };
    },

    async login(username, password) {
        try {
            const res = await fetch(`${this.BASE_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ usernameOrEmail: username, password })
            });
            const data = await res.json();
            if (data.success) {
                localStorage.setItem(this.USER_KEY, JSON.stringify(data.user));
                localStorage.setItem(this.TOKEN_KEY, data.token);
                localStorage.setItem('mrs_age', data.user.age);
                return { ok: true, data };
            }
            return { ok: false, error: data.error };
        } catch (e) {
            console.warn('Backend unavailable, creating local offline session.');
            const localUser = { user_uid: 'local-' + Date.now(), username, display_name: username, age: 18 };
            localStorage.setItem(this.USER_KEY, JSON.stringify(localUser));
            localStorage.setItem(this.TOKEN_KEY, 'offline-token');
            localStorage.setItem('mrs_age', '18');
            return { ok: true, data: { user: localUser, token: 'offline-token' }, localFallback: true };
        }
    },

    async register(username, email, password, displayName, age) {
        try {
            const res = await fetch(`${this.BASE_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, email, password, displayName, age })
            });
            const data = await res.json();
            if (data.success) {
                localStorage.setItem(this.USER_KEY, JSON.stringify(data.user));
                localStorage.setItem(this.TOKEN_KEY, data.token);
                localStorage.setItem('mrs_age', data.user.age);
                return { ok: true, data };
            }
            return { ok: false, error: data.error };
        } catch (e) {
            console.warn('Backend unavailable, creating local offline session.');
            const localUser = { user_uid: 'local-' + Date.now(), username, display_name: displayName, email, age };
            localStorage.setItem(this.USER_KEY, JSON.stringify(localUser));
            localStorage.setItem(this.TOKEN_KEY, 'offline-token');
            localStorage.setItem('mrs_age', age);
            return { ok: true, data: { user: localUser, token: 'offline-token' }, localFallback: true };
        }
    },

    async updateProfile(updates) {
        try {
            const res = await fetch(`${this.BASE_URL}/auth/profile`, {
                method: 'PUT',
                headers: this.getHeaders(),
                body: JSON.stringify(updates)
            });
            const data = await res.json();
            if (data.success) {
                localStorage.setItem(this.USER_KEY, JSON.stringify(data.user));
                if (updates.age) localStorage.setItem('mrs_age', updates.age);
                return { ok: true, data };
            }
            return { ok: false, error: data.error };
        } catch (e) {
            return { ok: false, error: 'Update failed' };
        }
    },

    logout() {
        localStorage.removeItem(this.USER_KEY);
        localStorage.removeItem(this.TOKEN_KEY);
        window.dispatchEvent(new CustomEvent('mrs:logout'));
    },

    // ── Interaction Tracking (Shared across backends via SQLite) ──
    async trackInteraction(movieId, eventType, eventValue, context) {
        // Update local brain for offline/immediate use
        LocalAI.learn(movieId, eventType, eventValue, context);

        const user = this.getUser();
        const uid = user ? user.user_uid : null;

        // 1. Track via Node.js authenticated backend (SQLite logging)
        try {
            await fetch(`${this.BASE_URL}/track`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify({ movieId, eventType, eventValue, context })
            });
        } catch (e) { /* Node backend might be down, that's ok */ }

        // 2. Track via FastAPI ML backend (RL Q-table updates) — requires user_uid in payload
        if (uid) {
            try {
                await fetch(`${this.ML_API_BASE}/track`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        user_uid: uid,
                        movie_id: parseInt(movieId),
                        eventType,
                        eventValue: eventValue || '',
                        context: context || {}
                    })
                });
            } catch (e) { console.warn('ML tracking sync failed'); }
        }
    },

    async trackSearch(query, resultCount) {
        try {
            await fetch(`${this.BASE_URL}/track/search`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify({ query, resultCount })
            });
        } catch (e) { }
    },

    // ── Ratings ──
    async rateMovie(movieId, rating) {
        try {
            const res = await fetch(`${this.BASE_URL}/rate`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify({ movieId, rating })
            });
            return await res.json();
        } catch (e) {
            // Fallback for offline UX
            return { ok: true };
        }
    },

    async getMovieRating(movieId) {
        try {
            const res = await fetch(`${this.BASE_URL}/rate/${movieId}`, {
                headers: this.getHeaders()
            });
            const data = await res.json();
            return { ok: true, data: { rating: data.rating } };
        } catch (e) {
            return { ok: false, error: 'Could not fetch rating' };
        }
    },

    // ── Watchlist ──
    async addToWatchlist(movieId) {
        try {
            const res = await fetch(`${this.BASE_URL}/watchlist/add`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify({ movieId })
            });
            return await res.json();
        } catch (e) {
            // Local fallback
            const watchlist = JSON.parse(localStorage.getItem(this.WATCHLIST_KEY) || '[]');
            if (!watchlist.includes(movieId)) {
                watchlist.push(movieId);
                localStorage.setItem(this.WATCHLIST_KEY, JSON.stringify(watchlist));
            }
            return { ok: true, local: true };
        }
    },

    async removeFromWatchlist(movieId) {
        try {
            const res = await fetch(`${this.BASE_URL}/watchlist/remove/${movieId}`, {
                method: 'DELETE',
                headers: this.getHeaders()
            });
            return await res.json();
        } catch (e) {
            // Local fallback
            let watchlist = JSON.parse(localStorage.getItem(this.WATCHLIST_KEY) || '[]');
            watchlist = watchlist.filter(id => id !== movieId);
            localStorage.setItem(this.WATCHLIST_KEY, JSON.stringify(watchlist));
            return { ok: true, local: true };
        }
    },

    async checkWatchlist(movieId) {
        try {
            const res = await fetch(`${this.BASE_URL}/watchlist/${movieId}`, { headers: this.getHeaders() });
            return await res.json();
        } catch (e) {
            const watchlist = JSON.parse(localStorage.getItem(this.WATCHLIST_KEY) || '[]');
            return { inWatchlist: watchlist.includes(movieId) };
        }
    },

    async getWatchlist() {
        try {
            const res = await fetch(`${this.BASE_URL}/watchlist`, { headers: this.getHeaders() });
            if (!res.ok && res.status === 401) { this.logout(); return { ok: false }; }
            const data = await res.json();
            return { ok: true, data: data };
        } catch (e) {
            const watchlist = JSON.parse(localStorage.getItem(this.WATCHLIST_KEY) || '[]');
            return { ok: true, data: { watchlist: watchlist.map(id => ({ movie_id: id })) } };
        }
    },

    // ── Favorites ──
    async addToFavorites(movieId) {
        try {
            const res = await fetch(`${this.BASE_URL}/favorites/add`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify({ movieId })
            });
            if (res.status === 401) this.logout();
            return await res.json();
        } catch (e) {
            const favs = JSON.parse(localStorage.getItem('mrs_favorites') || '[]');
            if (!favs.includes(movieId)) {
                favs.push(movieId);
                localStorage.setItem('mrs_favorites', JSON.stringify(favs));
            }
            return { ok: true, local: true };
        }
    },

    async removeFromFavorites(movieId) {
        try {
            const res = await fetch(`${this.BASE_URL}/favorites/remove/${movieId}`, {
                method: 'DELETE',
                headers: this.getHeaders()
            });
            if (res.status === 401) this.logout();
            return await res.json();
        } catch (e) {
            let favs = JSON.parse(localStorage.getItem('mrs_favorites') || '[]');
            favs = favs.filter(id => id !== movieId);
            localStorage.setItem('mrs_favorites', JSON.stringify(favs));
            return { ok: true, local: true };
        }
    },

    async checkFavorite(movieId) {
        try {
            const res = await fetch(`${this.BASE_URL}/favorites/${movieId}`, { headers: this.getHeaders() });
            return await res.json();
        } catch (e) {
            const favs = JSON.parse(localStorage.getItem('mrs_favorites') || '[]');
            return { isFavorite: favs.includes(movieId) };
        }
    },

    async getFavorites() {
        try {
            const res = await fetch(`${this.BASE_URL}/favorites`, { headers: this.getHeaders() });
            if (!res.ok && res.status === 401) { this.logout(); return { ok: false }; }
            const data = await res.json();
            return { ok: true, data: data };
        } catch (e) {
            const favs = JSON.parse(localStorage.getItem('mrs_favorites') || '[]');
            return { ok: true, data: { favorites: favs.map(id => ({ movie_id: id })) } };
        }
    },

    // ── AI Recommendations ──
    async getRecommendations(count = 8) {
        const user = this.getUser();
        const userId = user ? user.user_uid : 'guest';

        try {
            const response = await fetch(`${this.ML_API_BASE}/recommend?user_id=${userId}&count=${count * 2}`);
            if (response.ok) {
                const recommendations = await response.json();
                // Deduplicate by movie_id
                const seen = new Set();
                const deduped = recommendations.filter(m => {
                    if (seen.has(m.movie_id)) return false;
                    seen.add(m.movie_id);
                    return true;
                }).slice(0, count);
                return {
                    ok: true,
                    data: {
                        recommendations: deduped.map(m => ({
                            ...m,
                            source: 'AI',
                            explanation: m.explanation || null,
                            similarity: m.similarity || 0,
                            user_pref: m.user_pref || 0,
                            score: m.score || 0,
                        }))
                    }
                };
            }
        } catch (error) {
            console.warn('AI Backend unreachable, falling back to LocalAI:', error);
        }

        // Fallback to LocalAI
        const recs = LocalAI.getRecommendations(count * 2);
        // Deduplicate fallback recs
        const seen = new Set();
        const dedupedLocal = recs.filter(m => {
            if (seen.has(m.movie_id)) return false;
            seen.add(m.movie_id);
            return true;
        }).slice(0, count);
        return {
            ok: true,
            data: {
                recommendations: dedupedLocal.map(m => ({
                    movie_id: m.movie_id,
                    reason: 'AI matched your vibe',
                    source: 'AI',
                    explanation: null,
                    similarity: 0,
                    user_pref: 0,
                    score: 0,
                }))
            }
        };
    },

    async getMovieRecommendations(movieId, count = 5) {
        const user = this.getUser();
        const userId = user ? user.user_uid : 'guest';

        try {
            const response = await fetch(`${this.ML_API_BASE}/recommend/${movieId}?user_id=${userId}&count=${count * 2}`);
            if (response.ok) {
                const recommendations = await response.json();
                // Deduplicate and exclude the current movie
                const seen = new Set([movieId]);
                const deduped = recommendations.filter(m => {
                    if (seen.has(m.movie_id)) return false;
                    seen.add(m.movie_id);
                    return true;
                }).slice(0, count);
                return {
                    ok: true,
                    data: {
                        recommendations: deduped.map(m => ({
                            ...m,
                            source: 'AI',
                            explanation: m.explanation || null,
                            similarity: m.similarity || 0,
                            user_pref: m.user_pref || 0,
                            score: m.score || 0,
                        }))
                    }
                };
            }
        } catch (error) {
            console.error('AI Recommendation Error:', error);
        }
        return { ok: false, error: 'Could not fetch similarity recommendations' };
    },

    async getHistory() {
        try {
            const res = await fetch(`${this.BASE_URL}/history`, { headers: this.getHeaders() });
            if (!res.ok && res.status === 401) { this.logout(); return { ok: false }; }
            const data = await res.json();
            return { ok: true, data: { interactions: data.interactions } };
        } catch (e) { return { ok: false }; }
    },

    async getSearchHistory() {
        try {
            const res = await fetch(`${this.BASE_URL}/history/searches`, { headers: this.getHeaders() });
            if (!res.ok && res.status === 401) { this.logout(); return { ok: false }; }
            const data = await res.json();
            return { ok: true, data: { searches: data.searches } };
        } catch (e) { return { ok: false }; }
    },

    async getLearningStats() {
        try {
            const res = await fetch(`${this.BASE_URL}/recommendations/stats`, { headers: this.getHeaders() });
            if (!res.ok && res.status === 401) { this.logout(); return { ok: false }; }
            const data = await res.json();
            // Server returns stats at top level (no .summary wrapper)
            const stats = data.stats || {};
            return { ok: true, data: { stats: {
                totalInteractions: stats.totalInteractions || 0,
                modelMaturity: stats.modelMaturity || 'cold_start',
                totalQEntries: stats.totalQEntries || 0,
                uniqueStatesLearned: stats.uniqueStatesLearned || 0,
                avgQValue: stats.avgQValue || 0,
                topGenres: stats.topGenres || [],
                activityBreakdown: stats.activityBreakdown || {}
            } } };
        } catch (e) {
            // Local fallback
            const stats = LocalAI.getUserLearningStats();
            return {
                ok: true,
                data: {
                    stats: {
                        totalInteractions: stats.summary.totalInteractions,
                        modelMaturity: stats.summary.modelMaturity,
                        totalQEntries: stats.summary.totalQEntries,
                        uniqueStatesLearned: stats.summary.uniqueStates,
                        avgQValue: stats.summary.avgQValue,
                        topGenres: [],
                        activityBreakdown: stats.activityBreakdown
                    }
                }
            };
        }
    },

    // ── ML Metrics & Model Info ──
    async getMLMetrics() {
        try {
            const res = await fetch(`${this.ML_API_BASE}/metrics`);
            if (res.ok) {
                const data = await res.json();
                return { ok: true, data };
            }
        } catch (e) {
            console.warn('ML metrics unavailable:', e);
        }
        return { ok: false, error: 'ML metrics unavailable' };
    },

    async getModelInfo() {
        try {
            const res = await fetch(`${this.ML_API_BASE}/model-info`);
            if (res.ok) {
                const data = await res.json();
                return { ok: true, data };
            }
        } catch (e) {
            console.warn('Model info unavailable:', e);
        }
        return { ok: false, error: 'Model info unavailable' };
    },

    // ── Generic GET (for dashboard/analytics) ──
    async get(url) {
        try {
            const res = await fetch(`${this.BASE_URL.replace('/api', '')}${url}`, { headers: this.getHeaders() });
            if (!res.ok && res.status === 401) { this.logout(); return { ok: false }; }
            const data = await res.json();
            return res.ok ? { ok: true, data } : { ok: false, error: data.error };
        } catch (e) {
            return { ok: false, error: 'Server unreachable' };
        }
    }
};
