import pandas as pd
import numpy as np
import json
import os
import pickle
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

# Paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MOVIES_JSON = os.path.join(BASE_DIR, 'baseMovies.json')
MODEL_PATH = os.path.join(BASE_DIR, 'data', 'similarity.pkl')

def train():
    print("🚀 Starting Movie Recommendation System Similarity Model Training...")
    
    # 1. Load Data
    with open(MOVIES_JSON, 'r', encoding='utf-8') as f:
        movies = json.load(f)
    
    df = pd.DataFrame(movies)
    print(f"✅ Loaded {len(df)} movies.")

    # 2. Text Preprocessing (Simple but powerful feature engineering)
    def create_soup(x):
        # We combine title, genres (multiple times for weight), overview, 
        # and vibes (experience_type) if available.
        genres = str(x.get('genre', '')).replace('|', ' ')
        vibes = str(x.get('experience_type', ''))
        primary = x['genre'].split('|')[0] if x['genre'] else ''
        return f"{primary} {primary} {x['title']} {genres} {genres} {x['overview']} {vibes} {vibes}"

    df['soup'] = df.apply(create_soup, axis=1)
    
    # 3. TF-IDF Matrix
    tfidf = TfidfVectorizer(stop_words='english', ngram_range=(1, 2)) # Unigrams and Bigrams for better context capture
    tfidf_matrix = tfidf.fit_transform(df['soup'])
    
    # Capture training metadata for dashboard
    metadata = {
        'tfidf_dimensions': tfidf_matrix.shape[1],
        'vocabulary_size': len(tfidf.vocabulary_),
        'ngram_range': tfidf.ngram_range,
        'trained_at': pd.Timestamp.now().isoformat()
    }
    
    # 4. Cosine Similarity
    cosine_sim = cosine_similarity(tfidf_matrix, tfidf_matrix)
    
    # 5. Save Model
    id_to_idx = {int(row['movie_id']): i for i, row in df.iterrows()}
    
    model_data = {
        'similarity_matrix': cosine_sim.astype(np.float32),
        'id_to_idx': id_to_idx,
        'movies': df[['movie_id', 'title', 'genre']].to_dict('records'),
        'training_metadata': metadata
    }
    
    os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)
    with open(MODEL_PATH, 'wb') as f:
        pickle.dump(model_data, f)
        
    print(f"🎉 Model saved to {MODEL_PATH}")
    print(f"📊 Matrix Size: {cosine_sim.shape}")

if __name__ == "__main__":
    train()
