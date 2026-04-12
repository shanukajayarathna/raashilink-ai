const DEFAULT_PRIVACY = {
  showLastSeen: true,
  showHoroscope: true,
  showPhone: false,
  whoCanMessage: 'Matches Only',
  whoCanSeePhotos: 'Matches Only',
};

const PLACEHOLDER_VALUES = new Set(['not provided', 'unknown']);

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

export function normalizeProfileData(profile: any) {
  const personalInfo = profile?.personalInfo || {};
  const lifestyle = profile?.lifestyle || {};
  const astrology = profile?.astrology || {};
  const privacy = { ...DEFAULT_PRIVACY, ...(profile?.privacy || {}) };
  const languages = normalizeStringArray(personalInfo.languages || profile?.languages || profile?.lifestyle?.languages);
  const hobbies = normalizeStringArray(lifestyle.hobbies || profile?.hobbies);
  const height = normalizeString(profile?.height || personalInfo.height);
  const education = normalizeString(profile?.education || personalInfo.education);
  const occupation = normalizeString(profile?.occupation || personalInfo.occupation);
  const religion = normalizeString(profile?.religion || personalInfo.religion);
  const ethnicity = normalizeString(profile?.ethnicity || personalInfo.ethnicity);

  return {
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
    privacy,
    photos: Array.isArray(profile?.photos) ? profile.photos : [],
  };
}

export function buildProfileUpdatePayload(source: any) {
  const normalized = normalizeProfileData(source);
  const age = normalized.age === '' ? undefined : Number(normalized.age);
  const derivedName = [normalized.personalInfo.firstName, normalized.personalInfo.lastName]
    .filter(Boolean)
    .join(' ')
    .trim();

  return {
    name: derivedName || normalized.name,
    bio: normalized.bio,
    tagline: normalized.tagline,
    location: normalized.location,
    age: Number.isFinite(age) ? age : undefined,
    birthDate: normalized.birthDate || undefined,
    birthTime: normalized.birthTime || '',
    birthPlace: normalized.birthPlace || undefined,
    knownBirthTime: normalized.knownBirthTime,
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
    privacy: normalized.privacy,
  };
}

export function buildEditProfileFormData(profile: any) {
  const normalized = normalizeProfileData(profile);

  return {
    name: normalized.name,
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