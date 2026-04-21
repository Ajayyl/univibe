// Movie Recommendation System — Home Page (Enhanced v65)

/**
 * Render a horizontal movie row for a specific OTT platform.
 */
function renderPlatformRow(movies, platformName, icon) {
  const platformMovies = getByPlatform(movies, platformName);
  if (platformMovies.length === 0) return '';

  return `
    <section class="section" style="padding-top: 0;">
      <div class="container">
        <div class="section-header">
          <div>
            <h2 class="section-title">On ${platformName}</h2>
            <p class="section-subtitle">Available to stream on ${platformName}</p>
          </div>
          <a href="#/platform/${encodeURIComponent(platformName)}" class="btn btn-sm btn-outline">View All →</a>
        </div>
        <div class="movie-row stagger">
          ${platformMovies.slice(0, 8).map(m => renderMovieCard(m)).join('')}
        </div>
      </div>
    </section>
    `;
}

function renderHome() {
  const userAge = parseInt(localStorage.getItem('mrs_age')) || 0;
  const safeMovies = applyAgeFilter(MOVIES, userAge);
  const trending = getTrending(safeMovies);
  const latest = getLatest(safeMovies);
  const topRated = getTopRated(safeMovies);

  const isLoggedIn = API.isLoggedIn();
  const user = API.getUser();

  // Get recently viewed movies
  const recentlyViewedIds = getRecentlyViewed(10);
  const recentlyViewedMovies = recentlyViewedIds
    .map(id => safeMovies.find(m => m.movie_id === id))
    .filter(Boolean);

  // Get "Because You Watched" data
  const becauseYouWatched = getBecauseYouWatchedData(safeMovies, userAge);

  return `
    <!-- Hero Slider -->
    <section class="home-slider-container">
      <div class="home-slider" id="home-hero-slider">
        ${(() => {
          // Filter out Vijay movies manually per user preference
          const filteredTrending = trending.filter(m => {
            const castStr = Array.isArray(m.cast) ? m.cast.join(' ').toLowerCase() : (typeof m.cast === 'string' ? m.cast.toLowerCase() : '');
            const dirname = (m.director || '').toLowerCase();
            return !castStr.includes('vijay') && !dirname.includes('vijay');
          });
          
          // Take the top 20 trending movies and shuffle them so it's different every time
          const topTrendingPool = filteredTrending.slice(0, 20);
          const shuffledTrending = topTrendingPool.sort(() => 0.5 - Math.random());
          const slidesToRender = shuffledTrending.slice(0, 5);
          return slidesToRender.map((m, index) => {
            let posterUrl = m.poster;
            
            // Dynamically upgrade image resolution for the massive hero screen
            if (posterUrl.includes('tmdb.org')) {
              // Replace 500px width constraint with original source resolution
              posterUrl = posterUrl.replace('/w500/', '/original/');
            } else if (posterUrl.includes('media-amazon.com')) {
              // Strip Amazon's low-res constraints (like _V1_SX250.jpg) to grab the raw HD image
              posterUrl = posterUrl.replace(/_V1_.*\.jpg$/, '_V1_.jpg');
            }

            return `
                <div class="slide ${index === 0 ? 'active' : ''}" data-index="${index}">
                  <div class="container slide-container">
                    <div class="slide-content">
                      <div class="slide-badge">Trending Now</div>
                      <h1 class="slide-title ${m.title.length > 20 ? 'title-long' : ''}">${m.title}</h1>
                      <div class="slide-meta">
                        <span class="slide-rating">${m.rating_percent || 0}%</span>
                        <span class="slide-year">${m.year}</span>
                        <span class="slide-genre">${Array.isArray(m.genre) ? m.genre.join(', ') : m.genre}</span>
                      </div>
                      <p class="slide-description">${m.synopsis}</p>
                      <div class="slide-actions">
                        <a href="#/movie/${m.movie_id}" class="btn btn-primary">
                          Explore Movie
                        </a>
                      </div>
                    </div>
                    <div class="slide-visual">
                      <img src="${posterUrl}" alt="${m.title}" class="hero-poster" />
                    </div>
                  </div>
                </div>
              `;
          }).join('');
        })()}
      </div>
      
      <!-- Slider Dots -->
      <div class="slider-dots">
        ${trending.slice(0, 5).map((_, index) => `
          <div class="dot ${index === 0 ? 'active' : ''}" data-index="${index}" onclick="goToSlide(${index})"></div>
        `).join('')}
      </div>
      
    <!-- Slider removed navigation buttons -->
    </section>

    <!-- Recently Viewed (Only if user has history) -->
    ${recentlyViewedMovies.length > 0 ? `
    <section class="section" style="padding-top: 0;">
      <div class="container">
        <div class="section-header">
          <div>
            <div class="section-title-row">
              <h2 class="section-title">Recently Viewed</h2>
            </div>
            <p class="section-subtitle">Pick up where you left off</p>
          </div>
          <a href="#/section/recently-viewed" class="btn btn-sm btn-outline">View All →</a>
        </div>
        <div class="scroll-row-container">
          ${renderScrollArrows('row-recently-viewed')}
          <div class="movie-row stagger" id="row-recently-viewed">
            ${recentlyViewedMovies.map(m => renderMovieCard(m)).join('')}
          </div>
        </div>
      </div>
    </section>
    ` : ''}

    <!-- Recommended For You (Personalized AI Model) -->
    <section class="section recommend-section fade-in-up" id="home-smart-section" style="padding-top: 0; display: ${isLoggedIn ? 'block' : 'none'};">
      <div class="container">
        <div class="section-header">
          <div>
            <div class="section-title-row">
              <h2 class="section-title">Recommended for You</h2>
            </div>
            <p class="section-subtitle">Personalized picks that evolve with your taste</p>
          </div>
          <a href="#/section/ai-picks" class="btn btn-sm btn-outline">View All →</a>
        </div>
        <div id="home-ai-recommendations">
          ${renderAnalysisLoader()}
        </div>
      </div>
    </section>

    <!-- Because You Watched [X] -->
    ${becauseYouWatched ? `
    <section class="section" style="padding-top: 0;">
      <div class="container">
        <div class="section-header">
          <div>
            <div class="section-title-row">
              <h2 class="section-title">Because You Watched ${becauseYouWatched.movieTitle}</h2>
            </div>
            <p class="section-subtitle">Similar titles based on your recent viewing</p>
          </div>
        </div>
        <div class="scroll-row-container">
          ${renderScrollArrows('row-because-watched')}
          <div class="movie-row stagger" id="row-because-watched">
            ${becauseYouWatched.recommendations.map(rec => renderRecommendedCard(rec.movie, rec.reason)).join('')}
          </div>
        </div>
      </div>
    </section>
    ` : ''}

    <!-- Trending Now -->
    <section class="section" style="padding-top: 0;">
      <div class="container">
        <div class="section-header">
          <div>
            <div class="section-title-row">
              <h2 class="section-title">Trending Now</h2>
            </div>
            <p class="section-subtitle">Most popular picks right now</p>
          </div>
          <a href="#/section/popular" class="btn btn-sm btn-outline">View All →</a>
        </div>
        <div class="scroll-row-container">
          ${renderScrollArrows('row-trending')}
          <div class="movie-row stagger" id="row-trending">
            ${trending.slice(0, 12).map(m => renderMovieCard(m)).join('')}
          </div>
        </div>
      </div>
    </section>

    <!-- Latest Movies (Formerly Recently Added) -->
    <section class="section" style="padding-top: 0;">
      <div class="container">
        <div class="section-header">
          <div>
            <h2 class="section-title">Latest Movies</h2>
            <p class="section-subtitle">Newest additions to our catalogue</p>
          </div>
          <a href="#/section/latest" class="btn btn-sm btn-outline">View All →</a>
        </div>
        <div class="scroll-row-container">
          ${renderScrollArrows('row-latest')}
          <div class="movie-row stagger" id="row-latest">
            ${latest.slice(0, 12).map(m => renderMovieCard(m)).join('')}
          </div>
        </div>
      </div>
    </section>

    <!-- Top Rated -->
    <section class="section" style="padding-top: 0;">
      <div class="container">
        <div class="section-header">
          <div>
            <h2 class="section-title">Top Rated</h2>
            <p class="section-subtitle">Highest rated by critics and audiences</p>
          </div>
          <a href="#/section/top-rated" class="btn btn-sm btn-outline">View All →</a>
        </div>
        <div class="scroll-row-container">
          ${renderScrollArrows('row-top-rated')}
          <div class="movie-row stagger" id="row-top-rated">
            ${topRated.slice(0, 12).map(m => renderMovieCard(m)).join('')}
          </div>
        </div>
      </div>
    </section>

  `;
}

/**
 * Get "Because You Watched [X]" data.
 * Picks the most recently viewed movie and finds similar titles.
 */
function getBecauseYouWatchedData(safeMovies, userAge) {
  const recentIds = getRecentlyViewed(5);
  if (recentIds.length === 0) return null;

  // Pick the most recent movie that exists in the safe list
  for (const recentId of recentIds) {
    const movie = safeMovies.find(m => m.movie_id === recentId);
    if (!movie) continue;

    // Get recommendations based on this movie
    const recs = getRecommendations(safeMovies, recentId, userAge, 8);
    if (recs.length >= 3) {
      return {
        movieTitle: movie.title,
        movieId: recentId,
        recommendations: recs
      };
    }
  }

  return null;
}

/**
 * Show content-based recommendations after simulated analysis delay.
 */
function showHomeRecommendations(featuredId) {
  const container = document.getElementById('home-recommendations');
  if (!container) return;

  const userAge = parseInt(localStorage.getItem('mrs_age')) || 0;
  const recs = getRecommendations(MOVIES, featuredId, userAge, 6);

  if (recs.length > 0) {
    container.innerHTML = `
      <div class="movie-row stagger">
        ${recs.map(item => renderMovieCard(item.movie)).join('')}
      </div>
    `;
  } else {
    container.innerHTML = `
      <div class="empty-state" style="padding: 40px 0;">
        <div class="empty-icon">?</div>
        <p style="color: var(--text-muted);">No similar movies found under current age filter.</p>
      </div>
    `;
  }
}

/**
 * Load Personalized AI Recommendations (RL Model)
 */
async function loadHomeAIRecommendations() {
  const container = document.getElementById('home-ai-recommendations');
  if (!container) return;

  const res = await API.getRecommendations(10);
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
  container.innerHTML = `
    <div class="scroll-row-container">
      ${renderScrollArrows('row-ai-recs')}
      <div class="movie-row stagger" id="row-ai-recs" style="margin-top:20px; padding-bottom: 24px;">
        ${recs.map(rec => {
          const movie = MOVIES.find(m => m.movie_id === rec.movie_id);
          if (!movie) return '';
          // Build a smart reason tag
          const reason = rec.reason || buildSmartReason(movie, rec);
          return renderRecommendedCard(movie, reason);
        }).join('')}
      </div>
    </div>
  `;
}

/**
 * Build a smart, visible reason for why a movie was recommended.
 * Makes the AI logic transparent to the user.
 */
function buildSmartReason(movie, rec) {
  if (rec.explanation) return rec.explanation;
  
  // Build contextual reasons
  const genre = Array.isArray(movie.genre) ? movie.genre[0] : movie.genre;
  
  if (rec.source === 'AI' && rec.user_pref > 0) {
    return `Based on your interest in ${genre}`;
  }
  
  // Check recently viewed for a match
  const recentIds = getRecentlyViewed(5);
  for (const recentId of recentIds) {
    const recentMovie = MOVIES.find(m => m.movie_id === recentId);
    if (recentMovie) {
      const sharedGenres = movie.genre.filter(g => recentMovie.genre.includes(g));
      if (sharedGenres.length > 0) {
        return `Because you watched ${recentMovie.title}`;
      }
    }
  }
  
  return `Based on your interest in ${genre}`;
}


/**
 * Slider Logic
 */
let currentSlideIndex = 0;
let slideInterval;

function initHomeSlider() {
  const slider = document.getElementById('home-hero-slider');
  if (!slider) return;

  // Reset index to match fresh render
  currentSlideIndex = 0;

  // Clear any existing interval
  if (slideInterval) clearInterval(slideInterval);

  // Set up auto-sliding
  slideInterval = setInterval(() => {
    moveSlide(1);
  }, 6000);
}

window.moveSlide = function(direction) {
  const slides = document.querySelectorAll('.slide');
  const dots = document.querySelectorAll('.dot');
  if (slides.length === 0) return;

  slides[currentSlideIndex].classList.remove('active');
  dots[currentSlideIndex].classList.remove('active');

  currentSlideIndex = (currentSlideIndex + direction + slides.length) % slides.length;

  slides[currentSlideIndex].classList.add('active');
  dots[currentSlideIndex].classList.add('active');
  
  // Sync global background
  const bg = slides[currentSlideIndex].dataset.bg;
  if (bg && typeof updateGlobalAppBackground === 'function') {
    updateGlobalAppBackground(bg);
  }
};

window.goToSlide = function(index) {
  const slides = document.querySelectorAll('.slide');
  const dots = document.querySelectorAll('.dot');
  if (!slides[index]) return;

  slides[currentSlideIndex].classList.remove('active');
  dots[currentSlideIndex].classList.remove('active');

  currentSlideIndex = index;

  slides[currentSlideIndex].classList.add('active');
  dots[currentSlideIndex].classList.add('active');
  
  // Sync global background
  const bg = slides[currentSlideIndex].dataset.bg;
  if (bg && typeof updateGlobalAppBackground === 'function') {
    updateGlobalAppBackground(bg);
  }

  // Reset timer on manual navigation
  if (slideInterval) {
    clearInterval(slideInterval);
    slideInterval = setInterval(() => moveSlide(1), 6000);
  }
};
