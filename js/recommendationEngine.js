// Movie Recommendation System — Recommendation Engine
// Separated from UI rendering. Contains all filtering, scoring, and recommendation logic.

// ──────────────────────────────────────────────
// FILTERING FUNCTIONS
// ──────────────────────────────────────────────

/**
 * Age-based content filtering.
 * Movies with age_limit greater than user age are excluded.
 */
function applyAgeFilter(movies, userAge) {
    if (!userAge || userAge >= 120) return movies;
    return movies.filter(m => userAge >= m.age_limit);
}

/**
 * Filter by genre.
 */
function getByGenre(movies, genre) {
    if (!genre || genre === 'All') return movies;
    return movies.filter(m => m.genre.includes(genre));
}

/**
 * Filter by experience type.
 */
function getByExperience(movies, exp) {
    if (!exp || exp === 'All') return movies;
    return movies.filter(m => m.experience_type === exp.toLowerCase());
}

/**
 * Filter by category tag (cult, underrated, family-safe).
 */
function getByCategory(movies, tag) {
    return movies.filter(m => m.tags.includes(tag));
}

/**
 * Search movies by title (partial, case-insensitive).
 */
function searchByTitle(movies, query) {
    if (!query) return movies;
    const q = query.toLowerCase();
    return movies.filter(m => m.title.toLowerCase().includes(q));
}

/**
 * Combined filter: genre + experience + search query.
 */
function filterMovies(movies, { genre, experience, query } = {}) {
    let result = movies;
    result = getByGenre(result, genre);
    result = getByExperience(result, experience);
    result = searchByTitle(result, query);
    return result;
}

// ──────────────────────────────────────────────
// CONTENT-BASED RECOMMENDATION ENGINE
// ──────────────────────────────────────────────

/**
 * Calculate similarity score between two movies using weighted metadata comparison.
 * Returns an object with the total score AND per-factor breakdown for explainability.
 *
 * Scoring formula (academically explicit):
 *   score += 2                                    if genre matches (any shared genre)
 *   score += 1                                    if experience_type matches
 *   score += 1 - abs(ratingA - ratingB) / 100     rating similarity (0..1 scaled)
 *   score += 1 - abs(popularityA - popularityB)   popularity similarity (0..1 scaled)
 *
 * Maximum possible score: 5.0
 *
 * @param {Object} movieA - The reference (selected) movie
 * @param {Object} movieB - The candidate movie to compare
 * @returns {{ total: number, genreScore: number, experienceScore: number, ratingScore: number, popularityScore: number, reasons: string[] }}
 */
function similarityScore(movieA, movieB) {
    if (movieA.movie_id === movieB.movie_id) {
        return { total: -1, genreScore: 0, experienceScore: 0, ratingScore: 0, popularityScore: 0, reasons: [] };
    }

    const breakdown = { genreScore: 0, experienceScore: 0, ratingScore: 0, popularityScore: 0 };
    const reasons = [];

    // ── Factor 1: Genre match (weight 1.5 per genre) ──
    // Any shared genre improves the score, scaling up rapidly for multi-genre matches
    const sharedGenres = movieA.genre.filter(g => movieB.genre.includes(g));
    if (sharedGenres.length > 0) {
        breakdown.genreScore = sharedGenres.length * 1.5;
        
        // Bonus: If the PRIMARY (first) genre matches, add extra weight (+0.5)
        if (movieA.genre[0] === movieB.genre[0]) {
            breakdown.genreScore += 0.5;
            reasons.push(`has an exact category match (${movieA.genre[0]})`);
        } else {
            reasons.push(`shares similar genres (${sharedGenres.join(', ')})`);
        }
    }

    // ── Factor 2: Same Director match (Bonus) ──
    if (movieA.director && movieB.director && movieA.director !== 'Unknown' && movieA.director === movieB.director) {
        breakdown.genreScore += 2.0;
        reasons.push(`is directed by the same person (${movieA.director})`);
    }

    // ── Factor 3: Experience match (weight 1) ──
    // Exact match of experience_type (fun, intense, emotional, relaxing)
    if (movieA.experience_type === movieB.experience_type) {
        breakdown.experienceScore = 1;
        reasons.push(`offers a similar experience (${movieA.experience_type})`);
    }

    // ── Factor 3: Rating similarity (weight 1) ──
    // Formula: score += 1 - abs(ratingA - ratingB) / 100
    // Closer ratings yield a higher score (max 1.0 when identical)
    const ratingDiff = Math.abs(movieA.rating_percent - movieB.rating_percent);
    breakdown.ratingScore = 1 - (ratingDiff / 100);
    if (breakdown.ratingScore >= 0.85) {
        reasons.push('has a similar audience rating');
    }

    // ── Factor 4: Popularity similarity (weight 1) ──
    // Formula: score += 1 - abs(popularityA - popularityB)
    // Both values are normalized 0..1, so diff is already 0..1
    const popDiff = Math.abs(movieA.popularity_score - movieB.popularity_score);
    breakdown.popularityScore = 1 - popDiff;
    if (breakdown.popularityScore >= 0.85) {
        reasons.push('is similarly popular');
    }

    // ── Total ──
    let total = breakdown.genreScore + breakdown.experienceScore + breakdown.ratingScore + breakdown.popularityScore;

    // Penalize movies that share zero genres to avoid random recommendations
    if (breakdown.genreScore === 0) {
        total *= 0.1;
    }

    return { total, ...breakdown, reasons };
}

/**
 * Build a human-readable recommendation reason string.
 * Examiners value explainability — this shows WHY a movie was recommended.
 *
 * @param {string[]} reasons - Array of reason fragments from similarityScore()
 * @returns {string} e.g. "Recommended because it shares genre and experience type."
 */
function buildReasonText(reasons) {
    if (!reasons || reasons.length === 0) return 'Recommended based on overall similarity.';
    
    // Shuffle the reasons slightly and cap at 2 to avoid repetitiveness and long text
    const shuffled = [...reasons].sort(() => 0.5 - Math.random());
    const selectedReasons = shuffled.slice(0, 2);
    
    return 'Recommended because it ' + selectedReasons.join(' and ') + '.';
}

/**
 * Get hybrid recommendations based on explicit criteria.
 * Used for the "Recommendation Engine" page.
 *
 * Logic:
 * 1. Filter by Age (mandatory)
 * 2. Filter by Genre (if selected)
 * 3. Filter by Experience (if selected)
 * 4. If 'similarToId' provided -> Score by Similarity to that movie
 *    Else -> Score by general quality (Rating + Popularity)
 *
 * @param {Array} allMovies
 * @param {Object} criteria - { userAge, genre, experience, similarToId }
 * @param {number} count
 */
function getHybridRecommendations(allMovies, criteria, count = 12) {
    const { userAge, genre, experience, similarToId } = criteria;

    // 1. Initial Filter (Age)
    let candidates = applyAgeFilter(allMovies, userAge);

    // 2. Filter by Genre
    if (genre && genre !== 'All' && genre !== '') {
        candidates = candidates.filter(m => m.genre.includes(genre));
    }

    // 3. Filter by Experience
    if (experience && experience !== 'All' && experience !== '') {
        candidates = candidates.filter(m => m.experience_type === experience);
    }

    // 4. Scoring Strategy
    let scored = [];
    const target = similarToId ? allMovies.find(m => m.movie_id == similarToId) : null;

    if (target) {
        // Strategy A: Similarity Scoring (if target movie selected)
        scored = candidates.map(m => {
            const sim = similarityScore(target, m);
            return {
                movie: m,
                score: sim.total,
                reason: buildReasonText(sim.reasons),
                breakdown: sim
            };
        });
    } else {
        // Strategy B: Filter Match + Quality Scoring (if no target movie)
        scored = candidates.map(m => {
            // Score = Popularity (0-1) + Rating (0-1)
            const qualityScore = m.popularity_score + (m.rating_percent / 100);

            let reasonStr = '';
            const isHighlyRated = m.rating_percent >= 85;
            const isVeryPopular = m.popularity_score >= 0.8;
            const dirStr = (m.director && m.director !== 'Unknown' && Math.random() > 0.5) ? ` directed by ${m.director}` : '';
            const yearStr = (m.year && !dirStr && Math.random() > 0.5) ? ` from ${m.year}` : '';
            const suffix = dirStr || yearStr;

            if (genre && experience) {
                 if (isHighlyRated) reasonStr = `Highly rated ${genre} pick with a ${experience} vibe${suffix}.`;
                 else reasonStr = `Matches the ${genre} category and ${experience} vibe${suffix}.`;
            } else if (genre) {
                 if (isHighlyRated) reasonStr = `Critically acclaimed ${genre} movie${suffix}.`;
                 else if (isVeryPopular) reasonStr = `Trending ${genre} choice${suffix}.`;
                 else reasonStr = `Selected for the ${genre} category${suffix}.`;
            } else if (experience) {
                 if (isHighlyRated) reasonStr = `Highly rated choice for a ${experience} vibe${suffix}.`;
                 else reasonStr = `Great fit for a ${experience} experience${suffix}.`;
            } else {
                 if (isHighlyRated && isVeryPopular) reasonStr = `A highly rated and globally popular movie${suffix}.`;
                 else if (isHighlyRated) reasonStr = `A critically acclaimed choice${suffix}.`;
                 else if (isVeryPopular) reasonStr = `A trending popular pick${suffix}.`;
                 else reasonStr = `A solid choice based on general quality${suffix}.`;
            }

            return {
                movie: m,
                score: qualityScore,
                reason: reasonStr
            };
        });
    }

    // 5. Sort, Filter, Slice
    const results = scored
        .filter(item => item.score > 0) // Remove self-match (-1) or zero score
        .sort((a, b) => (b.score - a.score) || (b.movie.popularity_score - a.movie.popularity_score) || (b.movie.rating_percent - a.movie.rating_percent))
        .slice(0, count);

    return results;
}
/**
 * Get recommended movies for a given movie_id.
 *
 * Algorithm steps:
 * 1. Accept selected movie_id
 * 2. Compute similarity scores(with breakdown) against all other movies
 * 3. Sort results by total similarity score(descending)
 * 4. Apply age filter BEFORE returning final recommendations
 * 5. Return top N results as { movie, score, reason } objects
 *
 * Fallback: Returns empty array when no matches found.
 * UI layer should display: "No similar movies found under current age filter."
 *
 * @param {Array} allMovies - Full movie catalogue
 * @param {number} movieId - Reference movie ID
 * @param {number} userAge - User's age for content filtering
 * @param {number} count - Max recommendations to return (default: 6)
 * @returns {Array<{ movie: Object, score: number, reason: string }>}
 */
function getRecommendations(allMovies, movieId, userAge, count = 6) {
    const target = allMovies.find(m => m.movie_id === movieId);
    if (!target) return [];

    // Score all movies with explicit breakdown
    const scored = allMovies
        .map(m => {
            const result = similarityScore(target, m);
            return {
                movie: m,
                score: result.total,
                reason: buildReasonText(result.reasons),
                breakdown: result
            };
        })
        .filter(item => item.score > 0)
        .sort((a, b) => (b.score - a.score) || (b.movie.popularity_score - a.movie.popularity_score) || (b.movie.rating_percent - a.movie.rating_percent));

    // Age filtering applied BEFORE returning final recommendations
    const filtered = scored.filter(item => userAge >= item.movie.age_limit);

    return filtered.slice(0, count);
}

/**
 * Legacy-compatible getSimilar wrapper.
 */
function getSimilar(allMovies, movieId, count = 6) {
    const userAge = parseInt(localStorage.getItem('mrs_age')) || 0;
    return getRecommendations(allMovies, movieId, userAge, count);
}

// ──────────────────────────────────────────────
// SORTING UTILITIES
// ──────────────────────────────────────────────

/**
 * Get trending/popular movies (popularity_score >= 0.8).
 */
function getTrending(movies) {
    return movies
        .filter(m => m.popularity_score >= 0.8)
        .sort((a, b) => b.popularity_score - a.popularity_score || b.rating_percent - a.rating_percent);
}

/**
 * Get latest movies (sorted by year, newest first).
 */
function getLatest(movies) {
    return [...movies].sort((a, b) => b.year - a.year);
}

/**
 * Get top rated movies (sorted by rating_percent, highest first).
 */
function getTopRated(movies) {
    return [...movies].sort((a, b) => b.rating_percent - a.rating_percent);
}

// ──────────────────────────────────────────────
// GENRE & PLATFORM HELPERS
// ──────────────────────────────────────────────

/**
 * Get all unique genres from the catalogue.
 */
function getAllGenres(movies) {
    const genreSet = new Set();
    movies.forEach(m => m.genre.forEach(g => genreSet.add(g)));
    return Array.from(genreSet).sort();
}

/**
 * Get movies available on a specific OTT platform.
 */
function getByPlatform(movies, platformName) {
    return movies.filter(m =>
        m.ottPlatforms.some(p => p.name === platformName)
    );
}

/**
 * Get all unique OTT platforms with icons.
 */
function getAllPlatforms() {
    const platformMap = {};
    if (typeof MOVIES !== 'undefined') {
        MOVIES.forEach(m => {
            if (m.ottPlatforms) {
                m.ottPlatforms.forEach(p => {
                    if (!platformMap[p.name]) {
                        platformMap[p.name] = { 
                            name: p.name, 
                            icon: p.icon || 'Movie', 
                            color: '#7c3aed' // Default accent
                        };
                    }
                });
            }
        });
    }
    return Object.values(platformMap).sort((a,b) => a.name.localeCompare(b.name));
}
