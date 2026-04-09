import json
import sys
import os
import math
from datetime import datetime

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

def calculate_horoscope(birth_date, birth_time, lat, lon):
    try:
        # Parse date and time
        dt = datetime.fromisoformat(f"{birth_date}T{birth_time}")
        year, month, day = dt.year, dt.month, dt.day
        hour = dt.hour + dt.minute / 60.0 + dt.second / 3600.0

        # Calculate Julian Day
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
            house = 0
            for i, cusp in enumerate(houses):
                if longitude >= cusp:
                    house = i + 1
                else:
                    break
            if house == 0:  # If longitude < first cusp, it's in 12th house
                house = 12
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
        ketu_house = 0
        for i, cusp in enumerate(houses):
            if ketu_longitude >= cusp:
                ketu_house = i + 1
            else:
                break
        if ketu_house == 0:
            ketu_house = 12
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

        return {
            "success": True,
            "zodiacSign": zodiac_sign,
            "rashi": rashi,
            "nakshatra": nakshatra,
            "nakshatraPada": pada,
            "ascendant": ascendant,
            "ascendantDegree": round(ascendant_degree, 4),
            "planetaryPositions": planetary_positions
        }

    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

def main():
    if len(sys.argv) != 2:
        print(json.dumps({"success": False, "error": "Invalid arguments. Expected JSON string with birthDate, birthTime, lat, lon"}))
        sys.exit(1)

    try:
        data = json.loads(sys.argv[1])
        birth_date = data["birthDate"]
        birth_time = data["birthTime"]
        lat = float(data["lat"])
        lon = float(data["lon"])

        result = calculate_horoscope(birth_date, birth_time, lat, lon)
        print(json.dumps(result))

    except json.JSONDecodeError:
        print(json.dumps({"success": False, "error": "Invalid JSON input"}))
    except KeyError as e:
        print(json.dumps({"success": False, "error": f"Missing required field: {e}"}))
    except Exception as e:
        print(json.dumps({"success": False, "error": str(e)}))

if __name__ == "__main__":
    main()
