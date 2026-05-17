"""
Comprehensive Training & Testing Evaluation Script
==================================================
Evaluates:
1. Hybrid Recommendation Integration (Content-Based + Collaborative Filtering)
2. Vedic Astronomical Positioning Accuracy (Guna Milan compatibility)

This script trains models on training data and evaluates on test data,
providing detailed accuracy metrics for both systems.
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
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.decomposition import TruncatedSVD
from scipy.sparse import csr_matrix

# Add paths for imports
sys.path.insert(0, os.path.dirname(__file__))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'recommendation'))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'compatibility'))

from recommendation.content_based import build_feature_vector, recommend_content_based
from recommendation.collaborative_filter import build_interaction_matrix, recommend_collaborative
from recommendation.hybrid_engine import hybrid_recommend
from compatibility.guna_milan import calculate_guna_milan
from compatibility.scorer import calculate_compatibility

# ============================================================================
# CONFIGURATION
# ============================================================================
RANDOM_SEED = 42
TRAIN_RATIO = 0.70
VAL_RATIO = 0.15
TEST_RATIO = 0.15
RELEVANCE_THRESHOLD = 0.75
K = 10  # Top-K for recommendation metrics
EVAL_SAMPLE = 200
INTERACTION_COUNT = 10

# ============================================================================
# PART 1: HYBRID RECOMMENDATION SYSTEM EVALUATION
# ============================================================================

class HybridRecommendationEvaluator:
    """Evaluates hybrid recommendation system accuracy."""
    
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
    
    def build_relevance_labels(self, query_profile, candidate_profiles):
        """Return relevant candidates based on synthetic likes."""
        return set(query_profile.get('synthetic_likes', []))
    
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
        vecs = np.array([build_feature_vector(p) for p in profiles])
        ids = [p['id'] for p in profiles]
        sims = cosine_similarity(vecs)
        
        for i, uid in enumerate(ids):
            row = sims[i].copy()
            row[i] = -1  # exclude self
            top_idxs = np.argsort(row)[-num_interactions_per_user:]
            for j in top_idxs:
                interactions.append({
                    'userId': uid,
                    'targetId': ids[j],
                    'score': float(row[j])
                })
        return interactions
    
    def evaluate_model(self, model_name, recommend_fn, query_profiles, 
                       candidate_profiles, k=K):
        """Evaluate a single recommendation model."""
        precisions, recalls, ndcgs, f1s = [], [], [], []
        
        for qp in query_profiles:
            relevant = self.build_relevance_labels(qp, candidate_profiles)
            if not relevant:
                continue
            
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
        print("HYBRID RECOMMENDATION SYSTEM EVALUATION")
        print("="*70)
        
        # Assign synthetic preferences
        profiles = self.assign_synthetic_likes(profiles, likes_per_user=20)
        
        # Split data
        train_profiles, val_profiles, test_profiles = self.split_profiles(profiles)
        print(f"\nDataset Split:")
        print(f"  Training:   {len(train_profiles)} profiles")
        print(f"  Validation: {len(val_profiles)} profiles")
        print(f"  Testing:    {len(test_profiles)} profiles")
        
        # Train Content-Based Model
        print(f"\n[1/3] Training Content-Based Model...")
        cb_vecs = np.array([build_feature_vector(p) for p in train_profiles])
        cb_ids = [p['id'] for p in train_profiles]
        cb_model = {'vectors': cb_vecs, 'ids': cb_ids}
        
        # Train Collaborative Filtering Model
        print(f"[2/3] Training Collaborative Filtering Model...")
        interactions = self.simulate_interactions(train_profiles, num_interactions_per_user=5)
        result = build_interaction_matrix(interactions)
        cf_model = None
        
        if result:
            matrix, user_ids = result
            n_comp = min(20, matrix.shape[0] - 1, 10)
            svd = TruncatedSVD(n_components=n_comp, random_state=self.random_seed)
            user_embeddings = svd.fit_transform(matrix)
            cf_model = {
                'user_embeddings': user_embeddings,
                'user_ids': user_ids,
                'svd': svd
            }
            print(f"  ✓ CF model trained (SVD components: {n_comp})")
        
        # Define recommendation functions
        def cb_recommend(query_profile):
            q_vec = build_feature_vector(query_profile).reshape(1, -1)
            sims = cosine_similarity(q_vec, cb_model['vectors'])[0]
            recs = []
            for idx, sim in enumerate(sims):
                uid = cb_model['ids'][idx]
                if uid != query_profile.get('id'):
                    recs.append({'userId': uid, 'cbScore': float(sim) * 100})
            recs.sort(key=lambda x: x['cbScore'], reverse=True)
            return recs[:K]
        
        def cf_recommend(query_profile):
            if cf_model is None:
                return []
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
        
        # Sample query profiles
        val_queries = random.sample(val_profiles, min(EVAL_SAMPLE, len(val_profiles)))
        test_queries = random.sample(test_profiles, min(EVAL_SAMPLE, len(test_profiles)))
        
        # Evaluate on validation set
        print(f"\n[3/3] Evaluating Models on Validation Set (n={len(val_queries)})...")
        results_val = []
        for name, fn in [("Content-Based", cb_recommend), 
                         ("Collaborative", cf_recommend), 
                         ("Hybrid", hybrid_rec)]:
            res = self.evaluate_model(name, fn, val_queries, 
                                     val_profiles + train_profiles, k=K)
            results_val.append(res)
            print(f"  ✓ {name:<20} Accuracy: {res['accuracy_percentage']:>6.2f}%")
        
        # Evaluate on test set
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
                'eval_sample': EVAL_SAMPLE,
            }
        }


# ============================================================================
# PART 2: VEDIC ASTRONOMICAL POSITIONING ACCURACY
# ============================================================================

class VedicAstronomicalEvaluator:
    """Evaluates Vedic astronomical positioning accuracy."""
    
    def __init__(self):
        self.test_cases = self._generate_test_cases()
    
    def _generate_test_cases(self):
        """Generate comprehensive test cases with known compatibility ranges."""
        test_cases = []
        
        # High compatibility cases
        high_compat = [
            {
                'case': 'Same Nakshatra (Ashwini)',
                'user_a': {'nakshatra': 'Ashwini', 'rashi': 'Aries', 
                          'personality': {'openness': 0.8}, 'lifestyle': {'religion': 'Hindu'},
                          'family': {'values': 0.8}},
                'user_b': {'nakshatra': 'Ashwini', 'rashi': 'Aries',
                          'personality': {'openness': 0.8}, 'lifestyle': {'religion': 'Hindu'},
                          'family': {'values': 0.8}},
                'expected_score_min': 75,
                'category': 'high_compatibility'
            },
            {
                'case': 'Complementary Rashis (Leo-Aries)',
                'user_a': {'nakshatra': 'Magha', 'rashi': 'Leo',
                          'personality': {'extraversion': 0.8}, 'lifestyle': {'religion': 'Hindu'},
                          'family': {'values': 0.7}},
                'user_b': {'nakshatra': 'Ashwini', 'rashi': 'Aries',
                          'personality': {'extraversion': 0.8}, 'lifestyle': {'religion': 'Hindu'},
                          'family': {'values': 0.7}},
                'expected_score_min': 65,
                'category': 'high_compatibility'
            },
        ]
        
        # Medium compatibility cases
        medium_compat = [
            {
                'case': 'Different Nakshatras, Compatible Rashis',
                'user_a': {'nakshatra': 'Krittika', 'rashi': 'Taurus',
                          'personality': {'openness': 0.6}, 'lifestyle': {'religion': 'Hindu'},
                          'family': {'values': 0.6}},
                'user_b': {'nakshatra': 'Rohini', 'rashi': 'Taurus',
                          'personality': {'openness': 0.6}, 'lifestyle': {'religion': 'Hindu'},
                          'family': {'values': 0.6}},
                'expected_score_min': 50,
                'category': 'medium_compatibility'
            },
        ]
        
        # Low compatibility cases
        low_compat = [
            {
                'case': 'Incompatible Elements (Fire-Water)',
                'user_a': {'nakshatra': 'Magha', 'rashi': 'Leo',
                          'personality': {'openness': 0.5}, 'lifestyle': {'religion': 'Hindu'},
                          'family': {'values': 0.4}},
                'user_b': {'nakshatra': 'Ashlesha', 'rashi': 'Cancer',
                          'personality': {'openness': 0.5}, 'lifestyle': {'religion': 'Hindu'},
                          'family': {'values': 0.4}},
                'expected_score_min': 30,
                'category': 'low_compatibility'
            },
        ]
        
        return high_compat + medium_compat + low_compat
    
    def evaluate_guna_milan(self, user_a, user_b):
        """Evaluate Guna Milan score for a pair."""
        try:
            result = calculate_guna_milan(
                user_a.get('nakshatra', 'Ashwini'),
                user_a.get('rashi', 'Aries'),
                user_b.get('nakshatra', 'Bharani'),
                user_b.get('rashi', 'Taurus')
            )
            astro_score = result['astroScore']
            guna_total = result['gunaTotal']
            return {
                'success': True,
                'astro_score': astro_score,
                'guna_total': guna_total,
                'max_possible': 36,
                'accuracy_percent': (guna_total / 36) * 100
            }
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    def evaluate_overall_compatibility(self, user_a, user_b):
        """Evaluate overall compatibility score."""
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
                    'band_label': result['bandLabel'],
                    'max_possible': 100
                }
            return {'success': False, 'error': 'Compatibility calculation failed'}
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def evaluate_accuracy(self):
        """Evaluate Vedic astronomical positioning accuracy across test cases."""
        print("\n" + "="*70)
        print("VEDIC ASTRONOMICAL POSITIONING ACCURACY")
        print("="*70)
        
        results = {
            'guna_milan': [],
            'overall_compatibility': [],
            'categories': {}
        }
        
        print(f"\nTesting {len(self.test_cases)} compatibility cases...\n")
        
        for test_case in self.test_cases:
            case_name = test_case['case']
            category = test_case['category']
            user_a = test_case['user_a']
            user_b = test_case['user_b']
            expected_min = test_case['expected_score_min']
            
            # Evaluate Guna Milan
            guna_result = self.evaluate_guna_milan(user_a, user_b)
            
            # Evaluate Overall Compatibility
            compat_result = self.evaluate_overall_compatibility(user_a, user_b)
            
            # Track results
            if guna_result['success']:
                results['guna_milan'].append({
                    'case': case_name,
                    'category': category,
                    'guna_total': guna_result['guna_total'],
                    'astro_score': guna_result['astro_score'],
                    'accuracy_percent': guna_result['accuracy_percent'],
                    'expected_min': expected_min,
                    'passed': guna_result['astro_score'] >= expected_min
                })
            
            if compat_result['success']:
                results['overall_compatibility'].append({
                    'case': case_name,
                    'category': category,
                    'overall_score': compat_result['overall_score'],
                    'band_label': compat_result['band_label'],
                    'astro_component': compat_result['astro_score'],
                    'expected_min': expected_min,
                    'passed': compat_result['overall_score'] >= expected_min
                })
            
            # Track by category
            if category not in results['categories']:
                results['categories'][category] = {
                    'guna_total': [],
                    'overall_score': []
                }
            
            if guna_result['success']:
                results['categories'][category]['guna_total'].append(guna_result['guna_total'])
            if compat_result['success']:
                results['categories'][category]['overall_score'].append(compat_result['overall_score'])
            
            # Print progress
            if compat_result['success']:
                status = "✓" if compat_result['overall_score'] >= expected_min else "✗"
                print(f"{status} {case_name:<40} Score: {compat_result['overall_score']:>6.1f}  "
                      f"({compat_result['band_label']})")
        
        # Calculate summary statistics
        summary = self._calculate_summary(results)
        return {**results, 'summary': summary}
    
    def _calculate_summary(self, results):
        """Calculate summary statistics."""
        summary = {}
        
        # Guna Milan summary
        if results['guna_milan']:
            guna_scores = [r['guna_total'] for r in results['guna_milan']]
            passed = [r['passed'] for r in results['guna_milan']]
            summary['guna_milan'] = {
                'avg_guna_total': round(np.mean(guna_scores), 2),
                'max_guna_total': max(guna_scores),
                'min_guna_total': min(guna_scores),
                'accuracy_percentage': round(sum(passed) / len(passed) * 100, 2) if passed else 0.0,
                'pass_count': sum(passed),
                'total_tests': len(passed)
            }
        
        # Overall compatibility summary
        if results['overall_compatibility']:
            compat_scores = [r['overall_score'] for r in results['overall_compatibility']]
            passed = [r['passed'] for r in results['overall_compatibility']]
            summary['overall_compatibility'] = {
                'avg_overall_score': round(np.mean(compat_scores), 2),
                'max_overall_score': max(compat_scores),
                'min_overall_score': min(compat_scores),
                'accuracy_percentage': round(sum(passed) / len(passed) * 100, 2) if passed else 0.0,
                'pass_count': sum(passed),
                'total_tests': len(passed)
            }
        
        # Category breakdown
        for category, scores in results['categories'].items():
            if scores['guna_total']:
                summary[f'{category}_guna'] = {
                    'avg': round(np.mean(scores['guna_total']), 2),
                    'count': len(scores['guna_total'])
                }
            if scores['overall_score']:
                summary[f'{category}_compat'] = {
                    'avg': round(np.mean(scores['overall_score']), 2),
                    'count': len(scores['overall_score'])
                }
        
        return summary


# ============================================================================
# JSON ENCODER FOR NUMPY TYPES
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

def load_synthetic_profiles():
    """Load synthetic profiles from JSON."""
    script_dir = os.path.dirname(os.path.abspath(__file__))
    profiles_path = os.path.join(script_dir, 'recommendation', 'synthetic_profiles.json')
    
    if not os.path.exists(profiles_path):
        print(f"Error: Synthetic profiles not found at {profiles_path}")
        return None
    
    with open(profiles_path, 'r') as f:
        return json.load(f)


def print_summary_report(rec_results, veda_results):
    """Print comprehensive summary report."""
    
    print("\n" + "="*70)
    print("FINAL ACCURACY SUMMARY")
    print("="*70)
    
    # Hybrid Recommendation Accuracy
    print("\n📊 HYBRID RECOMMENDATION SYSTEM:")
    print("-" * 70)
    
    test_results = rec_results['test']
    for model in test_results:
        print(f"  {model['model']:<20}")
        print(f"    Precision@{K}: {model[f'Precision@{K}']:.4f}")
        print(f"    Recall@{K}:    {model[f'Recall@{K}']:.4f}")
        print(f"    NDCG@{K}:      {model[f'NDCG@{K}']:.4f}")
        print(f"    F1@{K}:        {model[f'F1@{K}']:.4f}")
        print(f"    ➜ ACCURACY:    {model['accuracy_percentage']:.2f}%")
        print()
    
    # Find best model
    best_model = max(test_results, key=lambda x: x['accuracy_percentage'])
    print(f"🏆 Best Performing Model: {best_model['model']}")
    print(f"   Accuracy: {best_model['accuracy_percentage']:.2f}%\n")
    
    # Vedic Astronomical Accuracy
    print("📊 VEDIC ASTRONOMICAL POSITIONING:")
    print("-" * 70)
    
    veda_summary = veda_results['summary']
    
    if 'guna_milan' in veda_summary:
        gm = veda_summary['guna_milan']
        print(f"  Guna Milan Scoring:")
        print(f"    Average Guna Total:  {gm['avg_guna_total']:.2f}/36")
        print(f"    Accuracy:            {gm['accuracy_percentage']:.2f}%")
        print(f"    Tests Passed:        {gm['pass_count']}/{gm['total_tests']}")
        print()
    
    if 'overall_compatibility' in veda_summary:
        oc = veda_summary['overall_compatibility']
        print(f"  Overall Compatibility Scoring:")
        print(f"    Average Score:       {oc['avg_overall_score']:.2f}/100")
        print(f"    Accuracy:            {oc['accuracy_percentage']:.2f}%")
        print(f"    Tests Passed:        {oc['pass_count']}/{oc['total_tests']}")
        print()
    
    # Category breakdown
    print("  Accuracy by Compatibility Category:")
    for key, value in veda_summary.items():
        if 'compat' in key and isinstance(value, dict) and 'avg' in value:
            category_name = key.replace('_compat', '').replace('_', ' ').title()
            print(f"    {category_name:<25} Avg Score: {value['avg']:.2f}")


def save_results(rec_results, veda_results):
    """Save detailed results to JSON file."""
    script_dir = os.path.dirname(os.path.abspath(__file__))
    output_path = os.path.join(script_dir, 'comprehensive_evaluation_results.json')
    
    # Prepare comprehensive results
    comprehensive_results = {
        'timestamp': datetime.now().isoformat(),
        'hybrid_recommendation': {
            'test_results': rec_results['test'],
            'validation_results': rec_results['validation'],
            'config': rec_results['config']
        },
        'vedic_astronomical': {
            'guna_milan_results': veda_results['guna_milan'],
            'overall_compatibility_results': veda_results['overall_compatibility'],
            'summary': veda_results['summary']
        }
    }
    
    with open(output_path, 'w') as f:
        json.dump(comprehensive_results, f, indent=2, cls=NpEncoder)
    
    print(f"\n✓ Detailed results saved to: {output_path}")


def main():
    """Run comprehensive evaluation."""
    print("\n")
    print("╔" + "="*68 + "╗")
    print("║" + " "*68 + "║")
    print("║" + " COMPREHENSIVE TRAINING & TESTING EVALUATION".center(68) + "║")
    print("║" + " RaashiLink.ai Recommendation & Vedic Astrology Systems".center(68) + "║")
    print("║" + " "*68 + "║")
    print("╚" + "="*68 + "╝")
    
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    print(f"\nExecution Time: {timestamp}")
    
    # Load data
    print("\nLoading synthetic profiles...")
    profiles = load_synthetic_profiles()
    
    if profiles is None:
        print("Failed to load profiles. Exiting.")
        return
    
    print(f"✓ Loaded {len(profiles)} profiles")
    
    # Part 1: Hybrid Recommendation Evaluation
    rec_evaluator = HybridRecommendationEvaluator(random_seed=RANDOM_SEED)
    rec_results = rec_evaluator.train_and_evaluate(profiles)
    
    # Part 2: Vedic Astronomical Positioning Accuracy
    veda_evaluator = VedicAstronomicalEvaluator()
    veda_results = veda_evaluator.evaluate_accuracy()
    
    # Print summary reports
    print_summary_report(rec_results, veda_results)
    
    # Save comprehensive results
    save_results(rec_results, veda_results)


if __name__ == "__main__":
    main()
