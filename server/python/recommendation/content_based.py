import json
import pickle
import os
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity

def build_feature_vector(profile):
    """Build normalized feature vector from user profile."""
    features = []
    
    # Age (normalized to 0-1, age range 22-45)
    age = profile.get('personalInfo', {}).get('age', 28)
    features.append((age - 22) / 23)
    
    # Gender (0=male, 1=female)
    gender = profile.get('personalInfo', {}).get('gender', 'male')
    features.append(1 if gender == 'female' else 0)
    
    # Big Five traits
    personality = profile.get('personality', {})
    features.extend([
        personality.get('openness', 0.5),
        personality.get('conscientiousness', 0.5),
        personality.get('extraversion', 0.5),
        personality.get('agreeableness', 0.5),
        personality.get('neuroticism', 0.5)
    ])
    
    # Lifestyle
    lifestyle = profile.get('lifestyle', {})
    
    # Diet (0=vegetarian, 1=non-vegetarian)
    diet = lifestyle.get('diet', 'non-vegetarian')
    features.append(1 if diet == 'non-vegetarian' else 0)
    
    # Smoking (0=false, 1=true)
    smoking = lifestyle.get('smoking', 'false')
    features.append(1 if smoking == 'true' else 0)
    
    # FamilyValues
    features.append(lifestyle.get('familyValues', 0.5))
    
    # Location encoded (simplified, using first 3 chars)
    location = profile.get('personalInfo', {}).get('location', '')
    location_hash = sum(ord(c) for c in location[:3]) % 10 / 10
    features.append(location_hash)
    
    return np.array(features)

def train_content_model(profiles_list):
    """Train content-based model by generating and storing feature vectors."""
    vectors = []
    ids = []
    
    for profile in profiles_list:
        vector = build_feature_vector(profile)
        vectors.append(vector)
        ids.append(profile.get('id', ''))
    
    model = {
        'vectors': np.array(vectors),
        'ids': ids
    }
    
    model_dir = os.path.dirname(__file__)
    model_path = os.path.join(model_dir, 'models', 'content_model.pkl')
    os.makedirs(os.path.dirname(model_path), exist_ok=True)
    
    with open(model_path, 'wb') as f:
        pickle.dump(model, f)
    
    return model

def recommend_content_based(user_profile, top_n=10, exclude_ids=None):
    """Generate content-based recommendations."""
    if exclude_ids is None:
        exclude_ids = []
    
    model_dir = os.path.dirname(__file__)
    model_path = os.path.join(model_dir, 'models', 'content_model.pkl')
    
    if not os.path.exists(model_path):
        return []
    
    try:
        with open(model_path, 'rb') as f:
            model = pickle.load(f)
    except:
        return []
    
    user_vector = build_feature_vector(user_profile).reshape(1, -1)
    similarities = cosine_similarity(user_vector, model['vectors'])[0]
    
    recommendations = []
    for idx, sim in enumerate(similarities):
        user_id = model['ids'][idx]
        if user_id not in exclude_ids and user_id != user_profile.get('id', ''):
            recommendations.append({'userId': user_id, 'cbScore': float(sim) * 100})
    
    recommendations.sort(key=lambda x: x['cbScore'], reverse=True)
    return recommendations[:top_n]

def main():
    """Load synthetic profiles and train content-based model."""
    try:
        with open('synthetic_profiles.json', 'r') as f:
            profiles = json.load(f)
        
        print(f"Loading {len(profiles)} profiles...")
        model = train_content_model(profiles)
        print(f"Content model trained on {len(profiles)} profiles")
        print("Model saved to models/content_model.pkl")
    except Exception as e:
        print(f"Error training model: {e}")
        raise

if __name__ == "__main__":
    main()
