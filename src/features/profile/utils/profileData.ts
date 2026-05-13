const DEFAULT_PRIVACY = {
  showHoroscope: true,
  showPhone: false,
  whoCanMessage: 'Matches Only',
  whoCanSeePhotos: 'Matches Only',
};

const PLACEHOLDER_VALUES = new Set(['not provided', 'unknown', 'building a meaningful future through shared values.']);
const PERSONALITY_SUBJECTS = [
  'Openness',
  'Conscientiousness',
  'Extraversion',
  'Agreeableness',
  'Neuroticism',
];
const PERSONALITY_KEY_BY_SUBJECT: Record<string, string> = {
  Openness: 'openness',
  Conscientiousness: 'conscientiousness',
  Extraversion: 'extraversion',
  Agreeableness: 'agreeableness',
  Neuroticism: 'neuroticism',
};
const PERSONALITY_QUESTION_COUNT = 10;

function average(values: number[]) {
  if (!values.length) return 3;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function normalizeLikert(value: any) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 3;
  return Math.max(1, Math.min(5, Math.round(parsed)));
}

function likertFromPercent(score: number) {
  if (!Number.isFinite(score)) return 3;
  return Math.max(1, Math.min(5, Math.round(score / 25) + 1));
}

function derivePersonalityAnswers(profile: any) {
  const answerSource = Array.isArray(profile?.personalityAnswers) ? profile.personalityAnswers : null;
  if (answerSource && answerSource.length >= PERSONALITY_QUESTION_COUNT) {
    return answerSource.slice(0, PERSONALITY_QUESTION_COUNT).map(normalizeLikert);
  }

  const traits = normalizePersonality(profile);
  const traitValue = (subject: string) => {
    const trait = traits.find((item) => item.subject === subject);
    return likertFromPercent(Number(trait?.A ?? 50));
  };

  const extraversion = traitValue('Extraversion');
  const conscientiousness = traitValue('Conscientiousness');
  const neuroticism = traitValue('Neuroticism');
  const openness = traitValue('Openness');
  const agreeableness = traitValue('Agreeableness');

  return [
    extraversion,
    conscientiousness,
    neuroticism,
    openness,
    agreeableness,
    extraversion,
    conscientiousness,
    openness,
    agreeableness,
    6 - neuroticism,
  ].map(normalizeLikert);
}

export function mapPersonalityFromAnswers(answers: any[] = []) {
  const safe = Array.isArray(answers) && answers.length >= PERSONALITY_QUESTION_COUNT
    ? answers.slice(0, PERSONALITY_QUESTION_COUNT).map(normalizeLikert)
    : new Array(PERSONALITY_QUESTION_COUNT).fill(3);
  const normalizeScore = (score: number) => Number(((score - 1) / 4).toFixed(2));

  return {
    extraversion: normalizeScore(average([safe[0], safe[5]])),
    conscientiousness: normalizeScore(average([safe[1], safe[6]])),
    neuroticism: normalizeScore(average([safe[2], 6 - safe[9]])),
    openness: normalizeScore(average([safe[3], safe[7]])),
    agreeableness: normalizeScore(average([safe[4], safe[8]])),
  };
}

function isPlaceholderValue(value: any) {
  return typeof value === 'string' && PLACEHOLDER_VALUES.has(value.trim().toLowerCase());
}

function normalizeString(value: any) {
  const normalized = typeof value === 'string' ? value : value == null ? '' : String(value);
  return isPlaceholderValue(normalized) ? '' : normalized;
}

function normalizeStringArray(value: any) {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => {
      if (typeof item === 'string') return item.trim();
      if (item && typeof item === 'object' && typeof item.label === 'string') return item.label.trim();
      return '';
    })
    .filter((item) => item && !PLACEHOLDER_VALUES.has(item.toLowerCase()));
}

function normalizeNumber(value: any, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeOptionalValue(value: any) {
  if (value === undefined || value === null) return '';
  if (typeof value === 'string') {
    const normalized = value.trim();
    return isPlaceholderValue(normalized) ? '' : normalized;
  }
  return value;
}

function normalizePersonality(profile: any) {
  const arraySource = Array.isArray(profile?.personality) ? profile.personality : null;
  const objectSource = profile?.personality && typeof profile.personality === 'object' && !Array.isArray(profile.personality)
    ? profile.personality
    : null;

  return PERSONALITY_SUBJECTS.map((subject) => {
    const traitFromArray = arraySource?.find((item: any) => item?.subject === subject);
    const key = PERSONALITY_KEY_BY_SUBJECT[subject];

    const fromArray = Number(traitFromArray?.A);
    const fromObject = Number(objectSource?.[key]);
    const raw = Number.isFinite(fromArray)
      ? fromArray
      : Number.isFinite(fromObject)
        ? fromObject <= 1
          ? fromObject * 100
          : fromObject
        : 50;

    const score = Math.max(0, Math.min(100, Math.round(raw)));
    return { subject, A: score, fullMark: 100 };
  });
}

export function computeProfileCompletion(profile: any): number {
  const personalInfo = profile?.personalInfo || {};
  const lifestyle = profile?.lifestyle || {};
  const astrology = profile?.astrology || {};
  const photos = Array.isArray(profile?.photos) ? profile.photos : [];

  const PLACEHOLDERS = new Set(['not provided', 'unknown', 'building a meaningful future through shared values.', 'sri lanka']);
  const isSet = (v: any) => {
    if (!v) return false;
    if (typeof v === 'string') return !PLACEHOLDERS.has(v.trim().toLowerCase());
    if (Array.isArray(v)) return v.filter((x: any) => x && !PLACEHOLDERS.has(String(x).trim().toLowerCase())).length > 0;
    return Boolean(v);
  };

  const hasPhoto = Boolean(profile?.profilePic) || photos.some((p: any) => p?.url);
  const hasHoroscope = isSet(astrology.rashi) || isSet(astrology.nakshatra);

  const checks = [
    hasPhoto,
    isSet(personalInfo.firstName),
    isSet(personalInfo.lastName),
    isSet(profile?.location),
    isSet(profile?.bio),
    isSet(profile?.tagline),
    isSet(profile?.height),
    isSet(personalInfo.ethnicity),
    isSet(profile?.birthDate),
    isSet(profile?.birthPlace),
    hasHoroscope,
    isSet(profile?.education) || isSet(personalInfo.education),
    isSet(profile?.occupation) || isSet(personalInfo.occupation),
    isSet(profile?.religion) || isSet(personalInfo.religion),
    isSet(lifestyle.diet),
    isSet(lifestyle.smoking),
    isSet(lifestyle.drinking),
    isSet(personalInfo.languages),
    isSet(lifestyle.hobbies),
    Boolean(profile?.verification?.emailVerified),
    Boolean(profile?.verification?.phoneVerified),
  ];

  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

export function computeMissingItems(profile: any): string[] {
  const personalInfo = profile?.personalInfo || {};
  const lifestyle = profile?.lifestyle || {};
  const astrology = profile?.astrology || {};
  const photos = Array.isArray(profile?.photos) ? profile.photos : [];

  // Treat server-side placeholder strings as empty
  const PLACEHOLDERS = new Set(['not provided', 'unknown', 'building a meaningful future through shared values.', 'sri lanka']);
  const isSet = (v: any) => {
    if (!v) return false;
    if (typeof v === 'string') return !PLACEHOLDERS.has(v.trim().toLowerCase());
    if (Array.isArray(v)) return v.filter((x: any) => x && !PLACEHOLDERS.has(String(x).trim().toLowerCase())).length > 0;
    return Boolean(v);
  };

  const hasPhoto = Boolean(profile?.profilePic) || photos.some((p: any) => p?.url);
  const hasHoroscope =
    (isSet(astrology.rashi)) || (isSet(astrology.nakshatra));

  const items: string[] = [];
  if (!hasPhoto) items.push('Add Profile Photo');
  if (!isSet(profile?.bio)) items.push('Add Short Bio');
  if (!isSet(profile?.tagline)) items.push('Add Tagline');
  if (!isSet(profile?.location)) items.push('Add Location');
  if (!isSet(profile?.height)) items.push('Add Height');
  if (!isSet(personalInfo.ethnicity)) items.push('Add Ethnicity');
  if (!isSet(profile?.birthDate)) items.push('Add Date of Birth');
  if (!isSet(profile?.birthPlace)) items.push('Add Birth Place');
  if (!hasHoroscope) items.push('Generate Horoscope');
  if (!isSet(profile?.education) && !isSet(personalInfo.education)) items.push('Add Education');
  if (!isSet(profile?.occupation) && !isSet(personalInfo.occupation)) items.push('Add Profession');
  if (!isSet(profile?.religion) && !isSet(personalInfo.religion)) items.push('Add Religion');
  if (!isSet(lifestyle.diet)) items.push('Add Diet');
  if (!isSet(lifestyle.smoking)) items.push('Add Smoking Habit');
  if (!isSet(lifestyle.drinking)) items.push('Add Drinking Habit');
  if (!isSet(personalInfo.languages)) items.push('Add Languages');
  if (!isSet(lifestyle.hobbies)) items.push('Add Hobbies');
  if (!profile?.verification?.emailVerified) items.push('Verify Email');
  if (!profile?.verification?.phoneVerified) items.push('Verify Phone');
  return items;
}

export function normalizeProfileData(profile: any) {
  const personalInfo = profile?.personalInfo || {};
  const lifestyle = profile?.lifestyle || {};
  const astrology = profile?.astrology || {};
  const privacy = { ...DEFAULT_PRIVACY, ...(profile?.privacy || {}) };
  const languages = normalizeStringArray(personalInfo.languages || profile?.languages || profile?.lifestyle?.languages);
  const hobbies = normalizeStringArray(lifestyle.hobbies || profile?.hobbies);
  // Prefer nested personal info first while editing; top-level fields can be stale snapshots.
  const height = normalizeString(personalInfo.height ?? profile?.height);
  const education = normalizeString(personalInfo.education ?? profile?.education);
  const occupation = normalizeString(personalInfo.occupation ?? profile?.occupation);
  const religion = normalizeString(personalInfo.religion ?? profile?.religion);
  const ethnicity = normalizeString(personalInfo.ethnicity ?? profile?.ethnicity);
  const personality = normalizePersonality(profile);
  const personalityAnswers = derivePersonalityAnswers(profile);
  const photos = Array.isArray(profile?.photos) ? profile.photos : [];

  const normalized = {
    ...profile,
    name: normalizeString(profile?.name),
    bio: normalizeString(profile?.bio),
    tagline: normalizeString(profile?.tagline),
    location: normalizeString(profile?.location),
    age: normalizeOptionalValue(profile?.age ?? personalInfo.age ?? ''),
    birthDate: normalizeString(profile?.birthDate),
    birthTime: normalizeString(profile?.birthTime),
    birthPlace: normalizeString(profile?.birthPlace),
    knownBirthTime:
      typeof profile?.knownBirthTime === 'boolean'
        ? profile.knownBirthTime
        : profile?.birthData?.knownBirthTime !== false,
    education,
    occupation,
    religion,
    ethnicity,
    height,
    personalInfo: {
      ...personalInfo,
      firstName: normalizeString(personalInfo.firstName),
      lastName: normalizeString(personalInfo.lastName),
      phone: normalizeString(personalInfo.phone || profile?.phone),
      age: normalizeOptionalValue(profile?.age ?? personalInfo.age ?? ''),
      gender: normalizeString(personalInfo.gender || profile?.gender),
      seekingGender: normalizeString(personalInfo.seekingGender ?? profile?.seekingGender ?? ''),
      height,
      education,
      occupation,
      religion,
      ethnicity,
      languages,
    },
    astrology: {
      ...astrology,
      birthDate: normalizeString(astrology.birthDate || profile?.birthDate) || 'Not provided',
      birthTime: normalizeString(astrology.birthTime || profile?.birthTime) || 'Not provided',
      birthPlace: normalizeString(astrology.birthPlace || profile?.birthPlace) || 'Not provided',
      rashi: normalizeString(astrology.rashi) || 'Not provided',
      nakshatra: normalizeString(astrology.nakshatra) || 'Not provided',
      ascendant: normalizeString(astrology.ascendant) || 'Not provided',
      sunSign: normalizeString(astrology.sunSign) || 'Not provided',
      luckyColors: normalizeStringArray(astrology.luckyColors),
      auspiciousDays: normalizeStringArray(astrology.auspiciousDays),
      favorablePartners: normalizeStringArray(astrology.favorablePartners),
      profileFacts: normalizeStringArray(astrology.profileFacts),
    },
    lifestyle: {
      ...lifestyle,
      hobbies,
      exercise: normalizeString(lifestyle.exercise),
      diet: normalizeString(lifestyle.diet),
      smoking: normalizeString(lifestyle.smoking),
      drinking: normalizeString(lifestyle.drinking),
      careerAmbitions: normalizeString(lifestyle.careerAmbitions),
      familyPlans: normalizeString(lifestyle.familyPlans),
      socialPreference: normalizeNumber(lifestyle.socialPreference, 50),
    },
    personality,
    personalityAnswers,
    privacy,
    photos,
  };

  // Recompute completion from the normalized fields so the displayed percentage
  // is always accurate regardless of cached server values.
  normalized.completion = computeProfileCompletion(normalized);
  return normalized;
}

export function buildProfileUpdatePayload(source: any) {
  const normalized = normalizeProfileData(source);
  const age = normalized.age === '' ? undefined : Number(normalized.age);
  const derivedName = [normalized.personalInfo.firstName, normalized.personalInfo.lastName]
    .filter(Boolean)
    .join(' ')
    .trim();

  // Only include birth fields when birthDate is actually set, to avoid incorrectly
  // triggering the backend's birth-data update path for general profile saves.
  const birthPayload = normalized.birthDate
    ? {
        birthDate: normalized.birthDate,
        birthTime: normalized.birthTime || '',
        birthPlace: normalized.birthPlace || undefined,
        knownBirthTime: normalized.knownBirthTime,
      }
    : {};

  const personalityPayload = mapPersonalityFromAnswers(normalized.personalityAnswers || []);

  return {
    name: derivedName || normalized.name,
    bio: normalized.bio,
    tagline: normalized.tagline,
    location: normalized.location,
    age: Number.isFinite(age) ? age : undefined,
    gender: normalized.personalInfo.gender || undefined,
    seekingGender: normalized.personalInfo.seekingGender || undefined,
    ...birthPayload,
    height: normalized.personalInfo.height,
    education: normalized.personalInfo.education,
    occupation: normalized.personalInfo.occupation,
    religion: normalized.personalInfo.religion,
    ethnicity: normalized.personalInfo.ethnicity,
    languages: normalized.personalInfo.languages,
    hobbies: normalized.lifestyle.hobbies,
    diet: normalized.lifestyle.diet,
    exercise: normalized.lifestyle.exercise,
    smoking: normalized.lifestyle.smoking,
    drinking: normalized.lifestyle.drinking,
    careerAmbitions: normalized.lifestyle.careerAmbitions,
    familyPlans: normalized.lifestyle.familyPlans,
    socialPreference: normalized.lifestyle.socialPreference,
    personality: personalityPayload,
    personalityAnswers: normalized.personalityAnswers,
    privacy: normalized.privacy,
  };
}

export function buildEditProfileFormData(profile: any) {
  const normalized = normalizeProfileData(profile);

  return {
    name: normalized.name,
    firstName: normalized.personalInfo.firstName || '',
    lastName: normalized.personalInfo.lastName || '',
    bio: normalized.bio,
    tagline: normalized.tagline,
    location: normalized.location,
    birthDate: normalized.birthDate,
    birthTime: normalized.birthTime,
    birthPlace: normalized.birthPlace,
    education: normalized.personalInfo.education,
    occupation: normalized.personalInfo.occupation,
    religion: normalized.personalInfo.religion,
    ethnicity: normalized.personalInfo.ethnicity,
    height: normalized.personalInfo.height,
    hobbies: normalized.lifestyle.hobbies,
    diet: normalized.lifestyle.diet || 'Non-veg',
    exercise: normalized.lifestyle.exercise || 'Regularly',
    smoking: normalized.lifestyle.smoking || 'Never',
    drinking: normalized.lifestyle.drinking || 'Never',
    careerAmbitions: normalized.lifestyle.careerAmbitions,
    familyPlans: normalized.lifestyle.familyPlans,
    socialPreference: normalized.lifestyle.socialPreference,
    privacy: normalized.privacy,
    gender: normalized.personalInfo.gender,
    seekingGender: normalized.personalInfo.seekingGender || '',
  };
}

export function formatProfileValue(value: any, fallback = 'Not provided') {
  if (value === undefined || value === null) return fallback;
  if (typeof value === 'string') {
    const normalized = value.trim();
    if (!normalized || PLACEHOLDER_VALUES.has(normalized.toLowerCase())) {
      return fallback;
    }
    return normalized;
  }
  return String(value);
}