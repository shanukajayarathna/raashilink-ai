import json
import sys
from guna_milan import calculate_guna_milan
from personality_score import personality_score, lifestyle_score, family_values_score

def calculate_compatibility(data_a, data_b):
    # Extract data
    nak1 = data_a.get('nakshatra')
    rashi1 = data_a.get('rashi')
    nak2 = data_b.get('nakshatra')
    rashi2 = data_b.get('rashi')

    personality_a = data_a.get('personality', {})
    personality_b = data_b.get('personality', {})

    lifestyle_a = data_a.get('lifestyle', {})
    lifestyle_b = data_b.get('lifestyle', {})

    family_a = data_a.get('family', {})
    family_b = data_b.get('family', {})

    # Calculate astro (guna milan)
    astro_result = calculate_guna_milan(nak1, rashi1, nak2, rashi2)
    astro_score = astro_result['astroScore']
    guna_total = astro_result['gunaTotal']
    guna_details = astro_result['scores']

    # Calculate personality
    personality_result = personality_score(personality_a, personality_b)
    personality_score_val = personality_result['personalityScore']

    # Calculate lifestyle
    lifestyle_result = lifestyle_score(lifestyle_a, lifestyle_b)
    lifestyle_score_val = lifestyle_result['lifestyleScore']

    # Calculate family
    family_result = family_values_score(family_a, family_b)
    family_score_val = family_result['familyScore']

    # Overall score
    overall_score = astro_score + personality_score_val + lifestyle_score_val + family_score_val

    # Band label
    if overall_score >= 80:
        band_label = "Excellent"
    elif overall_score >= 60:
        band_label = "Good"
    elif overall_score >= 40:
        band_label = "Moderate"
    else:
        band_label = "Low"

    # Explanation
    explanation = f"Astrological compatibility: {astro_score:.1f}/40, Personality: {personality_score_val:.1f}/25, Lifestyle: {lifestyle_score_val:.1f}/20, Family values: {family_score_val:.1f}/15. Overall: {band_label}."

    return {
        "success": True,
        "overallScore": round(overall_score, 1),
        "bandLabel": band_label,
        "astroScore": round(astro_score, 1),
        "gunaTotal": guna_total,
        "gunaDetails": guna_details,
        "personalityScore": round(personality_score_val, 1),
        "lifestyleScore": round(lifestyle_score_val, 1),
        "familyScore": round(family_score_val, 1),
        "explanation": explanation
    }

def load_input_data():
    raw_input = " ".join(sys.argv[1:]).strip() if len(sys.argv) > 1 else sys.stdin.read().strip()

    if not raw_input:
        raise ValueError("Missing input. Expected a JSON object")

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
        user_a = data.get('userA', {})
        user_b = data.get('userB', {})
        result = calculate_compatibility(user_a, user_b)
        print(json.dumps(result))
    except json.JSONDecodeError as e:
        print(json.dumps({"success": False, "error": f"Invalid JSON input: {e.msg}"}))
    except Exception as e:
        print(json.dumps({"success": False, "error": str(e)}))

if __name__ == "__main__":
    main()
