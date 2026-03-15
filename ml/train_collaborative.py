import pandas as pd
import sqlite3
import pickle
import os
import numpy as np
from sklearn.decomposition import TruncatedSVD

def train_svd():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    db_path = os.path.join(base_dir, 'backend', 'data', 'univibe.db')
    out_path = os.path.join(base_dir, 'models', 'collaborative.pkl')
    
    if not os.path.exists(db_path):
        print("Database not found. Skipping Collaborative SVD training.")
        return
        
    conn = sqlite3.connect(db_path)
    
    # We can use ratings as explicit feedback
    df = pd.read_sql("SELECT user_uid, movie_id, rating FROM ratings", conn)
    
    # Also fetch implicit feedback from interactions (e.g. clicks = 3, views = 2) if rating doesn't exist?
    # For simplicity, let's use interactions and convert to a score
    interactions = pd.read_sql("SELECT user_uid, movie_id, event_type FROM interactions", conn)
    conn.close()
    
    if df.empty and interactions.empty:
        print("No interactions or ratings found. Skipping Collab TF.")
        return

    # Create an implicit rating from interactions
    event_weights = {
        'view': 1, 'click': 2, 'search': 2, 'dwell': 3,
        'watchlist': 4, 'recommend_click': 3
    }
    interactions['implicit_rating'] = interactions['event_type'].map(event_weights).fillna(1)
    
    # Group by user and movie to get max interaction weight
    grouped_interactions = interactions.groupby(['user_uid', 'movie_id'])['implicit_rating'].max().reset_index()
    
    # Merge explicit ratings (strongest signal)
    if not df.empty:
        merged = pd.merge(grouped_interactions, df, on=['user_uid', 'movie_id'], how='outer')
        # If explicit rating exists, use it, else use implicit. (Assuming 1-5 scale)
        merged['final_score'] = merged['rating'].combine_first(merged['implicit_rating'])
    else:
        grouped_interactions['final_score'] = grouped_interactions['implicit_rating']
        merged = grouped_interactions
        
    if merged.empty:
        print("No viable data for SVD.")
        return

    # Pivot table: rows=user_uid, cols=movie_id
    user_item_matrix = merged.pivot(index='user_uid', columns='movie_id', values='final_score').fillna(0)
    
    print(f"User-Item Matrix shape: {user_item_matrix.shape}")
    
    # Scikit-Learn SVD
    n_comp = min(20, user_item_matrix.shape[0]-1, user_item_matrix.shape[1]-1)
    if n_comp < 1:
        print("Not enough data to run SVD.")
        return
        
    svd = TruncatedSVD(n_components=n_comp, random_state=42)
    user_factors = svd.fit_transform(user_item_matrix)
    item_factors = svd.components_
    
    # Reconstructed predictions for users
    predicted_ratings = np.dot(user_factors, item_factors)
    predicted_df = pd.DataFrame(predicted_ratings, index=user_item_matrix.index, columns=user_item_matrix.columns)
    
    model_data = {
        'users': user_item_matrix.index.tolist(),
        'movies': user_item_matrix.columns.tolist(),
        'predicted_df': predicted_df,
        'user_factors': user_factors,
        'item_factors': item_factors,
    }
    
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    with open(out_path, 'wb') as f:
        pickle.dump(model_data, f)
        
    print(f"Collaborative Model saved to: {out_path}")

if __name__ == '__main__':
    train_svd()
