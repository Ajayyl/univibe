// Movie Recommendation System — Age & Content Control
// Derive content labels (Kids, Teen, Adult) from numeric age

function renderAgeGate() {
  return `
    <div class="age-gate-overlay" id="age-gate">
      <div class="age-gate-card">
        <div class="gate-icon">?</div>
        <h2>Welcome</h2>
        <p>Enter your age to personalize your movie discovery</p>
        
        <div class="age-input-field" style="margin: 24px 0;">
          <input type="number" id="age-gate-input" placeholder="Age" min="1" max="120" style="width: 140px; text-align: center; font-size: 18px; padding: 12px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.2); background: rgba(0,0,0,0.3); color: white; display: block; margin: 0 auto 16px auto;" />
          <p class="age-hint" style="margin: 0; opacity: 0.8;">We use this to filter content for Kids, Teens, or Adults.</p>
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
  localStorage.setItem('mrs_age', age);

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
  if (!localStorage.getItem('mrs_age') && !API.isLoggedIn()) {
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
  localStorage.removeItem('mrs_age');
  location.reload();
}

function updateNavAgeBadge() {
  const badge = document.getElementById('nav-age-badge');
  if (!badge) return;

  const user = API.getUser();
  const age = user ? user.age : parseInt(localStorage.getItem('mrs_age'));

  if (age) {
    if (user) {
      // Logged in: show Name + Avatar only
      badge.innerHTML = `${user.avatar_emoji || ''} ${user.display_name}`;
      badge.onclick = () => Router.navigate('/profile');
      badge.title = 'View your profile';
    } else {
      // Guest: show generic profile label
      badge.innerHTML = `Guest Profile`;
      badge.onclick = () => resetAge();
      badge.title = 'Click to reset age';
    }
  } else {
    badge.innerHTML = 'Set Age';
    badge.onclick = () => showAgeGate();
  }
}

// Helper to get labels globally
function getAgeLabel(age) {
  if (age <= 12) return 'Kids';
  if (age <= 17) return 'Teen';
  return 'Adult';
}
