import json
import csv
import random
from collections import Counter

# Sri Lankan districts with census weights
DISTRICTS = {
    "Colombo": 0.086, "Gampaha": 0.081, "Kalutara": 0.045, "Kandy": 0.058, "Matale": 0.025,
    "NuwaraEliya": 0.032, "Galle": 0.043, "Matara": 0.037, "Hambantota": 0.029, "Jaffna": 0.032,
    "Vavuniya": 0.015, "Trincomalee": 0.022, "Batticaloa": 0.035, "Ampara": 0.038,
    "Kurunegala": 0.067, "Puttalam": 0.035, "Anuradhapura": 0.055, "Polonnaruwa": 0.028,
    "Badulla": 0.045, "Monaragala": 0.025, "Ratnapura": 0.055, "Kegalle": 0.038
}

RELIGIONS = ["Buddhist", "Hindu", "Muslim", "Christian"]
RELIGION_WEIGHTS = [0.70, 0.13, 0.10, 0.07]

DIETS = ["vegetarian", "non-vegetarian"]
PROFESSIONS = ["Engineer", "Doctor", "Teacher", "Accountant", "Entrepreneur", "Manager", "Lawyer", "Artist", "Consultant", "Student"]
HOBBIES = ["Reading", "Traveling", "Cooking", "Sports", "Music", "Movies", "Yoga", "Gaming", "Art", "Gardening"]

def generate_big_five():
    return {
        "openness": max(0.1, min(1.0, random.gauss(0.6, 0.2))),
        "conscientiousness": max(0.1, min(1.0, random.gauss(0.65, 0.2))),
        "extraversion": max(0.1, min(1.0, random.gauss(0.55, 0.2))),
        "agreeableness": max(0.1, min(1.0, random.gauss(0.65, 0.2))),
        "neuroticism": max(0.1, min(1.0, random.gauss(0.45, 0.2)))
    }

def generate_lifestyle():
    return {
        "religion": random.choices(RELIGIONS, weights=RELIGION_WEIGHTS)[0],
        "diet": random.choice(DIETS),
        "smoking": "true" if random.random() < 0.15 else "false",
        "drinking": "moderate" if random.random() < 0.4 else "none",
        "professionType": random.choice(PROFESSIONS),
        "educationLevel": random.choice(["10th", "12th", "Bachelors", "Masters", "PhD"]),
        "familyValues": random.gauss(0.6, 0.2),
        "language": random.choice(["Sinhala", "Tamil", "English"]),
        "hobbies": random.sample(HOBBIES, k=random.randint(1, 4))
    }

def generate_profile(profile_id):
    district = random.choices(list(DISTRICTS.keys()), weights=list(DISTRICTS.values()))[0]
    age = max(22, min(45, int(random.gauss(28, 6))))
    
    return {
        "id": str(profile_id),
        "personalInfo": {
            "firstName": f"User{profile_id}",
            "lastName": f"SL{random.randint(100, 999)}",
            "age": age,
            "gender": random.choice(["male", "female"]),
            "location": district
        },
        "personality": generate_big_five(),
        "lifestyle": generate_lifestyle(),
        "interactions": {
            "interestsSent": random.randint(0, 20),
            "interestsReceived": random.randint(0, 15)
        }
    }

def main():
    profiles = [generate_profile(i + 1) for i in range(5000)]
    
    # Save to JSON
    with open('synthetic_profiles.json', 'w') as f:
        json.dump(profiles, f, indent=2)
    
    # Save to CSV
    with open('synthetic_profiles.csv', 'w', newline='') as f:
        writer = csv.writer(f)
        writer.writerow(['id', 'firstName', 'lastName', 'age', 'gender', 'location', 'religion', 'diet', 'profession'])
        for p in profiles:
            writer.writerow([
                p['id'], p['personalInfo']['firstName'], p['personalInfo']['lastName'],
                p['personalInfo']['age'], p['personalInfo']['gender'], p['personalInfo']['location'],
                p['lifestyle']['religion'], p['lifestyle']['diet'], p['lifestyle']['professionType']
            ])
    
    # Print district distribution
    district_counts = Counter(p['personalInfo']['location'] for p in profiles)
    print("District Distribution Summary:")
    for district in sorted(DISTRICTS.keys()):
        count = district_counts.get(district, 0)
        pct = (count / 5000) * 100
        expected_pct = DISTRICTS[district] * 100
        print(f"{district}: {count} ({pct:.1f}%) [Expected: {expected_pct:.1f}%]")
    
    print(f"\nGenerated {len(profiles)} synthetic profiles")
    print("Saved: synthetic_profiles.json, synthetic_profiles.csv")

if __name__ == "__main__":
    main()
