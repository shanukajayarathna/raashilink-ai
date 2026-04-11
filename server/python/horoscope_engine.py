import json
import sys
import os
import math
from datetime import datetime
from zoneinfo import ZoneInfo

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

# Nakshatras (27)
NAKSHATRAS = [
    "Ashwini", "Bharani", "Krittika", "Rohini", "Mrigashira", "Ardra",
    "Punarvasu", "Pushya", "Ashlesha", "Magha", "Purva Phalguni", "Uttara Phalguni",
    "Hasta", "Chitra", "Swati", "Vishakha", "Anuradha", "Jyeshtha",
    "Mula", "Purva Ashadha", "Uttara Ashadha", "Shravana", "Dhanishta", "Shatabhisha",
    "Purva Bhadrapada", "Uttara Bhadrapada", "Revati"
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
            pos, _ = swe.calc_ut(jd, planet_id, swe.FLG_SIDEREAL)
            longitude = pos[0]
            sign_index = int(longitude / 30) % 12
            sign = SIGNS[sign_index]
            house = determine_house(longitude, houses)
            degree = longitude % 30

            planetary_positions.append({
                "planet": planet_name,
                "longitude": round(longitude, 4),
                "sign": sign,
                "house": house,
                "degree": round(degree, 4)
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
            "degree": round(ketu_degree, 4)
        })

        # Determine Rashi (Moon sign)
        moon_sign_index = int(moon_longitude / 30) % 12
        rashi = SIGNS[moon_sign_index]

        # Determine Nakshatra
        nakshatra_index = int(moon_longitude / (360 / 27)) % 27
        nakshatra = NAKSHATRAS[nakshatra_index]

        # Determine Nakshatra Pada (1-4)
        nakshatra_start = nakshatra_index * (360 / 27)
        position_in_nakshatra = moon_longitude - nakshatra_start
        pada = int(position_in_nakshatra / (360 / 27 / 4)) + 1

        # Zodiac sign (Western, based on Sun)
        sun_pos = next(p for p in planetary_positions if p["planet"] == "Sun")
        zodiac_sign = sun_pos["sign"]
        panchanga = calculate_panchanga(moon_longitude, sun_pos["longitude"], dt_local)

        return {
            "success": True,
            "zodiacSign": zodiac_sign,
            "moonSign": rashi,
            "rashi": rashi,
            "nakshatra": nakshatra,
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
            "planetaryPositions": planetary_positions
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
