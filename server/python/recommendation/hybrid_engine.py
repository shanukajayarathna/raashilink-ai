import json
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from content_based import recommend_content_based
from collaborative_filter import recommend_collaborative

def hybrid_recommend(user_profile, top_n=10, exclude_ids=None, interaction_count=0):
    """Hybrid recommendation combining content-based and collaborative filtering."""
    if exclude_ids is None:
        exclude_ids = []
    
    # Alpha increases with interaction count (0 to 0.7)
    alpha = min(0.7, interaction_count / 50.0)
    
    # Get recommendations from both engines
    cb_recs = recommend_content_based(user_profile, top_n=top_n*2, exclude_ids=exclude_ids)
    cf_recs = recommend_collaborative(user_profile.get('id', ''), top_n=top_n*2, exclude_ids=exclude_ids)
    
    # Merge recommendations
    all_recs = {}
    
    # Content-based (weight: 1-alpha)
    for rec in cb_recs:
        user_id = rec['userId']
        score = rec['cbScore'] * (1 - alpha)
        if user_id not in all_recs:
            all_recs[user_id] = 0
        all_recs[user_id] += score
    
    # Collaborative (weight: alpha)
    for rec in cf_recs:
        user_id = rec['userId']
        score = rec['cfScore'] * alpha
        if user_id not in all_recs:
            all_recs[user_id] = 0
        all_recs[user_id] += score
    
    # Sort and return top N
    recommendations = [{'userId': uid, 'hybridScore': score} for uid, score in all_recs.items()]
    recommendations.sort(key=lambda x: x['hybridScore'], reverse=True)
    
    return recommendations[:top_n]

def main():
    if len(sys.argv) != 2:
        print(json.dumps({"success": False, "error": "Invalid arguments"}))
        sys.exit(1)
    
    try:
        data = json.loads(sys.argv[1])
        user_profile = data.get('userProfile', {})
        top_n = data.get('topN', 10)
        exclude_ids = data.get('excludeIds', [])
        interaction_count = data.get('interactionCount', 0)
        
        recommendations = hybrid_recommend(user_profile, top_n=top_n, exclude_ids=exclude_ids, interaction_count=interaction_count)
        
        print(json.dumps({
            "success": True,
            "recommendations": recommendations
        }))
    except json.JSONDecodeError:
        print(json.dumps({"success": False, "error": "Invalid JSON input"}))
    except Exception as e:
        print(json.dumps({"success": False, "error": str(e)}))

if __name__ == "__main__":
    main()
