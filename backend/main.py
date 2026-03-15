"""
UniVibe — FastAPI ML Backend (Enhanced)
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
from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, UniqueConstraint, func
from sqlalchemy.orm import sessionmaker, declarative_base, Session
from sqlalchemy.pool import QueuePool

# ──────────────────────────────────────────────
# CONFIGURATION & SCALING SETTINGS
# ──────────────────────────────────────────────
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
# PostgreSQL ready (Use env variable for production)
DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{os.path.join(BASE_DIR, 'backend', 'data', 'univibe.db')}")

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
# MODEL LOADING & DATA
# ──────────────────────────────────────────────
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_PATH = os.path.join(BASE_DIR, 'backend', 'data', 'univibe.db')
MODEL_PATH = os.path.join(BASE_DIR, 'models', 'similarity.pkl')
DATASET_PATH = os.path.join(BASE_DIR, 'ml', 'dataset.csv')
METRICS_PATH = os.path.join(BASE_DIR, 'models', 'metrics.pkl')
METRICS_JSON_PATH = os.path.join(BASE_DIR, 'models', 'metrics.json')

# Globals to hold our models
SIM_MODEL = None
MOVIES_DF = None
EVAL_METRICS = None
COLLAB_MODEL = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Load model, dataset, and metrics on startup (Immutable in memory)
    global SIM_MODEL, MOVIES_DF, EVAL_METRICS, COLLAB_MODEL
    try:
        if os.path.exists(MODEL_PATH):
            with open(MODEL_PATH, 'rb') as f:
                SIM_MODEL = pickle.load(f)
        if os.path.exists(DATASET_PATH):
            MOVIES_DF = pd.read_csv(DATASET_PATH)
            print(f"Loaded similarity model for {len(MOVIES_DF)} movies.")
        else:
            MOVIES_DF = pd.DataFrame()
            print("Dataset not found. Initializing empty catalog.")
        # Load evaluation metrics
        if os.path.exists(METRICS_JSON_PATH):
            with open(METRICS_JSON_PATH, 'r') as f:
                EVAL_METRICS = json.load(f)
            print(f"Loaded evaluation metrics: Precision@{EVAL_METRICS.get('k', 5)} = {EVAL_METRICS.get('precision_k', 'N/A')}")
        elif os.path.exists(METRICS_PATH):
            with open(METRICS_PATH, 'rb') as f:
                EVAL_METRICS = pickle.load(f)
            print(f"Loaded evaluation metrics (pkl)")
            
        collab_path = os.path.join(BASE_DIR, 'models', 'collaborative.pkl')
        if os.path.exists(collab_path):
            with open(collab_path, 'rb') as f:
                COLLAB_MODEL = pickle.load(f)
            print("Loaded Collaborative Filtering model.")
    except Exception as e:
        print(f"Startup Error: {e}")
        MOVIES_DF = pd.DataFrame()
    yield
    # No dynamic cleanup needed for this model size

app = FastAPI(title="UniVibe ML Backend — Enhanced Engine", lifespan=lifespan)

# CORS configurations
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
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
        return HTTPException(status_code=429, detail="Too many requests. Peak threshold reached.")
    
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


# ──────────────────────────────────────────────
# SCHEMAS (Pydantic Models)
# ──────────────────────────────────────────────
class Movie(BaseModel):
    movie_id: int
    title: str
    genre: str
    year: int
    rating_percent: int
    popularity_score: float
    synopsis: str
    director: str = "Unknown"
    cast: str = "Unknown"
    keywords: str = ""


class MovieRecommendation(Movie):
    movie: Optional[str] = None
    score: float
    reason: str
    similarity_score: float = 0.0
    user_preference: float = 0.0
    similarity: float = 0.0
    user_pref: float = 0.0
    explanation: Optional[Dict] = None


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
    
    return f"🤖 {reason.capitalize()}", explanation


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
        reason_parts.append("masterpiece-level rating")
        explanation['factors'].append({
            'type': 'high_rating',
            'label': f"Exceptionally rated ({rating}%)",
            'weight': 'high',
        })
    elif rating >= 80:
        reason_parts.append("highly rated")
        explanation['factors'].append({
            'type': 'good_rating',
            'label': f"Highly rated ({rating}%)",
            'weight': 'medium',
        })
    
    if popularity >= 0.9:
        reason_parts.append("trending globally")
        explanation['factors'].append({
            'type': 'high_popularity',
            'label': f"Very popular (score: {popularity})",
            'weight': 'high',
        })
    elif popularity >= 0.7:
        reason_parts.append("popular choice")
        explanation['factors'].append({
            'type': 'moderate_popularity',
            'label': f"Popular (score: {popularity})",
            'weight': 'medium',
        })
    
    if not reason_parts:
        reason = "Why recommended:\n• Recommended to get you started"
    else:
        reason = "Why recommended:\n" + "\n".join(f"• {part.capitalize()}" for part in reason_parts)
    
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
        
        if not uid or not m_id: return {"ok": False, "error": "Missing uid or m_id"}
        
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

    # 1. Fetch User Preference Scores (From Cache or DB)
    user_pref_scores = PREF_CACHE.get(user_id)
    
    if user_pref_scores is None:
        count_movies = len(MOVIES_DF) if MOVIES_DF is not None else 0
        user_pref_scores = np.zeros(count_movies)
        
        if count_movies > 0:
            q_rows = db.query(RLQTable.movie_id, RLQTable.q_value).filter(RLQTable.user_uid == user_id).all()
            
            if q_rows and SIM_MODEL:
                for m_id, q_val in q_rows:
                    if m_id in SIM_MODEL['id_to_idx']:
                        m_idx = SIM_MODEL['id_to_idx'][m_id]
                        if m_idx < count_movies:
                            user_pref_scores[m_idx] = q_val * 2.5
            
            PREF_CACHE.set(user_id, user_pref_scores)
            
    # Combine Collaborative Filtering (SVD) with RL user preference
    if COLLAB_MODEL is not None and user_id in COLLAB_MODEL['users']:
        try:
            user_idx = COLLAB_MODEL['users'].index(user_id)
            user_factors = COLLAB_MODEL['user_factors'][user_idx]
            item_factors = COLLAB_MODEL['item_factors']
            collab_preds = np.dot(user_factors, item_factors)
            
            collab_scores = np.zeros_like(user_pref_scores)
            movie_ids = COLLAB_MODEL['movies']
            for i, m_id in enumerate(movie_ids):
                if SIM_MODEL and m_id in SIM_MODEL['id_to_idx']:
                    m_idx = SIM_MODEL['id_to_idx'][m_id]
                    collab_scores[m_idx] = collab_preds[i]
                    
            if collab_scores.max() > 0:
                collab_scores = collab_scores / collab_scores.max()
                
            user_pref_scores += collab_scores * 2.5
        except Exception as e:
            print(f"Collab Filtering Error: {e}")
            
    
    if MOVIES_DF is None or MOVIES_DF.empty:
        raise HTTPException(status_code=500, detail="Dataframe empty")
    
    # 2. Build user genre preference vector from interaction history
    user_genre_pref = build_user_genre_pref(db, user_id)
    has_genre_pref = len(user_genre_pref) > 0
    top_genre = get_top_genre(user_genre_pref) if has_genre_pref else ''
    
    # 3. Compute per-movie genre preference scores
    genre_pref_scores = np.array([
        genre_score(str(row.get('genre', '')), user_genre_pref)
        for _, row in MOVIES_DF.iterrows()
    ]) if has_genre_pref else np.zeros(len(MOVIES_DF))
    
    # Determine If Cold Start (no interaction history)
    is_cold_start = np.sum(user_pref_scores) == 0 and not has_genre_pref

    # 4. Compute quality scores with genre preference boost
    if is_cold_start and SIM_MODEL is not None:
        # Cold-Start: 0.5*avg_similarity + 0.3*popularity + 0.2*rating (no genre pref yet)
        sim_matrix = SIM_MODEL['similarity_matrix']
        avg_sims = np.mean(sim_matrix, axis=1)
        
        popularity_scores = MOVIES_DF['popularity_score'].values
        rating_scores = MOVIES_DF['rating_percent'].values / 100.0
        
        quality_scores = (0.5 * avg_sims) + (0.3 * popularity_scores) + (0.2 * rating_scores)
    elif has_genre_pref and SIM_MODEL is not None:
        # Warm user WITH genre history: blend all four signals
        # 0.45*similarity_avg + 0.25*popularity + 0.15*rating + 0.15*genre_pref
        sim_matrix = SIM_MODEL['similarity_matrix']
        avg_sims = np.mean(sim_matrix, axis=1)
        
        popularity_scores = MOVIES_DF['popularity_score'].values
        rating_scores = MOVIES_DF['rating_percent'].values / 100.0
        
        quality_scores = (
            0.45 * avg_sims +
            0.25 * popularity_scores +
            0.15 * rating_scores +
            0.15 * genre_pref_scores
        )
    else:
        # Warm user without genre history
        quality_scores = (MOVIES_DF['popularity_score'].values * 0.7) + (MOVIES_DF['rating_percent'].values / 100.0 * 0.3)

    # 5. Final Hybrid Score = Hybrid Recommender (0.7 * Content/Similarity + 0.3 * User Preference)
    final_scores = (0.7 * quality_scores) + (0.3 * user_pref_scores)
    
    # Exploration strategy (epsilon-greedy)
    if not is_cold_start and random.random() < RLEngine.CONFIG["exploration_rate"]:
        # Boost randomly selected items for exploration
        exploration_boost = np.random.uniform(0, 0.5, size=len(final_scores))
        final_scores += exploration_boost

    # Get a pool of candidates
    pool_size = min(len(final_scores), count * 5)
    if pool_size > 0:
        candidate_indices = np.argpartition(final_scores, -pool_size)[-pool_size:]
        candidate_indices = candidate_indices[np.argsort(final_scores[candidate_indices])][::-1].tolist()
    else:
        candidate_indices = []

    # Recommendation diversity using Maximal Marginal Relevance (MMR)
    top_indices = []
    diversity_weight = 0.4
    sim_matrix = SIM_MODEL.get('similarity_matrix') if SIM_MODEL else None

    while len(top_indices) < count and candidate_indices:
        best_idx = -1
        best_mmr_score = -float('inf')
        
        for idx in candidate_indices:
            base_score = final_scores[idx]
            diversity_penalty = 0.0
            
            if top_indices and sim_matrix is not None:
                similarities = [sim_matrix[idx][s_idx] for s_idx in top_indices]
                if similarities:
                    diversity_penalty = max(similarities)
                
            mmr_score = base_score - (diversity_weight * diversity_penalty)
            
            if mmr_score > best_mmr_score:
                best_mmr_score = mmr_score
                best_idx = idx
                
        if best_idx == -1: break
        candidate_indices.remove(best_idx)
        top_indices.append(best_idx)

    indices = top_indices
    recommendations = []
    for idx in indices:
        movie_row = MOVIES_DF.iloc[idx].to_dict()
        pref_score = float(user_pref_scores[idx])
        quality = float(quality_scores[idx])
        g_boost = float(genre_pref_scores[idx]) if has_genre_pref else 0.0
        
        # Explainability
        if is_cold_start:
            reason, explanation = build_cold_start_explanation(movie_row, quality)
        else:
            from sqlalchemy import text
            # Fetch recent watched for UI
            recent_watched_titles = []
            recent_rows = db.execute(
                text("SELECT movie_id FROM interactions WHERE user_uid = :uid ORDER BY created_at DESC LIMIT 10"),
                {"uid": user_id}
            ).fetchall()
            for r in recent_rows:
                m_id = r[0]
                match = MOVIES_DF[MOVIES_DF['movie_id'] == m_id]
                if not match.empty:
                    t = match.iloc[0]['title']
                    if t not in recent_watched_titles:
                        recent_watched_titles.append(t)
                if len(recent_watched_titles) >= 2:
                    break
            if len(recent_watched_titles) > 0:
                similar_to = recent_watched_titles[0]
                reason = f"Why recommended:\n• Similar to {similar_to}"
                if top_genre:
                    reason += f"\n• Popular among {top_genre} fans"
            else:
                reason = "Why recommended:\n• Matches your taste profile"
                if top_genre:
                    reason += f"\n• Popular among {top_genre} fans"
            
            explanation = {
                'factors': [],
                'similarity_score': round(float(quality), 4),
                'user_preference': round(pref_score, 4),
                'genre_boost': round(g_boost, 4),
                'final_score': round(float(final_scores[idx]), 4),
                'cold_start': False,
            }
            if pref_score > 0.5:
                explanation['factors'].append({
                    'type': 'user_preference',
                    'label': f"Your RL model preference score: {pref_score:.2f}",
                    'weight': 'high' if pref_score > 1.5 else 'medium',
                })
            if g_boost > 0.15 and top_genre:
                explanation['factors'].append({
                    'type': 'genre_preference',
                    'label': f"Matches your preference for {top_genre}",
                    'weight': 'high' if g_boost > 0.3 else 'medium',
                })
            explanation['factors'].append({
                'type': 'quality_baseline',
                'label': f"Quality baseline: {quality:.2f}",
                'weight': 'medium',
            })

        rec = {
            **movie_row,
            "movie": movie_row.get("title", ""),
            "score": round(float(final_scores[idx]), 4),
            "similarity_score": 0.0,
            "similarity": 0.0,
            "user_preference": round(pref_score, 4),
            "user_pref": round(pref_score, 4),
            "reason": reason,
            "explanation": explanation,
        }
        recommendations.append(MovieRecommendation(**rec))

    return recommendations


@app.get("/recommend/{movie_id}", response_model=List[MovieRecommendation])
async def get_movie_recommendations(movie_id: int, user_id: str, db: Session = Depends(get_db), count: int = 5):
    """
    Generates similar-movie recommendations using:
    1. Content-based similarity matrix (TF-IDF + cosine similarity)
    2. Reinforcement learning user preferences
    3. Genre preference boost from user history
    
    Hybrid Score = similarity + user_pref + genre_boost
    
    Each recommendation returns:
    - movie metadata
    - score (final hybrid score)
    - similarity (cosine similarity)
    - user_pref (RL preference)
    - reason (human-readable XAI)
    - explanation (structured XAI with per-factor breakdown)
    """
    if SIM_MODEL is None or MOVIES_DF is None:
        raise HTTPException(status_code=500, detail="Models not loaded.")

    if movie_id not in SIM_MODEL['id_to_idx']:
        raise HTTPException(status_code=404, detail=f"Movie {movie_id} not in similarity model.")

    movie_idx = SIM_MODEL['id_to_idx'][movie_id]
    
    # 1. Content-based Similarity (Cosine Scores)
    sim_scores = SIM_MODEL['similarity_matrix'][movie_idx]
    
    # 2. Reinforcement Learning Preference Vector (Cached)
    user_pref_scores = PREF_CACHE.get(user_id)
    if user_pref_scores is None:
        count_movies = len(MOVIES_DF) if MOVIES_DF is not None else 0
        user_pref_scores = np.zeros(count_movies)
        q_rows = db.query(RLQTable.movie_id, RLQTable.q_value).filter(RLQTable.user_uid == user_id).all()
        if q_rows and count_movies > 0:
            for m_id, q_val in q_rows:
                if m_id in SIM_MODEL['id_to_idx']:
                    m_idx = SIM_MODEL['id_to_idx'][m_id]
                    if m_idx < count_movies:
                        user_pref_scores[m_idx] = q_val * 0.2
        PREF_CACHE.set(user_id, user_pref_scores)

    user_genre_pref = build_user_genre_pref(db, user_id)
    has_genre_pref = len(user_genre_pref) > 0
    top_genre = get_top_genre(user_genre_pref) if has_genre_pref else ''
    
    genre_boost_scores = np.array([
        genre_score(str(MOVIES_DF.iloc[i].get('genre', '')), user_genre_pref) * 0.15
        for i in range(len(MOVIES_DF))
    ]) if has_genre_pref else np.zeros(len(sim_scores))

    # 4. Calculate Hybrid Score = 0.7*similarity + 0.3*user_pref (+ genre boost if relevant)
    n = len(sim_scores)
    pref = user_pref_scores[:n] if len(user_pref_scores) >= n else np.pad(user_pref_scores, (0, n - len(user_pref_scores)))
    g_boost = genre_boost_scores[:n] if len(genre_boost_scores) >= n else np.pad(genre_boost_scores, (0, n - len(genre_boost_scores)))
    
    hybrid_scores = (0.7 * sim_scores) + (0.3 * pref) + g_boost
    
    # Get a pool of candidates to select diverse recommendations from
    pool_size = min(len(hybrid_scores), count * 5)
    if pool_size > 0:
        candidate_indices = np.argpartition(hybrid_scores, -pool_size)[-pool_size:]
        candidate_indices = candidate_indices[np.argsort(hybrid_scores[candidate_indices])][::-1].tolist()
    else:
        candidate_indices = []
        
    if movie_idx in candidate_indices:
        candidate_indices.remove(movie_idx)
    
    top_recommendations = []
    selected_indices = []
    source_movie = MOVIES_DF.iloc[movie_idx].to_dict()
    diversity_weight = 0.5
    
    while len(top_recommendations) < count and candidate_indices:
        best_idx = -1
        best_mmr_score = -float('inf')
        
        for idx in candidate_indices:
            base_score = hybrid_scores[idx]
            diversity_penalty = 0.0
            
            if selected_indices:
                similarities = [SIM_MODEL['similarity_matrix'][idx][s_idx] for s_idx in selected_indices]
                diversity_penalty = max(similarities) if similarities else 0.0
                
            mmr_score = base_score - (diversity_weight * diversity_penalty)
            
            if mmr_score > best_mmr_score:
                best_mmr_score = mmr_score
                best_idx = idx
                
        if best_idx == -1:
            break
            
        candidate_indices.remove(best_idx)
        selected_indices.append(best_idx)
        idx = best_idx
        
        movie_row = MOVIES_DF.iloc[idx].to_dict()
        score = float(hybrid_scores[idx])
        sim_score = float(sim_scores[idx])
        pref_score = float(pref[idx])
        g_score_val = float(g_boost[idx])
        
        # Build XAI explanation with genre boost info
        explanation_reason, explanation = build_explanation(
            source_movie, movie_row, sim_score, pref_score,
            genre_boost=g_score_val, user_genre_pref=user_genre_pref
        )
        explanation['genre_boost'] = round(g_score_val, 4)
        
        # Override with UI requested exact format
        reason = f"Why recommended:\n• Similar to {source_movie.get('title', 'this movie')}"
        if top_genre:
            reason += f"\n• Popular among {top_genre} fans"
            
        rec = {
            **movie_row,
            "movie": movie_row.get("title", ""),
            "score": round(best_mmr_score, 4), # using the diverse score for display
            "similarity_score": round(sim_score, 4),
            "similarity": round(sim_score, 4),
            "user_preference": round(pref_score, 4),
            "user_pref": round(pref_score, 4),
            "reason": reason,
            "explanation": explanation,
        }
        top_recommendations.append(MovieRecommendation(**rec))
            
    return top_recommendations


# ──────────────────────────────────────────────
# EVALUATION METRICS ENDPOINT
# ──────────────────────────────────────────────

@app.get("/metrics")
async def get_metrics():
    """
    Returns comprehensive ML evaluation metrics.
    
    Response includes:
    - precision_k: Precision at K
    - recall_k: Recall at K
    - hit_rate_k: Hit Rate at K
    - mrr: Mean Reciprocal Rank
    - ndcg_k: Normalized Discounted Cumulative Gain at K
    - coverage: Catalog coverage ratio
    - avg_similarity: Mean similarity of top-K recommendations
    - k: The K value used
    - num_movies: Number of movies in the catalog
    - model_info: Training metadata (if available)
    """
    if EVAL_METRICS:
        response = {**EVAL_METRICS}
        # Add model info if available
        if SIM_MODEL and 'model_info' in SIM_MODEL:
            response['model_info'] = SIM_MODEL['model_info']
        return response
    
    # Fallback: try to load from file
    try:
        if os.path.exists(METRICS_JSON_PATH):
            with open(METRICS_JSON_PATH, 'r') as f:
                return json.load(f)
        elif os.path.exists(METRICS_PATH):
            with open(METRICS_PATH, 'rb') as f:
                return pickle.load(f)
    except:
        pass
    
    return {"error": "Metrics not computed yet. Run: python -m ml.model_evaluator"}


@app.get("/model-info")
async def get_model_info():
    """
    Returns model training information and configuration.
    Useful for ML transparency and debugging.
    """
    info = {
        'status': 'loaded' if SIM_MODEL else 'not_loaded',
        'catalog_size': len(MOVIES_DF) if MOVIES_DF is not None else 0,
    }
    
    if SIM_MODEL:
        if 'model_info' in SIM_MODEL:
            info['training'] = SIM_MODEL['model_info']
        info['matrix_shape'] = list(SIM_MODEL['similarity_matrix'].shape) if SIM_MODEL.get('similarity_matrix') is not None else None
        info['has_metadata'] = 'metadata' in SIM_MODEL
    
    if EVAL_METRICS:
        info['evaluation'] = EVAL_METRICS
    
    info['cold_start_weights'] = {
        'similarity': 0.5,
        'popularity': 0.3,
        'rating': 0.2,
    }
    
    info['warm_user_weights'] = {
        'similarity': 0.45,
        'popularity': 0.25,
        'rating': 0.15,
        'genre_preference': 0.15,
    }
    
    info['rl_config'] = RLEngine.CONFIG
    
    return info


if __name__ == "__main__":
    # Ensure tables in database-url target exist
    Base.metadata.create_all(bind=engine)
    # Start server with scaling-ready settings using multiple workers
    import multiprocessing
    workers = min(4, multiprocessing.cpu_count())
    uvicorn.run("main:app", host="127.0.0.1", port=8000, workers=workers, reload=False)
