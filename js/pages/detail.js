// Movie Recommendation System — Movie Detail Page

function renderDetail(params) {
  const movieId = parseInt(params.id);
  const movie = MOVIES.find(m => m.movie_id === movieId);
  
  const shouldAutoplay = localStorage.getItem('mrs_play_trailer') === 'true';

  // Track this movie as recently viewed
  if (typeof trackRecentlyViewed === 'function') {
    trackRecentlyViewed(movieId);
  }

  // Auto-scroll to trailer if requested
  if (shouldAutoplay) {
    setTimeout(() => {
      const el = document.getElementById('movie-trailer-section');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      localStorage.removeItem('mrs_play_trailer');
    }, 500);
  }

  if (!movie) {
    return `
      <div class="empty-state" style="padding-top: 20px;">
        <div class="empty-icon">?</div>
        <h3>Movie not found</h3>
        <p>The movie you're looking for doesn't exist.</p>
        <a href="#/" class="btn btn-primary" style="margin-top: 20px;">← Go Home</a>
      </div>
    `;
  }

  // Check age filter
  const userAge = parseInt(localStorage.getItem('mrs_age')) || 0;
  if (userAge < movie.age_limit) {
    return `
      <div class="empty-state" style="padding-top: 20px;">
        <div class="empty-icon">?</div>
        <h3>Age-Restricted Content</h3>
        <p>This movie requires age ${movie.age_limit}+. Please update your age to access.</p>
        <a href="#/" class="btn btn-primary" style="margin-top: 20px;">← Go Home</a>
      </div>
    `;
  }

  const ageBadgeText = movie.age_limit === 0 ? 'All' : movie.age_limit + '+';

  return `
    <div class="detail-page">
      <div class="container">
        <a class="back-link" onclick="window.history.back()" style="cursor: pointer;">← Go Back</a>

        <div class="detail-hero fade-in">
          <!-- Poster -->
          <div class="detail-poster">
            <img
              src="${movie.poster}"
              alt="${movie.title}"
              referrerpolicy="no-referrer"
              onerror="this.src='https://via.placeholder.com/300x450/1a1a2e/7c3aed?text=${encodeURIComponent(movie.title)}'"
            />
          </div>

          <!-- Info -->
          <div class="detail-info">
            <h1 class="detail-title">${movie.title}</h1>
            <div class="detail-year" style="display: flex; align-items: center; gap: 10px; margin-bottom: 20px;">
              <span style="font-weight: 700;">${movie.release_date || movie.year}</span>
              ${movie.duration_minutes ? `<span style="opacity: 0.6; font-size: 0.9rem;">${Math.floor(movie.duration_minutes / 60)}h ${movie.duration_minutes % 60}m</span>` : '<span style="opacity: 0.6; font-size: 0.9rem;">Official runtime pending</span>'}
            </div>

            <div class="detail-badges">
              ${(movie.genre || []).map(g => `<span class="genre-badge">${g}</span>`).join('')}
              <span class="exp-badge ${movie.experience_type || 'fun'}">${movie.experience_type || 'Universal'}</span>
              <span class="genre-badge" style="background: rgba(255,255,255,0.08); color: var(--text-secondary);">${ageBadgeText}</span>
            </div>

            <p class="detail-synopsis">${movie.synopsis || movie.overview || 'Description coming soon...'}</p>

            ${movie.quote ? `
            <blockquote class="detail-quote">
              <p>
                ${movie.quote.includes('--') ? `
                  <span class="quote-highlight">${movie.quote.split('--')[0].trim()}</span>
                  <span class="quote-sep">--</span>
                  <span>${movie.quote.split('--')[1].trim()}</span>
                ` : movie.quote}
              </p>
            </blockquote>
            ` : ''}

            ${movie.trailer ? `
            <!-- Trailer -->
            <div class="trailer-section" id="movie-trailer-section" style="margin-bottom: 24px;">
              <div class="rating-label" style="margin-bottom: 14px;">Watch Trailer</div>
              <div class="trailer-container" id="trailer-container">
                <div class="trailer-iframe-wrap">
                  <iframe 
                    src="https://www.youtube-nocookie.com/embed/${movie.trailer}?autoplay=${shouldAutoplay ? 1 : 0}&rel=0&modestbranding=1&origin=${encodeURIComponent(window.location.origin)}" 
                    frameborder="0" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                    allowfullscreen
                    referrerpolicy="strict-origin-when-cross-origin"
                  ></iframe>
                </div>
              </div>
            </div>
            ` : ''}

            <!-- Rating -->
            <div class="rating-section">
              <div class="rating-label">Reference Rating (avg. IMDb, Rotten Tomatoes, Metacritic)</div>
              <div class="rating-bar-outer">
                <div class="rating-bar-inner" style="width: 0%;" data-target="${movie.rating_percent}"></div>
              </div>
              <div class="rating-value">${movie.rating_percent}%</div>
              <div class="rating-note">Ratings shown for reference only — not the sole factor in recommendations</div>
            </div>

            <!-- User Rate & Review Section (AI-connected) -->
            ${renderUserFeedback(movieId)}

            <!-- Cast & Crew -->
            <div class="crew-section">
              <div class="rating-label" style="margin-bottom: 14px;">Cast & Crew</div>
              <div class="crew-grid">
                ${movie.director ? `
                <div class="crew-card">
                  <span class="crew-role">Director</span>
                  <span class="crew-name">${movie.director}</span>
                </div>` : ''}
                ${movie.writer ? `
                <div class="crew-card">
                  <span class="crew-role">Writer</span>
                  <span class="crew-name">${movie.writer}</span>
                </div>` : ''}
                ${movie.cast ? `
                <div class="crew-card crew-card-wide">
                  <span class="crew-role">Cast</span>
                  <span class="crew-name" style="line-height:1.4;">${Array.isArray(movie.cast) ? movie.cast.join(', ') : movie.cast}</span>
                </div>` : ''}
                ${movie.cinematographer ? `
                <div class="crew-card">
                  <span class="crew-role">Cinematography</span>
                  <span class="crew-name">${movie.cinematographer}</span>
                </div>` : ''}
                ${movie.music ? `
                <div class="crew-card">
                  <span class="crew-role">Music</span>
                  <span class="crew-name">${movie.music}</span>
                </div>` : ''}
              </div>
            </div>

            <!-- Movie Metadata -->
            <div class="detail-metadata">
              <div class="metadata-item">
                <span class="metadata-label">Released</span>
                <span class="metadata-value">${movie.release_date || movie.year}</span>
              </div>
              <div class="metadata-item">
                <span class="metadata-label">Popularity</span>
                <span class="metadata-value">${(movie.popularity_score * 100).toFixed(0)}%</span>
              </div>
              <div class="metadata-item">
                <span class="metadata-label">Experience</span>
                <span class="metadata-value exp-badge ${movie.experience_type}" style="font-size: 13px;">${movie.experience_type}</span>
              </div>
              <div class="metadata-item">
                <span class="metadata-label">Age Limit</span>
                <span class="metadata-value">${ageBadgeText}</span>
              </div>
            </div>

            <!-- OTT Platforms -->
            <div class="ott-section">
              <div class="rating-label" style="margin-bottom: 14px;">Watch On</div>
              <div class="ott-grid">
                ${(movie.ottPlatforms || []).map(p => `
                  <a href="${p.url}" target="_blank" rel="noopener noreferrer" class="ott-link">
                    ${p.icon ? `<img src="${p.icon}" class="ott-platform-icon" style="width: 24px !important; height: 24px !important; display: inline-block !important; vertical-align: middle !important; margin-right: 10px !important; object-fit: contain !important;" />` : getOTTIcon(p.name)}
                    <span class="ott-name">${p.name}</span>
                    <span class="ott-arrow">↗</span>
                  </a>
                `).join('') || '<p style="color:var(--text-muted); font-size:13px;">No streaming info available yet.</p>'}
              </div>
            </div>

            <!-- Actions -->
            <div class="detail-actions" style="margin-top: 24px; display: flex; gap: 12px; position: relative; z-index: 100;">
              <button id="favorite-toggle-btn" class="btn btn-outline" style="flex: 1; justify-content: center; border-color: rgba(239, 68, 68, 0.4); border-width: 1.5px; cursor: pointer !important;" onclick="toggleFavorite(event, ${movieId})">
                Favorite
              </button>
              <button id="watchlist-toggle-btn" class="btn btn-outline" style="flex: 1; justify-content: center; border-color: rgba(6, 182, 212, 0.4); border-width: 1.5px; cursor: pointer !important;" onclick="toggleWatchlist(event, ${movieId})">
                Watch Later
              </button>
            </div>

            <!-- Like / Dislike (Quick Feedback for AI) -->
            <div style="margin-top: 16px;">
              <div class="rating-label" style="margin-bottom: 10px;">Quick Feedback</div>
              ${renderLikeDislike(movieId)}
            </div>
          </div>
        </div>

        <!-- More Like This — with Loading State -->
        <div class="section recommend-section" style="padding-top: 0;">
          <div class="section-header">
            <div>
              <h2 class="section-title">More Like This</h2>
              <p class="section-subtitle">If you enjoyed this, you'll love these</p>
            </div>
          </div>
          <div id="detail-recommendations">
            ${renderAnalysisLoader()}
          </div>
        </div>

        <!-- Smart Contextual Sections (populated dynamically) -->
        <div id="smart-context-sections"></div>
      </div>
    </div>
  `;
}

/**
 * Show recommendations on the detail page after analysis delay.
 * Displays reasoning text under each recommended card for explainability.
 * Fetches from the AI backend for production-grade similarity.
 */
async function showDetailRecommendations(movieId) {
  const container = document.getElementById('detail-recommendations');
  if (!container) return;

  const userAge = parseInt(localStorage.getItem('mrs_age')) || 0;


  try {
    // 1. Try fetching from AI Backend
    const result = await API.getMovieRecommendations(movieId, 6);
    if (result.ok && result.data.recommendations.length > 0) {
      renderRecList(container, result.data.recommendations);
      // Now render smart contextual sections
      renderSmartContextSections(movieId, userAge);
      return;
    }
  } catch (error) {
    console.warn('AI similarity fetch failed, using local engine:', error);
  }

  // 2. Fallback to Local Recommendation Engine (heuristic-based)
  const localRecs = getRecommendations(MOVIES, movieId, userAge, 6);
  if (localRecs.length > 0) {
    renderRecList(container, localRecs.map(r => ({
      ...r.movie,
      reason: r.reason + ' (Local)',
      source: 'LocalHeuristic'
    })));
  } else {
    container.innerHTML = `
      <div class="empty-state" style="padding: 40px 0;">
        <div class="empty-icon">?</div>
        <h3>No Similar Movies Found</h3>
        <p style="color: var(--text-muted);">No similar movies found under current age filter. Try updating your age to see more recommendations.</p>
      </div>
    `;
  }

  // Render smart contextual sections regardless
  renderSmartContextSections(movieId, userAge);
}

/**
 * Helper to render the recommendation list.
 */
function renderRecList(container, items) {
  // Deduplicate items by movie_id
  const seen = new Set();
  const uniqueItems = items.filter(item => {
    const id = item.movie_id || (item.movie_id === undefined ? null : item.movie_id);
    if (!id || seen.has(id)) return false;
    seen.add(id);
    return true;
  });

  container.innerHTML = `
    <div class="movie-row stagger">
      ${uniqueItems.map(item => {
    const movie = item.movie_id ? MOVIES.find(m => m.movie_id === item.movie_id) : item;
    if (!movie) return '';

    const reason = item.reason || 'AI matched your vibe';
    const card = renderRecommendedCard(movie, reason);

    // Wrap card to track recommendation clicks for AI learning
    return card.replace(
      `onclick="Router.navigate('/movie/${movie.movie_id}')"`,
      `onclick="trackRecommendationClick(${movie.movie_id}, MOVIES.find(m=>m.movie_id===${movie.movie_id})); Router.navigate('/movie/${movie.movie_id}')"`
    );
  }).join('')}
    </div>
  `;
}

function getOTTIcon(name) {
  const logos = {
    'Netflix': '<img class="ott-original-logo" src="https://upload.wikimedia.org/wikipedia/commons/0/08/Netflix_2015_logo.svg" alt="Netflix" />',
    'Prime Video': '<img class="ott-original-logo" src="https://upload.wikimedia.org/wikipedia/commons/1/11/Amazon_Prime_Video_logo.svg" alt="Prime Video" />',
    'Disney+ Hotstar': '<img class="ott-original-logo" src="https://upload.wikimedia.org/wikipedia/commons/1/1e/Disney%2B_Hotstar_logo.svg" alt="Disney+ Hotstar" />',
    'JioCinema': '<span class="ott-logo-fallback" style="background:linear-gradient(135deg,#e50914,#ff6b35);color:#fff;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:700;">JioCinema</span>',
    'JioCinema (HBO)': '<span class="ott-logo-fallback" style="background:linear-gradient(135deg,#e50914,#ff6b35);color:#fff;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:700;">JioCinema</span>',
    'Sun NXT': '<span class="ott-logo-fallback" style="background:linear-gradient(135deg,#e31e24,#ff5722);color:#fff;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:700;">Sun NXT</span>',
    'Aha': '<span class="ott-logo-fallback" style="background:#ff6600;color:#fff;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:700;">Aha</span>',
    'Zee5': '<span class="ott-logo-fallback" style="background:linear-gradient(135deg,#8230c6,#b24bf3);color:#fff;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:700;">Zee5</span>',
    'SonyLIV': '<span class="ott-logo-fallback" style="background:#000;color:#fff;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:700;">SonyLIV</span>',
    'Apple TV+': '<img class="ott-original-logo" src="https://upload.wikimedia.org/wikipedia/commons/2/28/Apple_TV_Plus_Logo.svg" alt="Apple TV+" />',
    'MUBI': '<span class="ott-logo-fallback" style="background:#001489;color:#fff;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:700;">MUBI</span>',
    'YouTube Premium': '<span class="ott-logo-fallback" style="background:#ff0000;color:#fff;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:700;">YouTube</span>'
  };
  return logos[name] || '<span class="ott-logo-fallback">Logo</span>';
}



// ──────────────────────────────────────────────
// SMART CONTEXTUAL RECOMMENDATION SECTIONS
// ──────────────────────────────────────────────

/**
 * Franchise/Universe detection rules.
 * Detects movies that belong to the same franchise or cinematic universe.
 */
const UNIVERSE_RULES = [
  // Title-prefix franchises (e.g., "Spider-Man: ...", "Avengers: ...")
  { type: 'prefix', detect: (movie) => {
    const parts = movie.title.split(':');
    if (parts.length > 1) return parts[0].trim();
    return null;
  }},
  // Numbered sequels (e.g., "Spider-Man 3", "The Dark Knight")
  { type: 'sequel', detect: (movie) => {
    // Match titles like "Movie Name 2", "Movie Name 3" etc.
    const numMatch = movie.title.match(/^(.+?)\s+\d+\s*$/); 
    if (numMatch) return numMatch[1].trim();
    return null;
  }},
  // Known franchise keyword groups
  { type: 'keyword', groups: {
    'Spider-Man': ['Spider-Man', 'Amazing Spider-Man', 'Spider-Verse'],
    'The Lord of the Rings': ['Lord of the Rings', 'LOTR'],
    'Star Wars': ['Star Wars'],
    'Harry Potter': ['Harry Potter'],
    'The Dark Knight': ['Dark Knight', 'Batman Begins'],
    'Avengers': ['Avengers', 'Infinity War', 'Endgame'],
    'John Wick': ['John Wick'],
    'Dune': ['Dune'],
    'K.G.F': ['K.G.F'],
    'Ponniyin Selvan': ['Ponniyin Selvan'],
    'Baahubali': ['Baahubali'],
    'Mission: Impossible': ['Mission: Impossible', 'Mission Impossible'],
    'The Godfather': ['Godfather'],
    'Jurassic': ['Jurassic Park', 'Jurassic World'],
    'Transformers': ['Transformers'],
    'Fast & Furious': ['Fast & Furious', 'Furious', 'Fast Five', 'Fast and Furious'],
    'Toy Story': ['Toy Story'],
    'Pirates of the Caribbean': ['Pirates of the Caribbean'],
    'X-Men': ['X-Men'],
    'Demon Slayer': ['Demon Slayer', 'Kimetsu no Yaiba'],
    'Dragon Ball': ['Dragon Ball'],
    'Lokesh Cinematic Universe': { exact: true, titles: ['Vikram', 'Kaithi', 'Leo'] },  // LCU
  }}
];

/**
 * Find movies from the same franchise/universe.
 */
function findUniverseMovies(movie, allMovies) {
  const currentId = movie.movie_id;
  let universeName = null;
  let universeMovies = [];

  // Strategy 1: Check known franchise keyword groups first (most reliable)
  for (const rule of UNIVERSE_RULES) {
    if (rule.type === 'keyword') {
      for (const [franchise, config] of Object.entries(rule.groups)) {
        const titleLower = movie.title.toLowerCase();
        // Support exact-match groups (like LCU) and substring-match groups
        const isExact = config.exact === true;
        const keywords = isExact ? config.titles : (Array.isArray(config) ? config : config.titles || []);
        const matchFn = (title, kw) => isExact 
          ? title === kw.toLowerCase() 
          : title.includes(kw.toLowerCase());
        const isMatch = keywords.some(kw => matchFn(titleLower, kw));
        if (isMatch) {
          universeMovies = allMovies.filter(m => {
            if (m.movie_id === currentId) return false;
            const mTitleLower = m.title.toLowerCase();
            return keywords.some(kw => matchFn(mTitleLower, kw));
          });
          if (universeMovies.length > 0) {
            universeName = franchise;
            break;
          }
        }
      }
      if (universeName) break;
    }
  }

  // Strategy 2: Title-prefix detection
  if (!universeName || universeMovies.length === 0) {
    for (const rule of UNIVERSE_RULES) {
      if (rule.type === 'prefix') {
        const prefix = rule.detect(movie);
        if (prefix && prefix.length > 2) {
          const found = allMovies.filter(m => {
            if (m.movie_id === currentId) return false;
            return m.title.startsWith(prefix);
          });
          if (found.length > 0) {
            universeName = prefix;
            universeMovies = found;
            break;
          }
        }
      }
    }
  }

  // Strategy 3: Numbered sequel detection
  if (!universeName || universeMovies.length === 0) {
    for (const rule of UNIVERSE_RULES) {
      if (rule.type === 'sequel') {
        const baseName = rule.detect(movie);
        if (baseName && baseName.length > 2) {
          const found = allMovies.filter(m => {
            if (m.movie_id === currentId) return false;
            return m.title.startsWith(baseName) || m.title === baseName;
          });
          if (found.length > 0) {
            universeName = baseName;
            universeMovies = found;
            break;
          }
        }
      }
    }
  }

  return { universeName, movies: universeMovies };
}

/**
 * Actor alias map — consolidates different name spellings for the same person.
 * This ensures Hero's Journey shows ALL movies for an actor even if names vary.
 */
const ACTOR_ALIASES = {
  'Vijay': ['Vijay', 'Joseph Vijay', 'Thalapathy Vijay'],
  'Rajinikanth': ['Rajinikanth', 'Rajini', 'Superstar Rajinikanth'],
  'Kamal Haasan': ['Kamal Haasan', 'Kamal Hassan', 'Kamalahaasan'],
};

/**
 * Get all aliases for an actor name (including the name itself).
 */
function getActorAliases(actorName) {
  for (const [, aliases] of Object.entries(ACTOR_ALIASES)) {
    if (aliases.some(a => a.toLowerCase() === actorName.toLowerCase())) {
      return aliases;
    }
  }
  return [actorName];
}

/**
 * Find movies featuring the same lead actor(s).
 * "Hero's Journey" — shows the filmography of the movie's star.
 */
function findHeroJourneyMovies(movie, allMovies) {
  if (!movie.cast) return { actorName: null, movies: [] };
  
  const castArr = Array.isArray(movie.cast) ? movie.cast : [movie.cast];
  const currentId = movie.movie_id;
  
  // Try lead actor first (cast[0]), then cast[1]
  for (let i = 0; i < Math.min(castArr.length, 2); i++) {
    const actor = castArr[i];
    if (!actor) continue;
    
    // Get all aliases for this actor
    const aliases = getActorAliases(actor);
    const aliasesLower = aliases.map(a => a.toLowerCase());
    
    const actorMovies = allMovies.filter(m => {
      if (m.movie_id === currentId) return false;
      if (!m.cast) return false;
      const mCast = Array.isArray(m.cast) ? m.cast : [m.cast];
      return mCast.some(c => aliasesLower.includes(c.toLowerCase()));
    });
    
    // Only show if actor has 2+ other movies
    if (actorMovies.length >= 2) {
      // Use the first alias as display name (canonical name)
      const displayName = aliases[0];
      return { actorName: displayName, movies: actorMovies };
    }
  }
  
  return { actorName: null, movies: [] };
}

/**
 * Find movies by the same director.
 * "Director's Vision" — the full filmography of the director.
 */
function findDirectorMovies(movie, allMovies) {
  if (!movie.director) return { directorName: null, movies: [] };
  
  const currentId = movie.movie_id;
  const director = movie.director;
  
  const dirMovies = allMovies.filter(m => {
    if (m.movie_id === currentId) return false;
    return m.director === director;
  });
  
  // Only show if director has 2+ other movies
  if (dirMovies.length >= 2) {
    return { directorName: director, movies: dirMovies };
  }
  
  return { directorName: null, movies: [] };
}

/**
 * Render all smart contextual recommendation sections.
 * These appear below the main "Recommended For You" section.
 */
function renderSmartContextSections(movieId, userAge) {
  const container = document.getElementById('smart-context-sections');
  if (!container) return;

  const movie = MOVIES.find(m => m.movie_id === movieId);
  if (!movie) return;

  const sections = [];

  // ── 1. Hero's Journey (Lead Actor Filmography) ──
  const hero = findHeroJourneyMovies(movie, MOVIES);
  if (hero.actorName && hero.movies.length >= 2) {
    const ageFiltered = hero.movies.filter(m => userAge >= m.age_limit);
    if (ageFiltered.length >= 1) {
      sections.push({
        id: 'hero-journey',
        icon: 'fa-solid fa-mask',
        accentClass: 'hero-accent',
        title: `Hero's Journey: ${hero.actorName}`,
        subtitle: `Explore more movies starring ${hero.actorName}`,
        movies: ageFiltered,
        reason: `Stars ${hero.actorName}`
      });
    }
  }

  // ── 2. Same Universe (Franchise Detection) ──
  const universe = findUniverseMovies(movie, MOVIES);
  if (universe.universeName && universe.movies.length >= 1) {
    const ageFiltered = universe.movies.filter(m => userAge >= m.age_limit);
    if (ageFiltered.length >= 1) {
      sections.push({
        id: 'same-universe',
        icon: 'fa-solid fa-globe',
        accentClass: 'universe-accent',
        title: `Same Universe: ${universe.universeName}`,
        subtitle: `All movies from the ${universe.universeName} universe`,
        movies: ageFiltered,
        reason: `${universe.universeName} Universe`
      });
    }
  }

  // ── 3. Director's Vision (Director Filmography) ──
  const director = findDirectorMovies(movie, MOVIES);
  if (director.directorName && director.movies.length >= 2) {
    const ageFiltered = director.movies.filter(m => userAge >= m.age_limit);
    if (ageFiltered.length >= 1) {
      sections.push({
        id: 'director-point-of-view',
        icon: 'fa-solid fa-clapperboard',
        accentClass: 'director-accent',
        title: `Director's Point of View: ${director.directorName}`,
        subtitle: `Explore the cinematic language of ${director.directorName}`,
        movies: ageFiltered,
        reason: `Directed by ${director.directorName}`
      });
    }
  }

  // Don't render if no sections
  if (sections.length === 0) {
    container.innerHTML = '';
    return;
  }

  // Render all sections with staggered animation
  container.innerHTML = sections.map((section, idx) => `
    <div class="section smart-context-section ${section.accentClass}" 
         id="${section.id}-section"
         style="padding-top: 0; animation-delay: ${idx * 200}ms;">
      <div class="smart-context-divider"></div>
      <div class="section-header" style="margin-top: 32px;">
        <div>
          <h2 class="section-title smart-context-title">
            ${section.title}
          </h2>
          <p class="section-subtitle">${section.subtitle}</p>
        </div>
        <span class="smart-context-count">${section.movies.length} movie${section.movies.length !== 1 ? 's' : ''}</span>
      </div>
      <div class="movie-row stagger">
        ${section.movies.map(m => {
          const card = renderRecommendedCard(m, section.reason);
          return card.replace(
            `onclick="Router.navigate('/movie/${m.movie_id}')"`,
            `onclick="trackRecommendationClick(${m.movie_id}, MOVIES.find(mv=>mv.movie_id===${m.movie_id})); Router.navigate('/movie/${m.movie_id}')"`
          );
        }).join('')}
      </div>
    </div>
  `).join('');

  // Trigger stagger animations
  requestAnimationFrame(() => {
    container.querySelectorAll('.smart-context-section').forEach((el, i) => {
      setTimeout(() => el.classList.add('visible'), i * 250);
    });
  });
}

/**
 * Animate the rating bar on the detail page.
 */
function animateRatingBar() {
  setTimeout(() => {
    const bar = document.querySelector('.rating-bar-inner');
    if (bar) {
      bar.style.width = bar.dataset.target + '%';
    }
  }, 200);
}
