// Movie Recommendation System — Advanced Search & Filter Page

function renderSearch() {
  const genres = [...new Set(MOVIES.flatMap(m => m.genre || []))].sort();
  const experiences = [...new Set(MOVIES.map(m => m.experience_type || 'Unknown'))].sort();

  return `
    <section class="section" style="padding-top: 20px; padding-bottom: 50px;">
      <div class="container" style="display: flex; gap: 30px; align-items: flex-start;">
        
        <!-- Filter Sidebar -->
        <aside class="filter-sidebar" style="flex: 0 0 300px; background: var(--bg-secondary); border-radius: 16px; padding: 24px; border: 1px solid var(--border-glass); position: sticky; top: 100px; max-height: calc(100vh - 120px); overflow-y: auto;">
          <h2 style="font-size: 1.5rem; margin-bottom: 20px;">Filters</h2>
          
          <div class="filter-group" style="margin-bottom: 24px;">
            <label style="display: block; color: var(--text-muted); font-size: 0.85rem; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px;">Keyword</label>
            <input type="text" id="adv-search-keyword" placeholder="Title, Director, Cast..." 
              style="width: 100%; padding: 12px; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; color: #fff;"
              onkeyup="applyAdvancedFilters()">
          </div>

          <div class="filter-group" style="margin-bottom: 24px;">
            <label style="display: block; color: var(--text-muted); font-size: 0.85rem; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px;">Genres</label>
            <div style="display: flex; flex-wrap: wrap; gap: 8px;" id="adv-search-genres">
              ${genres.map(g => `
                <button class="btn btn-outline btn-sm adv-genre-btn" data-genre="${g}" onclick="toggleAdvFilter(this, 'genre')" style="font-size: 12px; padding: 6px 10px;">${g}</button>
              `).join('')}
            </div>
          </div>

          <div class="filter-group" style="margin-bottom: 24px;">
            <label style="display: block; color: var(--text-muted); font-size: 0.85rem; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px;">Vibe</label>
            <div style="display: flex; flex-wrap: wrap; gap: 8px;" id="adv-search-vibes">
              ${experiences.map(e => `
                <button class="btn btn-outline btn-sm adv-vibe-btn" data-vibe="${e}" onclick="toggleAdvFilter(this, 'vibe')" style="font-size: 12px; padding: 6px 10px;">${e}</button>
              `).join('')}
            </div>
          </div>

          <div class="filter-group" style="margin-bottom: 24px;">
            <label style="display: flex; justify-content: space-between; color: var(--text-muted); font-size: 0.85rem; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px;">
              <span>Min Rating</span>
              <span id="adv-rating-val">0%</span>
            </label>
            <input type="range" id="adv-search-rating" min="0" max="100" value="0" step="5" style="width: 100%; cursor: pointer;" oninput="document.getElementById('adv-rating-val').innerText = this.value + '%'; applyAdvancedFilters()">
          </div>
          
          <div class="filter-group" style="margin-bottom: 24px;">
            <label style="display: flex; justify-content: space-between; color: var(--text-muted); font-size: 0.85rem; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px;">
              <span>Year Released</span>
              <span id="adv-year-val">Any</span>
            </label>
            <input type="range" id="adv-search-year" min="1950" max="${new Date().getFullYear()}" value="1950" step="1" style="width: 100%; cursor: pointer;" oninput="document.getElementById('adv-year-val').innerText = this.value == 1950 ? 'Any' : this.value + ' - Present'; applyAdvancedFilters()">
          </div>

          <button class="btn btn-outline" style="width: 100%; justify-content: center; margin-top: 10px; border-color: rgba(255,255,255,0.2);" onclick="resetAdvancedFilters()">Reset Filters</button>
        </aside>

        <!-- Results Grid -->
        <main style="flex: 1;">
          <div class="section-header" style="margin-bottom: 24px;">
            <div>
              <h1 class="section-title">Discovery</h1>
              <p class="section-subtitle" id="adv-search-count">Loading results...</p>
            </div>
          </div>
          
          <div id="adv-results-grid" class="movie-grid stagger">
            <!-- Rendered via JS -->
          </div>
        </main>
      </div>
    </section>
  `;
}

// State container for selected filters
const advFilters = {
  genres: new Set(),
  vibes: new Set()
};

function toggleAdvFilter(btn, type) {
  btn.classList.toggle('active');
  
  if (type === 'genre') {
    const val = btn.dataset.genre;
    advFilters.genres.has(val) ? advFilters.genres.delete(val) : advFilters.genres.add(val);
  } else if (type === 'vibe') {
    const val = btn.dataset.vibe;
    advFilters.vibes.has(val) ? advFilters.vibes.delete(val) : advFilters.vibes.add(val);
  }
  
  // Custom active styling hook since default btn-outline doesn't always stay filled
  if (btn.classList.contains('active')) {
    btn.style.background = 'var(--primary-color)';
    btn.style.borderColor = 'var(--primary-color)';
    btn.style.color = '#fff';
  } else {
    btn.style.background = 'transparent';
    btn.style.borderColor = 'rgba(255,255,255,0.2)';
    btn.style.color = 'inherit';
  }

  applyAdvancedFilters();
}

function resetAdvancedFilters() {
  document.getElementById('adv-search-keyword').value = '';
  document.getElementById('adv-search-rating').value = 0;
  document.getElementById('adv-rating-val').innerText = '0%';
  document.getElementById('adv-search-year').value = 1950;
  document.getElementById('adv-year-val').innerText = 'Any';
  
  advFilters.genres.clear();
  advFilters.vibes.clear();
  
  document.querySelectorAll('.adv-genre-btn, .adv-vibe-btn').forEach(btn => {
    btn.classList.remove('active');
    btn.style.background = 'transparent';
    btn.style.borderColor = 'rgba(255,255,255,0.2)';
    btn.style.color = 'inherit';
  });

  applyAdvancedFilters();
}

function applyAdvancedFilters() {
  const container = document.getElementById('adv-results-grid');
  const countLabel = document.getElementById('adv-search-count');
  if (!container || !countLabel) return;

  const keyword = document.getElementById('adv-search-keyword').value.toLowerCase();
  const minRating = parseInt(document.getElementById('adv-search-rating').value) || 0;
  const minYear = parseInt(document.getElementById('adv-search-year').value) || 1950;

  // Enforce age safe logic first
  const userAge = parseInt(localStorage.getItem('mrs_age')) || 0;
  let matches = applyAgeFilter(MOVIES, userAge);

  // Apply specific filters
  matches = matches.filter(m => {
    // 1. Keyword (Title, Director, Cast, Quote)
    if (keyword) {
      const matchText = (m.title + ' ' + (m.director||'') + ' ' + (m.cast||'') + ' ' + (m.quote||'')).toLowerCase();
      if (!matchText.includes(keyword)) return false;
    }
    
    // 2. Min Rating
    if ((m.rating_percent || 0) < minRating) return false;
    
    // 3. Min Year
    if ((m.year || 0) < minYear && minYear !== 1950) return false;

    // 4. Genres (MUST match ALL selected genres if we want strict, or AT LEAST ONE. Let's do AT LEAST ONE for broader discovery)
    if (advFilters.genres.size > 0) {
      const movieGenres = m.genre || [];
      const hasOverlap = [...advFilters.genres].some(selectedG => movieGenres.includes(selectedG));
      if (!hasOverlap) return false;
    }

    // 5. Vibes (Experience Type) - also OR logic if multiple selected
    if (advFilters.vibes.size > 0) {
      if (!advFilters.vibes.has(m.experience_type || 'Unknown')) return false;
    }

    return true;
  });

  // Sort by rating desc by default
  matches.sort((a, b) => (b.rating_percent || 0) - (a.rating_percent || 0));

  countLabel.innerText = `Showing ${matches.length} matches`;

  if (matches.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1; padding: 60px 0;">
        <div class="empty-icon">?</div>
        <h3>No matches found</h3>
        <p>Try loosening your filters to discover more.</p>
        <button class="btn btn-outline" style="margin-top: 20px;" onclick="resetAdvancedFilters()">Clear Filters</button>
      </div>
    `;
    return;
  }

  // Optimize rendering for large datasets (slice first 50 results to prevent DOM lag, or render all if optimized)
  const displayLimit = 60;
  const toDisplay = matches.slice(0, displayLimit);
  
  container.innerHTML = toDisplay.map(m => renderMovieCard(m)).join('');
  
  if (matches.length > displayLimit) {
    container.innerHTML += `
      <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: var(--text-muted);">
        + ${matches.length - displayLimit} more results (Refine your search to see them)
      </div>
    `;
  }
}

// Make functions globally accessible
window.toggleAdvFilter = toggleAdvFilter;
window.resetAdvancedFilters = resetAdvancedFilters;
window.applyAdvancedFilters = applyAdvancedFilters;
window.renderSearch = renderSearch;
