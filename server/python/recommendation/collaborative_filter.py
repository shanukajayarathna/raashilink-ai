import pickle
import os
import numpy as np
from scipy.sparse import csr_matrix
from sklearn.decomposition import TruncatedSVD

def build_interaction_matrix(interactions):
    """Build sparse interaction matrix from interaction data.
    
    interactions: list of {userId, targetId, score}
    """
    if not interactions:
        return None
    
    user_ids = list(set([i['userId'] for i in interactions] + [i['targetId'] for i in interactions]))
    user_idx_map = {uid: idx for idx, uid in enumerate(user_ids)}
    
    rows, cols, data = [], [], []
    
    for interaction in interactions:
        user_idx = user_idx_map.get(interaction['userId'])
        target_idx = user_idx_map.get(interaction['targetId'])
        score = interaction.get('score', 1)
        
        if user_idx is not None and target_idx is not None:
            rows.append(user_idx)
            cols.append(target_idx)
            data.append(score)
    
    matrix = csr_matrix((data, (rows, cols)), shape=(len(user_ids), len(user_ids)))
    return matrix, user_ids

def train_collaborative_model(interactions):
    """Train collaborative filtering model using SVD."""
    matrix, user_ids = build_interaction_matrix(interactions)
    
    if matrix is None or matrix.nnz == 0:
        return None
    
    try:
        svd = TruncatedSVD(n_components=min(20, matrix.shape[0] - 1))
        user_embeddings = svd.fit_transform(matrix)
    except:
        return None
    
    model = {
        'user_embeddings': user_embeddings,
        'user_ids': user_ids,
        'svd': svd
    }
    
    model_dir = os.path.dirname(__file__)
    model_path = os.path.join(model_dir, 'models', 'cf_model.pkl')
    os.makedirs(os.path.dirname(model_path), exist_ok=True)
    
    with open(model_path, 'wb') as f:
        pickle.dump(model, f)
    
    return model

def recommend_collaborative(user_id, top_n=10, exclude_ids=None):
    """Generate collaborative filtering recommendations."""
    if exclude_ids is None:
        exclude_ids = []
    
    model_dir = os.path.dirname(__file__)
    model_path = os.path.join(model_dir, 'models', 'cf_model.pkl')
    
    if not os.path.exists(model_path):
        return []
    
    try:
        with open(model_path, 'rb') as f:
            model = pickle.load(f)
    except:
        return []
    
    if user_id not in model['user_ids']:
        return []
    
    user_idx = model['user_ids'].index(user_id)
    user_embedding = model['user_embeddings'][user_idx]
    
    # Compute cosine similarity
    similarities = np.dot(model['user_embeddings'], user_embedding)
    
    recommendations = []
    for idx, sim in enumerate(similarities):
        candidate_id = model['user_ids'][idx]
        if candidate_id not in exclude_ids and candidate_id != user_id:
            recommendations.append({'userId': candidate_id, 'cfScore': float(sim) * 50})
    
    recommendations.sort(key=lambda x: x['cfScore'], reverse=True)
    return recommendations[:top_n]
