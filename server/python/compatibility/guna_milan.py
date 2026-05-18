import json
import sys
import math
from server.python.compatibility.nakshatra_defs import NAKSHATRAS, GANA_BY_NAKSHATRA, normalize_nakshatra

# Rashi definitions (12)
RASHIS = [
    "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
    "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"
]

# Varna groups by nakshatra (Brahmin, Kshatriya, Vaishya, Shudra)
VARNA_GROUPS = [
    "Kshatriya", "Vaishya", "Brahmin", "Shudra", "Kshatriya", "Vaishya", "Shudra", "Brahmin", "Kshatriya", "Vaishya", "Shudra", "Brahmin",
    "Kshatriya", "Vaishya", "Shudra", "Brahmin", "Kshatriya", "Vaishya", "Shudra", "Brahmin", "Kshatriya", "Vaishya", "Shudra", "Brahmin", "Kshatriya", "Vaishya", "Shudra"
]

# Vashya groups by rashi
VASHYA_GROUPS = [
    "Chatushpada", "Chatushpada", "Manava", "Jalachara", "Vanachara", "Manava", "Keeta", "Jalachara", "Vanachara", "Chatushpada", "Manava", "Jalachara"
]

# Yoni animals by nakshatra
YONI_ANIMALS = [
    "Horse", "Elephant", "Sheep", "Serpent", "Dog", "Cat", "Rat", "Cow", "Buffalo",
    "Tiger", "Hare", "Monkey", "Mongoose", "Lion", "Horse", "Buffalo", "Tiger", "Hare",
    "Monkey", "Lion", "Mongoose", "Cow", "Elephant", "Sheep", "Serpent", "Dog", "Cat"
]

# Enemy pairs for Yoni (5 pairs)
YONI_ENEMIES = {
    "Cat": "Rat", "Rat": "Cat",
    "Cow": "Tiger", "Tiger": "Cow",
    "Elephant": "Lion", "Lion": "Elephant",
    "Horse": "Buffalo", "Buffalo": "Horse",
    "Serpent": "Mongoose", "Mongoose": "Serpent"
}


# Nadi by nakshatra
NADI_GROUPS = [
    "Adi", "Madhya", "Antya", "Adi", "Madhya", "Antya", "Adi", "Madhya", "Antya",
    "Adi", "Madhya", "Antya", "Adi", "Madhya", "Antya", "Adi", "Madhya", "Antya",
    "Adi", "Madhya", "Antya", "Adi", "Madhya", "Antya", "Adi", "Madhya", "Antya"
]

# Rashi lords
RASHI_LORDS = [
    "Mars", "Venus", "Mercury", "Moon", "Sun", "Mercury", "Venus", "Mars", "Jupiter", "Saturn", "Saturn", "Jupiter"
]

# Planetary friendships (simplified)
PLANET_FRIENDSHIPS = {
    "Sun": {"friends": ["Moon", "Mars", "Jupiter"], "enemies": ["Venus", "Saturn"], "neutrals": ["Mercury"]},
    "Moon": {"friends": ["Sun", "Mercury"], "enemies": [], "neutrals": ["Mars", "Jupiter", "Venus", "Saturn"]},
    "Mars": {"friends": ["Sun", "Moon", "Jupiter"], "enemies": ["Mercury"], "neutrals": ["Venus", "Saturn"]},
    "Mercury": {"friends": ["Sun", "Venus"], "enemies": ["Moon"], "neutrals": ["Mars", "Jupiter", "Saturn"]},
    "Jupiter": {"friends": ["Sun", "Moon", "Mars"], "enemies": [], "neutrals": ["Mercury", "Venus", "Saturn"]},
    "Venus": {"friends": ["Mercury", "Saturn"], "enemies": ["Sun", "Moon"], "neutrals": ["Mars", "Jupiter"]},
    "Saturn": {"friends": ["Mercury", "Venus"], "enemies": ["Sun", "Moon", "Mars"], "neutrals": ["Jupiter"]}
}

def get_nakshatra_index(nakshatra):
    name = normalize_nakshatra(nakshatra)
    return NAKSHATRAS.index(name) if name in NAKSHATRAS else -1

def get_rashi_index(rashi):
    return RASHIS.index(rashi) if rashi in RASHIS else -1

def score_varna(nak1, nak2):
    idx1 = get_nakshatra_index(nak1)
    idx2 = get_nakshatra_index(nak2)
    if idx1 == -1 or idx2 == -1:
        return 0
    return 1 if VARNA_GROUPS[idx1] == VARNA_GROUPS[idx2] else 0

def score_vashya(rashi1, rashi2):
    idx1 = get_rashi_index(rashi1)
    idx2 = get_rashi_index(rashi2)
    if idx1 == -1 or idx2 == -1:
        return 0
    g1 = VASHYA_GROUPS[idx1]
    g2 = VASHYA_GROUPS[idx2]
    if g1 == g2:
        return 2
    # Vashya (domination) relationships: Manava dominates Chatushpada, Jalachara, Vanachara
    # Jalachara dominates Keeta
    VASHYA_OVER = {
        "Manava":     {"Chatushpada", "Jalachara", "Vanachara"},
        "Jalachara":  {"Keeta"},
    }
    # 1 point if one side is vashya of the other (partial match)
    if g2 in VASHYA_OVER.get(g1, set()) or g1 in VASHYA_OVER.get(g2, set()):
        return 1
    return 0

def score_tara(nak1, nak2):
    idx1 = get_nakshatra_index(nak1)
    idx2 = get_nakshatra_index(nak2)
    if idx1 == -1 or idx2 == -1:
        return 0
    # Favorable Tara groups (0-indexed): Sampat(1), Kshema(3), Sadhana(5), Mitra(7), Parma Mitra(8)
    # Unfavorable: Janma(0), Vipat(2), Pratyak(4), Naidhana(6)
    FAVORABLE = {1, 3, 5, 7, 8}
    group_forward = ((idx2 - idx1) % 27) % 9   # nak1 → nak2
    group_backward = ((idx1 - idx2) % 27) % 9  # nak2 → nak1
    score = 0
    if group_forward in FAVORABLE:
        score += 1.5
    if group_backward in FAVORABLE:
        score += 1.5
    return score

def score_yoni(nak1, nak2):
    idx1 = get_nakshatra_index(nak1)
    idx2 = get_nakshatra_index(nak2)
    if idx1 == -1 or idx2 == -1:
        return 0
    animal1 = YONI_ANIMALS[idx1]
    animal2 = YONI_ANIMALS[idx2]
    if animal1 == animal2:
        return 4
    if YONI_ENEMIES.get(animal1) == animal2:
        return 0
    return 2

def score_graha_maitri(rashi1, rashi2):
    idx1 = get_rashi_index(rashi1)
    idx2 = get_rashi_index(rashi2)
    if idx1 == -1 or idx2 == -1:
        return 0
    lord1 = RASHI_LORDS[idx1]
    lord2 = RASHI_LORDS[idx2]
    if lord1 == lord2:
        return 5
    # Determine the relationship from each lord's perspective
    def rel(a, b):
        if b in PLANET_FRIENDSHIPS.get(a, {}).get("friends", []):
            return "friend"
        if b in PLANET_FRIENDSHIPS.get(a, {}).get("neutrals", []):
            return "neutral"
        return "enemy"
    r1 = rel(lord1, lord2)  # how lord1 sees lord2
    r2 = rel(lord2, lord1)  # how lord2 sees lord1
    # Combined bidirectional scoring (traditional Graha Maitri table)
    if r1 == "friend"  and r2 == "friend":  return 5
    if r1 == "friend"  and r2 == "neutral": return 4
    if r1 == "neutral" and r2 == "friend":  return 4
    if r1 == "neutral" and r2 == "neutral": return 3
    if r1 == "friend"  and r2 == "enemy":   return 1.5
    if r1 == "enemy"   and r2 == "friend":  return 1.5
    if r1 == "neutral" and r2 == "enemy":   return 0.5
    if r1 == "enemy"   and r2 == "neutral": return 0.5
    return 0  # both enemies

def score_gana(nak1, nak2):
    name1 = normalize_nakshatra(nak1)
    name2 = normalize_nakshatra(nak2)
    gana1 = GANA_BY_NAKSHATRA.get(name1)
    gana2 = GANA_BY_NAKSHATRA.get(name2)
    if not gana1 or not gana2:
        return 0
    if gana1 == gana2:
        return 6
    if {gana1, gana2} == {"Deva", "Manushya"}:
        return 5
    return 0

def score_bhakoot(rashi1, rashi2):
    idx1 = get_rashi_index(rashi1)
    idx2 = get_rashi_index(rashi2)
    if idx1 == -1 or idx2 == -1:
        return 0
    # Use 1-indexed directional forward count (traditional inclusive counting)
    # Bhakoot dosha: 2/12 relationship (forward=2 or 12) and 6/8 relationship (forward=6 or 8)
    forward = (idx2 - idx1) % 12 + 1
    if forward in [2, 6, 8, 12]:
        return 0
    return 7

def score_nadi(nak1, nak2):
    idx1 = get_nakshatra_index(nak1)
    idx2 = get_nakshatra_index(nak2)
    if idx1 == -1 or idx2 == -1:
        return 0
    nadi1 = NADI_GROUPS[idx1]
    nadi2 = NADI_GROUPS[idx2]
    return 0 if nadi1 == nadi2 else 8

def calculate_guna_milan(nakshatra1, rashi1, nakshatra2, rashi2):
    scores = {
        "varna": score_varna(nakshatra1, nakshatra2),
        "vashya": score_vashya(rashi1, rashi2),
        "tara": score_tara(nakshatra1, nakshatra2),
        "yoni": score_yoni(nakshatra1, nakshatra2),
        "grahaMaitri": score_graha_maitri(rashi1, rashi2),
        "gana": score_gana(nakshatra1, nakshatra2),
        "bhakoot": score_bhakoot(rashi1, rashi2),
        "nadi": score_nadi(nakshatra1, nakshatra2)
    }
    guna_total = sum(scores.values())
    astro_score = (guna_total / 36) * 40  # Scale to 40 points
    return {
        "scores": scores,
        "gunaTotal": guna_total,
        "astroScore": astro_score
    }
