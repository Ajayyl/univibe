// Movie Recommendation System — Recommendation Builder Page (formerly Catalogue)

function renderCatalogue(params) {
  const userAge = parseInt(localStorage.getItem('mrs_age')) || 0;
  const safeMovies = applyAgeFilter(MOVIES, userAge);
  const genres = getAllGenres(safeMovies).sort();

  // Prepare options for movie selector
  const movieOptions = safeMovies
    .sort((a, b) => a.title.localeCompare(b.title))
    .map(m => `<option value="${m.movie_id}">${m.title}</option>`)
    .join('');

  // Prepare Age Options based on profile
  let ageOptions = `<option value="">Any (Up to Profile)</option>`;
  if (userAge >= 9) ageOptions += `<option value="9">Kids (Safe)</option>`;
  if (userAge >= 15) ageOptions += `<option value="15">Teen (13+)</option>`;
  if (userAge >= 18) ageOptions += `<option value="18">Adult (18+)</option>`;

  return `
    <section class="section" style="padding-top: 20px;">
      <div class="container">
        <div class="section-header" style="justify-content: center; text-align: center; margin-bottom: 40px;">
          <div style="max-width: 600px;">

            <h2 class="section-title">Build Your Perfect Vibe</h2>
            <p class="section-subtitle">
              Mix and match criteria to let our engine discover the perfect movie for you right now.
            </p>
          </div>
        </div>

        <!-- Recipe Builder Form -->
        <div class="rec-builder-card fade-in-up">
          <div class="rec-builder-grid">
            
            <!-- 1. Vibe -->
            <div class="rec-input-group">
              <label>What's your vibe?</label>
              <select id="rec-experience" class="rec-select">
                <option value="">Any Vibe</option>
                <option value="fun">Fun & Light</option>
                <option value="intense">Intense & Thrilling</option>
                <option value="emotional">Emotional & Deep</option>
                <option value="relaxing">Relaxing & Chill</option>
              </select>
            </div>

            <!-- 2. Genre -->
            <div class="rec-input-group">
              <label>Preferred Genre?</label>
              <select id="rec-genre" class="rec-select">
                <option value="">Any Genre</option>
                ${genres.map(g => `<option value="${g}">${g}</option>`).join('')}
              </select>
            </div>

            <!-- 3. Age Rating -->
            <div class="rec-input-group">
              <label>Age Rating</label>
              <select id="rec-age" class="rec-select">
                ${ageOptions}
              </select>
            </div>

            <!-- 4. Similar To -->
            <div class="rec-input-group">
              <label>Similar to a movie you love? (Optional)</label>
              <select id="rec-similar" class="rec-select">
                <option value="">-- No specific movie --</option>
                ${movieOptions}
              </select>
            </div>
          </div>

          <div class="rec-actions">
            <button class="btn btn-primary btn-lg btn-block" onclick="runRecommendationEngine()">
              Show Recommendations
            </button>
            <button class="btn btn-text" onclick="resetRecBuilder()">Clear Filters</button>
          </div>
        </div>

        <!-- Results Section -->
        <div id="rec-results-area" style="margin-top: 60px; min-height: 200px; display: none;">
          <div class="section-header">
             <h3 class="section-title" id="rec-results-title">Your Matches</h3>
             <span class="section-subtitle" id="rec-results-count"></span>
          </div>
          <div class="movie-grid stagger" id="rec-grid"></div>
        </div>
        
        <!-- Empty/Init State -->
        <div id="rec-empty-state" class="empty-state" style="margin-top: 40px; opacity: 0.6;">
        </div>

      </div>
    </section>
  `;
}

function runRecommendationEngine() {
  const profileAge = parseInt(localStorage.getItem('mrs_age')) || 0;

  // Get Inputs
  const experience = document.getElementById('rec-experience').value;
  const genre = document.getElementById('rec-genre').value;
  const ageInput = document.getElementById('rec-age').value;
  const similarIdRaw = document.getElementById('rec-similar').value;
  const similarToId = similarIdRaw ? parseInt(similarIdRaw) : null;

  // Calculate effective age limit
  let effectiveAge = profileAge;
  if (ageInput) {
    const selectedAge = parseInt(ageInput);
    // Ensure we don't exceed profile limit (though UI prevents it mostly)
    if (selectedAge < effectiveAge) effectiveAge = selectedAge;
  }

  // UI States
  const resultsArea = document.getElementById('rec-results-area');
  const emptyState = document.getElementById('rec-empty-state');
  const grid = document.getElementById('rec-grid');
  const countLabel = document.getElementById('rec-results-count');

  // Loading state
  emptyState.style.display = 'none';
  resultsArea.style.display = 'block';
  grid.innerHTML = renderAnalysisLoader(); // Re-use the loader from home

  // Logic Delay for effect
  setTimeout(() => {
    const criteria = { userAge: effectiveAge, experience, genre, similarToId };
    const results = getHybridRecommendations(MOVIES, criteria, 12);

    if (results.length > 0) {
      countLabel.textContent = `${results.length} matches found`;
      grid.innerHTML = results.map(item => renderRecommendedCard(item.movie, item.reason)).join('');

      // Scroll to results
      resultsArea.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      countLabel.textContent = '0 matches';
      grid.innerHTML = `
        <div class="empty-state" style="grid-column: 1/-1;">
          <div class="empty-icon"></div>
          <h3>No matches found</h3>
          <p>Try loosening your criteria (e.g. remove specific genre or vibe)</p>
        </div>
      `;
    }
  }, 800);
}

function resetRecBuilder() {
  document.getElementById('rec-experience').value = '';
  document.getElementById('rec-genre').value = '';
  document.getElementById('rec-age').value = '';
  document.getElementById('rec-similar').value = '';

  document.getElementById('rec-results-area').style.display = 'none';
  document.getElementById('rec-empty-state').style.display = 'block';
}

// Make globally available
window.runRecommendationEngine = runRecommendationEngine;
window.resetRecBuilder = resetRecBuilder;

// Safe no-op for filter pre-sets (no pre-set filters to apply currently)
function applyCatalogueFilters() { }
window.applyCatalogueFilters = applyCatalogueFilters;

