// Movie Recommendation System — Platform Page (shows all movies on a specific OTT platform)

function renderPlatform(params) {
  const platformName = decodeURIComponent(params.name || '');
  const platforms = getAllPlatforms();
  const platformMeta = platforms.find(p => p.name === platformName);
  const icon = platformMeta ? platformMeta.icon : 'Movie';

  const iconHTML = platformMeta && platformMeta.icon && platformMeta.icon.startsWith('http')
    ? `<img src="${platformMeta.icon}" style="width: 56px; height: 56px; object-fit: contain; margin-bottom: 20px;" />`
    : `<div class="cat-icon fade-in" style="font-size: 56px;">${icon}</div>`;

  const userAge = parseInt(localStorage.getItem('mrs_age')) || 0;
  const safeMovies = applyAgeFilter(MOVIES, userAge);
  const platformMovies = getByPlatform(safeMovies, platformName);

  return `
    <div class="category-header">
      ${iconHTML}
      <h1 class="fade-in">${platformName}</h1>
      <p class="fade-in">Movies available to stream on ${platformName}</p>
    </div>

    <section class="section" style="padding-top: 0;">
      <div class="container">
        <a class="back-link" href="#/">← Back to Home</a>
        <p class="section-subtitle" style="margin-bottom: 24px;">${platformMovies.length} movies available</p>
        ${platformMovies.length > 0 ? `
          <div class="movie-grid stagger">
            ${platformMovies.map(m => renderMovieCard(m)).join('')}
          </div>
        ` : `
          <div class="empty-state">
            <div class="empty-icon">?</div>
            <h3>No movies found</h3>
            <p>No movies currently listed for ${platformName}</p>
          </div>
        `}
      </div>
    </section>
    `;
}
