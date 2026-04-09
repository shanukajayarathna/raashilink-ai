import numpy as np
from sklearn.metrics.pairwise import cosine_similarity

def personality_score(traits_a, traits_b):
    # Big Five: openness, conscientiousness, extraversion, agreeableness, neuroticism
    vec_a = np.array([
        traits_a.get('openness', 0.5),
        traits_a.get('conscientiousness', 0.5),
        traits_a.get('extraversion', 0.5),
        traits_a.get('agreeableness', 0.5),
        traits_a.get('neuroticism', 0.5)
    ]).reshape(1, -1)

    vec_b = np.array([
        traits_b.get('openness', 0.5),
        traits_b.get('conscientiousness', 0.5),
        traits_b.get('extraversion', 0.5),
        traits_b.get('agreeableness', 0.5),
        traits_b.get('neuroticism', 0.5)
    ]).reshape(1, -1)

    similarity = cosine_similarity(vec_a, vec_b)[0][0]
    personality_score = similarity * 25  # Scale to 25 points
    return {
        "personalityScore": personality_score,
        "similarity": similarity
    }

def lifestyle_score(lifestyle_a, lifestyle_b):
    score = 0

    # Diet match: 5 points
    if lifestyle_a.get('diet') and lifestyle_b.get('diet') and lifestyle_a['diet'] == lifestyle_b['diet']:
        score += 5

    # Smoking match: 3 points
    if lifestyle_a.get('smoking') and lifestyle_b.get('smoking') and lifestyle_a['smoking'] == lifestyle_b['smoking']:
        score += 3

    # Drinking match: 3 points
    if lifestyle_a.get('drinking') and lifestyle_b.get('drinking') and lifestyle_a['drinking'] == lifestyle_b['drinking']:
        score += 3

    # Hobbies overlap: 1 point each up to 5 max
    hobbies_a = set(lifestyle_a.get('hobbies', []))
    hobbies_b = set(lifestyle_b.get('hobbies', []))
    overlap = len(hobbies_a & hobbies_b)
    score += min(overlap, 5)

    # Profession type match: 4 points
    if lifestyle_a.get('professionType') and lifestyle_b.get('professionType') and lifestyle_a['professionType'] == lifestyle_b['professionType']:
        score += 4

    return {
        "lifestyleScore": score
    }

def family_values_score(family_a, family_b):
    # Use familyValues (0-1 scale)
    val_a = family_a.get('familyValues', 0.5)
    val_b = family_b.get('familyValues', 0.5)
    difference = abs(val_a - val_b)
    # Scale: if difference <= 0.2, full 15 points, linear decrease
    if difference <= 0.2:
        score = 15
    else:
        score = max(0, 15 * (1 - (difference - 0.2) / 0.8))
    return {
        "familyScore": score
    }
