// Movie Recommendation System — Database Layer (SQLite)
// Stores users, interaction history, and RL model state

const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, 'data', 'mrs.db');
const db = new Database(DB_PATH);

// Enable WAL mode for better concurrent performance
db.pragma('journal_mode = WAL');

// ──────────────────────────────────
// SCHEMA CREATION
// ──────────────────────────────────

db.exec(`
  -- Users table
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_uid TEXT UNIQUE NOT NULL,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    display_name TEXT,
    age INTEGER DEFAULT 18,
    preferred_genres TEXT DEFAULT '[]',
    preferred_experience TEXT DEFAULT '',
    avatar_emoji TEXT DEFAULT '👤',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- User interaction events (tracks every interaction)
  CREATE TABLE IF NOT EXISTS interactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_uid TEXT NOT NULL,
    movie_id INTEGER NOT NULL,
    event_type TEXT NOT NULL CHECK(event_type IN ('view', 'click', 'search', 'rating', 'recommend_click', 'dwell', 'watchlist')),
    event_value TEXT DEFAULT '',
    context_genre TEXT DEFAULT '',
    context_experience TEXT DEFAULT '',
    context_source TEXT DEFAULT '',
    duration_ms INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_uid) REFERENCES users(user_uid)
  );

  -- Search history (separate for fast search recall)
  CREATE TABLE IF NOT EXISTS search_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_uid TEXT NOT NULL,
    query TEXT NOT NULL,
    result_count INTEGER DEFAULT 0,
    selected_movie_id INTEGER DEFAULT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_uid) REFERENCES users(user_uid)
  );

  -- RL Q-Table: stores learned values for state-action pairs
  -- State = user preference context (genre + experience combo)
  -- Action = movie_id
  -- Value = learned Q-value (higher = better recommendation for this context)
  CREATE TABLE IF NOT EXISTS rl_qtable (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_uid TEXT NOT NULL,
    state_key TEXT NOT NULL,
    movie_id INTEGER NOT NULL,
    q_value REAL DEFAULT 0.0,
    visit_count INTEGER DEFAULT 0,
    last_reward REAL DEFAULT 0.0,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_uid, state_key, movie_id),
    FOREIGN KEY (user_uid) REFERENCES users(user_uid)
  );

  -- User movie ratings (explicit feedback)
  CREATE TABLE IF NOT EXISTS ratings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_uid TEXT NOT NULL,
    movie_id INTEGER NOT NULL,
    rating INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_uid, movie_id),
    FOREIGN KEY (user_uid) REFERENCES users(user_uid)
  );

  -- Session tracking
  CREATE TABLE IF NOT EXISTS sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_uid TEXT NOT NULL,
    session_token TEXT UNIQUE NOT NULL,
    ip_address TEXT DEFAULT '',
    user_agent TEXT DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME NOT NULL,
    FOREIGN KEY (user_uid) REFERENCES users(user_uid)
  );

  -- Movie Watch Later (Watchlist)
  CREATE TABLE IF NOT EXISTS watchlist (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_uid TEXT NOT NULL,
    movie_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_uid, movie_id),
    FOREIGN KEY (user_uid) REFERENCES users(user_uid)
  );

  -- Favorite Movies
  CREATE TABLE IF NOT EXISTS favorites (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_uid TEXT NOT NULL,
    movie_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_uid, movie_id),
    FOREIGN KEY (user_uid) REFERENCES users(user_uid)
  );

  -- Indexes for performance
  CREATE INDEX IF NOT EXISTS idx_interactions_user ON interactions(user_uid);
  CREATE INDEX IF NOT EXISTS idx_interactions_movie ON interactions(movie_id);
  CREATE INDEX IF NOT EXISTS idx_interactions_type ON interactions(event_type);
  CREATE INDEX IF NOT EXISTS idx_search_user ON search_history(user_uid);
  CREATE INDEX IF NOT EXISTS idx_rl_user_state ON rl_qtable(user_uid, state_key);
  CREATE INDEX IF NOT EXISTS idx_ratings_user ON ratings(user_uid);
  CREATE INDEX IF NOT EXISTS idx_watchlist_user ON watchlist(user_uid);
  CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites(user_uid);
`);

// ──────────────────────────────────
// PREPARED STATEMENTS (Performance)
// ──────────────────────────────────

const stmts = {
  // Users
  createUser: db.prepare(`
    INSERT INTO users (user_uid, username, email, password_hash, display_name, age, avatar_emoji)
    VALUES (@user_uid, @username, @email, @password_hash, @display_name, @age, @avatar_emoji)
  `),
  getUserByUsername: db.prepare('SELECT * FROM users WHERE username = ?'),
  getUserByEmail: db.prepare('SELECT * FROM users WHERE email = ?'),
  getUserByUid: db.prepare('SELECT * FROM users WHERE user_uid = ?'),
  updateUserProfile: db.prepare(`
    UPDATE users SET display_name = @display_name, age = @age, preferred_genres = @preferred_genres,
    preferred_experience = @preferred_experience, avatar_emoji = @avatar_emoji, updated_at = CURRENT_TIMESTAMP
    WHERE user_uid = @user_uid
  `),

  // Interactions
  logInteraction: db.prepare(`
    INSERT INTO interactions (user_uid, movie_id, event_type, event_value, context_genre, context_experience, context_source, duration_ms)
    VALUES (@user_uid, @movie_id, @event_type, @event_value, @context_genre, @context_experience, @context_source, @duration_ms)
  `),
  getUserInteractions: db.prepare(`
    SELECT * FROM interactions WHERE user_uid = ? ORDER BY created_at DESC LIMIT ?
  `),
  getMovieInteractionCounts: db.prepare(`
    SELECT movie_id, event_type, COUNT(*) as count FROM interactions
    WHERE user_uid = ? GROUP BY movie_id, event_type
  `),

  // Search History
  logSearch: db.prepare(`
    INSERT INTO search_history (user_uid, query, result_count, selected_movie_id)
    VALUES (@user_uid, @query, @result_count, @selected_movie_id)
  `),
  getUserSearches: db.prepare(`
    SELECT * FROM search_history WHERE user_uid = ? ORDER BY created_at DESC LIMIT ?
  `),

  // Ratings
  upsertRating: db.prepare(`
    INSERT INTO ratings (user_uid, movie_id, rating)
    VALUES (@user_uid, @movie_id, @rating)
    ON CONFLICT(user_uid, movie_id) DO UPDATE SET rating = @rating, updated_at = CURRENT_TIMESTAMP
  `),
  getUserRatings: db.prepare('SELECT * FROM ratings WHERE user_uid = ?'),
  getMovieRating: db.prepare('SELECT * FROM ratings WHERE user_uid = ? AND movie_id = ?'),
  deleteRating: db.prepare('DELETE FROM ratings WHERE user_uid = ? AND movie_id = ?'),

  // Watchlist
  addToWatchlist: db.prepare(`
    INSERT INTO watchlist (user_uid, movie_id)
    VALUES (@user_uid, @movie_id)
    ON CONFLICT(user_uid, movie_id) DO NOTHING
  `),
  removeFromWatchlist: db.prepare('DELETE FROM watchlist WHERE user_uid = ? AND movie_id = ?'),
  getUserWatchlist: db.prepare('SELECT * FROM watchlist WHERE user_uid = ? ORDER BY created_at DESC'),
  getWatchlistItem: db.prepare('SELECT * FROM watchlist WHERE user_uid = ? AND movie_id = ?'),

  // RL Q-Table
  getQValue: db.prepare('SELECT * FROM rl_qtable WHERE user_uid = ? AND state_key = ? AND movie_id = ?'),
  upsertQValue: db.prepare(`
    INSERT INTO rl_qtable (user_uid, state_key, movie_id, q_value, visit_count, last_reward)
    VALUES (@user_uid, @state_key, @movie_id, @q_value, @visit_count, @last_reward)
    ON CONFLICT(user_uid, state_key, movie_id)
    DO UPDATE SET q_value = @q_value, visit_count = @visit_count, last_reward = @last_reward, updated_at = CURRENT_TIMESTAMP
  `),
  getTopQValues: db.prepare(`
    SELECT * FROM rl_qtable WHERE user_uid = ? AND state_key = ?
    ORDER BY q_value DESC LIMIT ?
  `),
  getAllUserQValues: db.prepare('SELECT * FROM rl_qtable WHERE user_uid = ?'),

  // Favorites
  addToFavorites: db.prepare('INSERT OR IGNORE INTO favorites (user_uid, movie_id) VALUES (@user_uid, @movie_id)'),
  removeFromFavorites: db.prepare('DELETE FROM favorites WHERE user_uid = ? AND movie_id = ?'),
  getUserFavorites: db.prepare('SELECT * FROM favorites WHERE user_uid = ? ORDER BY created_at DESC'),
  getFavoriteItem: db.prepare('SELECT * FROM favorites WHERE user_uid = ? AND movie_id = ?'),

  // Analytics
  getUserTopGenres: db.prepare(`
    SELECT context_genre, COUNT(*) as cnt FROM interactions
    WHERE user_uid = ? AND context_genre != '' AND event_type IN ('view', 'click', 'rating')
    GROUP BY context_genre ORDER BY cnt DESC LIMIT 5
  `),
  getUserTopMovies: db.prepare(`
    SELECT movie_id, COUNT(*) as cnt FROM interactions
    WHERE user_uid = ? AND event_type IN ('view', 'click')
    GROUP BY movie_id ORDER BY cnt DESC LIMIT 10
  `),
  getUserActivityStats: db.prepare(`
    SELECT event_type, COUNT(*) as cnt FROM interactions
    WHERE user_uid = ? GROUP BY event_type
  `),
};

module.exports = { db, stmts };
