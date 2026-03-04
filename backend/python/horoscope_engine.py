import swisseph as swe
import json
import sys

RASHIS = [
    'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
    'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
]

NAKSHATRAS = [
    'Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashira', 'Ardra',
    'Punarvasu', 'Pushya', 'Ashlesha', 'Magha', 'Purva Phalguni',
    'Uttara Phalguni', 'Hasta', 'Chitra', 'Swati', 'Vishakha', 'Anuradha',
    'Jyeshtha', 'Moola', 'Purva Ashadha', 'Uttara Ashadha', 'Shravana',
    'Dhanishta', 'Shatabhisha', 'Purva Bhadrapada', 'Uttara Bhadrapada', 'Revati'
]

def generate_chart(year, month, day, hour_ut, lat, lon):
    swe.set_ephe_path('./ephe')
    jd = swe.julday(year, month, day, float(hour_ut))

    planets = {
        'Sun': swe.SUN, 'Moon': swe.MOON, 'Mars': swe.MARS,
        'Mercury': swe.MERCURY, 'Jupiter': swe.JUPITER,
        'Venus': swe.VENUS, 'Saturn': swe.SATURN,
        'Rahu': swe.MEAN_NODE
    }

    positions = {}
    for name, planet in planets.items():
        pos = swe.calc_ut(jd, planet)[0][0]
        positions[name] = round(pos, 4)

    moon_pos = positions['Moon']
    sun_pos  = positions['Sun']
    asc      = swe.houses(jd, float(lat), float(lon), b'P')[0][0]

    return {
        'planetary_positions': positions,
        'zodiac_sign': RASHIS[int(sun_pos / 30)],
        'moon_sign':   RASHIS[int(moon_pos / 30)],
        'nakshatra':   NAKSHATRAS[int(moon_pos / 13.3333)],
        'ascendant':   round(asc, 4)
    }

if __name__ == '__main__':
    try:
        args = json.loads(sys.argv[1])
        result = generate_chart(**args)
        print(json.dumps({ 'success': True, 'data': result }))
    except Exception as e:
        print(json.dumps({ 'success': False, 'error': str(e) }))