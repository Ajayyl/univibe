// Movie Recommendation System — Auth UI (Login, Register, Profile)
// Handles all authentication-related UI rendering and logic

// ──────────────────────────────────
// AUTH MODAL (Login / Register)
// ──────────────────────────────────

function renderAuthModal(mode = 'login') {
  const isLogin = mode === 'login';

  return `
    <div class="auth-overlay" id="auth-modal">
      <div class="auth-card">
        <button class="auth-close" onclick="closeAuthModal()" title="Close">✕</button>
        
        <div class="auth-header">
          <div class="auth-logo">
            <img src="assets/logo/cinema.png" alt="Movie Recommendation System" class="logo-img" style="width:54px; height:54px; filter: drop-shadow(0 4px 12px rgba(124, 58, 237, 0.5));" />
          </div>
          <h2 class="auth-title">${isLogin ? 'Welcome Back' : 'Create Account'}</h2>
          <p class="auth-subtitle">${isLogin ? 'Sign in to get personalized recommendations' : 'Create your account for personalized movie picks'}</p>
        </div>

        <div class="auth-tabs">
          <button class="auth-tab ${isLogin ? 'active' : ''}" onclick="switchAuthTab('login')">Sign In</button>
          <button class="auth-tab ${!isLogin ? 'active' : ''}" onclick="switchAuthTab('register')">Create Account</button>
        </div>

        <div id="auth-error" class="auth-error" style="display:none;"></div>

        <form id="auth-form" class="auth-form" onsubmit="handleAuthSubmit(event)">
          ${isLogin ? renderLoginForm() : renderRegisterForm()}
        </form>

        <div class="auth-footer">
          <p class="auth-footer-text">
            ${isLogin
      ? 'New here? <a href="#" onclick="switchAuthTab(\'register\'); return false;">Create account</a>'
      : 'Already have an account? <a href="#" onclick="switchAuthTab(\'login\'); return false;">Sign in</a>'}
          </p>
        </div>
      </div>
    </div>
  `;
}

function renderLoginForm() {
  return `
    <input type="hidden" name="authMode" value="login" />
    <div class="auth-field">
      <label for="auth-username">Username or Email</label>
      <div class="auth-input-wrap">
        <span class="auth-input-icon"><i class="fa-solid fa-user"></i></span>
        <input type="text" id="auth-username" name="usernameOrEmail" placeholder="Enter username or email" 
               required autocomplete="username" />
      </div>
    </div>
    <div class="auth-field">
      <label for="auth-password">Password</label>
      <div class="auth-input-wrap">
        <span class="auth-input-icon"><i class="fa-solid fa-key"></i></span>
        <input type="password" id="auth-password" name="password" placeholder="Enter password" 
               required autocomplete="current-password" />
      </div>
    </div>
    <button type="submit" class="btn btn-primary btn-block auth-submit" id="auth-submit-btn">
      <span class="auth-submit-text">Sign In</span>
      <span class="auth-submit-loader" style="display:none;">
        <span class="mini-spinner"></span> Signing in...
      </span>
    </button>
  `;
}

function renderRegisterForm() {
  return `
    <input type="hidden" name="authMode" value="register" />
    <div class="auth-field-row">
      <div class="auth-field">
        <label for="auth-display-name">Display Name</label>
        <div class="auth-input-wrap">
          <span class="auth-input-icon"><i class="fa-solid fa-id-card"></i></span>
          <input type="text" id="auth-display-name" name="displayName" placeholder="Your name" required />
        </div>
      </div>
      <div class="auth-field">
        <label for="auth-age">Age</label>
        <div class="auth-input-wrap">
          <span class="auth-input-icon"><i class="fa-solid fa-calendar"></i></span>
          <input type="number" id="auth-age" name="age" placeholder="Age" min="1" max="120" value="18" required />
        </div>
      </div>
    </div>
    <div class="auth-field">
      <label for="auth-username-reg">Username</label>
      <div class="auth-input-wrap">
        <span class="auth-input-icon"><i class="fa-solid fa-at"></i></span>
        <input type="text" id="auth-username-reg" name="username" placeholder="Choose a username (3-24 chars)" 
               required pattern="[a-zA-Z0-9_]+" minlength="3" maxlength="24" autocomplete="username" />
      </div>
    </div>
    <div class="auth-field">
      <label for="auth-email">Email</label>
      <div class="auth-input-wrap">
        <span class="auth-input-icon"><i class="fa-solid fa-envelope"></i></span>
        <input type="email" id="auth-email" name="email" placeholder="your@email.com" 
               required autocomplete="email" />
      </div>
    </div>
    <div class="auth-field">
      <label for="auth-password-reg">Password</label>
      <div class="auth-input-wrap">
        <span class="auth-input-icon"><i class="fa-solid fa-lock"></i></span>
        <input type="password" id="auth-password-reg" name="password" placeholder="Min 6 characters" 
               required minlength="6" autocomplete="new-password" />
      </div>
    </div>
    <button type="submit" class="btn btn-primary btn-block auth-submit" id="auth-submit-btn">
      <span class="auth-submit-text">Create Account</span>
      <span class="auth-submit-loader" style="display:none;">
        <span class="mini-spinner"></span> Creating...
      </span>
    </button>
  `;
}

// ──────────────────────────────────
// AUTH LOGIC
// ──────────────────────────────────

function showAuthModal(mode = 'login') {
  closeAuthModal(); // Remove any existing modal
  document.body.insertAdjacentHTML('beforeend', renderAuthModal(mode));
  // Focus first input
  setTimeout(() => {
    const firstInput = document.querySelector('#auth-form input[type="text"], #auth-form input[type="email"]');
    if (firstInput) firstInput.focus();
  }, 100);
}

function closeAuthModal() {
  const modal = document.getElementById('auth-modal');
  if (modal) {
    modal.style.animation = 'fadeOut 0.2s ease forwards';
    setTimeout(() => modal.remove(), 200);
  }
}

function switchAuthTab(mode) {
  closeAuthModal();
  showAuthModal(mode);
}

async function handleAuthSubmit(event) {
  event.preventDefault();

  const form = event.target;
  const formData = new FormData(form);
  const mode = formData.get('authMode');
  const errorEl = document.getElementById('auth-error');
  const submitBtn = document.getElementById('auth-submit-btn');
  const submitText = submitBtn.querySelector('.auth-submit-text');
  const submitLoader = submitBtn.querySelector('.auth-submit-loader');

  // Show loading
  submitText.style.display = 'none';
  submitLoader.style.display = 'inline-flex';
  submitBtn.disabled = true;
  errorEl.style.display = 'none';

  let result;

  if (mode === 'login') {
    result = await API.login(
      formData.get('usernameOrEmail'),
      formData.get('password')
    );
  } else {
    result = await API.register(
      formData.get('username'),
      formData.get('email'),
      formData.get('password'),
      formData.get('displayName'),
      parseInt(formData.get('age')) || 18
    );
  }

  if (result.ok) {
    // Success — close modal and update UI
    closeAuthModal();

    // Sync age with existing age gate system
    const user = API.getUser();
    if (user && user.age) {
      localStorage.setItem('mrs_age', user.age);
    }

    updateAuthUI();
    Router.resolve(); // Re-render current page

    // Show success toast
    showToast(`Welcome${mode === 'login' ? ' back' : ''}, ${result.data.user.display_name}!`, 'success');
  } else {
    // Show error
    errorEl.textContent = result.error || (result.data && result.data.error) || 'Something went wrong';
    errorEl.style.display = 'block';
    submitText.style.display = 'inline';
    submitLoader.style.display = 'none';
    submitBtn.disabled = false;
  }
}

// ──────────────────────────────────
// PROFILE PAGE
// ──────────────────────────────────

function renderProfile() {
  const user = API.getUser();
  if (!user) {
    return `
      <div class="empty-state" style="padding-top:20px;">
        <div class="empty-icon"><i class="fa-solid fa-lock" style="font-size:48px;"></i></div>
        <h3>Sign in required</h3>
        <p>Log in to view your profile and ML recommendations.</p>
        <button class="btn btn-primary" onclick="showAuthModal('login')" style="margin-top:20px;">Sign In</button>
      </div>
    `;
  }

  return `
    <section class="section" style="padding-top:20px;">
      <div class="container">
        
        <!-- Profile Header -->
        <div class="profile-hero fade-in">
          <div class="profile-hero-info">
            <h1 class="profile-name">${user.display_name}</h1>
            <div class="profile-uid">
              <span class="uid-badge">ID: ${user.user_uid}</span>
              <span class="profile-username">@${user.username}</span>
            </div>
            <div class="profile-stats-row" id="profile-stats-row">
              <div class="stat-pill"><span class="stat-label">Age</span><span class="stat-value">${user.age}</span></div>
              <div class="stat-pill"><span class="stat-label">Joined</span><span class="stat-value">${new Date(user.created_at || Date.now()).toLocaleDateString()}</span></div>
              <div class="stat-pill" id="stat-interactions"><span class="stat-label">Interactions</span><span class="stat-value">...</span></div>
            </div>
          </div>
          <div class="profile-actions">
            <button class="btn btn-outline btn-sm" onclick="showEditProfile()">Edit Profile</button>
            <button class="btn btn-outline btn-sm" onclick="handleLogout()" style="border-color:rgba(239,68,68,0.3);color:#ef4444;">Sign Out</button>
          </div>
        </div>

        <!-- AI Intelligence Card -->
        <div class="ml-intelligence-card fade-in-up" id="ml-intelligence-card">
          <div class="ml-card-header">
            <div>
              <h2 class="section-title">AI Intelligence</h2>
              <p class="section-subtitle">Your personal recommendation model learns from every interaction</p>
            </div>
            <div style="display:flex;align-items:center;gap:12px;">
              <div class="ml-model-badge" id="ml-model-badge">
                <span class="model-status-dot"></span>
                Processing...
              </div>
            </div>
          </div>
          <div class="ml-stats-grid" id="ml-stats-grid">
            ${renderAnalysisLoader()}
          </div>
        </div>

        <!-- Favorites Section -->
        <div class="section fade-in-up" style="padding-top:0;padding-bottom:10px;margin-top:10px;">
          <div class="section-header">
            <div>
              <h2 class="section-title">Favorites</h2>
              <p class="section-subtitle">Your most loved movies</p>
            </div>
          </div>
          <div id="favorites-feed">
            ${renderAnalysisLoader()}
          </div>
        </div>

        <!-- Watch Later Section -->
        <div class="section fade-in-up" style="padding-top:0;padding-bottom:10px;margin-top:10px;">
          <div class="section-header">
            <div>
              <h2 class="section-title">Watch Later</h2>
              <p class="section-subtitle">Movies you've saved to watch another time</p>
            </div>
          </div>
          <div id="watchlist-feed">
            ${renderAnalysisLoader()}
          </div>
        </div>

        <!-- Recent Activity Card -->
        <div class="section fade-in-up" style="padding-top:0;padding-bottom:30px;margin-top:10px;">
          <div class="activity-cta-card">
            <div class="cta-card-content">
              <div class="cta-card-info">
                <h2 class="section-title">Recent Activity</h2>
                <p class="section-subtitle">Review your recently viewed movies, clicked recommendations, and search history.</p>
              </div>
            </div>
            <a href="#/history" class="btn btn-primary" style="margin-top: 24px;"><i class="fa-solid fa-clock-rotate-left" style="margin-right:8px;"></i> View Full History &rarr;</a>
          </div>
        </div>

        
      </div>
    </section>
  `;
}

// ──────────────────────────────────
// PROFILE DATA LOADING
// ──────────────────────────────────

async function loadProfileData() {
  if (!API.isLoggedIn()) return;

  // Load AI stats
  loadAIStats();

  // Load Favorites
  loadFavorites();

  // Load Watchlist
  loadWatchlist();

  // Load AI recommendations
  loadAIRecommendations();
}

async function loadFavorites() {
  const container = document.getElementById('favorites-feed');
  if (!container) return;

  const res = await API.getFavorites();
  if (!res.ok || !res.data.favorites || res.data.favorites.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="padding:40px 0;">
        <div class="empty-icon"><i class="fa-solid fa-heart-crack" style="font-size:48px;"></i></div>
        <p style="color:var(--text-muted);">You haven't added any movies to your Favorites yet.</p>
      </div>
    `;
    return;
  }

  const items = res.data.favorites;
  container.innerHTML = `
    <div class="movie-row movie-row-compact stagger">
      ${items.map(item => {
    const movie = MOVIES.find(m => m.movie_id === item.movie_id);
    if (!movie) return '';
    return renderMovieCard(movie);
  }).join('')}
    </div>
  `;
}

async function loadWatchlist() {
  const container = document.getElementById('watchlist-feed');
  if (!container) return;

  const res = await API.getWatchlist();
  if (!res.ok || !res.data.watchlist || res.data.watchlist.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="padding:40px 0;">
        <div class="empty-icon"><i class="fa-solid fa-list-ul" style="font-size:48px;"></i></div>
        <p style="color:var(--text-muted);">Your Watch Later list is empty. Save movies you want to watch later!</p>
      </div>
    `;
    return;
  }

  const items = res.data.watchlist;
  container.innerHTML = `
    <div class="movie-row movie-row-compact stagger">
      ${items.map(item => {
    const movie = MOVIES.find(m => m.movie_id === item.movie_id);
    if (!movie) return '';
    return renderMovieCard(movie);
  }).join('')}
    </div>
  `;
}

async function loadAIStats() {
  const statsCard = document.getElementById('ml-stats-grid');
  const modelBadge = document.getElementById('ml-model-badge');
  if (!statsCard) return;

  const res = await API.getLearningStats();
  if (!res.ok) {
    statsCard.innerHTML = '<p style="color:var(--text-muted);padding:20px;">Could not load AI stats.</p>';
    return;
  }

  const stats = res.data.stats;
  const maturityLabels = {
    cold_start: 'Cold Start',
    learning: 'Learning',
    improving: 'Improving',
    mature: 'Mature'
  };
  const maturityColors = {
    cold_start: '#6b7280',
    learning: '#f59e0b',
    improving: '#10b981',
    mature: '#7c3aed'
  };

  const maturity = stats.modelMaturity || 'learning';
  const label = maturityLabels[maturity] || 'Learning';
  const color = maturityColors[maturity] || '#f59e0b';

  if (modelBadge) {
    modelBadge.innerHTML = `<span class="model-status-dot" style="background:${color}"></span> ${label}`;
  }

  // Update interaction count in header
  const statInteractions = document.getElementById('stat-interactions');
  if (statInteractions) {
    statInteractions.innerHTML = `<span class="stat-label">Interactions</span><span class="stat-value">${stats.totalInteractions}</span>`;
  }

  statsCard.innerHTML = `
    <div class="ml-stat-item">
      <div class="ml-stat-number">${stats.totalInteractions}</div>
      <div class="ml-stat-label">Total Interactions</div>
    </div>
    <div class="ml-stat-item">
      <div class="ml-stat-number">${stats.uniqueStatesLearned}</div>
      <div class="ml-stat-label">Contexts Learned</div>
    </div>
    <div class="ml-stat-item">
      <div class="ml-stat-number">${stats.totalQEntries}</div>
      <div class="ml-stat-label">Q-Table Entries</div>
    </div>
    <div class="ml-stat-item">
      <div class="ml-stat-number">${stats.avgQValue}</div>
      <div class="ml-stat-label">Avg Q-Value</div>
    </div>
    ${stats.topGenres.length > 0 ? `
      <div class="ml-stat-item" style="grid-column:1/-1;">
        <div class="ml-stat-label" style="margin-bottom:8px;">Your Top Genres (Preference Model)</div>
        <div class="genre-chips">
          ${(() => {
            const total = stats.topGenres.reduce((sum, g) => sum + g.count, 0);
            return stats.topGenres.map(g => {
              const pct = total > 0 ? Math.round((g.count / total) * 100) : 0;
              return `<span class="genre-chip">${g.genre} <small>(${pct}%)</small></span>`;
            }).join('');
          })()}
        </div>
      </div>
    ` : ''}
    ${Object.keys(stats.activityBreakdown).length > 0 ? `
      <div class="ml-stat-item" style="grid-column:1/-1;">
        <div class="ml-stat-label" style="text-align: center; margin-bottom: 24px; text-transform: uppercase; letter-spacing: 1px; font-size: 11px; opacity: 0.6;">Activity Breakdown</div>
        <div class="activity-bars">
          ${Object.entries(stats.activityBreakdown).map(([type, count]) => {
    const maxCount = Math.max(...Object.values(stats.activityBreakdown));
    const pct = Math.round((count / maxCount) * 100);
    const labels = { 
      view: 'Movie Views', 
      click: 'Direct Clicks', 
      search: 'Search Queries', 
      rating: 'Star Ratings', 
      recommend_click: 'AI Recommendations', 
      dwell: 'Watch Time' 
    };
    return `
              <div class="activity-bar-row">
                <span class="activity-bar-label">${labels[type] || type}</span>
                <div class="activity-bar-track">
                  <div class="activity-bar-fill" style="width:${pct}%"></div>
                </div>
                <span class="activity-bar-count">${count}</span>
              </div>
            `;
  }).join('')}
        </div>
      </div>
    ` : ''}
  `;
}

async function loadAIRecommendations() {
  const container = document.getElementById('ai-recommendations');
  if (!container) return;

  const res = await API.getRecommendations(20);
  if (!res.ok || !res.data || !res.data.recommendations || res.data.recommendations.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="padding:40px 0;">
        <div class="empty-icon"><i class="fa-solid fa-brain" style="font-size:48px;"></i></div>
        <p style="color:var(--text-muted);">Interact with more movies to train your AI model!</p>
      </div>
    `;
    return;
  }

  const recs = res.data.recommendations;

  // Map recommendation data back to full movie objects
  container.innerHTML = `
    <div class="movie-row stagger" style="margin-top:20px; padding-bottom: 24px;">
      ${recs.map(rec => {
    const movie = MOVIES.find(m => m.movie_id === rec.movie_id);
    if (!movie) return '';
    return renderRecommendedCard(movie, rec.reason);
  }).join('')}
    </div>
    <div class="rl-meta-info">
      <span>${recs.length} recommendations</span>
      <span>Sources: ${[...new Set(recs.map(r => r.source))].join(', ')}</span>
    </div>
  `;
}

async function loadActivityFeed() {
  const container = document.getElementById('activity-feed');
  if (!container) return;

  const res = await API.getHistory(15);
  if (!res.ok || !res.data || !res.data.interactions || res.data.interactions.length === 0) {
    container.innerHTML = '<p style="color:var(--text-muted);padding:20px;">No activity yet. Start browsing movies!</p>';
    return;
  }

  const icons = { 
    view: '<i class="fa-solid fa-eye"></i>', 
    click: '<i class="fa-solid fa-computer-mouse"></i>', 
    search: '<i class="fa-solid fa-magnifying-glass"></i>', 
    rating: '<i class="fa-solid fa-star"></i>', 
    recommend_click: '<i class="fa-solid fa-wand-magic-sparkles"></i>', 
    dwell: '<i class="fa-solid fa-hourglass-half"></i>' 
  };

  container.innerHTML = `
    <div class="activity-list">
      ${res.data.interactions.map(i => {
    const movie = MOVIES.find(m => m.movie_id === i.movie_id);
    const title = movie ? movie.title : `Movie #${i.movie_id}`;
    const time = new Date(i.created_at).toLocaleString();
    return `
          <div class="activity-item fade-in-up" onclick="Router.navigate('/movie/${i.movie_id}')" style="cursor:pointer;">
            <span class="activity-icon">${icons[i.event_type] || '📊'}</span>
            <div class="activity-info">
              <span class="activity-event">${i.event_type}</span>
              <span class="activity-movie">${title}</span>
              ${i.event_value ? `<span class="activity-value">${i.event_value}</span>` : ''}
            </div>
            <span class="activity-time">${time}</span>
          </div>
        `;
  }).join('')}
    </div>
  `;
}

async function loadSearchHistory() {
  const container = document.getElementById('search-history-feed');
  if (!container) return;

  const res = await API.getSearchHistory(10);
  if (!res.ok || !res.data || !res.data.searches || res.data.searches.length === 0) {
    container.innerHTML = '<p style="color:var(--text-muted);padding:20px;">No searches yet.</p>';
    return;
  }

  container.innerHTML = `
    <div class="search-history-list">
      ${res.data.searches.map(s => {
    const time = new Date(s.created_at).toLocaleString();
    const movie = s.selected_movie_id ? MOVIES.find(m => m.movie_id === s.selected_movie_id) : null;
    return `
          <div class="search-item fade-in-up">
            <span class="search-icon"><i class="fa-solid fa-magnifying-glass"></i></span>
            <div class="search-info">
              <span class="search-query">"${s.query}"</span>
              <span class="search-results">${s.result_count} results</span>
              ${movie ? `<span class="search-selected">→ Selected: ${movie.title}</span>` : ''}
            </div>
            <span class="search-time">${time}</span>
          </div>
        `;
  }).join('')}
    </div>
  `;
}

// ──────────────────────────────────
// ACTIVITY HISTORY PAGE
// ──────────────────────────────────

function renderActivityHistory() {
  const user = API.getUser();
  if (!user) return Router.navigate('/profile');

  return `
    <section class="section" style="padding-top:20px;">
      <div class="container">
        <div class="section-header">
          <div>
            <h1 class="section-title">Interaction History</h1>
            <p class="section-subtitle">A complete log of your views, clicks, and AI interactions</p>
          </div>
          <a href="#/profile" class="btn btn-sm btn-outline">← Back to Profile</a>
        </div>

        <div id="full-history-feed" style="margin-top:20px;">
          ${renderAnalysisLoader(10)}
        </div>
      </div>
    </section>
  `;
}

async function loadFullActivityHistory() {
  const container = document.getElementById('full-history-feed');
  if (!container) return;

  // Fetch a larger history (e.g., 100 items)
  const res = await API.getHistory(100);
  if (!res.ok || !res.data || !res.data.interactions || res.data.interactions.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="padding:100px 0;">
        <div class="empty-icon"><i class="fa-solid fa-clock-rotate-left" style="font-size:56px;"></i></div>
        <h3>No history found</h3>
        <p>Your interactions will appear here as you browse movies.</p>
        <a href="#/" class="btn btn-primary" style="margin-top:20px;">Start Browsing</a>
      </div>
    `;
    return;
  }

  const icons = { 
    view: '<i class="fa-solid fa-eye"></i>', 
    click: '<i class="fa-solid fa-computer-mouse"></i>', 
    search: '<i class="fa-solid fa-magnifying-glass"></i>', 
    rating: '<i class="fa-solid fa-star"></i>', 
    recommend_click: '<i class="fa-solid fa-wand-magic-sparkles"></i>', 
    dwell: '<i class="fa-solid fa-hourglass-half"></i>' 
  };

  container.innerHTML = `
    <div class="activity-history-container">
      <div class="activity-list">
        ${res.data.interactions.map(i => {
    const movie = MOVIES.find(m => m.movie_id === i.movie_id);
    const title = movie ? movie.title : `Movie #${i.movie_id}`;
    const time = new Date(i.created_at).toLocaleString();
    return `
            <div class="activity-item fade-in-up" onclick="Router.navigate('/movie/${i.movie_id}')" style="cursor:pointer; margin-bottom:8px;">
              <span class="activity-icon">${icons[i.event_type] || '📊'}</span>
              <div class="activity-info">
                <span class="activity-event">${i.event_type}</span>
                <span class="activity-movie">${title}</span>
                ${i.event_value ? `<span class="activity-value">${i.event_value}</span>` : ''}
              </div>
              <span class="activity-time">${time}</span>
            </div>
          `;
  }).join('')}
      </div>
    </div>
  `;
}

function showEditProfile() {
  const user = API.getUser();
  if (!user) return;

  const avatars = ['👤', '🎬', '🍿', '🎭', '🎪', '🎯', '🦊', '🐱', '🦋', '⭐', '🔥', '💖', '🌈', '🎵', '🎮', '🚀'];
  const allGenres = getAllGenres(MOVIES);

  const modal = `
    <div class="auth-overlay" id="edit-profile-modal">
      <div class="auth-card" style="max-width:520px;">
        <button class="auth-close" onclick="document.getElementById('edit-profile-modal').remove()">✕</button>
        <div class="auth-header">
          <h2 class="auth-title">Edit Profile</h2>
        </div>
        <form id="edit-profile-form" class="auth-form" onsubmit="handleProfileUpdate(event)">
          <input type="hidden" name="avatar_emoji" id="edit-avatar" value="${user.avatar_emoji || ''}" />
          <div class="auth-field-row">
            <div class="auth-field">
              <label for="edit-display-name">Display Name</label>
              <div class="auth-input-wrap">
                <span class="auth-input-icon"><i class="fa-solid fa-user"></i></span>
                <input type="text" id="edit-display-name" name="display_name" value="${user.display_name}" required />
              </div>
            </div>
            <div class="auth-field">
              <label for="edit-age">Age</label>
              <div class="auth-input-wrap">
                <span class="auth-input-icon"><i class="fa-solid fa-calendar"></i></span>
                <input type="number" id="edit-age" name="age" value="${user.age}" min="1" max="120" required />
              </div>
            </div>
          </div>
          <div class="auth-field">
            <label>Preferred Genres (select up to 3)</label>
            <div class="genre-picker" id="genre-picker">
              ${allGenres.map(g => {
    let prefArray = [];
    try {
      prefArray = Array.isArray(user.preferred_genres) ? user.preferred_genres : JSON.parse(user.preferred_genres || '[]');
    } catch (e) { prefArray = []; }

    return `<button type="button" class="genre-pick-btn ${prefArray.includes(g) ? 'active' : ''}" 
                          onclick="toggleGenrePick(this, '${g}')">${g}</button>`;
  }).join('')}
            </div>
          </div>
          <div class="auth-field">
            <label for="edit-experience">Preferred Vibe</label>
            <select id="edit-experience" name="preferred_experience" class="rec-select" style="width:100%">
              <option value="">Any</option>
              <option value="fun" ${user.preferred_experience === 'fun' ? 'selected' : ''}>Fun</option>
              <option value="intense" ${user.preferred_experience === 'intense' ? 'selected' : ''}>Intense</option>
              <option value="emotional" ${user.preferred_experience === 'emotional' ? 'selected' : ''}>Emotional</option>
              <option value="relaxing" ${user.preferred_experience === 'relaxing' ? 'selected' : ''}>Relaxing</option>
            </select>
          </div>
          <button type="submit" class="btn btn-primary btn-block auth-submit">Save Changes</button>
        </form>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', modal);
}

function selectAvatar(btn, emoji) {
  document.querySelectorAll('.avatar-option').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById('edit-avatar').value = emoji;
}

function toggleGenrePick(btn, genre) {
  const activeButtons = document.querySelectorAll('.genre-pick-btn.active');
  if (btn.classList.contains('active')) {
    btn.classList.remove('active');
  } else if (activeButtons.length < 3) {
    btn.classList.add('active');
  }
}

async function handleProfileUpdate(event) {
  event.preventDefault();
  const form = event.target;
  const formData = new FormData(form);

  const selectedGenres = Array.from(document.querySelectorAll('.genre-pick-btn.active')).map(b => b.textContent);

  const result = await API.updateProfile({
    display_name: formData.get('display_name'),
    age: parseInt(formData.get('age')),
    avatar_emoji: formData.get('avatar_emoji'),
    preferred_genres: selectedGenres,
    preferred_experience: formData.get('preferred_experience')
  });

  if (result.ok) {
    // Sync age
    localStorage.setItem('mrs_age', formData.get('age'));
    document.getElementById('edit-profile-modal').remove();
    updateAuthUI();
    Router.resolve();
    showToast('Profile updated!', 'success');
  } else {
    showToast(result.error || (result.data && result.data.error) || 'Update failed', 'error');
  }
}

// ──────────────────────────────────
// NAVBAR AUTH STATE
// ──────────────────────────────────

function updateAuthUI() {
  const navUser = document.getElementById('navbar-user');
  if (!navUser) return;

  const user = API.getUser();
  
  if (user) {
    // Get initials (e.g. "Ajay Kumaar" → "AK" or just the first 2 chars)
    let initials = 'AK'; 
    if (user.display_name) {
      const parts = user.display_name.split(' ');
      initials = parts.length > 1 
        ? (parts[0][0] + parts[1][0]).toUpperCase() 
        : user.display_name.substring(0, 2).toUpperCase();
    }

    navUser.innerHTML = `
      <div class="nav-profile-pill" onclick="Router.navigate('/profile')" title="View Profile">
        <span class="nav-profile-text">Profile</span>
      </div>
    `;
  } else {
    navUser.innerHTML = `
      <button class="btn btn-primary btn-sm nav-login-btn" onclick="showAuthModal('login')">
        Sign In
      </button>
    `;
  }
}

function handleLogout() {
  API.logout();
  updateAuthUI();
  Router.navigate('/');
  showToast('Signed out successfully', 'success');
}

// ──────────────────────────────────
// TOAST NOTIFICATIONS
// ──────────────────────────────────

function showToast(message, type = 'info') {
  const existing = document.querySelector('.toast-notification');
  if (existing) existing.remove();

  const colors = {
    success: 'linear-gradient(135deg, #10b981, #059669)',
    error: 'linear-gradient(135deg, #ef4444, #dc2626)',
    info: 'linear-gradient(135deg, #7c3aed, #a855f7)'
  };

  const toast = document.createElement('div');
  toast.className = 'toast-notification';
  toast.style.background = colors[type] || colors.info;
  toast.innerHTML = `<span>${message}</span>`;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('toast-fade-out');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// ──────────────────────────────────
// USER INTERACTION TRACKER (frontend)
// ──────────────────────────────────

// Debounced search tracker
let _searchDebounce = null;
function trackSearchQuery(query, resultCount) {
  clearTimeout(_searchDebounce);
  _searchDebounce = setTimeout(() => {
    if (query.length >= 2) {
      API.trackSearch(query, resultCount);
    }
  }, 800);
}

// Track movie view (called when detail page loads)
function trackMovieView(movieId, movie) {
  if (!API.isLoggedIn()) return;
  const genre = movie ? (Array.isArray(movie.genre) ? movie.genre[0] : String(movie.genre).split('|')[0]) : '';
  API.trackInteraction(movieId, 'view', '', {
    genre: genre,
    experience: movie ? movie.experience_type : '',
    source: 'detail_page'
  });
}

// Track movie click (when user clicks a card)
function trackMovieClick(movieId, movie, source = 'browse') {
  if (!API.isLoggedIn()) return;
  const genre = movie ? (Array.isArray(movie.genre) ? movie.genre[0] : String(movie.genre).split('|')[0]) : '';
  API.trackInteraction(movieId, 'click', '', {
    genre: genre,
    experience: movie ? movie.experience_type : '',
    source
  });
}

// Track recommendation click
function trackRecommendationClick(movieId, movie) {
  if (!API.isLoggedIn()) return;
  const genre = movie ? (Array.isArray(movie.genre) ? movie.genre[0] : String(movie.genre).split('|')[0]) : '';
  API.trackInteraction(movieId, 'recommend_click', '', {
    genre: genre,
    experience: movie ? movie.experience_type : '',
    source: 'recommendation'
  });
}

// ──────────────────────────────────
// RATING WIDGET
// ──────────────────────────────────

// Redundant renderRatingWidget removed — using the one from components.js for better UI consistency.


async function loadExistingRating(movieId) {
  if (!API.isLoggedIn()) return;
  const res = await API.getMovieRating(movieId);
  if (res.ok && res.data.rating) {
    setStarRating(res.data.rating);
    const feedback = document.getElementById('rating-feedback');
    if (feedback) feedback.textContent = `You rated this ${res.data.rating}/5`;
  }
}

function highlightStars(value) {
  const stars = document.querySelectorAll('.star-btn');
  stars.forEach((star, idx) => {
    star.classList.toggle('highlighted', idx < value);
  });
}

function resetStarHighlight(movieId) {
  const container = document.getElementById('star-rating');
  if (!container) return;
  const current = parseInt(container.dataset.currentRating || '0');
  highlightStars(current);
}

function setStarRating(value) {
  const container = document.getElementById('star-rating');
  if (container) container.dataset.currentRating = value;
  const stars = document.querySelectorAll('.star-btn');
  stars.forEach((star, idx) => {
    star.classList.toggle('active', idx < value);
    star.classList.toggle('highlighted', idx < value);
  });
}

async function submitRating(movieId, rating) {
  const res = await API.rateMovie(movieId, rating);
  if (res.ok) {
    setStarRating(rating);
    const feedback = document.getElementById('rating-feedback');
    if (feedback) {
      feedback.textContent = `Rated ${rating}/5 — Your AI model updated!`;
      feedback.classList.add('fade-in');
    }
    showToast(`Rated ${rating}/5 — AI model learning!`, 'success');
  }
}

// ──────────────────────────────────
// WATCHLIST LOGIC
// ──────────────────────────────────

async function toggleWatchlist(event, movieId) {
  if (!API.isLoggedIn()) {
    showAuthModal('login');
    return;
  }

  const btn = event.currentTarget || document.getElementById('watchlist-toggle-btn');
  if (!btn) return;

  // Optimistic UI state determination (Fast!)
  const inWatchlist = btn.classList.contains('active');

  if (inWatchlist) {
    // Optimistically update UI
    updateWatchlistButton(movieId, false);
    showToast('Removed from Watch Later', 'info');
    
    // Background removal
    API.removeFromWatchlist(movieId);
  } else {
    // Optimistically update UI 
    updateWatchlistButton(movieId, true);
    showToast('Added to Watch Later', 'success');
    
    // Background addition
    API.addToWatchlist(movieId);
  }
}

async function updateWatchlistButton(movieId, forceStatus = null) {
  if (!API.isLoggedIn()) return;

  let inWatchlist = forceStatus;
  if (inWatchlist === null) {
    const res = await API.checkWatchlist(movieId);
    inWatchlist = res.inWatchlist;
  }

  // Update detail page button if active
  const detailBtn = document.getElementById('watchlist-toggle-btn');
  const currentPath = window.location.hash.split('?')[0];
  if (detailBtn && currentPath.includes(`/movie/${movieId}`)) {
    detailBtn.innerHTML = inWatchlist ? 'In Watch Later' : 'Add to Watch Later';
    detailBtn.classList.toggle('active', inWatchlist);
  }

    // Update any grid buttons if visible
  document.querySelectorAll(`.watch-later-btn[onclick*="${movieId}"]`).forEach(btn => {
    btn.innerHTML = inWatchlist ? 'Saved' : 'Save';
    btn.classList.toggle('active', inWatchlist);
    btn.title = inWatchlist ? 'In Watch Later' : 'Watch Later';
  });
}

// ──────────────────────────────────
// FAVORITE LOGIC
// ──────────────────────────────────

async function toggleFavorite(event, movieId) {
  if (!API.isLoggedIn()) {
    showAuthModal('login');
    return;
  }

  const btn = event.currentTarget || document.getElementById('favorite-toggle-btn');
  if (!btn) return;

  // Optimistic UI state determination (Fast!)
  const isFavorite = btn.classList.contains('active');

  if (isFavorite) {
    // Optimistically update UI
    updateFavoriteButton(movieId, false);
    showToast('Removed from Favorites', 'info');
    
    // Background removal
    API.removeFromFavorites(movieId);
  } else {
    // Optimistically update UI
    updateFavoriteButton(movieId, true);
    showToast('Added to Favorites', 'success');
    
    // Background addition
    API.addToFavorites(movieId);
  }
}

async function updateFavoriteButton(movieId, forceStatus = null) {
  if (!API.isLoggedIn()) return;

  let isFavorite = forceStatus;
  if (isFavorite === null) {
    const res = await API.checkFavorite(movieId);
    isFavorite = res.isFavorite;
  }

  // Update detail page button if active
  const detailBtn = document.getElementById('favorite-toggle-btn');
  const currentPath = window.location.hash.split('?')[0];
  if (detailBtn && currentPath.includes(`/movie/${movieId}`)) {
    detailBtn.innerHTML = isFavorite ? 'Favorited' : 'Favorite';
    detailBtn.classList.toggle('active', isFavorite);
  }
}

// Make functions globally accessible
window.showAuthModal = showAuthModal;
window.closeAuthModal = closeAuthModal;
window.switchAuthTab = switchAuthTab;
window.handleAuthSubmit = handleAuthSubmit;
window.showEditProfile = showEditProfile;
window.selectAvatar = selectAvatar;
window.toggleGenrePick = toggleGenrePick;
window.handleProfileUpdate = handleProfileUpdate;
window.handleLogout = handleLogout;
window.submitRating = submitRating;
window.highlightStars = highlightStars;
window.resetStarHighlight = resetStarHighlight;
window.trackMovieView = trackMovieView;
window.trackMovieClick = trackMovieClick;
window.trackRecommendationClick = trackRecommendationClick;
window.trackSearchQuery = trackSearchQuery;
window.loadExistingRating = loadExistingRating;
window.showToast = showToast;
window.updateAuthUI = updateAuthUI;
window.loadProfileData = loadProfileData;
window.loadAIStats = loadAIStats;
window.toggleWatchlist = toggleWatchlist;
window.updateWatchlistButton = updateWatchlistButton;
window.toggleFavorite = toggleFavorite;
window.updateFavoriteButton = updateFavoriteButton;
