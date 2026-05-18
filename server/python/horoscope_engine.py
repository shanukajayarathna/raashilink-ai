import json
import sys
import os
import math
from datetime import datetime
from zoneinfo import ZoneInfo
from server.python.compatibility.nakshatra_defs import NAKSHATRAS, GANA_BY_NAKSHATRA, normalize_nakshatra

try:
    import swisseph as swe
except ImportError:
    print(json.dumps({"success": False, "error": "pyswisseph not installed"}))
    sys.exit(1)

# Set ephemeris path
ephe_path = os.path.join(os.path.dirname(__file__), 'ephe')
swe.set_ephe_path(ephe_path)

# Set Lahiri ayanamsa for Vedic astrology
swe.set_sid_mode(swe.SIDM_LAHIRI)

# Planet constants
PLANETS = [
    (swe.SUN, "Sun"),
    (swe.MOON, "Moon"),
    (swe.MARS, "Mars"),
    (swe.MERCURY, "Mercury"),
    (swe.JUPITER, "Jupiter"),
    (swe.VENUS, "Venus"),
    (swe.SATURN, "Saturn"),
    (swe.TRUE_NODE, "Rahu")
]

# Zodiac signs
SIGNS = [
    "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
    "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"
]

SHUKLA_TITHIS = [
    "Pratipada", "Dwitiya", "Tritiya", "Chaturthi", "Panchami", "Shashthi", "Saptami",
    "Ashtami", "Navami", "Dashami", "Ekadashi", "Dwadashi", "Trayodashi", "Chaturdashi", "Purnima"
]

KRISHNA_TITHIS = [
    "Pratipada", "Dwitiya", "Tritiya", "Chaturthi", "Panchami", "Shashthi", "Saptami",
    "Ashtami", "Navami", "Dashami", "Ekadashi", "Dwadashi", "Trayodashi", "Chaturdashi", "Amavasya"
]

YOGAS = [
    "Vishkambha", "Priti", "Ayushman", "Saubhagya", "Shobhana", "Atiganda", "Sukarma",
    "Dhriti", "Shoola", "Ganda", "Vriddhi", "Dhruva", "Vyaghata", "Harshana", "Vajra",
    "Siddhi", "Vyatipata", "Variyana", "Parigha", "Shiva", "Siddha", "Sadhya", "Shubha",
    "Shukla", "Brahma", "Indra", "Vaidhriti"
]

REPEATING_KARANAS = ["Bava", "Balava", "Kaulava", "Taitila", "Garaja", "Vanija", "Vishti"]

# ── Planet Dignity Tables (Vedic / Sidereal) ──────────────────────────────
PLANET_DIGNITY = {
    "Sun":     {"exalt": "Aries",       "debil": "Libra",        "own": ["Leo"]},
    "Moon":    {"exalt": "Taurus",      "debil": "Scorpio",      "own": ["Cancer"]},
    "Mars":    {"exalt": "Capricorn",   "debil": "Cancer",       "own": ["Aries", "Scorpio"]},
    "Mercury": {"exalt": "Virgo",       "debil": "Pisces",       "own": ["Gemini", "Virgo"]},
    "Jupiter": {"exalt": "Cancer",      "debil": "Capricorn",    "own": ["Sagittarius", "Pisces"]},
    "Venus":   {"exalt": "Pisces",      "debil": "Virgo",        "own": ["Taurus", "Libra"]},
    "Saturn":  {"exalt": "Libra",       "debil": "Aries",        "own": ["Capricorn", "Aquarius"]},
    "Rahu":    {"exalt": "Gemini",      "debil": "Sagittarius",  "own": []},
    "Ketu":    {"exalt": "Sagittarius", "debil": "Gemini",       "own": []},
}

def get_planet_dignity(planet, sign):
    d = PLANET_DIGNITY.get(planet)
    if not d:
        return "Normal"
    if sign == d["exalt"]:
        return "Exalted"
    if sign == d["debil"]:
        return "Debilitated"
    if sign in d["own"]:
        return "Own Sign"
    return "Normal"

# ── Rajju (5 types, repeating over 27 nakshatras) ─────────────────────────
# Shiro, Kanta, Udara, Kati, Pada — in groups of 3 nakshatras each cycle
RAJJU_BY_NAKSHATRA = {
    "Ashwini": "Pada",         "Bharani": "Pada",         "Krittika": "Pada",
    "Rohini": "Kanta",         "Mrigashira": "Kanta",     "Ardra": "Kanta",
    "Punarvasu": "Shiro",      "Pushya": "Shiro",         "Ashlesha": "Shiro",
    "Magha": "Kanta",          "Purva Phalguni": "Kanta", "Uttara Phalguni": "Kanta",
    "Hasta": "Udara",          "Chitra": "Udara",         "Swati": "Udara",
    "Vishakha": "Kati",        "Anuradha": "Kati",        "Jyeshtha": "Kati",
    "Mula": "Pada",            "Purva Ashadha": "Pada",   "Uttara Ashadha": "Pada",
    "Shravana": "Kanta",       "Dhanishta": "Kanta",      "Shatabhisha": "Kanta",
    "Purva Bhadrapada": "Shiro","Uttara Bhadrapada": "Shiro","Revati": "Shiro",
}

# ── Nadi (Vata/Pitta/Kapha, repeating over 27 nakshatras) ─────────────────
NADI_BY_NAKSHATRA = {
    "Ashwini": "Vata",         "Bharani": "Pitta",        "Krittika": "Kapha",
    "Rohini": "Vata",          "Mrigashira": "Pitta",     "Ardra": "Kapha",
    "Punarvasu": "Vata",       "Pushya": "Pitta",         "Ashlesha": "Kapha",
    "Magha": "Vata",           "Purva Phalguni": "Pitta", "Uttara Phalguni": "Kapha",
    "Hasta": "Vata",           "Chitra": "Pitta",         "Swati": "Kapha",
    "Vishakha": "Vata",        "Anuradha": "Pitta",       "Jyeshtha": "Kapha",
    "Mula": "Vata",            "Purva Ashadha": "Pitta",  "Uttara Ashadha": "Kapha",
    "Shravana": "Vata",        "Dhanishta": "Pitta",      "Shatabhisha": "Kapha",
    "Purva Bhadrapada": "Vata","Uttara Bhadrapada": "Pitta","Revati": "Kapha",
}

# ── Yoni (animal symbol, 14 pairs) ────────────────────────────────────────
YONI_BY_NAKSHATRA = {
    "Ashwini": "Horse",        "Bharani": "Elephant",     "Krittika": "Sheep",
    "Rohini": "Snake",         "Mrigashira": "Serpent",   "Ardra": "Dog",
    "Punarvasu": "Cat",        "Pushya": "Sheep",         "Ashlesha": "Cat",
    "Magha": "Rat",            "Purva Phalguni": "Rat",   "Uttara Phalguni": "Cow",
    "Hasta": "Buffalo",        "Chitra": "Tiger",         "Swati": "Buffalo",
    "Vishakha": "Tiger",       "Anuradha": "Deer",        "Jyeshtha": "Deer",
    "Mula": "Dog",             "Purva Ashadha": "Monkey", "Uttara Ashadha": "Mongoose",
    "Shravana": "Monkey",      "Dhanishta": "Lion",       "Shatabhisha": "Horse",
    "Purva Bhadrapada": "Lion","Uttara Bhadrapada": "Cow","Revati": "Elephant",
}

# Enemy yoni pairs (same yoni also = dosha at max level)
YONI_ENEMIES = {
    "Horse": "Buffalo", "Buffalo": "Horse",
    "Tiger": "Deer",    "Deer": "Tiger",
    "Dog": "Deer",      "Deer": "Dog",
    "Cat": "Rat",       "Rat": "Cat",
    "Cow": "Tiger",     "Tiger": "Cow",
    "Elephant": "Lion", "Lion": "Elephant",
    "Snake": "Mongoose","Mongoose": "Snake",
    "Monkey": "Sheep",  "Sheep": "Monkey",
}

# ── Rasi Athipathi (lord of Moon sign) ────────────────────────────────────
RASI_LORD = {
    "Aries": "Mars",   "Taurus": "Venus",  "Gemini": "Mercury",
    "Cancer": "Moon",  "Leo": "Sun",       "Virgo": "Mercury",
    "Libra": "Venus",  "Scorpio": "Mars",  "Sagittarius": "Jupiter",
    "Capricorn": "Saturn","Aquarius": "Saturn","Pisces": "Jupiter",
}

# Friendly lords for Rasi Athipathi Porutham
RASI_LORD_FRIENDS = {
    "Sun":     {"Moon", "Mars", "Jupiter"},
    "Moon":    {"Sun", "Mercury"},
    "Mars":    {"Sun", "Moon", "Jupiter"},
    "Mercury": {"Sun", "Venus"},
    "Jupiter": {"Sun", "Moon", "Mars"},
    "Venus":   {"Mercury", "Saturn"},
    "Saturn":  {"Mercury", "Venus"},
}

# ── Navamsha (D9) Chart ───────────────────────────────────────────────────
NAVAMSHA_STARTS = {
    # Fire signs → start from Aries (index 0)
    "Aries": 0, "Leo": 0, "Sagittarius": 0,
    # Earth signs → start from Capricorn (index 9)
    "Taurus": 9, "Virgo": 9, "Capricorn": 9,
    # Air signs → start from Libra (index 6)
    "Gemini": 6, "Libra": 6, "Aquarius": 6,
    # Water signs → start from Cancer (index 3)
    "Cancer": 3, "Scorpio": 3, "Pisces": 3,
}

def get_navamsha_sign(longitude):
    """Return the Navamsha (D9) sign for a given sidereal longitude."""
    sign_index = int(longitude / 30) % 12
    sign = SIGNS[sign_index]
    position_in_sign = longitude % 30
    amsha_index = int(position_in_sign / (30.0 / 9))  # 0‑8
    nav_start = NAVAMSHA_STARTS.get(sign, 0)
    nav_sign_index = (nav_start + amsha_index) % 12
    return SIGNS[nav_sign_index]

# ── Sign lords (for 7th-house-lord lookup) ────────────────────────────────
SIGN_LORDS = {
    "Aries": "Mars",    "Taurus": "Venus",   "Gemini": "Mercury",
    "Cancer": "Moon",   "Leo": "Sun",        "Virgo": "Mercury",
    "Libra": "Venus",   "Scorpio": "Mars",   "Sagittarius": "Jupiter",
    "Capricorn": "Saturn", "Aquarius": "Saturn", "Pisces": "Jupiter",
}

# ── Vimshottari Dasha ─────────────────────────────────────────────────────
NAKSHATRA_DASHA_LORD = {
    "Ashwini": "Ketu",    "Bharani": "Venus",   "Krittika": "Sun",
    "Rohini": "Moon",     "Mrigashira": "Mars",  "Ardra": "Rahu",
    "Punarvasu": "Jupiter","Pushya": "Saturn",   "Ashlesha": "Mercury",
    "Magha": "Ketu",      "Purva Phalguni": "Venus", "Uttara Phalguni": "Sun",
    "Hasta": "Moon",      "Chitra": "Mars",      "Swati": "Rahu",
    "Vishakha": "Jupiter","Anuradha": "Saturn",  "Jyeshtha": "Mercury",
    "Mula": "Ketu",       "Purva Ashadha": "Venus","Uttara Ashadha": "Sun",
    "Shravana": "Moon",   "Dhanishta": "Mars",   "Shatabhisha": "Rahu",
    "Purva Bhadrapada": "Jupiter","Uttara Bhadrapada": "Saturn","Revati": "Mercury",
}

DASHA_YEARS = {
    "Ketu": 7, "Venus": 20, "Sun": 6,  "Moon": 10, "Mars": 7,
    "Rahu": 18,"Jupiter": 16,"Saturn": 19,"Mercury": 17,
}

DASHA_SEQUENCE = ["Ketu","Venus","Sun","Moon","Mars","Rahu","Jupiter","Saturn","Mercury"]

def calculate_vimshottari_dasha(nakshatra, moon_longitude, birth_datetime_utc):
    """Return current Mahadasa lord + years remaining and next two dashas."""
    start_lord = NAKSHATRA_DASHA_LORD.get(nakshatra, "Ketu")
    nak_index = NAKSHATRAS.index(nakshatra) if nakshatra in NAKSHATRAS else 0
    nak_size = 360.0 / 27.0
    nak_start_lon = nak_index * nak_size
    elapsed_fraction = (moon_longitude - nak_start_lon) / nak_size
    elapsed_fraction = max(0.0, min(1.0, elapsed_fraction))

    start_years = DASHA_YEARS[start_lord]
    elapsed_years_in_first = elapsed_fraction * start_years

    # Build full 120-year dasha sequence starting from birth dasha
    seq_start = DASHA_SEQUENCE.index(start_lord)
    dashas = []
    cursor_date = birth_datetime_utc
    # first dasha: partial
    first_remaining = start_years - elapsed_years_in_first
    days = first_remaining * 365.25
    end_date = birth_datetime_utc.replace(tzinfo=None) + __import__('datetime').timedelta(days=days)
    dashas.append({"lord": start_lord, "years": round(first_remaining, 2), "start": birth_datetime_utc.strftime("%Y-%m-%d"), "end": end_date.strftime("%Y-%m-%d")})
    cursor_date = end_date
    for i in range(1, 10):
        lord = DASHA_SEQUENCE[(seq_start + i) % 9]
        yrs = DASHA_YEARS[lord]
        start_dt = cursor_date
        end_dt = cursor_date + __import__('datetime').timedelta(days=yrs * 365.25)
        dashas.append({"lord": lord, "years": yrs, "start": start_dt.strftime("%Y-%m-%d"), "end": end_dt.strftime("%Y-%m-%d")})
        cursor_date = end_dt

    now = __import__('datetime').datetime.utcnow()
    current = None
    upcoming = []
    for d in dashas:
        start_parsed = __import__('datetime').datetime.strptime(d["start"], "%Y-%m-%d")
        end_parsed   = __import__('datetime').datetime.strptime(d["end"],   "%Y-%m-%d")
        if start_parsed <= now < end_parsed:
            remaining_days = (end_parsed - now).days
            remaining_years = round(remaining_days / 365.25, 1)
            current = {
                "lord": d["lord"],
                "start": d["start"],
                "end": d["end"],
                "yearsRemaining": remaining_years,
            }
        elif start_parsed > now and len(upcoming) < 2:
            upcoming.append({"lord": d["lord"], "start": d["start"], "end": d["end"], "years": d["years"]})

    return {"current": current, "upcoming": upcoming}

def calculate_antardasha(mahadasa_lord, mahadasa_start_str, mahadasa_end_str):
    """Calculate all Antardashas (sub-periods) within a Mahadasa and return the current+next one."""
    import datetime as dt_mod
    sequence_start = DASHA_SEQUENCE.index(mahadasa_lord)
    mahadasa_years = DASHA_YEARS[mahadasa_lord]
    total_days = mahadasa_years * 365.25
    start_dt = dt_mod.datetime.strptime(mahadasa_start_str, "%Y-%m-%d")

    antardashas = []
    cursor = start_dt
    for i in range(9):
        lord = DASHA_SEQUENCE[(sequence_start + i) % 9]
        # Antardasha duration = (antarDasha years / 120) * mahadasa total days
        sub_days = (DASHA_YEARS[lord] / 120.0) * total_days
        end = cursor + dt_mod.timedelta(days=sub_days)
        antardashas.append({"lord": lord, "start": cursor.strftime("%Y-%m-%d"), "end": end.strftime("%Y-%m-%d")})
        cursor = end

    now = dt_mod.datetime.utcnow()
    current_antar = None
    next_antar = None
    for a in antardashas:
        s = dt_mod.datetime.strptime(a["start"], "%Y-%m-%d")
        e = dt_mod.datetime.strptime(a["end"], "%Y-%m-%d")
        if s <= now < e:
            days_left = (e - now).days
            current_antar = {**a, "daysRemaining": days_left}
        elif s > now and next_antar is None:
            next_antar = a
    return {"current": current_antar, "next": next_antar}

def calculate_marriage_window(dasa_info):
    """Return estimated marriage window years from Dasha sequence."""
    import datetime as dt_mod
    MARRIAGE_LORDS = {"Venus", "Jupiter", "Moon", "Mercury"}
    now = dt_mod.datetime.utcnow()
    windows = []
    # Check current dasha
    if dasa_info.get("current") and dasa_info["current"]["lord"] in MARRIAGE_LORDS:
        windows.append({
            "lord": dasa_info["current"]["lord"],
            "start": dasa_info["current"]["start"],
            "end": dasa_info["current"]["end"],
            "note": "Current period",
        })
    # Check upcoming dashas (next 2)
    for d in (dasa_info.get("upcoming") or []):
        if d["lord"] in MARRIAGE_LORDS:
            windows.append({
                "lord": d["lord"],
                "start": d["start"],
                "end": d["end"],
                "note": "Upcoming period",
            })
    return windows[:2]

def calculate_chart_grade(manglik, kala_sarpa, sade_sati, seventh_house_analysis, venus_summary, jupiter_summary):
    """Return a simple chart quality grade for marriage."""
    issues = []
    strengths = []

    if manglik.get("severity") == "Full":
        issues.append("Full Manglik (H7)")
    elif manglik.get("severity") in ("High", "Partial"):
        issues.append(f"{manglik['severity']} Manglik")

    if kala_sarpa.get("present"):
        issues.append("Kala Sarpa Dosha")

    if sade_sati.get("present"):
        issues.append(f"Sade Sati ({sade_sati.get('phase')})")
    elif sade_sati.get("ashtamaShani"):
        issues.append("Ashtama Shani")

    if seventh_house_analysis.get("lordDignity") == "Exalted":
        strengths.append("7th Lord Exalted")
    elif seventh_house_analysis.get("lordDignity") == "Own Sign":
        strengths.append("7th Lord in Own Sign")
    elif seventh_house_analysis.get("lordDignity") == "Debilitated":
        issues.append("7th Lord Debilitated")

    if venus_summary and venus_summary.get("dignity") == "Exalted":
        strengths.append("Venus Exalted")
    elif venus_summary and venus_summary.get("dignity") == "Debilitated":
        issues.append("Venus Debilitated")

    if jupiter_summary and jupiter_summary.get("dignity") == "Exalted":
        strengths.append("Jupiter Exalted")
    elif jupiter_summary and jupiter_summary.get("dignity") == "Debilitated":
        issues.append("Jupiter Debilitated")

    if len(issues) == 0:
        grade = "Excellent"
        summary = "Highly auspicious chart for marriage"
    elif len(issues) == 1 and not any("Full" in i or "Kala Sarpa" in i for i in issues):
        grade = "Good"
        summary = "Good chart — minor consideration needed"
    elif len(issues) <= 2:
        grade = "Moderate"
        summary = "Some doshas present — careful partner matching advised"
    else:
        grade = "Needs Attention"
        summary = "Multiple doshas — consult a qualified astrologer"

    return {
        "grade": grade,
        "summary": summary,
        "strengths": strengths,
        "issues": issues,
    }

# ── Kala Sarpa Dosha ──────────────────────────────────────────────────────
KALA_SARPA_NAMES = {
    1: "Ananta",  2: "Kulika",   3: "Vasuki",   4: "Shankhapala",
    5: "Padma",   6: "Mahapadma",7: "Takshaka",  8: "Karkotaka",
    9: "Shankhachuda",10: "Ghataka",11: "Vishadara",12: "Sheshanaga",
}

def check_kala_sarpa_dosha(planetary_positions):
    rahu = next((p for p in planetary_positions if p["planet"] == "Rahu"), None)
    ketu = next((p for p in planetary_positions if p["planet"] == "Ketu"), None)
    if not rahu or not ketu:
        return {"present": False}

    rahu_lon = rahu["longitude"] % 360
    ketu_lon = ketu["longitude"] % 360
    others   = [p for p in planetary_positions if p["planet"] not in ("Rahu", "Ketu")]

    def between_rahu_ketu(lon):
        lon = lon % 360
        if rahu_lon < ketu_lon:
            return rahu_lon <= lon <= ketu_lon
        else:
            return lon >= rahu_lon or lon <= ketu_lon

    all_between = all(between_rahu_ketu(p["longitude"]) for p in others)
    if not all_between:
        return {"present": False}

    rahu_house = rahu["house"]
    name = KALA_SARPA_NAMES.get(rahu_house, f"Rahu-House-{rahu_house}")
    return {
        "present": True,
        "name": name,
        "rahuHouse": rahu_house,
        "description": f"{name} Kala Sarpa Dosha (Rahu in house {rahu_house})",
    }


def resolve_timezone(timezone_name="Asia/Colombo"):
    try:
        return ZoneInfo(timezone_name or "Asia/Colombo")
    except Exception:
        return ZoneInfo("Asia/Colombo")


def to_local_datetime(birth_date, birth_time, timezone_name="Asia/Colombo"):
    return datetime.fromisoformat(f"{birth_date}T{birth_time}").replace(tzinfo=resolve_timezone(timezone_name))


def to_utc_datetime(birth_date, birth_time, timezone_name="Asia/Colombo"):
    return to_local_datetime(birth_date, birth_time, timezone_name).astimezone(ZoneInfo("UTC"))


def calculate_panchanga(moon_longitude, sun_longitude, local_dt):
    lunar_phase = (moon_longitude - sun_longitude) % 360

    tithi_number = int(lunar_phase / 12) + 1
    paksha = "Shukla Paksha" if tithi_number <= 15 else "Krishna Paksha"
    tithi_name = SHUKLA_TITHIS[tithi_number - 1] if tithi_number <= 15 else KRISHNA_TITHIS[tithi_number - 16]

    yoga_index = int(((moon_longitude + sun_longitude) % 360) / (360 / 27)) % 27
    yoga = YOGAS[yoga_index]

    karana_index = int(lunar_phase / 6)
    if karana_index == 0:
        karana = "Kimstughna"
    elif karana_index >= 57:
        karana = {57: "Shakuni", 58: "Chatushpada", 59: "Naga"}.get(karana_index, "Kimstughna")
    else:
        karana = REPEATING_KARANAS[(karana_index - 1) % len(REPEATING_KARANAS)]

    return {
        "tithi": tithi_name,
        "paksha": paksha,
        "yoga": yoga,
        "karana": karana,
        "vedicDay": local_dt.strftime("%A"),
    }


def determine_house(longitude, house_cusps):
    normalized_longitude = longitude % 360
    cusps = [(cusp % 360) for cusp in list(house_cusps)[:12]]

    for index, start in enumerate(cusps):
        end = cusps[(index + 1) % len(cusps)]
        if start <= end:
            in_house = start <= normalized_longitude < end
        else:
            in_house = normalized_longitude >= start or normalized_longitude < end

        if in_house:
            return index + 1

    return 12


def calculate_horoscope(birth_date, birth_time, lat, lon, timezone="Asia/Colombo"):
    try:
        # Parse local birth date/time and convert to UTC for Swiss Ephemeris
        dt_local = to_local_datetime(birth_date, birth_time, timezone)
        dt_utc = dt_local.astimezone(ZoneInfo("UTC"))
        year, month, day = dt_utc.year, dt_utc.month, dt_utc.day
        hour = dt_utc.hour + dt_utc.minute / 60.0 + dt_utc.second / 3600.0

        # Calculate Julian Day in UTC
        jd = swe.julday(year, month, day, hour)

        # Calculate ascendant
        houses, ascmc = swe.houses_ex(jd, lat, lon, b'P', swe.FLG_SIDEREAL)
        ascendant_degree = ascmc[0]
        ascendant_sign_index = int(ascendant_degree / 30) % 12
        ascendant = SIGNS[ascendant_sign_index]

        # Calculate planetary positions
        planetary_positions = []
        moon_longitude = None

        for planet_id, planet_name in PLANETS:
            pos, _ = swe.calc_ut(jd, planet_id, swe.FLG_SIDEREAL | swe.FLG_SPEED)
            longitude = pos[0]
            speed    = pos[3]  # deg/day — negative means retrograde
            sign_index = int(longitude / 30) % 12
            sign = SIGNS[sign_index]
            house = determine_house(longitude, houses)
            degree = longitude % 30
            retrograde = speed < 0 if planet_name not in ("Rahu",) else True  # Rahu always retrograde

            planetary_positions.append({
                "planet": planet_name,
                "longitude": round(longitude, 4),
                "sign": sign,
                "house": house,
                "degree": round(degree, 4),
                "dignity": get_planet_dignity(planet_name, sign),
                "retrograde": retrograde,
                "navamsha": get_navamsha_sign(longitude),
            })

            if planet_name == "Moon":
                moon_longitude = longitude

        # Calculate Ketu (opposite of Rahu)
        rahu_pos = next(p for p in planetary_positions if p["planet"] == "Rahu")
        ketu_longitude = (rahu_pos["longitude"] + 180) % 360
        ketu_sign_index = int(ketu_longitude / 30) % 12
        ketu_sign = SIGNS[ketu_sign_index]
        ketu_house = determine_house(ketu_longitude, houses)
        ketu_degree = ketu_longitude % 30

        planetary_positions.append({
            "planet": "Ketu",
            "longitude": round(ketu_longitude, 4),
            "sign": ketu_sign,
            "house": ketu_house,
            "degree": round(ketu_degree, 4),
            "dignity": get_planet_dignity("Ketu", ketu_sign),
            "retrograde": True,  # Ketu always retrograde
            "navamsha": get_navamsha_sign(ketu_longitude),
        })

        # Determine Rashi (Moon sign)
        moon_sign_index = int(moon_longitude / 30) % 12
        rashi = SIGNS[moon_sign_index]

        # Determine Nakshatra
        nakshatra_index = int(moon_longitude / (360 / 27)) % 27
        nakshatra = NAKSHATRAS[nakshatra_index]
        nakshatra = normalize_nakshatra(nakshatra)

        # Determine Nakshatra Pada (1-4)
        nakshatra_start = nakshatra_index * (360 / 27)
        position_in_nakshatra = moon_longitude - nakshatra_start
        pada = int(position_in_nakshatra / (360 / 27 / 4)) + 1
        gana = GANA_BY_NAKSHATRA.get(nakshatra)

        # Zodiac sign (Western, based on Sun)
        sun_pos = next(p for p in planetary_positions if p["planet"] == "Sun")
        zodiac_sign = sun_pos["sign"]
        panchanga = calculate_panchanga(moon_longitude, sun_pos["longitude"], dt_local)

        # ── New: Vimshottari Dasha ──
        dasa_info = calculate_vimshottari_dasha(nakshatra, moon_longitude, dt_utc)

        # ── New: Kala Sarpa Dosha ──
        kala_sarpa = check_kala_sarpa_dosha(planetary_positions)

        # ── New: Manglik (Kuja Dosha) with severity ──
        mars_pos = next((p for p in planetary_positions if p["planet"] == "Mars"), None)
        mars_house = mars_pos["house"] if mars_pos else None
        MANGLIK_FULL    = {7}            # strongest — direct marriage house
        MANGLIK_HIGH    = {1, 8}         # 1st=self, 8th=longevity
        MANGLIK_PARTIAL = {2, 4, 12}     # 2nd=family, 4th=home, 12th=bed
        if mars_house is None:
            manglik = {"present": False, "label": "Pending", "severity": None}
        elif mars_house in MANGLIK_FULL:
            manglik = {"present": True, "label": f"Yes — Full (Mars in House {mars_house})",
                       "marsHouse": mars_house, "severity": "Full"}
        elif mars_house in MANGLIK_HIGH:
            manglik = {"present": True, "label": f"Yes — High (Mars in House {mars_house})",
                       "marsHouse": mars_house, "severity": "High"}
        elif mars_house in MANGLIK_PARTIAL:
            manglik = {"present": True, "label": f"Yes — Partial (Mars in House {mars_house})",
                       "marsHouse": mars_house, "severity": "Partial"}
        else:
            manglik = {"present": False, "label": f"No (Mars in House {mars_house})",
                       "marsHouse": mars_house, "severity": None}

        # ── New: 7th House Analysis ──
        # house cusps[6] (index 6) is the 7th house cusp longitude
        seventh_house_cusp = houses[6] if len(houses) >= 7 else 0.0
        seventh_sign_index = int(seventh_house_cusp / 30) % 12
        seventh_sign = SIGNS[seventh_sign_index]
        seventh_lord_name = SIGN_LORDS.get(seventh_sign, "Jupiter")
        seventh_lord_pos = next((p for p in planetary_positions if p["planet"] == seventh_lord_name), None)
        seventh_house_analysis = {
            "sign": seventh_sign,
            "lord": seventh_lord_name,
            "lordHouse": seventh_lord_pos["house"] if seventh_lord_pos else None,
            "lordSign": seventh_lord_pos["sign"] if seventh_lord_pos else None,
            "lordDignity": seventh_lord_pos["dignity"] if seventh_lord_pos else None,
            "lordRetrograde": seventh_lord_pos["retrograde"] if seventh_lord_pos else False,
        }

        # ── New: Sade Sati (current Saturn transit vs natal Moon) ──
        now_jd = swe.julday(*__import__('datetime').datetime.utcnow().timetuple()[:3],
                             __import__('datetime').datetime.utcnow().hour +
                             __import__('datetime').datetime.utcnow().minute / 60.0)
        sat_now, _ = swe.calc_ut(now_jd, swe.SATURN, swe.FLG_SIDEREAL)
        saturn_transit_lon = sat_now[0]
        saturn_transit_sign_index = int(saturn_transit_lon / 30) % 12
        saturn_transit_sign = SIGNS[saturn_transit_sign_index]
        moon_sign_index_now = int(moon_longitude / 30) % 12
        # Positions of Saturn relative to natal Moon sign (1-based)
        sat_from_moon = ((saturn_transit_sign_index - moon_sign_index_now) % 12) + 1
        if sat_from_moon == 1:
            sade_sati_phase = "Peak"
        elif sat_from_moon == 12:
            sade_sati_phase = "Rising"
        elif sat_from_moon == 2:
            sade_sati_phase = "Setting"
        else:
            sade_sati_phase = None
        # Ashtama Shani: Saturn in 8th from Moon
        ashtama_shani = sat_from_moon == 8
        sade_sati = {
            "present": sade_sati_phase is not None,
            "phase": sade_sati_phase,
            "saturnTransitSign": saturn_transit_sign,
            "saturnFromMoon": sat_from_moon,
            "ashtamaShani": ashtama_shani,
        }

        # ── New: Venus & Jupiter natal summaries ──
        venus_pos = next((p for p in planetary_positions if p["planet"] == "Venus"), None)
        jupiter_pos = next((p for p in planetary_positions if p["planet"] == "Jupiter"), None)
        venus_summary = {
            "sign": venus_pos["sign"] if venus_pos else None,
            "house": venus_pos["house"] if venus_pos else None,
            "dignity": venus_pos["dignity"] if venus_pos else None,
            "retrograde": venus_pos["retrograde"] if venus_pos else False,
            "navamsha": venus_pos["navamsha"] if venus_pos else None,
        } if venus_pos else None
        jupiter_summary = {
            "sign": jupiter_pos["sign"] if jupiter_pos else None,
            "house": jupiter_pos["house"] if jupiter_pos else None,
            "dignity": jupiter_pos["dignity"] if jupiter_pos else None,
            "retrograde": jupiter_pos["retrograde"] if jupiter_pos else False,
            "navamsha": jupiter_pos["navamsha"] if jupiter_pos else None,
        } if jupiter_pos else None

        # ── New: Ascendant Navamsha ──
        ascendant_navamsha = get_navamsha_sign(ascendant_degree)

        # ── New: Rajju, Nadi, Yoni, Rasi Lord ──
        rajju = RAJJU_BY_NAKSHATRA.get(nakshatra, "Unknown")
        nadi  = NADI_BY_NAKSHATRA.get(nakshatra, "Unknown")
        yoni  = YONI_BY_NAKSHATRA.get(nakshatra, "Unknown")
        rasi_lord = RASI_LORD.get(rashi, "Unknown")

        # ── New: Antardasha ──
        antardasha = None
        if dasa_info.get("current"):
            antardasha = calculate_antardasha(
                dasa_info["current"]["lord"],
                dasa_info["current"]["start"],
                dasa_info["current"]["end"],
            )

        # ── New: Marriage Window ──
        marriage_window = calculate_marriage_window(dasa_info)

        # ── New: Chart Grade ──
        chart_grade = calculate_chart_grade(manglik, kala_sarpa, sade_sati, seventh_house_analysis, venus_summary, jupiter_summary)

        return {
            "success": True,
            "zodiacSign": zodiac_sign,
            "moonSign": rashi,
            "rashi": rashi,
            "nakshatra": nakshatra,
            "gana": gana,
            "nakshatraPada": pada,
            "ascendant": ascendant,
            "ascendantDegree": round(ascendant_degree, 4),
            "tithi": panchanga["tithi"],
            "paksha": panchanga["paksha"],
            "yoga": panchanga["yoga"],
            "karana": panchanga["karana"],
            "vedicDay": panchanga["vedicDay"],
            "ayanamsa": "Lahiri",
            "timezone": timezone,
            "utcDateTime": dt_utc.isoformat(),
            "localDateTime": dt_local.isoformat(),
            "planetaryPositions": planetary_positions,
            "dasaInfo": dasa_info,
            "kalaSarpaDosha": kala_sarpa,
            "manglik": manglik,
            "seventhHouseAnalysis": seventh_house_analysis,
            "sadeSati": sade_sati,
            "venusSummary": venus_summary,
            "jupiterSummary": jupiter_summary,
            "ascendantNavamsha": ascendant_navamsha,
            "rajju": rajju,
            "nadi": nadi,
            "yoni": yoni,
            "rasiLord": rasi_lord,
            "antardasha": antardasha,
            "marriageWindow": marriage_window,
            "chartGrade": chart_grade,
        }

    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

def load_input_data():
    raw_input = " ".join(sys.argv[1:]).strip() if len(sys.argv) > 1 else sys.stdin.read().strip()

    if not raw_input:
        raise ValueError("Missing input. Expected a JSON object with birthDate, birthTime, lat, lon")

    raw_input = (raw_input
        .replace("“", '"')
        .replace("”", '"')
        .replace("‘", "'")
        .replace("’", "'"))

    if (raw_input.startswith("'") and raw_input.endswith("'")) or (
        raw_input.startswith('"') and raw_input.endswith('"')
    ):
        raw_input = raw_input[1:-1]

    return json.loads(raw_input)


def main():
    try:
        data = load_input_data()
        birth_date = data["birthDate"]
        birth_time = data["birthTime"]
        lat = float(data["lat"])
        lon = float(data["lon"])
        timezone = data.get("timezone", "Asia/Colombo")

        result = calculate_horoscope(birth_date, birth_time, lat, lon, timezone)
        print(json.dumps(result))

    except json.JSONDecodeError as e:
        print(json.dumps({
            "success": False,
            "error": f"Invalid JSON input: {e.msg}. Use quoted JSON or pipe it through stdin."
        }))
    except KeyError as e:
        print(json.dumps({"success": False, "error": f"Missing required field: {e}"}))
    except Exception as e:
        print(json.dumps({"success": False, "error": str(e)}))

if __name__ == "__main__":
    main()
