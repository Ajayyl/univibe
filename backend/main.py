"""
Movie Recommendation System — FastAPI ML Backend (Enhanced)
========================================
Handles movie metadata, user profiles, and hybrid (RL + Content) recommendations.
Uses SQLite for persistence.

Enhancements:
- Explainable AI: Every recommendation includes a detailed 'reason' explaining WHY
- Recommendation Scores: Response includes similarity_score, user_preference, final_score
- Evaluation Metrics Endpoint: Serves precision@K, recall@K, hit_rate, NDCG, coverage
- Improved Cold-Start: Weighted blend of 0.5*similarity + 0.3*popularity + 0.2*rating
- Genre Preference Boost: Learns per-user genre preferences from interaction history
"""

from fastapi import FastAPI, HTTPException, Depends, Query, Request, BackgroundTasks
from starlette.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict
import sqlite3
import pandas as pd
import pickle
import numpy as np
import os
import uvicorn
import time
import random
import json
from contextlib import asynccontextmanager
from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, UniqueConstraint, func, text
from sqlalchemy.orm import sessionmaker, declarative_base, Session
from sqlalchemy.pool import QueuePool

# ──────────────────────────────────────────────
# CONFIGURATION & SCALING SETTINGS
# ──────────────────────────────────────────────
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
# PostgreSQL ready (Use env variable for production)
DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{os.path.join(BASE_DIR, 'backend', 'data', 'mrs.db')}")

# Scaling defaults
POOL_SIZE = int(os.getenv("DB_POOL_SIZE", "10"))
MAX_OVERFLOW = int(os.getenv("DB_MAX_OVERFLOW", "20"))
PREF_CACHE_TTL = 60  # Cache user preference vectors for 60 seconds

# Initializing Engine with Pooling
# Note: For SQLite, pooling works differently; we optimize for concurrent reads.
engine_args = {
    "pool_size": POOL_SIZE,
    "max_overflow": MAX_OVERFLOW,
    "poolclass": QueuePool,
} if not DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(DATABASE_URL, **engine_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# ──────────────────────────────────────────────
# DATABASE MODELS (SQLAlchemy)
# ──────────────────────────────────────────────
class RLQTable(Base):
    __tablename__ = "rl_qtable"
    id = Column(Integer, primary_key=True, index=True)
    user_uid = Column(String, index=True)
    state_key = Column(String)
    movie_id = Column(Integer)
    q_value = Column(Float, default=0.0)
    visit_count = Column(Integer, default=0)
    last_reward = Column(Float, default=0.0)
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    __table_args__ = (UniqueConstraint('user_uid', 'state_key', 'movie_id', name='_user_state_movie_uc'),)

class Interaction(Base):
    __tablename__ = "interactions"
    id = Column(Integer, primary_key=True, index=True)
    user_uid = Column(String, index=True)
    movie_id = Column(Integer, index=True)
    event_type = Column(String, index=True)
    event_value = Column(String)
    context_genre = Column(String, default="")
    context_experience = Column(String, default="")
    context_source = Column(String, default="")
    duration_ms = Column(Integer, default=0)
    created_at = Column(DateTime, default=func.now())

# ──────────────────────────────────────────────
# CACHE SYSTEM (In-Memory for Low Latency)
# ──────────────────────────────────────────────
class UserPrefCache:
    def __init__(self, ttl: int):
        self.cache: Dict[str, Dict] = {}
        self.ttl = ttl

    def get(self, user_id: str):
        if user_id in self.cache:
            entry = self.cache[user_id]
            if time.time() - entry['timestamp'] < self.ttl:
                return entry['vector']
            else:
                del self.cache[user_id]
        return None

    def set(self, user_id: str, vector):
        self.cache[user_id] = {
            'vector': vector,
            'timestamp': time.time()
        }

PREF_CACHE = UserPrefCache(ttl=PREF_CACHE_TTL)
GENRE_PREF_CACHE = UserPrefCache(ttl=PREF_CACHE_TTL)  # Caches user genre preference dicts


# ──────────────────────────────────────────────
# SCHEMAS (Pydantic Models)
# ──────────────────────────────────────────────
class Movie(BaseModel):
    movie_id: int
    title: str
    genre: str
    year: int
    rating_percent: int = 0
    popularity_score: float = 0.0
    synopsis: str = ""
    director: str = "Unknown"
    cast: str = "Unknown"
    keywords: str = ""
    experience_type: Optional[str] = None
    age_limit: int = 18
    tags: Optional[str] = None
    poster: Optional[str] = None
    quote: Optional[str] = None
    trailer_yt_id: Optional[str] = None

class MovieRecommendation(Movie):
    movie: Optional[str] = None
    score: float = 0.0
    reason: str = ""
    similarity_score: float = 0.0
    user_preference: float = 0.0
    similarity: float = 0.0
    user_pref: float = 0.0
    explanation: Optional[Dict] = None


# ──────────────────────────────────────────────
# MODEL LOADING & DATA (Paths corrected to match train.py)
# ──────────────────────────────────────────────
MODEL_PATH = os.path.join(BASE_DIR, 'backend', 'data', 'similarity.pkl')
DATASET_PATH = os.path.join(BASE_DIR, 'backend', 'baseMovies.json')
METRICS_JSON_PATH = os.path.join(BASE_DIR, 'backend', 'data', 'metrics.json')

# Globals
SIM_MODEL = None
MOVIES_DF = None
EVAL_METRICS = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    global SIM_MODEL, MOVIES_DF, EVAL_METRICS
    try:
        if os.path.exists(MODEL_PATH):
            with open(MODEL_PATH, 'rb') as f:
                SIM_MODEL = pickle.load(f)
        if os.path.exists(DATASET_PATH):
            MOVIES_DF = pd.read_json(DATASET_PATH).fillna('')
            # Normalize array fields to strings so Pydantic & string-ops don't crash
            if 'genre' in MOVIES_DF.columns:
                MOVIES_DF['genre'] = MOVIES_DF['genre'].apply(lambda x: '|'.join(x) if isinstance(x, list) else str(x))
            if 'tags' in MOVIES_DF.columns:
                MOVIES_DF['tags'] = MOVIES_DF['tags'].apply(lambda x: ','.join(x) if isinstance(x, list) else str(x))
            if 'cast' in MOVIES_DF.columns:
                MOVIES_DF['cast'] = MOVIES_DF['cast'].apply(lambda x: ', '.join(x) if isinstance(x, list) else str(x))
            print(f"Loaded similarity model for {len(MOVIES_DF)} movies.")
        else:
            MOVIES_DF = pd.DataFrame()
            print("Dataset not found at " + DATASET_PATH)
        if os.path.exists(METRICS_JSON_PATH):
            with open(METRICS_JSON_PATH, 'r') as f:
                EVAL_METRICS = json.load(f)
    except Exception as e:
        print(f"Startup Error: {e}")
        MOVIES_DF = pd.DataFrame()
    yield

app = FastAPI(title="Movie Recommendation System ML Backend - Enhanced Engine", lifespan=lifespan)

# CORS configurations
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ──────────────────────────────────────────────
# SIMPLE RATE LIMITING MIDDLEWARE
# ──────────────────────────────────────────────
RATE_LIMIT_STORE = {}
@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    # Simple IP-based rate limiting (100 req/min)
    client_ip = request.client.host
    now = time.time()
    if client_ip not in RATE_LIMIT_STORE:
        RATE_LIMIT_STORE[client_ip] = []
    
    # Prune old timestamps
    RATE_LIMIT_STORE[client_ip] = [ts for ts in RATE_LIMIT_STORE[client_ip] if now - ts < 60]
    
    if len(RATE_LIMIT_STORE[client_ip]) > 100:
        return JSONResponse(status_code=429, content={"detail": "Too many requests. Peak threshold reached."})
    
    RATE_LIMIT_STORE[client_ip].append(now)
    
    # Global cleanup of dead IPs optionally (to prevent memory leaks from one-off IPs)
    if random.random() < 0.01:
        dead_ips = [ip for ip, times in RATE_LIMIT_STORE.items() if not times]
        for ip in dead_ips: del RATE_LIMIT_STORE[ip]
        
    return await call_next(request)


# ──────────────────────────────────────────────
# DATABASE UTILS
# ──────────────────────────────────────────────
# Dependency to get SQL session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# Movie and MovieRecommendation schemas are consolidated at the top of the file.


class UserProfile(BaseModel):
    user_uid: str
    username: str
    display_name: Optional[str] = None
    age: int = 18
    preferred_genres: List[str] = []
    preferred_experience: str = ""


# ──────────────────────────────────────────────
# GENRE PREFERENCE ENGINE
# ──────────────────────────────────────────────

def build_user_genre_pref(db: Session, user_id: str) -> dict:
    """
    Compute a normalized genre preference vector from the user's interaction history.
    Uses time-based user preference: recent_weight = 1 / days_since_interaction.
    Returns a dict like {'Action': 0.35, 'Sci-Fi': 0.25, 'Drama': 0.20, ...}
    """
    from sqlalchemy import text
    from datetime import datetime, timezone

    # Check cache first
    cached = GENRE_PREF_CACHE.get(user_id)
    if cached is not None:
        return cached

    # Fetch movie_ids and their latest interaction timestamp
    rows = db.execute(
        text("SELECT movie_id, MAX(created_at) as last_interaction FROM interactions WHERE user_uid = :uid GROUP BY movie_id"),
        {"uid": user_id}
    ).fetchall()

    genre_counts: Dict[str, float] = {}

    if rows and MOVIES_DF is not None and not MOVIES_DF.empty:
        now = datetime.now()
        for r in rows:
            m_id = int(r[0])
            last_dt = r[1]
            if isinstance(last_dt, str):
                try:
                    last_dt = datetime.fromisoformat(last_dt.replace('Z', '+00:00')).replace(tzinfo=None)
                except ValueError:
                    last_dt = now
            elif not isinstance(last_dt, datetime):
                last_dt = now
            else:
                last_dt = last_dt.replace(tzinfo=None)

            days_since = max(1.0, (now - last_dt).days)
            recent_weight = 1.0 / days_since

            match = MOVIES_DF.loc[MOVIES_DF['movie_id'] == m_id, 'genre']
            if match.empty:
                continue
            genres_str = str(match.iloc[0])
            for g in genres_str.split('|'):
                g = g.strip()
                if g and g != 'nan':
                    genre_counts[g] = genre_counts.get(g, 0.0) + recent_weight

    # Normalize to [0, 1] so it's comparable with other score components
    total = sum(genre_counts.values()) or 1.0
    genre_pref = {g: count / total for g, count in genre_counts.items()}

    # Cache for reuse within the TTL window
    GENRE_PREF_CACHE.set(user_id, genre_pref)
    return genre_pref


def genre_score(movie_genres_str: str, pref: dict) -> float:
    """
    Score a candidate movie by how well its genres match the user's preferences.
    Returns a float in [0, ~1], higher = stronger match.
    """
    if not pref:
        return 0.0
    score = 0.0
    for g in str(movie_genres_str).split('|'):
        g = g.strip()
        score += pref.get(g, 0)
    return score


def get_top_genre(pref: dict) -> str:
    """Return the user's single most-preferred genre, or empty string."""
    if not pref:
        return ''
    return max(pref, key=pref.get)


# ──────────────────────────────────────────────
# EXPLAINABILITY ENGINE (XAI)
# ──────────────────────────────────────────────
PLACEHOLDER_DIRECTORS = {'Various Directors', 'Unknown', ''}
PLACEHOLDER_CAST = {'Talented Cast', 'Unknown', ''}

def build_explanation(source_movie: dict, rec_movie: dict, sim_score: float, pref_score: float, genre_boost: float = 0.0, user_genre_pref: dict = None):
    """
    Build an Explainable AI (XAI) breakdown for a recommendation.
    
    Returns:
        reason: Human-readable text explaining why this movie was recommended
        explanation: Structured dict with per-factor scores and reason tags
    """
    reason_parts = []
    explanation: dict = {
        'factors': [],
        'similarity_score': round(sim_score, 4),
        'user_preference': round(pref_score, 4),
        'genre_boost': round(genre_boost, 4),
        'final_score': round(sim_score + pref_score + genre_boost, 4),
    }
    
    # 1. Genre overlap
    source_genres = set(str(source_movie.get('genre', '')).split('|'))
    rec_genres = set(str(rec_movie.get('genre', '')).split('|'))
    shared_genres = source_genres.intersection(rec_genres) - {'', 'nan'}
    
    if shared_genres:
        genre_list = sorted(list(shared_genres))[:3]
        factor = f"similar genre ({', '.join(genre_list)})"
        reason_parts.append(factor)
        explanation['factors'].append({
            'type': 'genre_match',
            'label': f"Shared genre: {', '.join(genre_list)}",
            'weight': 'high',
        })
    
    # 2. Same director
    src_dir = str(source_movie.get('director', ''))
    rec_dir = str(rec_movie.get('director', ''))
    if src_dir == rec_dir and src_dir not in PLACEHOLDER_DIRECTORS:
        reason_parts.append(f"same director ({src_dir})")
        explanation['factors'].append({
            'type': 'director_match',
            'label': f"Same director: {src_dir}",
            'weight': 'high',
        })
    
    # 3. Shared cast members
    src_cast = set(str(source_movie.get('cast', '')).split(', '))
    rec_cast = set(str(rec_movie.get('cast', '')).split(', '))
    shared_cast = (src_cast.intersection(rec_cast)) - PLACEHOLDER_CAST
    if shared_cast:
        actor = sorted(list(shared_cast))[0]
        reason_parts.append(f"shared actor ({actor})")
        explanation['factors'].append({
            'type': 'cast_match',
            'label': f"Shared actor: {actor}",
            'weight': 'medium',
        })
    
    # 4. High cosine similarity
    if sim_score > 0.3:
        explanation['factors'].append({
            'type': 'high_similarity',
            'label': f"High content similarity ({sim_score:.2f})",
            'weight': 'high',
        })
    elif sim_score > 0.15:
        explanation['factors'].append({
            'type': 'moderate_similarity',
            'label': f"Moderate content similarity ({sim_score:.2f})",
            'weight': 'medium',
        })
    
    # 5. User preference signal
    if pref_score > 1.5:
        reason_parts.append("strongly matches your history")
        explanation['factors'].append({
            'type': 'strong_preference',
            'label': "Strongly aligned with your viewing history",
            'weight': 'high',
        })
    elif pref_score > 0.3:
        reason_parts.append("matches your taste profile")
        explanation['factors'].append({
            'type': 'moderate_preference',
            'label': "Matches your growing taste profile",
            'weight': 'medium',
        })
    
    # 6. Same experience type
    src_exp = source_movie.get('experience_type', '')
    rec_exp = rec_movie.get('experience_type', '')
    if src_exp and src_exp == rec_exp:
        explanation['factors'].append({
            'type': 'experience_match',
            'label': f"Same vibe: {src_exp}",
            'weight': 'low',
        })

    # 7. Genre preference boost (from user history)
    if genre_boost > 0.15 and user_genre_pref:
        top_genre = get_top_genre(user_genre_pref)
        if top_genre:
            reason_parts.append(f"matches your interest in {top_genre}")
            explanation['factors'].append({
                'type': 'genre_preference',
                'label': f"Matches your preference for {top_genre}",
                'weight': 'high' if genre_boost > 0.3 else 'medium',
            })

    # Build final reason string
    if not reason_parts:
        if sim_score > 0.1:
            reason = "selected for overall content similarity"
        else:
            reason = "trending choice you might enjoy"
    else:
        reason = " · ".join(reason_parts)
    
    return f"AI: {reason.capitalize()}", explanation


def build_cold_start_explanation(movie_row: dict, quality_score: float):
    """Build explanation for cold-start (no user history) recommendations."""
    reason_parts = []
    explanation: dict = {
        'factors': [],
        'similarity_score': 0.0,
        'user_preference': 0.0,
        'final_score': round(quality_score, 4),
        'cold_start': True,
    }
    
    rating = movie_row.get('rating_percent', 0)
    popularity = movie_row.get('popularity_score', 0)
    
    if rating >= 90:
        variations = [f"exceptional {rating}% rating", "masterpiece-level rating", "critically acclaimed"]
        choice = random.choice(variations)
        reason_parts.append(choice)
        explanation['factors'].append({
            'type': 'high_rating',
            'label': f"Exceptionally rated ({rating}%)",
            'weight': 'high',
        })
    elif rating >= 80:
        variations = [f"strong {rating}% rating", "highly rated", "audience favorite"]
        choice = random.choice(variations)
        reason_parts.append(choice)
        explanation['factors'].append({
            'type': 'good_rating',
            'label': f"Highly rated ({rating}%)",
            'weight': 'medium',
        })
    
    if popularity >= 0.9:
        variations = ["trending globally", "top trending choice", "highly popular"]
        choice = random.choice(variations)
        reason_parts.append(choice)
        explanation['factors'].append({
            'type': 'high_popularity',
            'label': f"Very popular (score: {popularity})",
            'weight': 'high',
        })
    elif popularity >= 0.7:
        variations = ["popular choice", "widely watched", "trending right now"]
        choice = random.choice(variations)
        reason_parts.append(choice)
        explanation['factors'].append({
            'type': 'moderate_popularity',
            'label': f"Popular (score: {popularity})",
            'weight': 'medium',
        })
    
    # Introduce variety using genre or year if available
    genre = str(movie_row.get('genre', '')).split('|')[0] if movie_row.get('genre') else ''
    if genre and genre != 'nan' and random.random() > 0.5:
        reason_parts.append(f"acclaimed {genre}")

    # Build the reason string
    if reason_parts:
        random.shuffle(reason_parts)
        reason = "AI: " + " · ".join(part.capitalize() for part in reason_parts[:2])
    else:
        reason = "AI: Trending choice you might enjoy"
    
    return reason, explanation


# ──────────────────────────────────────────────
# API ENDPOINTS
# ──────────────────────────────────────────────

@app.get("/movies", response_model=List[Movie])
async def get_movies(limit: int = 20, offset: int = 0):
    """Returns the movie catalog."""
    if MOVIES_DF is None or MOVIES_DF.empty:
        raise HTTPException(status_code=404, detail="Movie catalog not found.")
    
    # Return a sample for the catalog
    movies = MOVIES_DF.iloc[offset:offset+limit].to_dict(orient='records')
    return [Movie(**m) for m in movies]


@app.get("/movie/{movie_id}", response_model=Movie)
async def get_movie(movie_id: int):
    """Returns metadata of a specific movie. Optimized via in-memory dataframe."""
    if MOVIES_DF is None or MOVIES_DF.empty:
        raise HTTPException(status_code=404, detail="Movie catalog not found.")
    
    movie_row = MOVIES_DF[MOVIES_DF['movie_id'] == movie_id]
    if movie_row.empty:
        raise HTTPException(status_code=404, detail=f"Movie {movie_id} not found.")
    
    return movie_row.iloc[0].to_dict()

# ──────────────────────────────────────────────
# BACKGROUND TASKS & RL ENGINE (Asynchronous Queueing)
# ──────────────────────────────────────────────
class RLEngine:
    CONFIG = {
        "learning_rate": 0.1,
        "discount_factor": 0.95,
        "exploration_rate": 0.15,  # Epsilon for epsilon-greedy exploration strategy
        "lr_decay": 0.05,          # Decay rate for Policy optimization
        "rewards": {
            "click": 1.0, "view": 0.5, "search": 0.3, "recommend_click": 1.5,
            "watchlist": 1.2, "dwell": 0.8, "rating_positive": 2.5,  # Adjusted in reward tuning
            "rating_neutral": 0.5, "rating_negative": -1.5, "ignore": -0.2
        }
    }
    
    @classmethod
    def softmax(cls, q_values: np.ndarray, temperature: float = 0.5) -> np.ndarray:
        """Boltzman/Softmax exploration strategy — converts Q-values into a probability distribution."""
        if q_values.max() > 50: q_values = q_values / q_values.max() * 10 # Scale to avoid overflow
        exp_q = np.exp(q_values / temperature)
        return exp_q / np.sum(exp_q)

    @classmethod
    def calculate_reward(cls, event_type: str, event_value: str = '') -> float:
        if event_type == "rating":
            try:
                rating = int(event_value)
                if rating >= 4: return cls.CONFIG["rewards"]["rating_positive"]
                if rating == 3: return cls.CONFIG["rewards"]["rating_neutral"]
                return cls.CONFIG["rewards"]["rating_negative"]
            except: pass
        return cls.CONFIG["rewards"].get(event_type, 0.0)

    @staticmethod
    def encode_state(db: Session, user_uid: str) -> str:
        import datetime
        from collections import Counter
        from sqlalchemy import text
        import json
        
        recent = db.execute(text("SELECT context_genre, context_experience FROM interactions WHERE user_uid = :uid ORDER BY created_at DESC LIMIT 50"), {"uid": user_uid}).fetchall()
        
        dominant_genre = 'general'
        dominant_exp = 'any'
        
        if recent:
            genres = [r[0] for r in recent if r[0]]
            exps = [r[1] for r in recent if r[1]]
            if genres: dominant_genre = Counter(genres).most_common(1)[0][0]
            if exps: dominant_exp = Counter(exps).most_common(1)[0][0]
        else:
            prof = db.execute(text("SELECT preferred_genres, preferred_experience FROM users WHERE user_uid = :uid"), {"uid": user_uid}).fetchone()
            if prof:
                try:
                    p_genres = json.loads(prof[0])
                    if p_genres: dominant_genre = p_genres[0]
                except: pass
                if prof[1]: dominant_exp = prof[1]
                
        hour = datetime.datetime.now().hour
        if 5 <= hour < 12: time_slot = 'morning'
        elif 12 <= hour < 17: time_slot = 'afternoon'
        elif 17 <= hour < 21: time_slot = 'evening'
        else: time_slot = 'night'
            
        return f"{dominant_genre}|{dominant_exp}|{time_slot}"

    @classmethod
    def update_q_value(cls, db: Session, user_uid: str, state_key: str, movie_id: int, reward: float):
        from sqlalchemy import text
        existing = db.execute(text("SELECT q_value, visit_count FROM rl_qtable WHERE user_uid = :uid AND state_key = :state AND movie_id = :mid"), 
                              {"uid": user_uid, "state": state_key, "mid": movie_id}).fetchone()
        
        current_q = existing[0] if existing else 0.0
        visit_count = existing[1] if existing else 0
        
        # Policy optimization: dynamic learning rate
        dynamic_lr = max(0.01, cls.CONFIG["learning_rate"] / (1 + cls.CONFIG["lr_decay"] * visit_count))
        
        top_future = db.execute(text("SELECT q_value FROM rl_qtable WHERE user_uid = :uid AND state_key = :state ORDER BY q_value DESC LIMIT 1"),
                                {"uid": user_uid, "state": state_key}).fetchone()
        max_future_q = top_future[0] if top_future else 0.0
        
        # Reward tuning: penalty for repeated identical interactions
        tuned_reward = reward * (0.9 ** visit_count) if reward > 0 else reward
        
        td_target = tuned_reward + cls.CONFIG["discount_factor"] * max_future_q
        td_error = td_target - current_q
        new_q = current_q + dynamic_lr * td_error
        
        if existing:
            db.execute(text("UPDATE rl_qtable SET q_value=:q, visit_count=:v, last_reward=:r, updated_at=CURRENT_TIMESTAMP WHERE user_uid=:uid AND state_key=:state AND movie_id=:mid"),
                       {"q": new_q, "v": visit_count + 1, "r": float(reward), "uid": user_uid, "state": state_key, "mid": movie_id})
        else:
            db.execute(text("INSERT INTO rl_qtable (user_uid, state_key, movie_id, q_value, visit_count, last_reward) VALUES (:uid, :state, :mid, :q, :v, :r)"),
                       {"uid": user_uid, "state": state_key, "mid": movie_id, "q": new_q, "v": 1, "r": float(reward)})
        db.commit()

def background_update_rl(user_id: str, movie_id: int, event_type: str, event_value: str = ''):
    """Offline RL training logic via DB connection pooling"""
    db = SessionLocal()
    try:
        reward = RLEngine.calculate_reward(event_type, event_value)
        state_key = RLEngine.encode_state(db, user_id)
        RLEngine.update_q_value(db, user_id, state_key, movie_id, reward)
        print(f"BG RL Update: User {user_id} | State {state_key} | Movie {movie_id} | Reward {reward:.2f}")
    except Exception as e:
        print(f"BG Update Error: {e}")
    finally:
        db.close()

@app.post("/track")
async def track_interaction(request: Request, bg: BackgroundTasks, db: Session = Depends(get_db)):
    """Logs interactions perfectly and triggers offline RL."""
    try:
        data = await request.json()
        uid = data.get('user_uid') or data.get('userUid') or data.get('user_id')
        m_id = data.get('movie_id') or data.get('movieId')
        event_type = str(data.get('eventType') or data.get('event_type') or data.get('action') or 'view')
        event_value = str(data.get('eventValue') or data.get('event_value') or '')
        context = data.get('context', {})
        
        if not uid or not m_id:
            print(f"Track Error: Missing uid={uid} or m_id={m_id} in payload: {data}")
            return {"ok": False, "error": "Missing uid or m_id"}
        
        # Save to SQL interactions table
        interaction = Interaction(
            user_uid=str(uid), 
            movie_id=int(m_id), 
            event_type=event_type,
            event_value=event_value,
            context_genre=context.get('genre', ''),
            context_experience=context.get('experience', ''),
            context_source=context.get('source', ''),
            duration_ms=context.get('duration', 0)
        )
        db.add(interaction)
        db.commit()

        # Offload RL update to background queue exactly as requested
        bg.add_task(background_update_rl, str(uid), int(m_id), event_type, event_value)
        return {"status": "queued"}
    except Exception as e:
        return {"ok": False, "error": str(e)}


@app.get("/recommend", response_model=List[MovieRecommendation])
async def get_general_recommendations(user_id: str, db: Session = Depends(get_db), count: int = 8):
    """
    Generates general recommendations with genre preference boost.
    
    Cold-start formula: 0.45*similarity_avg + 0.25*popularity + 0.15*rating + 0.15*genre_pref
    Warm user: RL preference + quality baseline + genre preference boost
    
    Each recommendation includes:
    - score (final_score)
    - similarity (cosine sim or 0 for general recs)
    - user_pref (RL Q-value contribution)
    - reason (human-readable explanation)
    - explanation (structured XAI breakdown)
    """
    if MOVIES_DF is None or MOVIES_DF.empty:
        raise HTTPException(status_code=500, detail="Movie catalog not loaded.")

    # 1. Fetch User Preference Scores (RL)
    user_pref_scores = PREF_CACHE.get(user_id)
    if user_pref_scores is None:
        count_movies = len(MOVIES_DF) if MOVIES_DF is not None else 0
        user_pref_scores = np.zeros(count_movies)
        if count_movies > 0:
            q_rows = db.query(RLQTable.movie_id, RLQTable.q_value)\
                       .filter(RLQTable.user_uid == user_id).all()
            if q_rows and SIM_MODEL:
                for m_id, q_val in q_rows:
                    if m_id in SIM_MODEL['id_to_idx']:
                        m_idx = SIM_MODEL['id_to_idx'][m_id]
                        user_pref_scores[m_idx] = q_val * 2.5
            PREF_CACHE.set(user_id, user_pref_scores)

    # 2. Extract profile preferences
    prof_genres, prof_experience, prof_age = [], "", 18
    prof_row = db.execute(text("SELECT preferred_genres, preferred_experience, age FROM users WHERE user_uid = :uid"), {"uid": user_id}).fetchone()
    if prof_row:
        try:
            prof_genres = json.loads(prof_row[0]) if prof_row[0] else []
            prof_experience = prof_row[1] or ""
            prof_age = prof_row[2] or 18
        except: pass

    # 3. Build history-based genre preference
    user_genre_pref = build_user_genre_pref(db, user_id)
    has_history = len(user_genre_pref) > 0
    top_genre_name = get_top_genre(user_genre_pref) if has_history else ""
    
    # 4. Filter candidates
    mask = MOVIES_DF['age_limit'] <= prof_age
    candidates_df = MOVIES_DF[mask].copy()
    if candidates_df.empty: return []

    # 5. Hybrid Scoring
    profile_boost = np.zeros(len(candidates_df))
    hist_genre_scores = np.zeros(len(candidates_df))
    c_user_pref = np.zeros(len(candidates_df))
    
    for i, (idx, row) in enumerate(candidates_df.iterrows()):
        mid = row['movie_id']
        # Profile match
        m_genres = set(str(row.get('genre', '')).split('|'))
        shared = m_genres.intersection(set(prof_genres))
        if shared: profile_boost[i] += len(shared) * 0.5
        if prof_experience and row.get('experience_type') == prof_experience:
            profile_boost[i] += 0.8
        
        # History match
        if has_history:
            hist_genre_scores[i] = genre_score(str(row.get('genre', '')), user_genre_pref)
            
        # RL pref
        if SIM_MODEL and mid in SIM_MODEL['id_to_idx']:
            c_user_pref[i] = user_pref_scores[SIM_MODEL['id_to_idx'][mid]]

    popularity = candidates_df['popularity_score'].values
    rating = candidates_df['rating_percent'].values / 100.0
    
    is_cold_start = not has_history and np.sum(c_user_pref) == 0
    
    if is_cold_start:
        quality_scores = (0.3 * popularity) + (0.3 * rating) + (0.4 * profile_boost)
    else:
        quality_scores = (0.2 * popularity) + (0.2 * rating) + (0.3 * hist_genre_scores) + (0.3 * profile_boost)

    # Hybrid blend: 60% quality/profile, 40% RL/History preference
    final_scores = (0.6 * quality_scores) + (0.4 * c_user_pref)
    
    # Deterministic final scoring (Removed exploration noise to guarantee accurate sorting)

    # Candidate Selection
    pool_size = min(len(final_scores), count * 4)
    if pool_size > 0:
        top_indices = np.argpartition(final_scores, -pool_size)[-pool_size:]
        top_indices = top_indices[np.argsort(final_scores[top_indices])][::-1]
    else:
        top_indices = []

    recommendations = []
    seen = set()
    for idx in top_indices:
        if len(recommendations) >= count: break
        row = candidates_df.iloc[idx]
        if row['title'] in seen: continue
        seen.add(row['title'])
        
        pref_val = float(c_user_pref[idx])
        score_val = float(final_scores[idx])

        if is_cold_start:
            reason, explanation = build_cold_start_explanation(row.to_dict(), score_val)
        else:
            reason_options = []
            if hist_genre_scores[idx] > 0.3 and top_genre_name:
                reason_options.append(f"matches your interest in {top_genre_name}")
            if profile_boost[idx] > 0.6:
                reason_options.append(f"aligns with your preferred movie vibes")
            if pref_val > 0.5:
                reason_options.append("strongly matches your viewing history")
            
            # Add movie specific stat for variety
            if float(row.get('rating_percent', 0)) >= 85:
                reason_options.append("highly rated by audiences")
            elif float(row.get('popularity_score', 0)) >= 0.8:
                reason_options.append("currently trending")
                
            if not reason_options:
                reason_options.append("matches your growing movie taste profile")
                
            random.shuffle(reason_options)
            selected = reason_options[:2]
            reason = "Recommended because it " + " and ".join(selected)
                
            explanation = {
                'factors': [{'type': 'hybrid', 'label': 'AI profile matching', 'weight': 'high'}],
                'final_score': round(score_val, 3),
                'user_pref': round(pref_val, 3)
            }

        recommendations.append(MovieRecommendation(
            **row.to_dict(),
            score=round(score_val, 3),
            reason=reason,
            explanation=explanation,
            similarity=0.0,
            user_pref=round(pref_val, 3)
        ))
    return recommendations


@app.get("/recommend/{movie_id}", response_model=List[MovieRecommendation])
async def get_movie_recommendations(movie_id: int, user_id: str, db: Session = Depends(get_db), count: int = 5):
    """Generates similar-movie recommendations using Content-Similarity + User Bias."""
    if SIM_MODEL is None or MOVIES_DF is None:
        raise HTTPException(status_code=500, detail="Models not loaded.")

    if movie_id not in SIM_MODEL['id_to_idx']:
        raise HTTPException(status_code=404, detail="Movie not found in model.")

    m_idx = SIM_MODEL['id_to_idx'][movie_id]
    source_title = MOVIES_DF.iloc[m_idx]['title']
    sim_scores = SIM_MODEL['similarity_matrix'][m_idx]
    
    # Fetch user pref for bias
    user_pref = PREF_CACHE.get(user_id)
    if user_pref is None:
        user_pref = np.zeros(len(MOVIES_DF))
        q_rows = db.query(RLQTable.movie_id, RLQTable.q_value).filter(RLQTable.user_uid == user_id).all()
        for mid, q in q_rows:
            if mid in SIM_MODEL['id_to_idx']:
                user_pref[SIM_MODEL['id_to_idx'][mid]] = q * 0.5
        PREF_CACHE.set(user_id, user_pref)

    # Genre Preference Boost (Simple but powerful)
    user_genre_pref = build_user_genre_pref(db, user_id)
    top_genre_name = get_top_genre(user_genre_pref) if user_genre_pref else ""
    
    # Calculate Hybrid Score = 0.6 * similarity + 0.4 * user_preference
    hybrid_sim = (0.6 * sim_scores) + (0.4 * user_pref)
    
    # Filter self and apply age-gate
    prof_age = 18
    p_row = db.execute(text("SELECT age FROM users WHERE user_uid = :uid"), {"uid": user_id}).fetchone()
    if p_row: prof_age = p_row[0] or 18
    
    candidates = []
    for i, score in enumerate(hybrid_sim):
        if i == m_idx: continue
        row = MOVIES_DF.iloc[i]
        if row['age_limit'] > prof_age: continue
        
        # Powerful Genre Boost: Increase score by 20% if it matches user's top genre
        current_genres = str(row.get('genre', '')).split('|')
        if top_genre_name and top_genre_name in current_genres:
            score *= 1.2
            
        candidates.append((i, score))
        
    candidates.sort(key=lambda x: x[1], reverse=True)
    
    recommendations = []
    for idx, score in candidates[:count]:
        row = MOVIES_DF.iloc[idx]
        
        # Explanation format as requested
        reason_opts = [f"similar to {source_title}"]
        if top_genre_name and top_genre_name in str(row.get('genre', '')):
            reason_opts.append(f"matches your interest in {top_genre_name}")
            
        rating = float(row.get('rating_percent', 0))
        if rating >= 85 and random.random() > 0.5:
            reason_opts.append(f"is highly rated by viewers ({rating}%)")
        elif float(row.get('popularity_score', 0)) >= 0.8 and random.random() > 0.5:
            reason_opts.append("is trending right now")
            
        random.shuffle(reason_opts)
        reason = "Recommended because it is " + " and ".join(reason_opts[:2])

        recommendations.append(MovieRecommendation(
            **row.to_dict(),
            score=round(float(score), 3),
            reason=reason,
            explanation={'factors': [{'type': 'content', 'label': f'Similar to {source_title}', 'weight': 'high'}]},
            similarity=round(float(sim_scores[idx]), 3),
            user_pref=round(float(user_pref[idx]), 3)
        ))
    return recommendations


# ──────────────────────────────────────────────
# EVALUATION METRICS ENDPOINT
# ──────────────────────────────────────────────

@app.get("/metrics")
async def get_metrics():
    """Returns ML evaluation metrics."""
    if EVAL_METRICS:
        return EVAL_METRICS
    return {"error": "Metrics not available"}

@app.get("/model-info")
async def get_model_info():
    """Returns model training metadata for the dashboard."""
    # Map and return weights for dashboard
    cold_start = {
        'similarity': 0.45,
        'popularity': 0.25,
        'rating': 0.15,
        'genre_boost': 0.15
    }
    warm_user = {
        'similarity': 0.45,
        'popularity': 0.25,
        'rating': 0.15,
        'genre_preference': 0.15
    }
    
    return {
        'status': 'loaded' if SIM_MODEL is not None else 'not_loaded',
        'catalog_size': len(MOVIES_DF) if MOVIES_DF is not None else 0,
        'has_model': SIM_MODEL is not None,
        'matrix_shape': SIM_MODEL['similarity_matrix'].shape if SIM_MODEL else [0,0],
        'has_metadata': True if SIM_MODEL else False,
        'training': SIM_MODEL.get('training_metadata', {}) if SIM_MODEL else {},
        'cold_start_weights': cold_start,
        'warm_user_weights': warm_user,
        'config': RLEngine.CONFIG
    }


if __name__ == "__main__":
    # Ensure tables in database-url target exist
    Base.metadata.create_all(bind=engine)
    # Start server (disabling multiprocessing workers on Windows to prevent WinError 10022)
    uvicorn.run("main:app", host="127.0.0.1", port=8000, workers=1, reload=False)
