"""
UniVibe — Content-Based Similarity Model Trainer
================================================
Vectorizes movie features and computes a similarity matrix.
Saves the results for fast inference in the backend.
"""

import pandas as pd
import pickle
import os
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity


def train_model(dataset_path: str = None, model_output_path: str = None):
    # Determine paths
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    
    if dataset_path is None:
        dataset_path = os.path.join(base_dir, 'ml', 'dataset.csv')
    
    if model_output_path is None:
        model_output_path = os.path.join(base_dir, 'models', 'similarity.pkl')

    print(f"Loading dataset from: {dataset_path}")
    df = pd.read_csv(dataset_path)
    
    if 'combined_features' not in df.columns:
        raise ValueError("Dataset does not contain 'combined_features' column. Run feature_engineering.py first.")

    print(f"Vectorizing features for {len(df)} movies...")
    
    # Initialize TF-IDF Vectorizer
    # We use a mix of unigrams and bigrams to capture more context
    tfidf = TfidfVectorizer(stop_words='english', ngram_range=(1, 2))
    
    # Transform textual features into a matrix of TF-IDF vectors
    tfidf_matrix = tfidf.fit_transform(df['combined_features'].fillna(''))
    
    print(f"Matrix shape: {tfidf_matrix.shape}")

    # Compute Cosine Similarity Matrix
    print("Computing cosine similarity matrix...")
    cosine_sim = cosine_similarity(tfidf_matrix, tfidf_matrix)

    # Prepare data for serialization
    # We need the similarity matrix and the mapping of movie_id to matrix index
    model_data = {
        'similarity_matrix': cosine_sim,
        'movie_ids': df['movie_id'].tolist(),
        'titles': df['title'].tolist(),
        'id_to_idx': {movie_id: i for i, movie_id in enumerate(df['movie_id'])},
        'idx_to_id': {i: movie_id for i, movie_id in enumerate(df['movie_id'])}
    }

    # Save to file
    os.makedirs(os.path.dirname(model_output_path), exist_ok=True)
    with open(model_output_path, 'wb') as f:
        pickle.dump(model_data, f)
    
    print(f"Model saved successfully to: {model_output_path}")
    print(f"Total entries: {len(model_data['movie_ids'])}")


if __name__ == '__main__':
    train_model()
