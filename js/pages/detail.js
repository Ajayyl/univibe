// UniVibe — Movie Detail Page

async function renderDetail(params) {
  const movieId = parseInt(params.id);
  const movie = await API.getMovieById(movieId);

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

  // 2nd Age Check logic block removed because it was rendering empty state text without returning properly in the original mock.
  // The first block returns HTML if userAge < limits anyways.
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

            <!-- Rating -->
            <div class="rating-section">
              <div class="rating-label">Reference Rating (avg. IMDb, Rotten Tomatoes, Metacritic)</div>
              <div class="rating-bar-outer">
                <div class="rating-bar-inner" style="width: 0%;" data-target="${movie.rating_percent}"></div>
              </div>
              <div class="rating-value">${movie.rating_percent}%</div>
              <div class="rating-note">Ratings shown for reference only — not the sole factor in recommendations</div>
            </div>

            <!-- User Actions (Rating & Watchlist) -->
            <div style="display: flex; gap: 20px; align-items: flex-start;">
              ${renderRatingWidget(movieId)}
              <div class="watchlist-widget">
                <button id="watchlist-btn" class="btn btn-outline" onclick="toggleWatchlist(${movieId})" style="padding: 8px 16px; border-radius: 20px;">
                  <span id="watchlist-icon">🔖</span> <span id="watchlist-text">Save to Watchlist</span>
                </button>
              </div>
            </div>

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

            <!-- YouTube Trailer Action -->
            <div class="trailer-section" style="margin-top: 24px;">
              <button class="btn btn-primary" onclick="window.open('https://www.youtube.com/results?search_query=${encodeURIComponent(movie.title + ' ' + movie.year + ' official trailer')}', '_blank')">
                ▶ Watch Trailer
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
            ${typeof renderSkeletonRow !== 'undefined' ? renderSkeletonRow(6) : ''}
          </div>
        </div>
      </div>
    </div>
    </div>
  `;
}

/**
 * Show recommendations on the detail page after analysis delay.
 * Displays reasoning text under each recommended card for explainability.
 */
async function showDetailRecommendations(movieId) {
  const container = document.getElementById('detail-recommendations');
  if (!container) return;

  const recs = await API.getSimilarMovies(movieId, 6);

  setTimeout(() => {
    if (recs.length > 0) {
      container.innerHTML = `
        <div class="movie-row stagger">
          ${recs.map(item => {
        // Wrap card to track recommendation clicks
        const reasonStr = `🎯 Similar vibe: ${item.genre.join(', ')}`;
        const card = renderRecommendedCard(item, reasonStr);
        return card.replace(
          `onclick="Router.navigate('/movie/${item.movie_id}')"`,
          `onclick="trackRecommendationClick(${item.movie_id}, false); Router.navigate('/movie/${item.movie_id}')"`
        );
      }).join('')}
        </div>
      `;
    } else {
      container.innerHTML = `
        <div class="empty-state" style="padding: 40px 0;">
          <div class="empty-icon">🔍</div>
          <h3>No Similar Movies Found</h3>
          <p style="color: var(--text-muted);">No similar movies found under current age filter. Try updating your age to see more recommendations.</p>
        </div>
      `;
    }
  }, 1500);
}

// Global scope for component bindings
window.toggleWatchlist = function (movieId) {
  if (!API.isLoggedIn()) {
    showToast('Please sign in to save movies to your watchlist', 'error');
    return;
  }

  const inWatchlist = localStorage.getItem(`watchlist_${movieId}`) === 'true';
  const btn = document.getElementById('watchlist-btn');
  const icon = document.getElementById('watchlist-icon');
  const text = document.getElementById('watchlist-text');

  if (inWatchlist) {
    localStorage.removeItem(`watchlist_${movieId}`);
    icon.textContent = '🔖';
    text.textContent = 'Save to Watchlist';
    btn.classList.remove('active');
    btn.style.borderColor = 'var(--border-glass)';
    btn.style.color = 'var(--text-primary)';
    showToast('Removed from Watchlist', 'info');
  } else {
    localStorage.setItem(`watchlist_${movieId}`, 'true');
    icon.textContent = '✅';
    text.textContent = 'Saved in Watchlist';
    btn.classList.add('active');
    btn.style.borderColor = 'var(--accent-primary)';
    btn.style.color = 'var(--accent-tertiary)';
    showToast('Added to Watchlist!', 'success');
  }
};

// Check Watchlist state on load
function checkWatchlistState(movieId) {
  setTimeout(() => {
    if (localStorage.getItem(`watchlist_${movieId}`) === 'true') {
      const btn = document.getElementById('watchlist-btn');
      const icon = document.getElementById('watchlist-icon');
      const text = document.getElementById('watchlist-text');
      if (btn && icon && text) {
        icon.textContent = '✅';
        text.textContent = 'Saved in Watchlist';
        btn.classList.add('active');
        btn.style.borderColor = 'var(--accent-primary)';
        btn.style.color = 'var(--accent-tertiary)';
      }
    }
  }, 100);
}

function getOTTIcon(name) {
  const icons = {
    'Netflix': '🔴',
    'Prime Video': '📦',
    'Disney+': '🏰',
    'HBO Max': '🟣',
    'Apple TV': '🍎',
    'Hulu': '🟢',
    'Paramount+': '⭐',
    'Peacock': '🦚'
  };
  return icons[name] || '🎬';
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
