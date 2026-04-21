// Movie Recommendation System — Shared UI Components
// Rendering only — no recommendation logic.

/**
 * Convert a percentage (0-100) to star HTML (5 stars).
 */
function renderStarsFromPercent(percent) {
  const rating5 = (percent / 100) * 5;
  const fullStars = Math.floor(rating5);
  const hasHalf = (rating5 - fullStars) >= 0.3;
  const emptyStars = 5 - fullStars - (hasHalf ? 1 : 0);
  let html = '';
  for (let i = 0; i < fullStars; i++) html += '<span class="star-icon filled">★</span>';
  if (hasHalf) html += '<span class="star-icon half">★</span>';
  for (let i = 0; i < emptyStars; i++) html += '<span class="star-icon">★</span>';
  return html;
}

/**
 * Get a short, balanced display label for experience_type.
 * Keeps badge text uniform in length with genre badges.
 */
function getExpLabel(type) {
  const labels = {
    'thought-provoking': 'Insightful',
    'intense': 'Intense',
    'emotional': 'Emotional',
    'fun': 'Fun',
    'relaxing': 'Relaxing',
    'inspirational': 'Inspiring'
  };
  return labels[type] || type;
}

/**
 * Render a movie card used in grids and rows.
 * Now includes ⭐ star rating display.
 */
function renderMovieCard(movie) {
  // Use local SVG placeholder if image fails
  const placeholderUrl = generatePlaceholderUrl(movie.title);

  return `
    <div class="movie-card fade-in-up" onclick="trackMovieClick(${movie.movie_id}, MOVIES.find(m=>m.movie_id===${movie.movie_id})); Router.navigate('/movie/${movie.movie_id}')">
      <div class="poster-wrap">
        <img
          src="${movie.poster}"
          alt="${movie.title}"
          loading="lazy"
          referrerpolicy="no-referrer"
          onerror="this.onerror=null; this.src='${placeholderUrl}'"
        />
        <div class="poster-overlay">
          <div class="overlay-rating">${movie.rating_percent}%</div>
        </div>
      </div>
      <div class="card-info">
        <div class="card-title" title="${movie.title}">${movie.title}</div>
        <div class="card-stars">
          ${renderStarsFromPercent(movie.rating_percent)}
          <span class="card-rating-num">${(movie.rating_percent / 20).toFixed(1)}</span>
        </div>
        <div class="card-meta">
          <span class="genre-badge">${movie.genre[0]}</span>
          <span class="exp-badge ${movie.experience_type}">${getExpLabel(movie.experience_type)}</span>
        </div>
      </div>
    </div>
  `;
}

/**
 * Render a recommended movie card with reasoning text.
 * Shows WHY the recommendation was made — valued for explainability.
 */
function renderRecommendedCard(movie, reason) {
  const placeholderUrl = generatePlaceholderUrl(movie.title);
  // Clean reason text for display
  const cleanReason = (reason || 'Matched your vibe').replace(/🤖\s*/g, '').replace(/^Recommended because it /i, '');

  return `
    <div class="movie-card fade-in-up has-reason" onclick="Router.navigate('/movie/${movie.movie_id}')" title="${(reason || '').replace(/"/g, '&quot;')}">
      <div class="poster-wrap">
        <img
          src="${movie.poster}"
          alt="${movie.title}"
          loading="lazy"
          referrerpolicy="no-referrer"
          onerror="this.onerror=null; this.src='${placeholderUrl}'"
        />
        <div class="poster-overlay">
          <div class="overlay-rating">${movie.rating_percent}%</div>
        </div>
      </div>
      <div class="card-info">
        <div class="card-title" title="${movie.title}">${movie.title}</div>
        <div class="card-stars">
          ${renderStarsFromPercent(movie.rating_percent)}
          <span class="card-rating-num">${(movie.rating_percent / 20).toFixed(1)}</span>
        </div>
        <div class="card-meta">
          <span class="genre-badge">${movie.genre[0]}</span>
          <span class="exp-badge ${movie.experience_type}">${getExpLabel(movie.experience_type)}</span>
        </div>
        <div class="card-reason-tag" title="${(reason || '').replace(/"/g, '&quot;')}">
          <span class="reason-text">${cleanReason}</span>
        </div>
      </div>
    </div>
  `;
}

/**
 * Generates a local SVG data URI placeholder for a movie.
 * Uses movie title to deterministically pick a gradient color.
 */
function generatePlaceholderUrl(title) {
  // Simple hash for color variation
  let hash = 0;
  for (let i = 0; i < title.length; i++) {
    hash = title.charCodeAt(i) + ((hash << 5) - hash);
  }

  const hue = Math.abs(hash % 360);
  const color1 = `hsl(${hue}, 60%, 20%)`;
  const color2 = `hsl(${(hue + 40) % 360}, 60%, 30%)`;

  // Create SVG with gradient background and centered text
  const svg = `
    <svg width="200" height="300" viewBox="0 0 200 300" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${color1};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${color2};stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#grad)" />
      <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="20" fill="white" text-anchor="middle" dominant-baseline="middle" dy="-10">
        ${title.substring(0, 25)}${title.length > 25 ? '...' : ''}
      </text>
      <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="12" fill="rgba(255,255,255,0.7)" text-anchor="middle" dominant-baseline="middle" dy="20">
        Poster Unavailable
      </text>
    </svg>
  `;

  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg.trim());
}

/**
 * Render a sleek skeleton loading grid for movie cards.
 * This looks much more premium than a simple spinning loader.
 */
function renderAnalysisLoader(count = 5) {
  const skeletons = Array(count).fill(0).map(() => `
    <div style="width: 200px; flex: 0 0 auto;" class="skeleton-card">
      <div class="skeleton-poster skeleton-shimmer" style="width: 100%; height: 300px; border-radius: 12px; background: rgba(255,255,255,0.05); margin-bottom: 12px;"></div>
      <div class="skeleton-text skeleton-shimmer" style="width: 80%; height: 16px; border-radius: 4px; background: rgba(255,255,255,0.05); margin-bottom: 8px;"></div>
      <div class="skeleton-text skeleton-shimmer" style="width: 50%; height: 12px; border-radius: 4px; background: rgba(255,255,255,0.05);"></div>
    </div>
  `).join('');

  return `
    <div class="movie-row stagger skeleton-loader-wrapper" style="overflow: hidden;">
      ${skeletons}
    </div>
  `;
}

/**
 * Render a unified Rate & Review section.
 * Merges explicit star ratings and textual reviews into one cohesive block.
 */
function renderUserFeedback(movieId) {
  const reviews = getMovieReviews(movieId);
  const isLoggedIn = API.isLoggedIn();

  // 1. Check if logged in for the whole widget
  if (!isLoggedIn) {
     return `
      <div class="user-feedback-section" style="margin-top: 32px; padding: 24px; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); border-radius: 16px;">
        <div class="rating-label" style="margin-bottom: 20px;">Rate & Review</div>
        
        <div class="stars-view" style="display: flex; gap: 8px; margin-bottom: 30px; opacity: 0.3; justify-content: center;">
          ${[1, 2, 3, 4, 5].map(i => `<span style="font-size: 32px;">★</span>`).join('')}
        </div>

        <div style="text-align: center; padding: 20px; background: rgba(255,255,255,0.03); border-radius: 12px;">
          <p style="color: var(--text-muted); margin-bottom: 12px; font-size: 14px;">Want to share your thoughts?</p>
          <a href="#/login" class="btn btn-primary btn-sm">Sign in to Rate & Review</a>
        </div>
        
        <div class="review-list-mini" style="margin-top: 30px;">
           <div style="font-size: 11px; color: var(--text-muted); text-transform: uppercase; margin-bottom: 12px;">Community Reviews (${reviews.length})</div>
           ${renderReviewItemsHTML(movieId, reviews)}
        </div>
      </div>
    `;
  }

  // 2. Logged in experience
  // Initial star fetch
  setTimeout(() => fetchAndRenderStars(movieId), 10);

  return `
    <div class="user-feedback-section" id="user-feedback-${movieId}" style="margin-top: 32px; padding: 24px; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); border-radius: 16px;">
      
      <!-- Upper: Rate -->
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px;">
        <div>
          <div class="rating-label" style="margin-bottom: 6px;">Rate & Review</div>
          <p style="font-size: 12px; color: var(--text-muted);">How was your experience?</p>
        </div>
        <div style="text-align: right;">
           <span id="rating-status-${movieId}" style="font-size: 11px; color: var(--accent-primary); text-transform: uppercase; font-weight: 600;"></span>
        </div>
      </div>

      <div class="feedback-stars-row" style="display: flex; align-items: center; gap: 15px; padding-bottom: 24px; border-bottom: 1px solid rgba(255,255,255,0.05); margin-bottom: 24px;">
        <div class="star-rating" id="star-rating-${movieId}" style="display: flex; gap: 8px;">
          ${[1, 2, 3, 4, 5].map(i => `
            <span class="star" data-rating="${i}" onclick="handleRating(${movieId}, ${i})" style="font-size: 32px; cursor: pointer; color: rgba(255,255,255,0.1); transition: transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275), color 0.2s ease;">★</span>
          `).join('')}
        </div>
        <div style="font-size: 11px; color: var(--text-muted); max-width: 140px; line-height: 1.4;">
           This feeds the AI to learn your specific taste profile.
        </div>
      </div>

      <!-- Middle: Review Form -->
      <div class="review-form-area" style="margin-bottom: 30px;">
        <textarea id="review-input-${movieId}" placeholder="Write a review... (how was the story, vibes, music?)" style="
          width: 100%; min-height: 90px; padding: 16px; border-radius: 12px;
          background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08);
          color: var(--text-primary); font-family: inherit; font-size: 14px;
          resize: none; outline: none; transition: all 0.3s ease;
          box-sizing: border-box;
        " onfocus="this.style.borderColor='var(--accent-primary)';this.style.background='rgba(255,255,255,0.05)'" onblur="this.style.borderColor='rgba(255,255,255,0.08)';this.style.background='rgba(255,255,255,0.03)'"></textarea>
        
        <div style="display: flex; justify-content: flex-end; margin-top: 12px;">
          <button onclick="submitReview(${movieId})" class="btn btn-primary btn-sm" style="padding: 10px 24px; font-size: 13px; border-radius: 10px;">
            Post Review
          </button>
        </div>
      </div>

      <!-- Lower: Review List -->
      <div class="community-reviews" id="review-list-${movieId}">
         <div style="font-size: 11px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 16px; display: flex; justify-content: space-between;">
           <span>Community Reviews</span>
           <span>${reviews.length} total</span>
         </div>
         ${renderReviewItemsHTML(movieId, reviews)}
      </div>

    </div>
  `;
}

/**
 * Helper to render individual review cards.
 */
function renderReviewItemsHTML(movieId, reviews) {
  if (reviews.length === 0) {
    return `<p style="color: var(--text-muted); font-size: 13px; text-align: center; padding: 20px 0;">No written reviews yet.</p>`;
  }

  return reviews.map((r, i) => `
    <div class="review-card" style="background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); border-radius: 12px; padding: 16px; margin-bottom: 12px; transition: transform 0.2s ease;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
        <div style="display: flex; align-items: center; gap: 10px;">
          <div style="background: var(--accent-primary); color: #fff; width: 30px; height: 30px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; box-shadow: 0 2px 6px rgba(124,58,237,0.3);">${(r.author || 'U')[0].toUpperCase()}</div>
          <div style="display: flex; flex-direction: column;">
            <span style="font-weight: 600; color: var(--text-primary); font-size: 13px;">${r.author || 'Anonymous'}</span>
            <span style="font-size: 10px; color: var(--text-muted);">${new Date(r.timestamp).toLocaleDateString()}</span>
          </div>
        </div>
        ${API.isLoggedIn() ? `
          <button onclick="deleteReview(${movieId}, ${i})" style="background: none; border: none; color: rgba(239,68,68,0.4); cursor: pointer; padding: 8px; border-radius: 50%; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; transition: all 0.2s;" onmouseover="this.style.color='#ef4444';this.style.background='rgba(239,68,68,0.1)'" onmouseout="this.style.color='rgba(239,68,68,0.4)';this.style.background='none'">
            <i class="fa-solid fa-trash-can" style="font-size: 11px;"></i>
          </button>
        ` : ''}
      </div>
      <p style="color: var(--text-secondary); font-size: 14px; line-height: 1.6; margin: 0;">${r.text}</p>
    </div>
  `).join('');
}

/**
 * Fetch existing rating and update the stars.
 */
async function fetchAndRenderStars(movieId) {
  const result = await API.getMovieRating(movieId);
  const rating = result.ok ? result.data.rating : null;
  updateStarUI(movieId, rating);
}

/**
 * Update the visual state of stars.
 */
function updateStarUI(movieId, rating) {
  const container = document.getElementById(`star-rating-${movieId}`);
  if (!container) return;

  // Track the current rating for toggle/deselection logic
  container.dataset.currentRating = rating || 0;

  const stars = container.querySelectorAll('.star');
  stars.forEach(star => {
    const val = parseInt(star.dataset.rating);
    if (rating && val <= rating) {
      star.style.color = 'var(--accent-primary)';
      star.style.transform = 'scale(1.1)';
    } else {
      star.style.color = 'rgba(255,255,255,0.1)';
      star.style.transform = 'scale(1)';
    }
  });

  const status = document.getElementById(`rating-status-${movieId}`);
  if (status) {
    if (rating) {
      status.innerText = 'Feedback Saved';
    } else {
      status.innerText = ''; // Clear status if no rating
    }
  }
}

/**
 * Handle user clicking a star.
 */
async function handleRating(movieId, rating) {
  const container = document.getElementById(`star-rating-${movieId}`);
  const currentRating = container ? parseInt(container.dataset.currentRating || '0') : 0;
  
  // Toggle: if clicking the same rating, deselect it (set to 0)
  const finalRating = (rating === currentRating) ? 0 : rating;

  // Optimistic UI update
  updateStarUI(movieId, finalRating);
  
  const status = document.getElementById(`rating-status-${movieId}`);
  if (status) status.innerText = finalRating === 0 ? 'Removing...' : 'Saving...';

  const result = await API.rateMovie(movieId, finalRating);
  
  if (result.success || result.ok) {
    if (status) status.innerText = finalRating === 0 ? 'Cleared' : 'Feedback Saved';
    
    // Success animation for feedback container
    const feedbackBox = document.getElementById(`user-feedback-${movieId}`);
    if (feedbackBox) {
      feedbackBox.classList.add('pulse');
      setTimeout(() => feedbackBox.classList.remove('pulse'), 500);
    }
  } else {
    if (status) status.innerText = 'Error Saving';
    // Reset to previous state if failed
    fetchAndRenderStars(movieId);
  }
}

/**
 * Render the footer.
 */
function renderFooter() {
  return `
    <footer class="footer">
      <div class="container footer-content" style="text-align: center; opacity: 0.7;">
        <div class="footer-disclaimer">
          <strong>Movie Recommendation System</strong> — Using Machine Learning Techniques<br>
          We are a movie discovery platform and do not stream or host any copyright content.<br>
          &copy; 2026. All streaming links redirect to official platforms.
        </div>
      </div>
    </footer>
  `;
}


/**
 * Get reviews for a movie from localStorage.
 */
function getMovieReviews(movieId) {
  try {
    const all = JSON.parse(localStorage.getItem('mrs_reviews') || '{}');
    return all[movieId] || [];
  } catch { return []; }
}

/**
 * Submit a review for a movie.
 */
function submitReview(movieId) {
  const textarea = document.getElementById(`review-input-${movieId}`);
  if (!textarea) return;

  const text = textarea.value.trim();
  if (!text) {
    textarea.style.borderColor = '#ef4444';
    setTimeout(() => textarea.style.borderColor = 'rgba(255,255,255,0.08)', 1500);
    return;
  }

  const user = API.getUser();
  const review = {
    author: user?.display_name || user?.username || 'Anonymous',
    text: text,
    timestamp: Date.now()
  };

  // Save to localStorage
  const all = JSON.parse(localStorage.getItem('mrs_reviews') || '{}');
  if (!all[movieId]) all[movieId] = [];
  all[movieId].push(review);
  localStorage.setItem('mrs_reviews', JSON.stringify(all));

  // Track the interaction for AI learning
  if (typeof API !== 'undefined' && API.trackInteraction) {
    API.trackInteraction(movieId, 'review', 1, { reviewLength: text.length });
  }

  // Re-render the feedback section
  const container = document.getElementById(`user-feedback-${movieId}`);
  if (container) {
    container.outerHTML = renderUserFeedback(movieId);
  }
}

/**
 * Delete a specific review by index.
 */
function deleteReview(movieId, index) {
  const all = JSON.parse(localStorage.getItem('mrs_reviews') || '{}');
  if (all[movieId] && all[movieId][index]) {
    all[movieId].splice(index, 1);
    if (all[movieId].length === 0) delete all[movieId];
    localStorage.setItem('mrs_reviews', JSON.stringify(all));

    // Re-render
    const container = document.getElementById(`user-feedback-${movieId}`);
    if (container) {
      container.outerHTML = renderUserFeedback(movieId);
    }
  }
}

// ──────────────────────────────────────────────
// LIKE / DISLIKE COMPONENT
// ──────────────────────────────────────────────

/**
 * Render Like / Dislike buttons for the detail page.
 * Feeds the AI recommendation model with preference signals.
 */
function renderLikeDislike(movieId) {
  const isLoggedIn = API.isLoggedIn();
  const existing = getLikeStatus(movieId);

  if (!isLoggedIn) {
    return `
      <div class="like-dislike-row" style="opacity: 0.4; pointer-events: none;">
        <button class="like-btn"><span class="thumb-icon">👍</span> Like</button>
        <button class="dislike-btn"><span class="thumb-icon">👎</span> Not for me</button>
      </div>
      <div class="like-dislike-feedback">Sign in to rate movies</div>
    `;
  }

  return `
    <div class="like-dislike-row" id="like-dislike-${movieId}">
      <button class="like-btn ${existing === 'like' ? 'active' : ''}" onclick="handleLikeDislike(${movieId}, 'like')">
        <span class="thumb-icon">👍</span> Like
      </button>
      <button class="dislike-btn ${existing === 'dislike' ? 'active' : ''}" onclick="handleLikeDislike(${movieId}, 'dislike')">
        <span class="thumb-icon">👎</span> Not for me
      </button>
    </div>
    <div class="like-dislike-feedback" id="like-feedback-${movieId}">
      ${existing ? (existing === 'like' ? 'You liked this — AI model updated' : 'Noted — AI will adjust recommendations') : 'Quick feedback helps the AI learn your taste'}
    </div>
  `;
}

/**
 * Handle like/dislike click.
 */
function handleLikeDislike(movieId, action) {
  const existing = getLikeStatus(movieId);
  const newAction = existing === action ? null : action;

  // Save to localStorage
  const likes = JSON.parse(localStorage.getItem('mrs_likes') || '{}');
  if (newAction) {
    likes[movieId] = newAction;
  } else {
    delete likes[movieId];
  }
  localStorage.setItem('mrs_likes', JSON.stringify(likes));

  // Update UI
  const container = document.getElementById(`like-dislike-${movieId}`);
  if (container) {
    const likeBtn = container.querySelector('.like-btn');
    const dislikeBtn = container.querySelector('.dislike-btn');
    likeBtn.classList.toggle('active', newAction === 'like');
    dislikeBtn.classList.toggle('active', newAction === 'dislike');
  }

  const feedback = document.getElementById(`like-feedback-${movieId}`);
  if (feedback) {
    if (!newAction) {
      feedback.textContent = 'Feedback cleared';
    } else if (newAction === 'like') {
      feedback.textContent = 'You liked this — AI model updated';
    } else {
      feedback.textContent = 'Noted — AI will adjust recommendations';
    }
  }

  // Track interaction for AI learning
  const movie = MOVIES.find(m => m.movie_id === movieId);
  if (newAction && typeof API !== 'undefined' && API.trackInteraction) {
    const reward = newAction === 'like' ? 'positive' : 'negative';
    API.trackInteraction(movieId, 'rating', newAction === 'like' ? 5 : 1, {
      genre: movie ? (Array.isArray(movie.genre) ? movie.genre[0] : movie.genre) : '',
      experience: movie ? movie.experience_type : '',
      source: 'like_dislike'
    });
  }

  if (typeof showToast === 'function') {
    showToast(newAction === 'like' ? 'Liked! AI learning...' : newAction === 'dislike' ? 'Noted! AI adjusting...' : 'Feedback cleared', newAction === 'like' ? 'success' : 'info');
  }
}

/**
 * Get existing like/dislike status for a movie.
 */
function getLikeStatus(movieId) {
  const likes = JSON.parse(localStorage.getItem('mrs_likes') || '{}');
  return likes[movieId] || null;
}

// ──────────────────────────────────────────────
// RECENTLY VIEWED TRACKING
// ──────────────────────────────────────────────

/**
 * Track a movie as recently viewed (localStorage).
 */
function trackRecentlyViewed(movieId) {
  const key = 'mrs_recently_viewed';
  let history = JSON.parse(localStorage.getItem(key) || '[]');
  // Remove duplicates
  history = history.filter(id => id !== movieId);
  // Prepend
  history.unshift(movieId);
  // Keep last 20
  history = history.slice(0, 20);
  localStorage.setItem(key, JSON.stringify(history));
}

/**
 * Get recently viewed movie IDs.
 */
function getRecentlyViewed(count = 10) {
  const key = 'mrs_recently_viewed';
  const history = JSON.parse(localStorage.getItem(key) || '[]');
  return history.slice(0, count);
}

/**
 * Render scroll arrows for a movie row container.
 */
function renderScrollArrows(rowId) {
  return ''; // Navigation arrows removed as requested
}

/**
 * Scroll a movie row left or right.
 */
function scrollMovieRow(rowId, direction) {
  const row = document.getElementById(rowId);
  if (!row) return;
  const scrollAmount = 600;
  row.scrollBy({ left: direction * scrollAmount, behavior: 'smooth' });
}

// Make components and logic accessible globally
window.renderMovieCard = renderMovieCard;
window.renderRecommendedCard = renderRecommendedCard;
window.renderUserFeedback = renderUserFeedback;
window.renderAnalysisLoader = renderAnalysisLoader;
window.fetchAndRenderStars = fetchAndRenderStars;
window.updateStarUI = updateStarUI;
window.handleRating = handleRating;
window.generatePlaceholderUrl = generatePlaceholderUrl;
window.renderFooter = renderFooter;
window.submitReview = submitReview;
window.deleteReview = deleteReview;
window.getMovieReviews = getMovieReviews;
window.renderStarsFromPercent = renderStarsFromPercent;
window.renderLikeDislike = renderLikeDislike;
window.handleLikeDislike = handleLikeDislike;
window.getLikeStatus = getLikeStatus;
window.trackRecentlyViewed = trackRecentlyViewed;
window.getRecentlyViewed = getRecentlyViewed;
window.renderScrollArrows = renderScrollArrows;
window.scrollMovieRow = scrollMovieRow;
