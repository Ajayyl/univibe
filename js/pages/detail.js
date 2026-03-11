// UniVibe — Movie Detail Page

function renderDetail(params) {
  const movieId = parseInt(params.id);
  const movie = MOVIES.find(m => m.movie_id === movieId);

  if (!movie) {
    return `
      <div class="empty-state" style="padding-top: 140px;">
        <div class="empty-icon">🚫</div>
        <h3>Movie not found</h3>
        <p>The movie you're looking for doesn't exist.</p>
        <a href="#/" class="btn btn-primary" style="margin-top: 20px;">← Go Home</a>
      </div>
    `;
  }

  // Check age filter
  const userAge = parseInt(localStorage.getItem('univibe_age')) || 99;
  if (userAge < movie.age_limit) {
    return `
      <div class="empty-state" style="padding-top: 140px;">
        <div class="empty-icon">🔒</div>
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
        <a class="back-link" href="#/movies">← Back to Discovery</a>

        <div class="detail-hero fade-in">
          <!-- Poster -->
          <div class="detail-poster">
            <img
              src="${movie.poster}"
              alt="${movie.title}"
              onerror="this.src='https://via.placeholder.com/300x450/1a1a2e/7c3aed?text=${encodeURIComponent(movie.title)}'"
            />
          </div>

          <!-- Info -->
          <div class="detail-info">
            <h1 class="detail-title">${movie.title}</h1>
            <div class="detail-year">${movie.year}</div>

            <div class="detail-badges">
              ${movie.genre.map(g => `<span class="genre-badge">${g}</span>`).join('')}
              <span class="exp-badge ${movie.experience_type}">${movie.experience_type}</span>
              <span class="genre-badge" style="background: rgba(255,255,255,0.08); color: var(--text-secondary);">${ageBadgeText}</span>
            </div>

            <p class="detail-synopsis">${movie.synopsis}</p>

            ${movie.quote ? `
            <blockquote class="detail-quote">
              <span class="detail-quote-icon">💭</span>
              <p>${movie.quote}</p>
            </blockquote>
            ` : ''}

            ${movie.trailer ? `
            <!-- Trailer -->
            <div class="trailer-section">
              <div class="rating-label" style="margin-bottom: 14px;">🎬 Watch Trailer</div>
              <div class="trailer-container" id="trailer-container">
                <div class="trailer-thumbnail" onclick="playTrailer('${movie.trailer}')">
                  <img src="https://img.youtube.com/vi/${movie.trailer}/hqdefault.jpg" alt="${movie.title} Trailer" />
                  <div class="trailer-play-btn">
                    <svg viewBox="0 0 68 48" width="68" height="48"><path d="M66.5 7.7c-.8-2.9-2.5-5.4-5.4-6.2C55.8.1 34 0 34 0S12.2.1 6.9 1.6c-3 .7-4.6 3.2-5.4 6.1C.1 13 0 24 0 24s.1 11 1.5 16.3c.8 2.9 2.5 5.4 5.4 6.2C12.2 47.9 34 48 34 48s21.8-.1 27.1-1.6c3-.7 4.6-3.2 5.4-6.1C67.9 35 68 24 68 24s-.1-11-1.5-16.3z" fill="#FF0000"/><path d="M45 24L27 14v20" fill="#fff"/></svg>
                  </div>
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

            <!-- User Star Rating Widget (RL-connected) -->
            ${renderRatingWidget(movieId)}

            <!-- Movie Metadata -->
            <div class="detail-metadata">
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
                ${movie.ottPlatforms.map(p => `
                  <a href="${p.url}" target="_blank" rel="noopener noreferrer" class="ott-link">
                    ${getOTTIcon(p.name)} ${p.name}
                    <span class="ott-arrow">↗</span>
                  </a>
                `).join('')}
              </div>
            </div>

            <!-- Actions -->
            <div class="detail-actions" style="margin-top: 24px;">
              <button id="watchlist-toggle-btn" class="btn btn-outline" style="width: 100%; justify-content: center;" onclick="toggleWatchlist(event, ${movieId})">
                🔖 Add to Watch Later
              </button>
            </div>
          </div>
        </div>

        <!-- Similar Movies with Loading State -->
        <div class="section recommend-section" style="padding-top: 0;">
          <div class="section-header">
            <div>
              <h2 class="section-title">✨ Recommended For You</h2>
              <p class="section-subtitle">If you liked ${movie.title}, you might enjoy these</p>
            </div>
          </div>
          <div id="detail-recommendations">
            ${renderAnalysisLoader()}
          </div>
        </div>
      </div>
    </div>
  `;
}

/**
 * Show recommendations on the detail page after analysis delay.
 * Displays reasoning text under each recommended card for explainability.
 * Fetches from the FastAPI ML backend for production-grade similarity.
 */
async function showDetailRecommendations(movieId) {
  const container = document.getElementById('detail-recommendations');
  if (!container) return;

  const userAge = parseInt(localStorage.getItem('univibe_age')) || 99;

  // Analysis delay for "AI Premium" feel
  await new Promise(resolve => setTimeout(resolve, 1500));

  try {
    // 1. Try fetching from FastAPI ML Backend
    const result = await API.getMovieRecommendations(movieId, 6);
    if (result.ok && result.data.recommendations.length > 0) {
      renderRecList(container, result.data.recommendations);
      return;
    }
  } catch (error) {
    console.warn('FastAPI similarity fetch failed, using local engine:', error);
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
        <div class="empty-icon">🔍</div>
        <h3>No Similar Movies Found</h3>
        <p style="color: var(--text-muted);">No similar movies found under current age filter. Try updating your age to see more recommendations.</p>
      </div>
    `;
  }
}

/**
 * Helper to render the recommendation list.
 */
function renderRecList(container, items) {
  container.innerHTML = `
    <div class="movie-row stagger">
      ${items.map(item => {
    const movie = item.movie_id ? MOVIES.find(m => m.movie_id === item.movie_id) : item;
    if (!movie) return '';

    const reason = item.reason || '🤖 AI matched your vibe';
    const card = renderRecommendedCard(movie, reason);

    // Wrap card to track recommendation clicks for RL learning
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
    'Disney+': '<img class="ott-original-logo" src="https://upload.wikimedia.org/wikipedia/commons/3/3e/Disney%2B_logo.svg" alt="Disney+" />',
    'HBO Max': '<img class="ott-original-logo" src="https://upload.wikimedia.org/wikipedia/commons/1/17/HBO_Max_Logo.svg" alt="HBO Max" />',
    'Apple TV': '<img class="ott-original-logo" src="https://upload.wikimedia.org/wikipedia/commons/2/28/Apple_TV_Plus_Logo.svg" alt="Apple TV" />',
    'Hulu': '<img class="ott-original-logo" src="https://upload.wikimedia.org/wikipedia/commons/0/03/Hulu_logo_%282014%29.svg" alt="Hulu" />',
    'Paramount+': '<img class="ott-original-logo" src="https://upload.wikimedia.org/wikipedia/commons/a/a5/Paramount_Plus.svg" alt="Paramount+" />',
    'Peacock': '<img class="ott-original-logo" src="https://upload.wikimedia.org/wikipedia/commons/d/d3/NBCUniversal_Peacock_Logo.svg" alt="Peacock" />'
  };
  return logos[name] || '<span class="ott-logo-fallback">🎬</span>';
}

function playTrailer(ytId) {
  const container = document.getElementById('trailer-container');
  if (!container) return;
  container.innerHTML = `
    <div class="trailer-iframe-wrap">
      <iframe 
        src="https://www.youtube.com/embed/${ytId}?autoplay=1&rel=0&modestbranding=1" 
        frameborder="0" 
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
        allowfullscreen
      ></iframe>
    </div>
  `;
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
