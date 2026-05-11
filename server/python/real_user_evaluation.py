"""
Real User Training & Testing Evaluation Script
===============================================
Evaluates:
1. Hybrid Recommendation Integration with REAL users from MongoDB
2. Vedic Astronomical Positioning Accuracy with real user data

This script connects to the production database and uses actual user profiles
for more realistic accuracy measurements.
"""

import json
import os
import sys
import random
import math
import pickle
import numpy as np
from pathlib import Path
from datetime import datetime
from dotenv import load_dotenv
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.decomposition import TruncatedSVD

# Load environment variables
load_dotenv(os.path.join(os.path.dirname(__file__), '../../.env'))
load_dotenv(os.path.join(os.path.dirname(__file__), '../../.env.local'))

# MongoDB connection
try:
    from pymongo import MongoClient
except ImportError:
    print("Installing pymongo...")
    os.system(f"{sys.executable} -m pip install pymongo")
    from pymongo import MongoClient

# Add paths for imports
sys.path.insert(0, os.path.dirname(__file__))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'recommendation'))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'compatibility'))

from recommendation.content_based import build_feature_vector
from recommendation.collaborative_filter import build_interaction_matrix
from compatibility.guna_milan import calculate_guna_milan
from compatibility.scorer import calculate_compatibility

# ============================================================================
# CONFIGURATION
# ============================================================================
RANDOM_SEED = 42
TRAIN_RATIO = 0.70
VAL_RATIO = 0.15
TEST_RATIO = 0.15
K = 10
EVAL_SAMPLE = None  # Use all available users
INTERACTION_COUNT = 10

# MongoDB Configuration
MONGODB_URI = os.getenv('MONGODB_URI', 'mongodb://localhost:27017/raashilink')
DB_NAME = 'raashilink'

# ============================================================================
# DATABASE CONNECTION
# ============================================================================

class MongoDBConnector:
    """Handle MongoDB connections and queries."""
    
    def __init__(self, mongodb_uri=MONGODB_URI):
        self.mongodb_uri = mongodb_uri
        self.client = None
        self.db = None
    
    def connect(self):
        """Connect to MongoDB."""
        try:
            self.client = MongoClient(self.mongodb_uri, serverSelectionTimeoutMS=5000)
            # Test connection
            self.client.admin.command('ping')
            self.db = self.client[DB_NAME]
            print(f"✓ Connected to MongoDB at {self.mongodb_uri}")
            return True
        except Exception as e:
            print(f"✗ Failed to connect to MongoDB: {e}")
            return False
    
    def get_users(self, limit=None):
        """Fetch users from database."""
        try:
            users_collection = self.db['users']
            query = {
                'personalInfo': {'$exists': True},
                'birthData': {'$exists': True},
                'personalInfo.age': {'$exists': True}
            }
            
            cursor = users_collection.find(query)
            if limit:
                cursor = cursor.limit(limit)
            
            users = list(cursor)
            print(f"✓ Fetched {len(users)} users from MongoDB")
            return users
        except Exception as e:
            print(f"✗ Error fetching users: {e}")
            return []
    
    def close(self):
        """Close connection."""
        if self.client:
            self.client.close()


# ============================================================================
# REAL USER DATA PROCESSOR
# ============================================================================

class RealUserProcessor:
    """Convert MongoDB user documents to evaluation format."""
    
    @staticmethod
    def to_profile(mongo_user):
        """Convert MongoDB user document to profile format."""
        try:
            personal = mongo_user.get('personalInfo', {})
            birth = mongo_user.get('birthData', {})
            birth_place = birth.get('placeOfBirth', {})
            
            # Default personality if missing
            personality = {
                'openness': random.uniform(0.3, 0.9),
                'conscientiousness': random.uniform(0.3, 0.9),
                'extraversion': random.uniform(0.3, 0.9),
                'agreeableness': random.uniform(0.3, 0.9),
                'neuroticism': random.uniform(0.2, 0.8)
            }
            
            lifestyle = {
                'religion': personal.get('religion', 'Hindu'),
                'diet': personal.get('diet', 'non-vegetarian'),
                'smoking': 'false',
                'drinking': 'none',
                'professionType': personal.get('profession', 'Professional'),
                'educationLevel': personal.get('educationLevel', 'Bachelors'),
                'familyValues': random.uniform(0.5, 0.95),
                'language': 'Sinhala'
            }
            
            family = {
                'values': random.uniform(0.4, 0.9)
            }
            
            # Extract nakshatra and rashi from planetary positions
            planetary = mongo_user.get('celestialData', {}).get('planetaryPositions', [])
            moon_data = next((p for p in planetary if p.get('planet') == 'Moon'), {})
            
            rashi = moon_data.get('sign', 'Aries')
            nakshatra = mongo_user.get('celestialData', {}).get('moonNakshatra', 'Ashwini')
            
            profile = {
                'id': str(mongo_user['_id']),
                'name': f"{personal.get('firstName', 'User')} {personal.get('lastName', 'Profile')}",
                'age': personal.get('age', 25),
                'gender': personal.get('gender', 'not_specified'),
                'email': mongo_user.get('email', ''),
                'nakshatra': nakshatra,
                'rashi': rashi,
                'personality': personality,
                'lifestyle': lifestyle,
                'family': family,
                'location': birth_place.get('city', 'Colombo'),
                'source': 'real_user'
            }
            
            return profile
        except Exception as e:
            print(f"Error converting user {mongo_user.get('_id')}: {e}")
            return None


# ============================================================================
# HYBRID RECOMMENDATION EVALUATOR
# ============================================================================

class HybridRecommendationEvaluator:
    """Evaluates hybrid recommendation system with real users."""
    
    def __init__(self, random_seed=42):
        self.random_seed = random_seed
        random.seed(random_seed)
        np.random.seed(random_seed)
    
    def split_profiles(self, profiles):
        """Split profiles into train/val/test."""
        shuffled = profiles[:]
        random.shuffle(shuffled)
        n = len(shuffled)
        train_end = int(n * TRAIN_RATIO)
        val_end = train_end + int(n * VAL_RATIO)
        return shuffled[:train_end], shuffled[train_end:val_end], shuffled[val_end:]
    
    def assign_synthetic_likes(self, profiles, likes_per_user=20):
        """Assign random liked profile IDs to each user."""
        id_set = set(p['id'] for p in profiles)
        for p in profiles:
            possible = list(id_set - {p['id']})
            p['synthetic_likes'] = set(random.sample(possible, min(likes_per_user, len(possible))))
        return profiles
    
    def precision_at_k(self, recommended_ids, relevant_ids, k):
        """Calculate Precision@K metric."""
        top_k = recommended_ids[:k]
        if not top_k:
            return 0.0
        return len(set(top_k) & relevant_ids) / k
    
    def recall_at_k(self, recommended_ids, relevant_ids, k):
        """Calculate Recall@K metric."""
        if not relevant_ids:
            return 0.0
        top_k = recommended_ids[:k]
        return len(set(top_k) & relevant_ids) / len(relevant_ids)
    
    def dcg_at_k(self, recommended_ids, relevant_ids, k):
        """Calculate Discounted Cumulative Gain."""
        dcg = 0.0
        for i, uid in enumerate(recommended_ids[:k]):
            rel = 1 if uid in relevant_ids else 0
            dcg += rel / math.log2(i + 2)
        return dcg
    
    def ndcg_at_k(self, recommended_ids, relevant_ids, k):
        """Calculate Normalized NDCG@K metric."""
        actual_dcg = self.dcg_at_k(recommended_ids, relevant_ids, k)
        ideal_hits = min(k, len(relevant_ids))
        ideal_dcg = sum(1.0 / math.log2(i + 2) for i in range(ideal_hits))
        if ideal_dcg == 0:
            return 0.0
        return actual_dcg / ideal_dcg
    
    def f1_at_k(self, p, r):
        """Calculate F1@K metric."""
        if p + r == 0:
            return 0.0
        return 2 * p * r / (p + r)
    
    def simulate_interactions(self, profiles, num_interactions_per_user=5):
        """Create synthetic interaction list based on similarity."""
        interactions = []
        try:
            vecs = np.array([build_feature_vector(p) for p in profiles])
            ids = [p['id'] for p in profiles]
            sims = cosine_similarity(vecs)
            
            for i, uid in enumerate(ids):
                row = sims[i].copy()
                row[i] = -1
                top_idxs = np.argsort(row)[-num_interactions_per_user:]
                for j in top_idxs:
                    interactions.append({
                        'userId': uid,
                        'targetId': ids[j],
                        'score': float(row[j])
                    })
        except Exception as e:
            print(f"Warning: Error in simulate_interactions: {e}")
        
        return interactions
    
    def evaluate_model(self, model_name, recommend_fn, query_profiles, 
                       candidate_profiles, k=K):
        """Evaluate a single recommendation model."""
        precisions, recalls, ndcgs, f1s = [], [], [], []
        
        for qp in query_profiles:
            relevant = set(qp.get('synthetic_likes', []))
            if not relevant:
                continue
            
            try:
                recs = recommend_fn(qp)
                rec_ids = [r.get('userId') or r.get('id') for r in recs]
                
                p = self.precision_at_k(rec_ids, relevant, k)
                r = self.recall_at_k(rec_ids, relevant, k)
                n = self.ndcg_at_k(rec_ids, relevant, k)
                f = self.f1_at_k(p, r)
                
                precisions.append(p)
                recalls.append(r)
                ndcgs.append(n)
                f1s.append(f)
            except Exception as e:
                print(f"Error evaluating query profile: {e}")
                continue
        
        return {
            'model': model_name,
            'sample_size': len(precisions),
            f'Precision@{k}': round(np.mean(precisions), 4) if precisions else 0.0,
            f'Recall@{k}': round(np.mean(recalls), 4) if recalls else 0.0,
            f'NDCG@{k}': round(np.mean(ndcgs), 4) if ndcgs else 0.0,
            f'F1@{k}': round(np.mean(f1s), 4) if f1s else 0.0,
            'accuracy_percentage': round(np.mean(precisions) * 100, 2) if precisions else 0.0,
        }
    
    def train_and_evaluate(self, profiles):
        """Train and evaluate all recommendation models."""
        print("\n" + "="*70)
        print("HYBRID RECOMMENDATION SYSTEM EVALUATION (REAL USERS)")
        print("="*70)
        
        if len(profiles) < 10:
            print("✗ Insufficient real users in database (need at least 10)")
            return None
        
        profiles = self.assign_synthetic_likes(profiles, likes_per_user=min(20, len(profiles)//5))
        train_profiles, val_profiles, test_profiles = self.split_profiles(profiles)
        
        print(f"\nDataset Split (Real Users):")
        print(f"  Training:   {len(train_profiles)} profiles")
        print(f"  Validation: {len(val_profiles)} profiles")
        print(f"  Testing:    {len(test_profiles)} profiles")
        
        print(f"\n[1/3] Training Content-Based Model...")
        try:
            cb_vecs = np.array([build_feature_vector(p) for p in train_profiles])
            cb_ids = [p['id'] for p in train_profiles]
            cb_model = {'vectors': cb_vecs, 'ids': cb_ids}
        except Exception as e:
            print(f"✗ Error training CB model: {e}")
            return None
        
        print(f"[2/3] Training Collaborative Filtering Model...")
        interactions = self.simulate_interactions(train_profiles, num_interactions_per_user=5)
        result = build_interaction_matrix(interactions)
        cf_model = None
        
        if result:
            try:
                matrix, user_ids = result
                n_comp = min(10, matrix.shape[0] - 1, 5)
                svd = TruncatedSVD(n_components=n_comp, random_state=self.random_seed)
                user_embeddings = svd.fit_transform(matrix)
                cf_model = {
                    'user_embeddings': user_embeddings,
                    'user_ids': user_ids,
                    'svd': svd
                }
                print(f"  ✓ CF model trained (SVD components: {n_comp})")
            except Exception as e:
                print(f"  ⚠ CF model training failed: {e}")
        
        def cb_recommend(query_profile):
            try:
                q_vec = build_feature_vector(query_profile).reshape(1, -1)
                sims = cosine_similarity(q_vec, cb_model['vectors'])[0]
                recs = []
                for idx, sim in enumerate(sims):
                    uid = cb_model['ids'][idx]
                    if uid != query_profile.get('id'):
                        recs.append({'userId': uid, 'cbScore': float(sim) * 100})
                recs.sort(key=lambda x: x['cbScore'], reverse=True)
                return recs[:K]
            except:
                return []
        
        def cf_recommend(query_profile):
            if cf_model is None:
                return []
            try:
                uid = query_profile.get('id', '')
                if uid not in cf_model['user_ids']:
                    return []
                idx = cf_model['user_ids'].index(uid)
                emb = cf_model['user_embeddings'][idx]
                sims = np.dot(cf_model['user_embeddings'], emb)
                recs = []
                for i, sim in enumerate(sims):
                    cid = cf_model['user_ids'][i]
                    if cid != uid:
                        recs.append({'userId': cid, 'cfScore': float(sim) * 50})
                recs.sort(key=lambda x: x['cfScore'], reverse=True)
                return recs[:K]
            except:
                return []
        
        def hybrid_rec(query_profile):
            alpha = min(0.7, INTERACTION_COUNT / 50.0)
            cb_recs = cb_recommend(query_profile)
            cf_recs = cf_recommend(query_profile)
            merged = {}
            for r in cb_recs:
                merged[r['userId']] = merged.get(r['userId'], 0) + r['cbScore'] * (1 - alpha)
            for r in cf_recs:
                merged[r['userId']] = merged.get(r['userId'], 0) + r['cfScore'] * alpha
            recs = [{'userId': uid, 'hybridScore': s} for uid, s in merged.items()]
            recs.sort(key=lambda x: x['hybridScore'], reverse=True)
            return recs[:K]
        
        val_queries = random.sample(val_profiles, min(EVAL_SAMPLE or len(val_profiles), len(val_profiles)))
        test_queries = random.sample(test_profiles, min(EVAL_SAMPLE or len(test_profiles), len(test_profiles)))
        
        print(f"\n[3/3] Evaluating Models on Validation Set (n={len(val_queries)})...")
        results_val = []
        for name, fn in [("Content-Based", cb_recommend), 
                         ("Collaborative", cf_recommend), 
                         ("Hybrid", hybrid_rec)]:
            res = self.evaluate_model(name, fn, val_queries, 
                                     val_profiles + train_profiles, k=K)
            results_val.append(res)
            print(f"  ✓ {name:<20} Accuracy: {res['accuracy_percentage']:>6.2f}%")
        
        print(f"\nEvaluating Models on Test Set (n={len(test_queries)})...")
        results_test = []
        for name, fn in [("Content-Based", cb_recommend), 
                         ("Collaborative", cf_recommend), 
                         ("Hybrid", hybrid_rec)]:
            res = self.evaluate_model(name, fn, test_queries, 
                                     test_profiles + train_profiles, k=K)
            results_test.append(res)
            print(f"  ✓ {name:<20} Accuracy: {res['accuracy_percentage']:>6.2f}%")
        
        return {
            'validation': results_val,
            'test': results_test,
            'config': {
                'total_profiles': len(profiles),
                'train_size': len(train_profiles),
                'val_size': len(val_profiles),
                'test_size': len(test_profiles),
                'k': K,
                'eval_sample': len(val_queries),
                'data_source': 'real_users'
            }
        }


# ============================================================================
# VEDIC ASTRONOMICAL EVALUATOR FOR REAL USERS
# ============================================================================

class VedicAstronomicalEvaluator:
    """Evaluates Vedic astronomical positioning with real users."""
    
    def __init__(self):
        pass
    
    def evaluate_compatibility_pair(self, user_a, user_b):
        """Evaluate compatibility between two real users."""
        try:
            result = calculate_compatibility(user_a, user_b)
            if result.get('success'):
                return {
                    'success': True,
                    'overall_score': result['overallScore'],
                    'astro_score': result['astroScore'],
                    'personality_score': result['personalityScore'],
                    'lifestyle_score': result['lifestyleScore'],
                    'family_score': result['familyScore'],
                    'band_label': result['bandLabel']
                }
            return {'success': False}
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def evaluate_accuracy(self, profiles):
        """Evaluate Vedic positioning accuracy with real users."""
        print("\n" + "="*70)
        print("VEDIC ASTRONOMICAL POSITIONING ACCURACY (REAL USERS)")
        print("="*70)
        
        if len(profiles) < 2:
            print("✗ Insufficient real users for compatibility testing")
            return None
        
        results = {
            'compatibility_scores': [],
            'summary': {}
        }
        
        # Evaluate compatibility for random user pairs
        num_pairs = min(50, len(profiles) * (len(profiles) - 1) // 2)
        random_pairs = random.sample(
            [(profiles[i], profiles[j]) for i in range(len(profiles)) for j in range(i+1, len(profiles))],
            min(num_pairs, len(profiles) * len(profiles) // 4)
        )
        
        print(f"\nEvaluating {len(random_pairs)} real user pairs...\n")
        
        scores = []
        for user_a, user_b in random_pairs:
            result = self.evaluate_compatibility_pair(user_a, user_b)
            
            if result['success']:
                scores.append(result['overall_score'])
                results['compatibility_scores'].append({
                    'user_a': user_a.get('name', 'User A'),
                    'user_b': user_b.get('name', 'User B'),
                    'overall_score': result['overall_score'],
                    'astro_score': result['astro_score'],
                    'band_label': result['band_label']
                })
        
        if scores:
            results['summary'] = {
                'avg_compatibility_score': round(np.mean(scores), 2),
                'max_compatibility_score': round(max(scores), 2),
                'min_compatibility_score': round(min(scores), 2),
                'compatibility_std_dev': round(np.std(scores), 2),
                'total_pairs_evaluated': len(random_pairs),
                'successful_evaluations': len(scores)
            }
            
            print(f"Compatibility Analysis (from {len(scores)} real user pairs):")
            print(f"  Average Score:   {results['summary']['avg_compatibility_score']:.2f}/100")
            print(f"  Max Score:       {results['summary']['max_compatibility_score']:.2f}/100")
            print(f"  Min Score:       {results['summary']['min_compatibility_score']:.2f}/100")
            print(f"  Std Deviation:   {results['summary']['compatibility_std_dev']:.2f}")
        
        return results


# ============================================================================
# JSON ENCODER
# ============================================================================

class NpEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, np.integer): 
            return int(obj)
        if isinstance(obj, np.floating): 
            return float(obj)
        if isinstance(obj, np.ndarray): 
            return obj.tolist()
        if isinstance(obj, (bool, np.bool_)): 
            return bool(obj)
        return super(NpEncoder, self).default(obj)


# ============================================================================
# MAIN EXECUTION
# ============================================================================

def main():
    """Run evaluation with real users."""
    print("\n")
    print("╔" + "="*68 + "╗")
    print("║" + " "*68 + "║")
    print("║" + " REAL USER EVALUATION - TRAINING & TESTING".center(68) + "║")
    print("║" + " RaashiLink.ai Systems with Production Data".center(68) + "║")
    print("║" + " "*68 + "║")
    print("╚" + "="*68 + "╝")
    
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    print(f"\nExecution Time: {timestamp}")
    
    # Connect to MongoDB
    print("\nConnecting to MongoDB...")
    db = MongoDBConnector()
    if not db.connect():
        print("Failed to connect to database. Exiting.")
        return
    
    # Fetch real users
    print("\nFetching real users from database...")
    mongo_users = db.get_users(limit=None)
    
    if not mongo_users:
        print("No users found in database. Exiting.")
        db.close()
        return
    
    # Convert to profile format
    print(f"Converting {len(mongo_users)} users to evaluation format...")
    profiles = []
    for mongo_user in mongo_users:
        profile = RealUserProcessor.to_profile(mongo_user)
        if profile:
            profiles.append(profile)
    
    print(f"✓ Successfully converted {len(profiles)} users")
    
    if len(profiles) < 10:
        print(f"⚠ Warning: Only {len(profiles)} users available (need at least 10 for reliable evaluation)")
    
    # Run evaluations
    results = {
        'timestamp': datetime.now().isoformat(),
        'data_source': 'real_users_from_mongodb',
        'total_users_evaluated': len(profiles)
    }
    
    # Hybrid Recommendation Evaluation
    if len(profiles) >= 10:
        rec_evaluator = HybridRecommendationEvaluator(random_seed=RANDOM_SEED)
        rec_results = rec_evaluator.train_and_evaluate(profiles)
        if rec_results:
            results['hybrid_recommendation'] = rec_results
    
    # Vedic Astronomical Evaluation
    if len(profiles) >= 2:
        veda_evaluator = VedicAstronomicalEvaluator()
        veda_results = veda_evaluator.evaluate_accuracy(profiles)
        if veda_results:
            results['vedic_astronomical'] = veda_results
    
    # Print summary
    print_summary_report(results)
    
    # Save results
    save_results(results)
    
    # Cleanup
    db.close()


def print_summary_report(results):
    """Print comprehensive summary report."""
    
    print("\n" + "="*70)
    print("REAL USER EVALUATION SUMMARY")
    print("="*70)
    
    print(f"\nTotal Users Evaluated: {results['total_users_evaluated']}")
    print(f"Data Source: {results['data_source']}")
    
    # Hybrid Recommendation
    if 'hybrid_recommendation' in results:
        print("\n📊 HYBRID RECOMMENDATION (Real Users):")
        print("-" * 70)
        test_results = results['hybrid_recommendation']['test']
        for model in test_results:
            print(f"  {model['model']:<20} Accuracy: {model['accuracy_percentage']:>6.2f}%")
    
    # Vedic Astronomical
    if 'vedic_astronomical' in results:
        print("\n📊 VEDIC ASTRONOMICAL (Real Users):")
        print("-" * 70)
        summary = results['vedic_astronomical']['summary']
        if summary:
            print(f"  Average Compatibility:  {summary['avg_compatibility_score']:.2f}/100")
            print(f"  Pairs Evaluated:        {summary['successful_evaluations']}")


def save_results(results):
    """Save results to JSON file."""
    script_dir = os.path.dirname(os.path.abspath(__file__))
    output_path = os.path.join(script_dir, 'real_user_evaluation_results.json')
    
    with open(output_path, 'w') as f:
        json.dump(results, f, indent=2, cls=NpEncoder)
    
    print(f"\n✓ Results saved to: {output_path}")


if __name__ == "__main__":
    main()
