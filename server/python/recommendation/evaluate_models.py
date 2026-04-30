"""
evaluate_models.py
------------------
Offline evaluation of Content-Based, Collaborative, and Hybrid recommendation models
using a 70/15/15 train/validation/test split on synthetic_profiles.json.

Ground-truth relevance: a candidate profile is "relevant" to a query profile if
their compatibility score (cosine similarity on feature vectors) >= RELEVANCE_THRESHOLD.

Metrics computed:
  - Precision@K  : fraction of top-K recommendations that are relevant
  - Recall@K     : fraction of all relevant profiles that appear in top-K
  - NDCG@K       : normalised discounted cumulative gain
  - F1@K         : harmonic mean of Precision@K and Recall@K
"""

import json
import os
import sys
import random
import math
import pickle
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.decomposition import TruncatedSVD
from scipy.sparse import csr_matrix

sys.path.insert(0, os.path.dirname(__file__))
from content_based import build_feature_vector, train_content_model, recommend_content_based
from collaborative_filter import build_interaction_matrix, train_collaborative_model, recommend_collaborative
from hybrid_engine import hybrid_recommend

# ── Configuration ────────────────────────────────────────────────────────────
RANDOM_SEED        = 42
TRAIN_RATIO        = 0.70   # 3,500 profiles
VAL_RATIO          = 0.15   #   750 profiles
TEST_RATIO         = 0.15   #   750 profiles
RELEVANCE_THRESHOLD = 0.75  # cosine similarity >= 0.75 → relevant
K                  = 10     # Precision@K, Recall@K, NDCG@K
EVAL_SAMPLE        = 200    # number of query profiles to evaluate per split (for speed)
INTERACTION_COUNT  = 10     # simulated interaction count for hybrid alpha


# ── Utility: split dataset ────────────────────────────────────────────────────
def split_profiles(profiles):
    random.seed(RANDOM_SEED)
    shuffled = profiles[:]
    random.shuffle(shuffled)
    n = len(shuffled)
    train_end = int(n * TRAIN_RATIO)
    val_end   = train_end + int(n * VAL_RATIO)
    return shuffled[:train_end], shuffled[train_end:val_end], shuffled[val_end:]


# ── Synthetic user preferences: assign random 'likes' for each user ───────────
def assign_synthetic_likes(profiles, likes_per_user=20, seed=42):
    """Assign a set of random liked profile IDs to each user profile."""
    random.seed(seed)
    id_set = set(p['id'] for p in profiles)
    for p in profiles:
        possible = list(id_set - {p['id']})
        p['synthetic_likes'] = set(random.sample(possible, min(likes_per_user, len(possible))))
    return profiles

# ── Ground-truth relevance: based on synthetic likes ─────────────────────────
def build_relevance_labels(query_profile, candidate_profiles):
    """Return set of candidate IDs that are relevant to query_profile (synthetic likes)."""
    return set(query_profile.get('synthetic_likes', []))


# ── Metric functions ──────────────────────────────────────────────────────────
def precision_at_k(recommended_ids, relevant_ids, k):
    top_k = recommended_ids[:k]
    if not top_k:
        return 0.0
    return len(set(top_k) & relevant_ids) / k


def recall_at_k(recommended_ids, relevant_ids, k):
    if not relevant_ids:
        return 0.0
    top_k = recommended_ids[:k]
    return len(set(top_k) & relevant_ids) / len(relevant_ids)


def dcg_at_k(recommended_ids, relevant_ids, k):
    dcg = 0.0
    for i, uid in enumerate(recommended_ids[:k]):
        rel = 1 if uid in relevant_ids else 0
        dcg += rel / math.log2(i + 2)
    return dcg


def ndcg_at_k(recommended_ids, relevant_ids, k):
    actual_dcg = dcg_at_k(recommended_ids, relevant_ids, k)
    ideal_hits  = min(k, len(relevant_ids))
    ideal_dcg   = sum(1.0 / math.log2(i + 2) for i in range(ideal_hits))
    if ideal_dcg == 0:
        return 0.0
    return actual_dcg / ideal_dcg


def f1_at_k(p, r):
    if p + r == 0:
        return 0.0
    return 2 * p * r / (p + r)


# ── Simulate interactions for CF ──────────────────────────────────────────────
def simulate_interactions(profiles, num_interactions_per_user=5):
    """Create synthetic interaction list based on top-5 content similarity."""
    interactions = []
    vecs = np.array([build_feature_vector(p) for p in profiles])
    ids  = [p['id'] for p in profiles]
    sims = cosine_similarity(vecs)

    for i, uid in enumerate(ids):
        row  = sims[i].copy()
        row[i] = -1  # exclude self
        top_idxs = np.argsort(row)[-num_interactions_per_user:]
        for j in top_idxs:
            interactions.append({'userId': uid, 'targetId': ids[j], 'score': float(row[j])})

    return interactions


# ── Evaluate one model on a set of query profiles ────────────────────────────
def evaluate(model_name, recommend_fn, query_profiles, candidate_profiles, k=K):
    precisions, recalls, ndcgs, f1s = [], [], [], []

    for qp in query_profiles:
        relevant = build_relevance_labels(qp, candidate_profiles)
        if not relevant:
            continue

        recs = recommend_fn(qp)
        rec_ids = [r.get('userId') or r.get('id') for r in recs]

        p = precision_at_k(rec_ids, relevant, k)
        r = recall_at_k(rec_ids, relevant, k)
        n = ndcg_at_k(rec_ids, relevant, k)
        f = f1_at_k(p, r)

        precisions.append(p)
        recalls.append(r)
        ndcgs.append(n)
        f1s.append(f)

    result = {
        'model':              model_name,
        'sample_size':        len(precisions),
        f'Precision@{k}':     round(np.mean(precisions), 4) if precisions else 0.0,
        f'Recall@{k}':        round(np.mean(recalls),    4) if recalls    else 0.0,
        f'NDCG@{k}':          round(np.mean(ndcgs),      4) if ndcgs      else 0.0,
        f'F1@{k}':            round(np.mean(f1s),        4) if f1s        else 0.0,
        'relevance_threshold': RELEVANCE_THRESHOLD,
        'K':                   k,
    }
    return result


# ── Main ──────────────────────────────────────────────────────────────────────
# ── Main ──────────────────────────────────────────────────────────────────────
def main():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    profiles_path = os.path.join(script_dir, 'synthetic_profiles.json')

    print(f"Loading profiles from {profiles_path} ...")
    with open(profiles_path, 'r') as f:
        profiles = json.load(f)

    print(f"Total profiles: {len(profiles)}")

    # Assign synthetic likes to all profiles
    profiles = assign_synthetic_likes(profiles, likes_per_user=20, seed=RANDOM_SEED)

    # Split
    train_profiles, val_profiles, test_profiles = split_profiles(profiles)
    print(f"Split → Train: {len(train_profiles)}  Val: {len(val_profiles)}  Test: {len(test_profiles)}")

    # ── Train content-based model on training set ──────────────────────────────
    print("\nTraining content-based model on training split ...")
    cb_model_path = os.path.join(script_dir, 'models', 'eval_content_model.pkl')
    os.makedirs(os.path.dirname(cb_model_path), exist_ok=True)

    cb_vecs = np.array([build_feature_vector(p) for p in train_profiles])
    cb_ids  = [p['id'] for p in train_profiles]
    cb_model = {'vectors': cb_vecs, 'ids': cb_ids}
    with open(cb_model_path, 'wb') as f:
        pickle.dump(cb_model, f)
    print("  Content model saved.")

    # ── Train collaborative model on training set ──────────────────────────────
    print("Simulating interactions & training collaborative model ...")
    interactions = simulate_interactions(train_profiles, num_interactions_per_user=5)
    cf_model_path = os.path.join(script_dir, 'models', 'eval_cf_model.pkl')

    result = build_interaction_matrix(interactions)
    if result:
        matrix, user_ids = result
        n_comp = min(20, matrix.shape[0] - 1)
        svd = TruncatedSVD(n_components=n_comp, random_state=RANDOM_SEED)
        user_embeddings = svd.fit_transform(matrix)
        cf_model = {'user_embeddings': user_embeddings, 'user_ids': user_ids, 'svd': svd}
        with open(cf_model_path, 'wb') as f:
            pickle.dump(cf_model, f)
        print(f"  CF model saved (SVD n_components={n_comp}).")
    else:
        cf_model = None
        print("  CF model could not be trained (empty interaction matrix).")

    # ── Recommendation wrappers using eval models ──────────────────────────────
    def cb_recommend(query_profile):
        q_vec = build_feature_vector(query_profile).reshape(1, -1)
        sims  = cosine_similarity(q_vec, cb_model['vectors'])[0]
        recs  = []
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

    # ── Sample query profiles from validation set ──────────────────────────────
    random.seed(RANDOM_SEED)
    val_queries  = random.sample(val_profiles,  min(EVAL_SAMPLE, len(val_profiles)))
    test_queries = random.sample(test_profiles, min(EVAL_SAMPLE, len(test_profiles)))

    # ── Evaluate on validation set ─────────────────────────────────────────────
    print(f"\n{'='*60}")
    print(f"VALIDATION SET  (n={len(val_queries)} query profiles, K={K})")
    print(f"{'='*60}")
    results_val = []
    for name, fn in [("Content-Based", cb_recommend), ("Collaborative", cf_recommend), ("Hybrid", hybrid_rec)]:
        print(f"  Evaluating {name} ...")
        res = evaluate(name, fn, val_queries, val_profiles + train_profiles, k=K)
        results_val.append(res)
        print(f"    Precision@{K}: {res[f'Precision@{K}']:.4f}  "
              f"Recall@{K}: {res[f'Recall@{K}']:.4f}  "
              f"NDCG@{K}: {res[f'NDCG@{K}']:.4f}  "
              f"F1@{K}: {res[f'F1@{K}']:.4f}")

    # ── Evaluate on test set ───────────────────────────────────────────────────
    print(f"\n{'='*60}")
    print(f"TEST SET  (n={len(test_queries)} query profiles, K={K})")
    print(f"{'='*60}")
    results_test = []
    for name, fn in [("Content-Based", cb_recommend), ("Collaborative", cf_recommend), ("Hybrid", hybrid_rec)]:
        print(f"  Evaluating {name} ...")
        res = evaluate(name, fn, test_queries, test_profiles + train_profiles, k=K)
        results_test.append(res)
        print(f"    Precision@{K}: {res[f'Precision@{K}']:.4f}  "
              f"Recall@{K}: {res[f'Recall@{K}']:.4f}  "
              f"NDCG@{K}: {res[f'NDCG@{K}']:.4f}  "
              f"F1@{K}: {res[f'F1@{K}']:.4f}")

    # ── Save results to JSON ───────────────────────────────────────────────────
    output = {
        "config": {
            "total_profiles":       len(profiles),
            "train_size":           len(train_profiles),
            "val_size":             len(val_profiles),
            "test_size":            len(test_profiles),
            "relevance_threshold":  RELEVANCE_THRESHOLD,
            "K":                    K,
            "eval_sample_per_split": EVAL_SAMPLE,
            "interaction_count_for_hybrid": INTERACTION_COUNT,
            "random_seed":          RANDOM_SEED,
        },
        "validation_results": results_val,
        "test_results":        results_test,
    }

    output_path = os.path.join(script_dir, 'evaluation_results.json')
    with open(output_path, 'w') as f:
        json.dump(output, f, indent=2)
    print(f"\nResults saved to {output_path}")

    # ── Summary table ──────────────────────────────────────────────────────────
    print(f"\n{'='*60}")
    print("SUMMARY TABLE (Validation Set)")
    print(f"{'Model':<20} {'P@10':>8} {'R@10':>8} {'NDCG@10':>10} {'F1@10':>8} {'n':>6}")
    print(f"{'-'*20} {'-'*8} {'-'*8} {'-'*10} {'-'*8} {'-'*6}")
    for r in results_val:
        print(f"{r['model']:<20} {r[f'Precision@{K}']:>8.4f} {r[f'Recall@{K}']:>8.4f} "
              f"{r[f'NDCG@{K}']:>10.4f} {r[f'F1@{K}']:>8.4f} {r['sample_size']:>6}")


if __name__ == "__main__":
    main()
