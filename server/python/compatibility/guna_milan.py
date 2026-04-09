import json
import sys
import math

# Nakshatra definitions (27)
NAKSHATRAS = [
    "Ashwini", "Bharani", "Krittika", "Rohini", "Mrigashira", "Ardra",
    "Punarvasu", "Pushya", "Ashlesha", "Magha", "Purva Phalguni", "Uttara Phalguni",
    "Hasta", "Chitra", "Swati", "Vishakha", "Anuradha", "Jyeshtha",
    "Mula", "Purva Ashadha", "Uttara Ashadha", "Shravana", "Dhanishta", "Shatabhisha",
    "Purva Bhadrapada", "Uttara Bhadrapada", "Revati"
]

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

# Gana by nakshatra
GANA_GROUPS = [
    "Deva", "Manushya", "Rakshasa", "Deva", "Manushya", "Rakshasa", "Deva", "Manushya", "Rakshasa",
    "Deva", "Manushya", "Rakshasa", "Deva", "Manushya", "Rakshasa", "Deva", "Manushya", "Rakshasa",
    "Deva", "Manushya", "Rakshasa", "Deva", "Manushya", "Rakshasa", "Deva", "Manushya", "Rakshasa"
]

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
    return NAKSHATRAS.index(nakshatra) if nakshatra in NAKSHATRAS else -1

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
    return 2 if VASHYA_GROUPS[idx1] == VASHYA_GROUPS[idx2] else 1

def score_tara(nak1, nak2):
    idx1 = get_nakshatra_index(nak1)
    idx2 = get_nakshatra_index(nak2)
    if idx1 == -1 or idx2 == -1:
        return 0
    distance = (idx2 - idx1) % 27
    tara_group = distance % 9
    return 3 if tara_group in [1, 3, 5, 7] else 1.5

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
    friends = PLANET_FRIENDSHIPS.get(lord1, {}).get("friends", [])
    if lord2 in friends:
        return 5
    neutrals = PLANET_FRIENDSHIPS.get(lord1, {}).get("neutrals", [])
    if lord2 in neutrals:
        return 2.5
    return 0

def score_gana(nak1, nak2):
    idx1 = get_nakshatra_index(nak1)
    idx2 = get_nakshatra_index(nak2)
    if idx1 == -1 or idx2 == -1:
        return 0
    gana1 = GANA_GROUPS[idx1]
    gana2 = GANA_GROUPS[idx2]
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
    distance = abs(idx1 - idx2)
    if distance in [2, 6, 8]:
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
