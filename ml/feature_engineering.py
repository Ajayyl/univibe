"""
UniVibe — Feature Engineering Pipeline (Enhanced)
===================================================
Transforms raw movie metadata into rich feature vectors for similarity computation.

Pipeline: raw movie JSON → cleaned text features → combined feature column → CSV dataset

Enhanced fields:
- genres (repeated 3x for emphasis)
- overview/synopsis (full text cleaned)
- keywords (domain-specific tags)
- cast (top actors, repeated 2x)
- director (repeated 4x for high authority)
- experience_type, tags, release decade, rating tier, popularity tier, age class, OTT platforms
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

    Enhanced feature vector uses:
    - genre (repeated 3x for emphasis — highest content signal)
    - director (repeated 4x — strong authority signal for same-director recs)
    - cast (repeated 2x — actor similarity matters)
    - keywords (domain-specific tags, cleaned)
    - synopsis/overview (full overview text, cleaned)
    - cinematographer (repeated 2x — visual style similarity)
    - music/composer (repeated 2x — same composer = similar feel)
    - writer/screenplay (repeated 2x — same writer = similar narrative)
    - experience_type (repeated 2x)
    - tags (cult, underrated, family-safe)
    - release decade
    - rating tier (excellent, good, average, below_average)
    - popularity tier
    - age classification
    - OTT platform names
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

    # Synopsis / overview (full overview cleaned)
    synopsis = movie.get('synopsis', '')
    overview = movie.get('overview', '')
    if synopsis:
        parts.append(clean_text(synopsis))
    if overview:
        parts.append(clean_text(overview))

    # Cinematographer (repeat 2x — visual style is a strong similarity signal)
    cinematographer = movie.get('cinematographer', '')
    if cinematographer and cinematographer not in ('N/A', 'N/A (Animation)', ''):
        norm_cinematographer = cinematographer.lower().replace(' ', '').replace(',', ' ')
        parts.extend([norm_cinematographer] * 2)

    # Music composer (repeat 2x — same composer = similar feel)
    music = movie.get('music', '')
    if music and music not in ('Various Artists', ''):
        norm_music = music.lower().replace(' ', '').replace(',', ' ')
        parts.extend([norm_music] * 2)

    # Writer/screenplay (repeat 2x — same writer = similar narrative style)
    writer = movie.get('writer', '')
    if writer:
        norm_writer = writer.lower().replace(' ', '').replace(',', ' ')
        parts.extend([norm_writer] * 2)

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
      popularity_score, tags, synopsis, director, cast, keywords,
      combined_features
    """
    records = []

    for movie in movies:
        combined = build_combined_features(movie)

        # Extract director (normalize "Various Directors" → empty for similarity)
        director = movie.get('director', 'Unknown')
        cast_val = movie.get('cast', 'Unknown')
        keywords_val = movie.get('keywords', '')

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
            'director': director,
            'cast': cast_val,
            'keywords': keywords_val,
            'combined_features': combined,
        })

    df = pd.DataFrame(records)

    # Ensure no NaN in combined_features
    df['combined_features'] = df['combined_features'].fillna('')
    df['director'] = df['director'].fillna('Unknown')
    df['cast'] = df['cast'].fillna('Unknown')
    df['keywords'] = df['keywords'].fillna('')

    print(f"Built dataset with {len(df)} movies")
    print(f"Feature column avg length: {df['combined_features'].str.len().mean():.0f} chars")
    print(f"Genres found: {df['genre'].nunique()}")
    print(f"Directors found: {df['director'].nunique()}")
    print(f"Year range: {df['year'].min()} — {df['year'].max()}")
    print(f"Movies with keywords: {(df['keywords'] != '').sum()}/{len(df)}")
    print(f"Movies with cast: {(df['cast'] != 'Unknown').sum()}/{len(df)}")
    print(f"Movies with director: {(df['director'] != 'Various Directors').sum()}/{len(df)}")

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
        print(f"     Director: {row['director']}")
        print(f"     Cast: {row['cast']}")
        print(f"     Keywords: {row['keywords']}")
        print(f"     Features: {row['combined_features'][:120]}...")
