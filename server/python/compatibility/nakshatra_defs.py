# Shared Nakshatra and Gana definitions for horoscope and compatibility modules

NAKSHATRAS = [
    "Ashwini", "Bharani", "Krittika", "Rohini", "Mrigashira", "Ardra",
    "Punarvasu", "Pushya", "Ashlesha", "Magha", "Purva Phalguni", "Uttara Phalguni",
    "Hasta", "Chitra", "Swati", "Vishakha", "Anuradha", "Jyeshtha",
    "Mula", "Purva Ashadha", "Uttara Ashadha", "Shravana", "Dhanishta", "Shatabhisha",
    "Purva Bhadrapada", "Uttara Bhadrapada", "Revati"
]

GANA_BY_NAKSHATRA = {
    "Ashwini": "Deva",
    "Bharani": "Manushya",
    "Krittika": "Rakshasa",
    "Rohini": "Manushya",
    "Mrigashira": "Deva",
    "Ardra": "Manushya",
    "Punarvasu": "Deva",
    "Pushya": "Deva",
    "Ashlesha": "Rakshasa",
    "Magha": "Rakshasa",
    "Purva Phalguni": "Manushya",
    "Uttara Phalguni": "Manushya",
    "Hasta": "Deva",
    "Chitra": "Rakshasa",
    "Swati": "Deva",
    "Vishakha": "Rakshasa",
    "Anuradha": "Deva",
    "Jyeshtha": "Rakshasa",
    "Mula": "Rakshasa",
    "Purva Ashadha": "Manushya",
    "Uttara Ashadha": "Manushya",
    "Shravana": "Deva",
    "Dhanishta": "Rakshasa",
    "Shatabhisha": "Rakshasa",
    "Purva Bhadrapada": "Manushya",
    "Uttara Bhadrapada": "Manushya",
    "Revati": "Deva",
}

def normalize_nakshatra(name):
    """Normalize nakshatra name for consistent lookup."""
    return name.strip().title().replace("  ", " ")
