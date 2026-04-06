import json
import math
import sys
from datetime import datetime

try:
    import swisseph as swe
except ImportError:
    swe = None


NAKSHATRA_LORDS = [
    "Ketu", "Venus", "Sun", "Moon", "Mars", "Rahu", "Jupiter", "Saturn", "Mercury",
    "Ketu", "Venus", "Sun", "Moon", "Mars", "Rahu", "Jupiter", "Saturn", "Mercury",
    "Ketu", "Venus", "Sun", "Moon", "Mars", "Rahu", "Jupiter", "Jupiter", "Mercury",
]
GANA_GROUPS = ["Deva", "Manushya", "Rakshasa"]
NADI_GROUPS = ["Adi", "Madhya", "Antya"]
VARNA_BY_SIGN = ["Kshatriya", "Vaishya", "Shudra", "Brahmin", "Kshatriya", "Vaishya", "Shudra", "Brahmin", "Kshatriya", "Vaishya", "Shudra", "Brahmin"]
VASHYA_BY_SIGN = ["Chatushpada", "Chatushpada", "Manava", "Jalachara", "Vanachara", "Manava", "Keeta", "Jalachara", "Vanachara", "Chatushpada", "Manava", "Jalachara"]
YONI_BY_NAKSHATRA = [
    "Horse", "Elephant", "Sheep", "Serpent", "Dog", "Cat", "Rat", "Cow", "Buffalo",
    "Tiger", "Hare", "Monkey", "Mongoose", "Lion", "Horse", "Buffalo", "Tiger", "Hare",
    "Monkey", "Lion", "Mongoose", "Cow", "Elephant", "Sheep", "Serpent", "Dog", "Cat"
]
GANA_BY_NAKSHATRA = [GANA_GROUPS[index % 3] for index in range(27)]
NADI_BY_NAKSHATRA = [NADI_GROUPS[index % 3] for index in range(27)]


def parse_datetime(date_of_birth: str, time_of_birth: str) -> datetime:
    return datetime.fromisoformat(f"{date_of_birth[:10]}T{time_of_birth}")


def fallback_moon_longitude(dt: datetime) -> float:
    day_seed = dt.toordinal() + dt.hour / 24 + dt.minute / 1440
    return (day_seed * 13.1764 * 11.3) % 360


def moon_longitude(horoscope: dict) -> float:
    dt = parse_datetime(horoscope["dateOfBirth"], horoscope["timeOfBirth"])

    if swe is None:
      return fallback_moon_longitude(dt)

    latitude = horoscope["placeOfBirth"]["latitude"]
    longitude = horoscope["placeOfBirth"]["longitude"]
    timezone = horoscope["placeOfBirth"].get("timezone", "Asia/Colombo")

    # Minimal timezone handling for API interoperability.
    if timezone == "Asia/Colombo":
        offset_hours = 5.5
    else:
        offset_hours = 0

    julian_day = swe.julday(
        dt.year,
        dt.month,
        dt.day,
        dt.hour + dt.minute / 60 + dt.second / 3600 - offset_hours,
    )
    position, _ = swe.calc_ut(julian_day, swe.MOON)
    return position[0] % 360


def nakshatra_index(longitude: float) -> int:
    return int(longitude / (360 / 27)) % 27


def sign_index(longitude: float) -> int:
    return int(longitude / 30) % 12


def score_varna(sign_a: int, sign_b: int) -> float:
    return 1 if VARNA_BY_SIGN[sign_a] == VARNA_BY_SIGN[sign_b] else 0


def score_vashya(sign_a: int, sign_b: int) -> float:
    return 2 if VASHYA_BY_SIGN[sign_a] == VASHYA_BY_SIGN[sign_b] else 1


def score_tara(nak_a: int, nak_b: int) -> float:
    distance = abs(nak_a - nak_b) + 1
    return 3 if distance % 9 in [1, 3, 5, 7] else 1.5


def score_yoni(nak_a: int, nak_b: int) -> float:
    return 4 if YONI_BY_NAKSHATRA[nak_a] == YONI_BY_NAKSHATRA[nak_b] else 2


def score_graha_maitri(sign_a: int, sign_b: int) -> float:
    difference = min((sign_a - sign_b) % 12, (sign_b - sign_a) % 12)
    return max(0, 5 - difference * 0.75)


def score_gana(nak_a: int, nak_b: int) -> float:
    return 6 if GANA_BY_NAKSHATRA[nak_a] == GANA_BY_NAKSHATRA[nak_b] else 3


def score_bhakoot(sign_a: int, sign_b: int) -> float:
    distance = abs(sign_a - sign_b)
    return 7 if distance not in [2, 6, 8] else 0


def score_nadi(nak_a: int, nak_b: int) -> float:
    return 0 if NADI_BY_NAKSHATRA[nak_a] == NADI_BY_NAKSHATRA[nak_b] else 8


def compute_scores(user_a: dict, user_b: dict) -> dict:
    longitude_a = moon_longitude(user_a)
    longitude_b = moon_longitude(user_b)

    nak_a = nakshatra_index(longitude_a)
    nak_b = nakshatra_index(longitude_b)
    sign_a = sign_index(longitude_a)
    sign_b = sign_index(longitude_b)

    sub_scores = {
        "varna": score_varna(sign_a, sign_b),
        "vashya": score_vashya(sign_a, sign_b),
        "tara": score_tara(nak_a, nak_b),
        "yoni": score_yoni(nak_a, nak_b),
        "grahaMaitri": round(score_graha_maitri(sign_a, sign_b), 2),
        "gana": score_gana(nak_a, nak_b),
        "bhakoot": score_bhakoot(sign_a, sign_b),
        "nadi": score_nadi(nak_a, nak_b),
    }

    total = round(sum(sub_scores.values()), 2)

    return {
        "subScores": sub_scores,
        "totalScore": total,
        "meta": {
            "userANakshatraIndex": nak_a,
            "userBNakshatraIndex": nak_b,
            "userAMoonLongitude": round(longitude_a, 4),
            "userBMoonLongitude": round(longitude_b, 4),
        },
    }


def main() -> None:
    try:
        payload = json.loads(sys.stdin.read())
        result = compute_scores(payload["userA"], payload["userB"])
        sys.stdout.write(json.dumps(result))
    except Exception as exc:
        sys.stderr.write(str(exc))
        sys.exit(1)


if __name__ == "__main__":
    main()
