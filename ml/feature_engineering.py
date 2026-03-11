"""
UniVibe — Feature Engineering Pipeline
=======================================
Transforms raw movie metadata into rich feature vectors for similarity computation.

Pipeline: raw movie JSON → cleaned text features → combined feature column → CSV dataset
"""

import json
import re
import os
import string
import pandas as pd
import numpy as np

# ──────────────────────────────────────────────
# STOPWORDS (minimal built-in list to avoid NLTK dependency)
# ──────────────────────────────────────────────
STOPWORDS = set([
    'i', 'me', 'my', 'myself', 'we', 'our', 'ours', 'ourselves', 'you', 'your',
    'yours', 'yourself', 'yourselves', 'he', 'him', 'his', 'himself', 'she', 'her',
    'hers', 'herself', 'it', 'its', 'itself', 'they', 'them', 'their', 'theirs',
    'themselves', 'what', 'which', 'who', 'whom', 'this', 'that', 'these', 'those',
    'am', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had',
    'having', 'do', 'does', 'did', 'doing', 'a', 'an', 'the', 'and', 'but', 'if',
    'or', 'because', 'as', 'until', 'while', 'of', 'at', 'by', 'for', 'with',
    'about', 'against', 'between', 'through', 'during', 'before', 'after', 'above',
    'below', 'to', 'from', 'up', 'down', 'in', 'out', 'on', 'off', 'over', 'under',
    'again', 'further', 'then', 'once', 'here', 'there', 'when', 'where', 'why',
    'how', 'all', 'both', 'each', 'few', 'more', 'most', 'other', 'some', 'such',
    'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 's',
    't', 'can', 'will', 'just', 'don', 'should', 'now', 'd', 'll', 'm', 'o', 're',
    've', 'y', 'ain', 'aren', 'couldn', 'didn', 'doesn', 'hadn', 'hasn', 'haven',
    'isn', 'ma', 'mightn', 'mustn', 'needn', 'shan', 'shouldn', 'wasn', 'weren',
    'won', 'wouldn',
])


def clean_text(text: str) -> str:
    """
    Clean and normalize text for feature engineering.
    - Lowercase
    - Remove punctuation
    - Remove stopwords
    - Normalize spacing
    """
    if not text or not isinstance(text, str):
        return ''

    # Lowercase
    text = text.lower()

    # Remove punctuation
    text = text.translate(str.maketrans('', '', string.punctuation))

    # Normalize whitespace
    text = re.sub(r'\s+', ' ', text).strip()

    # Remove stopwords
    words = text.split()
    words = [w for w in words if w not in STOPWORDS and len(w) > 1]

    return ' '.join(words)


def extract_decade(year: int) -> str:
    """Convert release year to decade bucket for feature grouping."""
    if not year or year < 1900:
        return 'unknown'
    decade = (year // 10) * 10
    return f'{decade}s'


def build_combined_features(movie: dict) -> str:
    """
    Combine multiple movie attributes into a single feature string.

    Uses:
    - genre (repeated 3x for emphasis)
    - experience_type (repeated 2x)
    - synopsis/overview
    - tags (cult, underrated, family-safe)
    - release decade
    - rating tier (excellent, good, average, below_average)
    - popularity tier
    """
    parts = []

    # Genre features (high weight — repeat 3x)
    genres = movie.get('genre', [])
    if isinstance(genres, list):
        genre_text = ' '.join(genres)
        parts.extend([genre_text] * 3)
    elif isinstance(genres, str):
        parts.extend([genres] * 3)

    # Experience type (repeat 2x for emphasis)
    experience = movie.get('experience_type', '')
    if experience:
        parts.extend([experience] * 2)

    # Director (repeat 4x for high authority similarity)
    director = movie.get('director', '')
    if director:
        # Normalize director name (remove spaces to keep 'christophernolan' as a single token)
        norm_director = director.lower().replace(' ', '').replace(',', ' ')
        parts.extend([norm_director] * 4)

    # Cast (repeat 2x)
    cast = movie.get('cast', '')
    if cast:
        # Normalize cast names
        norm_cast = cast.lower().replace(' ', '').replace(',', ' ')
        parts.extend([norm_cast] * 2)

    # Keywords / Tags
    keywords = movie.get('keywords', '')
    if keywords:
        parts.append(clean_text(keywords))

    # Synopsis / overview
    synopsis = movie.get('synopsis', '')
    if synopsis:
        parts.append(clean_text(synopsis))

    # Tags (cult, underrated, family-safe)
    tags = movie.get('tags', [])
    if isinstance(tags, list) and tags:
        parts.append(' '.join(tags))

    # Release decade
    year = movie.get('year', 0)
    if year:
        parts.append(extract_decade(year))

    # Rating tier
    rating = movie.get('rating_percent', 0)
    if rating >= 90:
        parts.append('excellent masterpiece high_quality')
    elif rating >= 80:
        parts.append('good highly_rated')
    elif rating >= 70:
        parts.append('average decent')
    else:
        parts.append('below_average')

    # Popularity tier
    popularity = movie.get('popularity_score', 0)
    if popularity >= 0.9:
        parts.append('blockbuster mainstream popular trending')
    elif popularity >= 0.7:
        parts.append('popular known')
    else:
        parts.append('niche indie hidden_gem')

    # Age limit context
    age_limit = movie.get('age_limit', 0)
    if age_limit == 0:
        parts.append('family_friendly all_ages kids_safe')
    elif age_limit >= 18:
        parts.append('mature adult_content r_rated')
    elif age_limit >= 16:
        parts.append('teen_plus')
    else:
        parts.append('general_audience')

    # OTT platforms as features
    platforms = movie.get('ottPlatforms', [])
    if isinstance(platforms, list):
        platform_names = [p.get('name', '').lower().replace(' ', '_')
                          for p in platforms if isinstance(p, dict)]
        if platform_names:
            parts.append(' '.join(platform_names))

    combined = ' '.join(parts)
    return clean_text(combined)


def load_movies_from_json(json_path: str) -> list:
    """Load movie data from a JSON file."""
    with open(json_path, 'r', encoding='utf-8') as f:
        return json.load(f)


def load_movies_from_js(js_path: str) -> list:
    """
    Load movie data from a JS module file (const MOVIES = [...]).
    Extracts the JSON array from the JavaScript source.
    """
    with open(js_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Extract JSON array from JS module
    # Look for the array between [ and the final ];
    start = content.index('[')
    end = content.rindex(']') + 1
    json_str = content[start:end]

    return json.loads(json_str)


def build_dataset(movies: list) -> pd.DataFrame:
    """
    Build a feature-engineered DataFrame from raw movie data.

    Returns a DataFrame with columns:
    - movie_id, title, genre, experience_type, year, rating_percent,
      popularity_score, tags, combined_features
    """
    records = []

    for movie in movies:
        combined = build_combined_features(movie)

        records.append({
            'movie_id': movie.get('movie_id'),
            'title': movie.get('title', ''),
            'genre': '|'.join(movie.get('genre', [])) if isinstance(movie.get('genre'), list) else movie.get('genre', ''),
            'experience_type': movie.get('experience_type', ''),
            'year': movie.get('year', 0),
            'rating_percent': movie.get('rating_percent', 0),
            'popularity_score': movie.get('popularity_score', 0),
            'age_limit': movie.get('age_limit', 0),
            'tags': '|'.join(movie.get('tags', [])) if isinstance(movie.get('tags'), list) else movie.get('tags', ''),
            'synopsis': movie.get('synopsis', ''),
            'combined_features': combined,
        })

    df = pd.DataFrame(records)

    # Ensure no NaN in combined_features
    df['combined_features'] = df['combined_features'].fillna('')

    print(f"Built dataset with {len(df)} movies")
    print(f"Feature column avg length: {df['combined_features'].str.len().mean():.0f} chars")
    print(f"Genres found: {df['genre'].nunique()}")
    print(f"Year range: {df['year'].min()} — {df['year'].max()}")

    return df


def run_pipeline(input_path: str = None, output_path: str = None) -> pd.DataFrame:
    """
    Run the full feature engineering pipeline.

    1. Load raw movie data (from JSON or JS)
    2. Clean and combine features
    3. Save as CSV dataset
    """
    # Determine paths
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

    if input_path is None:
        # Try JSON first, then JS
        json_path = os.path.join(base_dir, 'backend', 'baseMovies.json')
        js_path = os.path.join(base_dir, 'data', 'movieData.js')

        if os.path.exists(json_path):
            print(f"Loading from: {json_path}")
            movies = load_movies_from_json(json_path)
        elif os.path.exists(js_path):
            print(f"Loading from: {js_path}")
            movies = load_movies_from_js(js_path)
        else:
            raise FileNotFoundError("No movie data file found!")
    else:
        if input_path.endswith('.json'):
            movies = load_movies_from_json(input_path)
        else:
            movies = load_movies_from_js(input_path)

    if output_path is None:
        output_path = os.path.join(base_dir, 'ml', 'dataset.csv')

    print(f"Loaded {len(movies)} movies")

    # Build dataset
    df = build_dataset(movies)

    # Save
    df.to_csv(output_path, index=False, encoding='utf-8')
    print(f"Saved dataset to: {output_path}")

    return df


if __name__ == '__main__':
    df = run_pipeline()
    print("\nSample features:")
    for _, row in df.head(3).iterrows():
        print(f"\n  Movie: {row['title']}")
        print(f"     Features: {row['combined_features'][:120]}...")
