"""
UniVibe — Model Evaluation Metrics
===================================
Calculates offline recommendation quality:
- Precision@K
- Recall@K
- Hit Rate
- Mean Reciprocal Rank (MRR)
"""

import pandas as pd
import numpy as np
import pickle
import os


def evaluate_model(model_path: str = None, dataset_path: str = None, k=5):
    # Determine paths
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    
    if model_path is None:
        model_path = os.path.join(base_dir, 'models', 'similarity.pkl')
    
    if dataset_path is None:
        dataset_path = os.path.join(base_dir, 'ml', 'dataset.csv')

    print(f"Loading model: {model_path}")
    with open(model_path, 'rb') as f:
        model_data = pickle.load(f)
    
    similarity_matrix = model_data['similarity_matrix']
    movie_ids = model_data['movie_ids']

    print(f"Loading dataset: {dataset_path}")
    df = pd.read_csv(dataset_path)
    
    # Pre-cache genre sets for performance
    movie_metadata = {}
    for _, row in df.iterrows():
        movie_metadata[row['movie_id']] = {
            'genres': set(str(row['genre']).split('|')),
            'director': str(row.get('director', '')),
            'title': row['title']
        }

    def is_relevant(id1, id2):
        if id1 not in movie_metadata or id2 not in movie_metadata:
            return False
        # Relevance = shares at least one genre OR same director
        m1 = movie_metadata[id1]
        m2 = movie_metadata[id2]
        
        # Explicit conversion and intersection
        g1 = m1.get('genres', set())
        g2 = m2.get('genres', set())
        shared_genres = g1.intersection(g2)
        
        dir1 = str(m1.get('director', ''))
        dir2 = str(m2.get('director', ''))
        same_director = (dir1 == dir2) and (dir1 != "Various Directors")
        
        return len(shared_genres) > 0 or same_director

    precisions = []
    recalls = []
    mrr_scores = []
    hits = 0

    print(f"Evaluating Metrics@{k} across {len(movie_ids)} movies...")

    for i, movie_id in enumerate(movie_ids):
        # Top K indices
        sim_scores = np.array(similarity_matrix[i])
        # Get indices of top K (excluding self at index i)
        indices = np.argsort(sim_scores)[::-1].tolist()
        top_k_indices = [int(idx) for idx in indices if idx != i][:k]
        top_k_ids = [movie_ids[idx] for idx in top_k_indices]

        # Calculate relevance
        relevance = [1 if is_relevant(movie_id, rec_id) else 0 for rec_id in top_k_ids]
        
        # Precision@K
        p_k = sum(relevance) / k
        precisions.append(p_k)

        # Hit Rate@K
        if sum(relevance) > 0:
            hits += 1

        # MRR
        mrr = 0
        for rank, rel in enumerate(relevance, 1):
            if rel == 1:
                mrr = 1.0 / rank
                break
        mrr_scores.append(mrr)

        # Recall@K (approximation based on available peers)
        total_relevant = sum([1 for other_id in movie_ids if other_id != movie_id and is_relevant(movie_id, other_id)])
        if total_relevant > 0:
            recalls.append(sum(relevance) / total_relevant)

    report = {
        'precision_k': float(np.mean(precisions)),
        'recall_k': float(np.mean(recalls)) if recalls else 0.0,
        'hit_rate_k': float(hits / len(movie_ids)),
        'mrr': float(np.mean(mrr_scores))
    }

    print("\n" + "="*40)
    print("       ML EVALUATION REPORT")
    print("="*40)
    print(f" Precision@{k}:      {report['precision_k']:.4f}")
    print(f" Recall@{k}:         {report['recall_k']:.4f}")
    print(f" Hit Rate@{k}:       {report['hit_rate_k']:.4f}")
    print(f" MRR@{k}:            {report['mrr']:.4f}")
    print("="*40)

    # Save metrics
    metrics_path = os.path.join(base_dir, 'models', 'metrics.pkl')
    with open(metrics_path, 'wb') as f:
        pickle.dump(report, f)
    print(f"Metrics saved to: {metrics_path}")

    return report


if __name__ == '__main__':
    evaluate_model(k=5)
