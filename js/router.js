// Movie Recommendation System — Hash-based SPA Router

const Router = {
    routes: {},
    currentRoute: null,

    /**
     * Register a route handler.
     * Pattern can include params, e.g. '/movie/:id'
     */
    on(pattern, handler) {
        this.routes[pattern] = handler;
    },

    /**
     * Navigate to a given hash route.
     */
    navigate(path) {
        window.location.hash = '#' + path;
    },

    /**
     * Match current hash against registered routes.
     */
    resolve() {
        const hash = window.location.hash.slice(1) || '/';
        this.currentRoute = hash;
        console.log('[Router.resolve] hash:', JSON.stringify(hash), 'registered patterns:', Object.keys(this.routes));

        for (const pattern in this.routes) {
            const params = this._matchRoute(pattern, hash);
            if (params !== null) {
                console.log('[Router.resolve] MATCHED pattern:', pattern, 'params:', params);
                try {
                    const result = this.routes[pattern](params);
                    if (result && typeof result.catch === 'function') {
                        result.catch(err => console.error('[Router.resolve] Async handler error:', err));
                    }
                } catch (e) {
                    console.error('[Router.resolve] Sync handler error:', e);
                }
                return;
            }
        }

        console.log('[Router.resolve] No match, falling back to /');
        // Fallback: go home
        this.routes['/'] && this.routes['/']({});
    },

    /**
     * Match a route pattern against a path.
     * Returns params object or null.
     */
    _matchRoute(pattern, path) {
        const patternParts = pattern.split('/').filter(Boolean);
        const pathParts = path.split('/').filter(Boolean);

        if (patternParts.length !== pathParts.length) return null;

        const params = {};
        for (let i = 0; i < patternParts.length; i++) {
            if (patternParts[i].startsWith(':')) {
                params[patternParts[i].slice(1)] = decodeURIComponent(pathParts[i]);
            } else if (patternParts[i] !== pathParts[i]) {
                return null;
            }
        }
        return params;
    },

    /**
     * Initialize the router.
     */
    init() {
        console.log('[Router.init] Initializing, attaching hashchange listener');
        window.addEventListener('hashchange', () => this.resolve());
        console.log('[Router.init] Calling initial resolve()');
        this.resolve();
        console.log('[Router.init] Done');
    }
};
