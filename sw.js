// ═══════════════════════════════════════════════════════════════
// Movie Recommendation System — Service Worker (PWA Offline Support)
// Caches all static assets for full offline functionality
// ═══════════════════════════════════════════════════════════════

// SW version bump strictly to clear caches smoothly
const CACHE_NAME = 'mrs-v78';

// All static assets to cache for offline use
const STATIC_ASSETS = [
    './',
    './index.html',
    './manifest.json',
    './css/style.css',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css',
    'https://img.icons8.com/fluency/512/cinema-.png',
    './assets/wallpapers/cyberpunk.png',

    // Data
    './data/movieData_v63.js',

    // Core JS
    './js/localAI.js',
    './js/api.js',
    './js/components.js',
    './js/recommendationEngine.js',
    './js/router.js',

    // Page JS
    './js/pages/ageGate.js',
    './js/pages/authUI.js',
    './js/pages/catalogue.js',
    './js/pages/dashboard.js',
    './js/pages/detail.js',
    './js/pages/home.js',
    './js/pages/movieList.js',
    './js/pages/platform.js'
];

// ── Install: Pre-cache all static assets ──
self.addEventListener('install', (event) => {
    console.log('[SW] Installing Movie Recommendation System service worker...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[SW] Pre-caching static assets');
                return cache.addAll(STATIC_ASSETS);
            })
            .then(() => self.skipWaiting())
    );
});

// ── Activate: Clean up old caches ──
self.addEventListener('activate', (event) => {
    console.log('[SW] Activating Movie Recommendation System service worker...');
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames
                        .filter((name) => name !== CACHE_NAME)
                        .map((name) => {
                            console.log('[SW] Removing old cache:', name);
                            return caches.delete(name);
                        })
                );
            })
            .then(() => self.clients.claim())
    );
});

// ── Fetch: Serve from cache, fallback to network ──
self.addEventListener('fetch', (event) => {
    const { request } = event;

    // Skip non-GET requests (API calls etc.)
    if (request.method !== 'GET') return;

    // Skip API/backend requests — let them go to network
    if (request.url.includes('/api/')) return;

    // For navigation requests (HTML pages), try network first, fall back to cache
    if (request.mode === 'navigate') {
        event.respondWith(
            fetch(request)
                .then((response) => {
                    // Clone and cache the fresh response
                    const responseClone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
                    return response;
                })
                .catch(() => caches.match('./index.html'))
        );
        return;
    }

    // For JS and CSS files: Network first, cache fallback (ensures code updates propagate)
    if (request.url.endsWith('.js') || request.url.endsWith('.css') || request.url.includes('.js?') || request.url.includes('.css?')) {
        event.respondWith(
            fetch(request)
                .then((response) => {
                    if (response && response.ok) {
                        const responseClone = response.clone();
                        caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
                    }
                    return response;
                })
                .catch(() => caches.match(request))
        );
        return;
    }

    // For other static assets (images etc.): Cache first, then network fallback
    event.respondWith(
        caches.match(request)
            .then((cachedResponse) => {
                if (cachedResponse) {
                    // Serve from cache immediately, update in background
                    const fetchPromise = fetch(request)
                        .then((networkResponse) => {
                            if (networkResponse && networkResponse.ok) {
                                caches.open(CACHE_NAME).then((cache) => cache.put(request, networkResponse.clone()));
                            }
                            return networkResponse;
                        })
                        .catch(() => null);
                    return cachedResponse;
                }

                // Not in cache — fetch from network and cache for next time
                return fetch(request)
                    .then((response) => {
                        if (!response || !response.ok) return response;

                        // Cache images and other resources dynamically
                        const responseClone = response.clone();
                        caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
                        return response;
                    })
                    .catch(() => {
                        // Offline fallback for images
                        if (request.destination === 'image') {
                            return new Response(
                                `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="300" viewBox="0 0 200 300">
                  <rect fill="#111128" width="200" height="300"/>
                  <text fill="#6b6b80" font-family="sans-serif" font-size="14" text-anchor="middle" x="100" y="150">Offline</text>
                </svg>`,
                                { headers: { 'Content-Type': 'image/svg+xml' } }
                            );
                        }
                        return new Response('Offline', { status: 503 });
                    });
            })
    );
});
