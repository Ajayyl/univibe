// UniVibe — Age & Content Control
// Derive content labels (Kids, Teen, Adult) from numeric age

function renderAgeGate() {
  return `
    <div class="age-gate-overlay" id="age-gate">
      <div class="age-gate-card">
        <div class="gate-icon">🎈</div>
        <h2>Welcome to UniVibe</h2>
        <p>Enter your age to personalize your movie discovery</p>
        
        <div class="age-input-field">
          <input type="number" id="age-gate-input" placeholder="Your age" min="1" max="120" />
          <p class="age-hint">We use this to filter content for Kids, Teens, or Adults.</p>
        </div>
        
        <button class="btn btn-primary" onclick="submitAgeGate()">Continue</button>
      </div>
    </div>
  `;
}

function submitAgeGate() {
  const input = document.getElementById('age-gate-input');
  const age = parseInt(input?.value);

  if (!age || age < 1 || age > 120) {
    showToast('Please enter a valid age (1-120)', 'error');
    return;
  }

  submitAge(age);
}

function submitAge(age) {
  localStorage.setItem('univibe_age', age);

  // Remove the gate
  const gate = document.getElementById('age-gate');
  if (gate) {
    gate.style.animation = 'fadeOut 0.3s ease forwards';
    setTimeout(() => gate.remove(), 300);
  }

  // Update nav age badge
  updateNavAgeBadge();

  // Re-render current page to apply filters
  Router.resolve();
}

function showAgeGate() {
  // Only show if no age is stored AND not logged in
  if (!localStorage.getItem('univibe_age') && !API.isLoggedIn()) {
    document.body.insertAdjacentHTML('beforeend', renderAgeGate());
  }
}

function resetAge() {
  // Only allow reset for guests
  if (API.isLoggedIn()) {
    Router.navigate('/profile');
    showToast('Update your age in your profile settings', 'info');
    return;
  }
  localStorage.removeItem('univibe_age');
  location.reload();
}

function updateNavAgeBadge() {
  const badge = document.getElementById('nav-age-badge');
  if (!badge) return;

  const user = API.getUser();
  const age = user ? user.age : parseInt(localStorage.getItem('univibe_age'));

  if (age) {
    const label = getAgeLabel(age);
    const emoji = age <= 12 ? '🎈' : age <= 17 ? '🍿' : '🔞';

    if (user) {
      // Logged in: show Name + Age Label
      badge.innerHTML = `${user.avatar_emoji || '👤'} ${user.display_name} (${label} ${emoji})`;
      badge.onclick = () => Router.navigate('/profile');
      badge.title = 'View your profile';
    } else {
      // Guest: show Age Label only
      badge.innerHTML = `👤 ${label} Profile ${emoji}`;
      badge.onclick = () => resetAge();
      badge.title = 'Click to reset age';
    }
  } else {
    badge.innerHTML = '👤 Set Age';
    badge.onclick = () => showAgeGate();
  }
}

// Helper to get labels globally
function getAgeLabel(age) {
  if (age <= 12) return 'Kids';
  if (age <= 17) return 'Teen';
  return 'Adult';
}
