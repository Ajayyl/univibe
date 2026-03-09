// UniVibe — Auth UI (Login, Register, Profile)
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
            <img src="assets/logo/v2.png" alt="UniVibe" class="logo-img" style="width:54px; height:54px;" />
          </div>
          <h2 class="auth-title">${isLogin ? 'Welcome Back' : 'Join UniVibe'}</h2>
          <p class="auth-subtitle">${isLogin ? 'Sign in to get personalized ML recommendations' : 'Create your account for AI-powered movie picks'}</p>
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
        <span class="auth-input-icon">👤</span>
        <input type="text" id="auth-username" name="usernameOrEmail" placeholder="Enter username or email" 
               required autocomplete="username" />
      </div>
    </div>
    <div class="auth-field">
      <label for="auth-password">Password</label>
      <div class="auth-input-wrap">
        <span class="auth-input-icon">🔒</span>
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
          <span class="auth-input-icon">✨</span>
          <input type="text" id="auth-display-name" name="displayName" placeholder="Your name" required />
        </div>
      </div>
      <div class="auth-field">
        <label for="auth-age">Age</label>
        <div class="auth-input-wrap">
          <span class="auth-input-icon">🎂</span>
          <input type="number" id="auth-age" name="age" placeholder="Age" min="1" max="120" value="18" required />
        </div>
      </div>
    </div>
    <div class="auth-field">
      <label for="auth-username-reg">Username</label>
      <div class="auth-input-wrap">
        <span class="auth-input-icon">👤</span>
        <input type="text" id="auth-username-reg" name="username" placeholder="Choose a username (3-24 chars)" 
               required pattern="[a-zA-Z0-9_]+" minlength="3" maxlength="24" autocomplete="username" />
      </div>
    </div>
    <div class="auth-field">
      <label for="auth-email">Email</label>
      <div class="auth-input-wrap">
        <span class="auth-input-icon">📧</span>
        <input type="email" id="auth-email" name="email" placeholder="your@email.com" 
               required autocomplete="email" />
      </div>
    </div>
    <div class="auth-field">
      <label for="auth-password-reg">Password</label>
      <div class="auth-input-wrap">
        <span class="auth-input-icon">🔒</span>
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
      localStorage.setItem('univibe_age', user.age);
    }

    updateAuthUI();
    Router.resolve(); // Re-render current page

    // Show success toast
    showToast(`Welcome${mode === 'login' ? ' back' : ''}, ${result.data.user.display_name}! 🎬`, 'success');
  } else {
    // Show error
    errorEl.textContent = result.data.error || 'Something went wrong';
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
      <div class="empty-state" style="padding-top:140px;">
        <div class="empty-icon">🔐</div>
        <h3>Sign in required</h3>
        <p>Log in to view your profile and ML recommendations.</p>
        <button class="btn btn-primary" onclick="showAuthModal('login')" style="margin-top:20px;">Sign In</button>
      </div>
    `;
  }

  return `
    <section class="section" style="padding-top:100px;">
      <div class="container">
        
        <!-- Profile Header -->
        <div class="profile-hero fade-in">
          <div class="profile-avatar-large">${user.avatar_emoji || '👤'}</div>
          <div class="profile-hero-info">
            <h1 class="profile-name">${user.display_name}</h1>
            <div class="profile-uid">
              <span class="uid-badge">🔑 ${user.user_uid}</span>
              <span class="profile-username">@${user.username}</span>
            </div>
            <div class="profile-stats-row" id="profile-stats-row">
              <div class="stat-pill"><span class="stat-label">Age</span><span class="stat-value">${user.age}</span></div>
              <div class="stat-pill"><span class="stat-label">Joined</span><span class="stat-value">${new Date(user.created_at).toLocaleDateString()}</span></div>
              <div class="stat-pill" id="stat-interactions"><span class="stat-label">Interactions</span><span class="stat-value">...</span></div>
            </div>
          </div>
          <div class="profile-actions">
            <button class="btn btn-outline btn-sm" onclick="showEditProfile()">✏️ Edit Profile</button>
            <button class="btn btn-outline btn-sm" onclick="handleLogout()" style="border-color:rgba(239,68,68,0.3);color:#ef4444;">🚪 Sign Out</button>
          </div>
        </div>

        <!-- RL Intelligence Card -->
        <div class="ml-intelligence-card fade-in-up" id="ml-intelligence-card">
          <div class="ml-card-header">
            <div>
              <h2 class="section-title">🧠 ML Intelligence</h2>
              <p class="section-subtitle">Your personal recommendation model learns from every interaction</p>
            </div>
            <div style="display:flex;align-items:center;gap:12px;">
              <a href="#/dashboard" class="btn btn-primary btn-sm">📊 Full Dashboard</a>
              <div class="ml-model-badge" id="ml-model-badge">
                <span class="model-status-dot"></span>
                Loading...
              </div>
            </div>
          </div>
          <div class="ml-stats-grid" id="ml-stats-grid">
            ${renderAnalysisLoader()}
          </div>
        </div>

        <!-- Watch Later Section -->
        <div class="section fade-in-up" style="padding-top:0;margin-top:20px;">
          <div class="section-header">
            <div>
              <h2 class="section-title">🔖 Watch Later</h2>
              <p class="section-subtitle">Movies you've saved to watch another time</p>
            </div>
          </div>
          <div id="watchlist-feed">
            ${renderAnalysisLoader()}
          </div>
        </div>

        <!-- RL Recommendations Section -->
        <div class="section recommend-section fade-in-up" style="padding-top:0;margin-top:40px;">
          <div class="section-header">
            <div>
              <h2 class="section-title">🤖 AI Picks For You</h2>
              <p class="section-subtitle">Generated by your personal reinforcement learning model</p>
            </div>
          </div>
          <div id="rl-recommendations">
            ${renderAnalysisLoader()}
          </div>
        </div>

        <!-- Recent Activity -->
        <div class="section fade-in-up" style="padding-top:0;margin-top:20px;">
          <div class="section-header">
            <h2 class="section-title">📊 Recent Activity</h2>
          </div>
          <div id="activity-feed">
            ${renderAnalysisLoader()}
          </div>
        </div>

        <!-- Search History -->
        <div class="section fade-in-up" style="padding-top:0;margin-top:20px;">
          <div class="section-header">
            <h2 class="section-title">🔍 Search History</h2>
          </div>
          <div id="search-history-feed">
            ${renderAnalysisLoader()}
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

  // Load ML stats
  loadMLStats();

  // Load Watchlist
  loadWatchlist();

  // Load RL recommendations
  loadRLRecommendations();

  // Load activity feed
  loadActivityFeed();

  // Load search history
  loadSearchHistory();
}

async function loadWatchlist() {
  const container = document.getElementById('watchlist-feed');
  if (!container) return;

  const res = await API.getWatchlist();
  if (!res.ok || res.data.watchlist.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="padding:40px 0;">
        <div class="empty-icon">🔖</div>
        <p style="color:var(--text-muted);">Your Watch Later list is empty. Save movies you want to watch later!</p>
      </div>
    `;
    return;
  }

  const items = res.data.watchlist;
  container.innerHTML = `
    <div class="movie-row stagger">
      ${items.map(item => {
    const movie = MOVIES.find(m => m.movie_id === item.movie_id);
    if (!movie) return '';
    return renderMovieCard(movie);
  }).join('')}
    </div>
  `;
}

async function loadMLStats() {
  const statsCard = document.getElementById('ml-stats-grid');
  const modelBadge = document.getElementById('ml-model-badge');
  if (!statsCard) return;

  const res = await API.getLearningStats();
  if (!res.ok) {
    statsCard.innerHTML = '<p style="color:var(--text-muted);padding:20px;">Could not load ML stats.</p>';
    return;
  }

  const stats = res.data.stats;
  const maturityLabels = {
    cold_start: '❄️ Cold Start',
    learning: '📚 Learning',
    improving: '📈 Improving',
    mature: '🎯 Mature'
  };
  const maturityColors = {
    cold_start: '#6b7280',
    learning: '#f59e0b',
    improving: '#10b981',
    mature: '#7c3aed'
  };

  if (modelBadge) {
    modelBadge.innerHTML = `<span class="model-status-dot" style="background:${maturityColors[stats.modelMaturity]}"></span> ${maturityLabels[stats.modelMaturity]}`;
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
        <div class="ml-stat-label" style="margin-bottom:8px;">Your Top Genres</div>
        <div class="genre-chips">
          ${stats.topGenres.map(g => `<span class="genre-chip">${g.genre} <small>(${g.count})</small></span>`).join('')}
        </div>
      </div>
    ` : ''}
    ${Object.keys(stats.activityBreakdown).length > 0 ? `
      <div class="ml-stat-item" style="grid-column:1/-1;">
        <div class="ml-stat-label" style="margin-bottom:8px;">Activity Breakdown</div>
        <div class="activity-bars">
          ${Object.entries(stats.activityBreakdown).map(([type, count]) => {
    const maxCount = Math.max(...Object.values(stats.activityBreakdown));
    const pct = Math.round((count / maxCount) * 100);
    const icons = { view: '👁️', click: '👆', search: '🔍', rating: '⭐', recommend_click: '🤖', dwell: '⏱️' };
    return `
              <div class="activity-bar-row">
                <span class="activity-bar-label">${icons[type] || '📊'} ${type}</span>
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

async function loadRLRecommendations() {
  const container = document.getElementById('rl-recommendations');
  if (!container) return;

  const res = await API.getRecommendations(8);
  if (!res.ok || res.data.recommendations.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="padding:40px 0;">
        <div class="empty-icon">🤖</div>
        <p style="color:var(--text-muted);">Interact with more movies to train your personal model!</p>
      </div>
    `;
    return;
  }

  const recs = res.data.recommendations;

  // Map recommendation data back to full movie objects
  container.innerHTML = `
    <div class="movie-row stagger">
      ${recs.map(rec => {
    const movie = MOVIES.find(m => m.movie_id === rec.movie_id);
    if (!movie) return '';
    return renderRecommendedCard(movie, rec.reason);
  }).join('')}
    </div>
    <div class="rl-meta-info">
      <span>⚡ ${recs.length} recommendations</span>
      <span>🧠 Sources: ${[...new Set(recs.map(r => r.source))].join(', ')}</span>
    </div>
  `;
}

async function loadActivityFeed() {
  const container = document.getElementById('activity-feed');
  if (!container) return;

  const res = await API.getHistory(15);
  if (!res.ok || res.data.interactions.length === 0) {
    container.innerHTML = '<p style="color:var(--text-muted);padding:20px;">No activity yet. Start browsing movies!</p>';
    return;
  }

  const icons = { view: '👁️', click: '👆', search: '🔍', rating: '⭐', recommend_click: '🤖', dwell: '⏱️' };

  container.innerHTML = `
    <div class="activity-list">
      ${res.data.interactions.map(i => {
    const movie = MOVIES.find(m => m.movie_id === i.movie_id);
    const title = movie ? movie.title : `Movie #${i.movie_id}`;
    const time = new Date(i.created_at).toLocaleString();
    return `
          <div class="activity-item fade-in-up">
            <span class="activity-icon">${icons[i.event_type] || '📊'}</span>
            <div class="activity-info">
              <span class="activity-event">${i.event_type}</span>
              <span class="activity-movie" onclick="Router.navigate('/movie/${i.movie_id}')">${title}</span>
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
  if (!res.ok || res.data.searches.length === 0) {
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
            <span class="search-icon">🔍</span>
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
// EDIT PROFILE MODAL
// ──────────────────────────────────

function showEditProfile() {
  const user = API.getUser();
  if (!user) return;

  const avatars = ['👤', '🎬', '🍿', '🎭', '🎪', '🎯', '🦊', '🐱', '🦋', '🌟', '🔥', '💜', '🌈', '🎵', '🎮', '🚀'];
  const allGenres = getAllGenres(MOVIES);

  const modal = `
    <div class="auth-overlay" id="edit-profile-modal">
      <div class="auth-card" style="max-width:520px;">
        <button class="auth-close" onclick="document.getElementById('edit-profile-modal').remove()">✕</button>
        <div class="auth-header">
          <h2 class="auth-title">Edit Profile</h2>
        </div>
        <form id="edit-profile-form" class="auth-form" onsubmit="handleProfileUpdate(event)">
          <div class="auth-field">
            <label>Avatar</label>
            <div class="avatar-picker">
              ${avatars.map(a => `
                <button type="button" class="avatar-option ${a === user.avatar_emoji ? 'active' : ''}" 
                        onclick="selectAvatar(this, '${a}')">${a}</button>
              `).join('')}
            </div>
            <input type="hidden" name="avatar_emoji" id="edit-avatar" value="${user.avatar_emoji || '👤'}" />
          </div>
          <div class="auth-field-row">
            <div class="auth-field">
              <label for="edit-display-name">Display Name</label>
              <div class="auth-input-wrap">
                <span class="auth-input-icon">✨</span>
                <input type="text" id="edit-display-name" name="display_name" value="${user.display_name}" required />
              </div>
            </div>
            <div class="auth-field">
              <label for="edit-age">Age</label>
              <div class="auth-input-wrap">
                <span class="auth-input-icon">🎂</span>
                <input type="number" id="edit-age" name="age" value="${user.age}" min="1" max="120" required />
              </div>
            </div>
          </div>
          <div class="auth-field">
            <label>Preferred Genres (select up to 3)</label>
            <div class="genre-picker" id="genre-picker">
              ${allGenres.map(g => {
    const preferred = JSON.parse(user.preferred_genres || '[]');
    return `<button type="button" class="genre-pick-btn ${preferred.includes(g) ? 'active' : ''}" 
                          onclick="toggleGenrePick(this, '${g}')">${g}</button>`;
  }).join('')}
            </div>
          </div>
          <div class="auth-field">
            <label for="edit-experience">Preferred Vibe</label>
            <select id="edit-experience" name="preferred_experience" class="rec-select" style="width:100%">
              <option value="">Any</option>
              <option value="fun" ${user.preferred_experience === 'fun' ? 'selected' : ''}>🎉 Fun</option>
              <option value="intense" ${user.preferred_experience === 'intense' ? 'selected' : ''}>🔥 Intense</option>
              <option value="emotional" ${user.preferred_experience === 'emotional' ? 'selected' : ''}>💙 Emotional</option>
              <option value="relaxing" ${user.preferred_experience === 'relaxing' ? 'selected' : ''}>🌿 Relaxing</option>
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
    localStorage.setItem('univibe_age', formData.get('age'));
    document.getElementById('edit-profile-modal').remove();
    updateAuthUI();
    Router.resolve();
    showToast('Profile updated! 🎉', 'success');
  } else {
    showToast(result.data.error || 'Update failed', 'error');
  }
}

// ──────────────────────────────────
// NAVBAR AUTH STATE
// ──────────────────────────────────

function updateAuthUI() {
  const navLinks = document.getElementById('nav-links');
  if (!navLinks) return;

  const user = API.getUser();
  const ageBadge = document.getElementById('nav-age-badge');
  const existingAuthBtn = document.getElementById('nav-auth-btn');

  // Remove existing auth btn
  if (existingAuthBtn) existingAuthBtn.remove();

  if (user) {
    // Logged in — show profile & avatar
    if (ageBadge) {
      ageBadge.innerHTML = `${user.avatar_emoji || '👤'} ${user.display_name}`;
      ageBadge.title = `${user.user_uid} — Click to view profile`;
      ageBadge.onclick = () => Router.navigate('/profile');
    }

    // Add profile link to nav
    const profileLink = document.createElement('a');
    profileLink.id = 'nav-auth-btn';
    profileLink.className = 'nav-link';
    profileLink.href = '#/dashboard';
    profileLink.dataset.route = '/dashboard';
    profileLink.textContent = '📊 Dashboard';
    navLinks.insertBefore(profileLink, ageBadge);
  } else {
    // Not logged in — show sign in button
    if (ageBadge) {
      const age = parseInt(localStorage.getItem('univibe_age'));
      if (age) {
        let label = 'Adult';
        if (age <= 12) label = 'Kids';
        else if (age <= 17) label = 'Teen';
        ageBadge.innerHTML = `👤 ${label} Profile`;
        ageBadge.onclick = () => resetAge();
      }
    }

    const loginBtn = document.createElement('button');
    loginBtn.id = 'nav-auth-btn';
    loginBtn.className = 'btn btn-primary btn-sm nav-login-btn';
    loginBtn.innerHTML = '🔐 Sign In';
    loginBtn.onclick = () => showAuthModal('login');
    navLinks.appendChild(loginBtn);
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
  API.trackInteraction(movieId, 'view', '', {
    genre: movie ? movie.genre[0] : '',
    experience: movie ? movie.experience_type : '',
    source: 'detail_page'
  });
}

// Track movie click (when user clicks a card)
function trackMovieClick(movieId, movie, source = 'browse') {
  if (!API.isLoggedIn()) return;
  API.trackInteraction(movieId, 'click', '', {
    genre: movie ? movie.genre[0] : '',
    experience: movie ? movie.experience_type : '',
    source
  });
}

// Track recommendation click
function trackRecommendationClick(movieId, movie) {
  if (!API.isLoggedIn()) return;
  API.trackInteraction(movieId, 'recommend_click', '', {
    genre: movie ? movie.genre[0] : '',
    experience: movie ? movie.experience_type : '',
    source: 'recommendation'
  });
}

// ──────────────────────────────────
// RATING WIDGET
// ──────────────────────────────────

function renderRatingWidget(movieId) {
  if (!API.isLoggedIn()) {
    return `
      <div class="rating-widget" id="rating-widget">
        <p class="rating-prompt">🔐 <a href="#" onclick="showAuthModal('login'); return false;" style="color:var(--accent-tertiary);">Sign in</a> to rate this movie & train your AI</p>
      </div>
    `;
  }

  return `
    <div class="rating-widget" id="rating-widget">
      <div class="rating-prompt">Rate this movie</div>
      <div class="star-rating" id="star-rating" data-movie-id="${movieId}">
        ${[1, 2, 3, 4, 5].map(i => `
          <button class="star-btn" data-value="${i}" onclick="submitRating(${movieId}, ${i})" 
                  onmouseenter="highlightStars(${i})" onmouseleave="resetStarHighlight(${movieId})">
            ★
          </button>
        `).join('')}
      </div>
      <div class="rating-feedback" id="rating-feedback"></div>
    </div>
  `;
}

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
      feedback.textContent = `Rated ${rating}/5 — Your AI model updated! 🧠`;
      feedback.classList.add('fade-in');
    }
    showToast(`Rated ${rating}/5 ⭐ — ML model learning!`, 'success');
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

  const btn = event.currentTarget;
  const isDetail = btn.id === 'watchlist-toggle-btn';

  // Check current status
  const checkRes = await API.checkWatchlist(movieId);
  const inWatchlist = checkRes.inWatchlist;

  if (inWatchlist) {
    // Remove
    const res = await API.removeFromWatchlist(movieId);
    if (res.ok) {
      showToast('Removed from Watch Later', 'info');
      updateWatchlistButton(movieId, false);
    }
  } else {
    // Add
    const res = await API.addToWatchlist(movieId);
    if (res.ok) {
      showToast('Added to Watch Later 🔖', 'success');
      updateWatchlistButton(movieId, true);
    }
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
    detailBtn.innerHTML = inWatchlist ? '✅ In Watch Later' : '🔖 Add to Watch Later';
    detailBtn.classList.toggle('active', inWatchlist);
  }

  // Update any grid buttons if visible
  document.querySelectorAll(`.watch-later-btn[onclick*="${movieId}"]`).forEach(btn => {
    btn.innerHTML = inWatchlist ? '✅' : '🔖';
    btn.classList.toggle('active', inWatchlist);
    btn.title = inWatchlist ? 'In Watch Later' : 'Watch Later';
  });
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
window.toggleWatchlist = toggleWatchlist;
window.updateWatchlistButton = updateWatchlistButton;
