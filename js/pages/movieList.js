// Movie Recommendation System — All Movies List Page
// Restores the original "Catalogue" functionality

function renderMovieList(params) {
  const userAge = parseInt(localStorage.getItem('mrs_age')) || 0;
  const safeMovies = applyAgeFilter(MOVIES, userAge);

  // Check for search query
  if (params && params.query) {
    const movies = searchByTitle(safeMovies, params.query);
    const title = `Search Results: "${params.query}"`;
    const subtitle = `${movies.length} matches found ${movies.length > 0 ? '' : '— try something else!'}`;

    return `
      <section class="section" style="padding-top: 20px; padding-bottom: 50px;">
        <div class="container">
          <div class="section-header">
            <div>
              <h2 class="section-title">${title}</h2>
              <p class="section-subtitle">${subtitle}</p>
            </div>
            <a href="#/movies" class="btn btn-sm btn-outline">← Back to Discovery</a>
          </div>
          
          ${movies.length > 0 ? `
          <div class="movie-grid stagger">
            ${movies.map(m => renderMovieCard(m)).join('')}
          </div>
          ` : `
          <div class="empty-state" style="padding: 100px 0;">
            <div class="empty-icon">?</div>
            <h3>No movies matched your search</h3>
            <p style="margin-bottom: 24px;">Check your spelling or try a broader term like "Action" or "Star Wars".</p>
            <a href="#/movies" class="btn btn-primary">Discover Trends</a>
          </div>
          `}
        </div>
      </section>
    `;
  }

  // Check for specific filter (e.g., "latest", "popular", "top-rated")
  if (params && params.filter) {
    let title = "Movies";
    let subtitle = "Explore our collection";
    let movies = [];

    switch (params.filter) {
      case 'latest':
        title = "Latest Movies";
        subtitle = "Newest additions to our catalogue";
        movies = getLatest(safeMovies);
        break;
      case 'popular':
        title = "Popular Movies";
        subtitle = "Trending right now";
        movies = getTrending(safeMovies);
        break;
      case 'top-rated':
        title = "Top Rated Movies";
        subtitle = "Highest rated by critics and audiences";
        movies = getTopRated(safeMovies);
        break;
      case 'recently-viewed':
        title = "Recently Viewed";
        subtitle = "Pick up where you left off";
        const rvIds = getRecentlyViewed(50);
        movies = rvIds.map(id => safeMovies.find(m => m.movie_id === id)).filter(Boolean);
        break;
      case 'all':
        title = "Complete Movie List";
        subtitle = `A-Z collection of all ${safeMovies.length} titles`;
        movies = [...safeMovies].sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'ai-picks':
        title = "Movies For You";
        subtitle = "Personalized recommendations chosen for your taste";
        // Handle async loading for AI picks
        setTimeout(loadAIPicksInGrid, 100);
        return `
          <section class="section" style="padding-top: 20px; padding-bottom: 50px;">
            <div class="container">
              <div class="section-header">
                <div>
                  <h2 class="section-title">${title}</h2>
                  <p class="section-subtitle">${subtitle}</p>
                </div>
                <a href="#/" class="btn btn-sm btn-outline">← Back to Home</a>
              </div>
              <div id="ai-picks-grid-container">
                ${renderAnalysisLoader()}
              </div>
            </div>
          </section>
        `;
      default:
        // Fallback to all safe sorted by title
        title = "Full Collection";
        movies = [...safeMovies].sort((a, b) => a.title.localeCompare(b.title));
    }

    // Render Grid View for Specific Filter
    return `
      <section class="section" style="padding-top: 20px; padding-bottom: 50px;">
        <div class="container">
          <div class="section-header">
            <div>
              <h2 class="section-title">${title}</h2>
              <p class="section-subtitle">${subtitle}</p>
            </div>
            <a href="#/all" class="btn btn-sm btn-outline">← Back to Categories</a>
          </div>
          
          <div class="movie-grid stagger">
            ${movies.map(m => renderMovieCard(m)).join('')}
          </div>
          
          ${movies.length === 0 ? `<p>No movies found for your age rating.</p>` : ''}
        </div>
      </section>
    `;
  }

  // --- Default: Category View ---

  // Helper to filter movies (reusable)
  const getMoviesByTag = (tag) => safeMovies.filter(m => m.tags && m.tags.includes(tag));
  const getMoviesByExperience = (exp) => safeMovies.filter(m => m.experience_type === exp);
  const getMoviesByGenre = (genre) => safeMovies.filter(m => m.genre && m.genre.includes(genre));

  // Define categories in order
  const categories = [
    { title: "Cult Classics", movies: getMoviesByTag('cult') },
    { title: "Underrated Gems", movies: getMoviesByTag('underrated') },
    { title: "Family Friendly", movies: getMoviesByTag('family-safe') },
    { title: "Adrenaline Rush", movies: getMoviesByExperience('intense').slice(0, 30) },
    { title: "Emotional Journey", movies: getMoviesByExperience('emotional') },
    { title: "Thought-Provoking", movies: getMoviesByExperience('thought-provoking') },
    { title: "Fun & Feel-Good", movies: getMoviesByExperience('fun') },
    { title: "Chill & Relax", movies: getMoviesByExperience('relaxing') },
    { title: "Animated Worlds", movies: getMoviesByGenre('Animation') },
    { title: "Sci-Fi Futures", movies: getMoviesByGenre('Sci-Fi') },
    { title: "Laugh Out Loud", movies: getMoviesByGenre('Comedy') },
    { title: "Action & Adventure", movies: [...new Set([...getMoviesByGenre('Action'), ...getMoviesByGenre('Adventure')])] },
    { title: "Drama", movies: getMoviesByGenre('Drama').slice(0, 30) },
    { title: "Horror & Thriller", movies: [...new Set([...getMoviesByGenre('Horror'), ...getMoviesByGenre('Thriller')])] }
  ].filter(cat => cat.movies.length > 0); // Only show categories with movies

  return `
    <section class="section" style="padding-top: 20px; padding-bottom: 50px;">
      <div class="container">
        <div class="section-header">
            <div>
              <h2 class="section-title">Movie Library</h2>
              <p class="section-subtitle">Discover movies by mood, theme, and genre.</p>
            </div>
            <a href="#/section/all" class="btn btn-sm btn-primary">View All A-Z</a>
        </div>

        ${categories.map(cat => `
          <div class="category-section" style="margin-bottom: 16px;">
            <h3 class="category-title" style="font-size: 1.5rem; margin-bottom: 15px; color: var(--text-color);">${cat.title}</h3>
            <div class="movie-row" style="
              display: flex;
              gap: 20px;
              overflow-x: auto;
              padding-bottom: 15px;
              scroll-behavior: smooth;
              -ms-overflow-style: none;  /* IE and Edge */
              scrollbar-width: none;  /* Firefox */
            ">
              <style>
                .movie-row::-webkit-scrollbar { display: none; } /* Chrome, Safari, Opera */
              </style>
              ${cat.movies.map(m => `
                <div style="flex: 0 0 auto; width: 200px;">
                  ${renderMovieCard(m)}
                </div>
              `).join('')}
            </div>
          </div>
        `).join('')}

        ${categories.length === 0 ? `<p>No movies found for your age rating.</p>` : ''}
      </div>
    </section>
  `;
}

/**
 * Async fetch and render AI picks into the movieList grid.
 */
async function loadAIPicksInGrid() {
  const container = document.getElementById('ai-picks-grid-container');
  if (!container) return;

  const res = await API.getRecommendations(50); // Large limit for "View All"
  
  if (res.ok && res.data.recommendations.length > 0) {
    const recs = res.data.recommendations;
    const seen = new Set();
    const uniqueRecs = recs.filter(rec => {
      if (seen.has(rec.movie_id)) return false;
      seen.add(rec.movie_id);
      return true;
    });

    container.innerHTML = `
      <div class="movie-grid stagger">
        ${uniqueRecs.map(rec => {
          const movie = MOVIES.find(m => m.movie_id === rec.movie_id);
          if (!movie) return '';
          return renderMovieCard(movie);
        }).join('')}
      </div>
    `;
  } else {
    container.innerHTML = `
      <div class="empty-state" style="padding: 100px 0;">
        <div class="empty-icon"><i class="fa-solid fa-brain" style="font-size:56px;"></i></div>
        <h3>No AI recommendations yet</h3>
        <p style="margin-bottom: 24px;">Your personal model needs more data. Rate some movies to start seeing your picks!</p>
        <a href="#/" class="btn btn-primary">Go to Home</a>
      </div>
    `;
  }
}

window.loadAIPicksInGrid = loadAIPicksInGrid;
