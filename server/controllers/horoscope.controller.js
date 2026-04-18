import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import compatibilityService from '../services/compatibility.service.js';
import logger from '../utils/logger.js';
import User from '../models/User.js';
import Horoscope from '../models/Horoscope.js';
import Match from '../models/Match.js';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { redisClient } from '../lib/redis.js';
import { resolvePythonCommand } from '../utils/pythonRuntime.js';
import { deriveGanaFromNakshatra } from '../utils/gana.js';

const PLANET_SYMBOLS = {
  Sun: 'Su',
  Moon: 'Mo',
  Mars: 'Ma',
  Mercury: 'Me',
  Jupiter: 'Ju',
  Venus: 'Ve',
  Saturn: 'Sa',
  Rahu: 'Ra',
  Ketu: 'Ke',
};

const PLANET_COLORS = {
  Sun: '#FFD700',
  Moon: '#C0C0C0',
  Mars: '#FF4500',
  Mercury: '#32CD32',
  Jupiter: '#DAA520',
  Venus: '#FF69B4',
  Saturn: '#6A5ACD',
  Rahu: '#1A6B72',
  Ketu: '#8B1A2E',
};

const MANGLIK_HOUSES = new Set([1, 2, 4, 7, 8, 12]);

const SIGNS = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
];

const ASCENDANT_TRAITS = {
  Aries: 'a direct, courageous, and action-oriented life approach',
  Taurus: 'a steady, practical, and comfort-seeking life approach',
  Gemini: 'a curious, adaptable, and communicative life approach',
  Cancer: 'an intuitive, protective, and family-centred life approach',
  Leo: 'a confident, expressive, and leadership-driven life approach',
  Virgo: 'an analytical, service-minded, and detail-focused life approach',
  Libra: 'a diplomatic, relationship-aware, and balanced life approach',
  Scorpio: 'an intense, resilient, and deeply transformative life approach',
  Sagittarius: 'an optimistic, truth-seeking, and growth-driven life approach',
  Capricorn: 'a disciplined, ambitious, and responsibility-focused life approach',
  Aquarius: 'an independent, humanitarian, and future-minded life approach',
  Pisces: 'a compassionate, intuitive, and spiritually sensitive life approach',
};

const MOON_TRAITS = {
  Aries: 'quick emotions, initiative, and a need to move forward confidently',
  Taurus: 'emotional steadiness, loyalty, and a strong need for security',
  Gemini: 'a lively mind, conversation, and emotional variety',
  Cancer: 'deep sensitivity, family attachment, and strong intuition',
  Leo: 'warmth, pride, and a need to feel appreciated',
  Virgo: 'careful thinking, service, and emotional precision',
  Libra: 'harmony-seeking emotions and a strong sense of fairness',
  Scorpio: 'intense feelings, privacy, and powerful inner endurance',
  Sagittarius: 'idealism, honesty, and emotional freedom',
  Capricorn: 'self-control, realism, and quiet determination',
  Aquarius: 'independence, objectivity, and unconventional thinking',
  Pisces: 'empathy, imagination, and spiritual openness',
};

const HOUSE_THEMES = {
  1: 'self-expression, confidence, and physical vitality',
  2: 'speech, family resources, and financial stability',
  3: 'communication, courage, and initiative',
  4: 'home life, property, and emotional foundations',
  5: 'creativity, romance, and learning',
  6: 'service, health, discipline, and daily challenges',
  7: 'partnership, marriage, and mutual agreements',
  8: 'transformation, hidden matters, and resilience',
  9: 'fortune, values, higher learning, and blessings',
  10: 'career, status, and public life',
  11: 'gains, networks, and long-term ambitions',
  12: 'spirituality, retreat, overseas links, and inner healing',
};

const SIGN_LORDS = {
  Aries: 'Mars',
  Taurus: 'Venus',
  Gemini: 'Mercury',
  Cancer: 'Moon',
  Leo: 'Sun',
  Virgo: 'Mercury',
  Libra: 'Venus',
  Scorpio: 'Mars',
  Sagittarius: 'Jupiter',
  Capricorn: 'Saturn',
  Aquarius: 'Saturn',
  Pisces: 'Jupiter',
};

const DAY_LORDS = {
  Sunday: 'Sun',
  Monday: 'Moon',
  Tuesday: 'Mars',
  Wednesday: 'Mercury',
  Thursday: 'Jupiter',
  Friday: 'Venus',
  Saturday: 'Saturn',
};

const HORA_SEQUENCE = ['Sun', 'Venus', 'Mercury', 'Moon', 'Saturn', 'Jupiter', 'Mars'];
const BENEFIC_PLANETS = new Set(['Jupiter', 'Venus', 'Mercury', 'Moon']);

const LUCKY_COLORS_BY_SIGN = {
  Aries: ['#E53935', '#FF7043'],
  Taurus: ['#43A047', '#8D6E63'],
  Gemini: ['#FDD835', '#29B6F6'],
  Cancer: ['#90CAF9', '#F8BBD0'],
  Leo: ['#FB8C00', '#FDD835'],
  Virgo: ['#66BB6A', '#26A69A'],
  Libra: ['#EC407A', '#AB47BC'],
  Scorpio: ['#8E24AA', '#D32F2F'],
  Sagittarius: ['#1E88E5', '#FFA726'],
  Capricorn: ['#546E7A', '#8D6E63'],
  Aquarius: ['#26C6DA', '#5C6BC0'],
  Pisces: ['#42A5F5', '#7E57C2'],
};

const FAVORABLE_PARTNERS_BY_SIGN = {
  Aries: ['Leo', 'Sagittarius', 'Gemini'],
  Taurus: ['Virgo', 'Capricorn', 'Cancer'],
  Gemini: ['Libra', 'Aquarius', 'Aries'],
  Cancer: ['Scorpio', 'Pisces', 'Taurus'],
  Leo: ['Aries', 'Sagittarius', 'Libra'],
  Virgo: ['Taurus', 'Capricorn', 'Cancer'],
  Libra: ['Gemini', 'Aquarius', 'Leo'],
  Scorpio: ['Cancer', 'Pisces', 'Virgo'],
  Sagittarius: ['Aries', 'Leo', 'Aquarius'],
  Capricorn: ['Taurus', 'Virgo', 'Scorpio'],
  Aquarius: ['Gemini', 'Libra', 'Sagittarius'],
  Pisces: ['Cancer', 'Scorpio', 'Capricorn'],
};

function formatDegree(value = 0) {
  const numeric = Number(value || 0);
  if (!Number.isFinite(numeric)) {
    return `0° 00'`;
  }

  let normalized = ((numeric % 30) + 30) % 30;
  let whole = Math.floor(normalized);
  let minutes = Math.round((normalized - whole) * 60);

  if (minutes === 60) {
    whole = (whole + 1) % 30;
    minutes = 0;
  }

  return `${whole}° ${String(minutes).padStart(2, '0')}'`;
}

function formatHouseLabel(value = 1) {
  const house = Number(value) || 1;
  if (house % 100 >= 11 && house % 100 <= 13) return `${house}th`;
  const suffix = { 1: 'st', 2: 'nd', 3: 'rd' }[house % 10] || 'th';
  return `${house}${suffix}`;
}

function getRequiredBirthFields(user) {
  const missingFields = [];

  if (!user?.birthData?.dateOfBirth) missingFields.push('birth date');
  if (!user?.birthData?.placeOfBirth?.city) missingFields.push('birth place');

  return missingFields;
}

function formatMinutesAsClock(totalMinutes) {
  const normalized = ((totalMinutes % 1440) + 1440) % 1440;
  const hours24 = Math.floor(normalized / 60);
  const minutes = normalized % 60;
  const suffix = hours24 >= 12 ? 'PM' : 'AM';
  const hours12 = hours24 % 12 || 12;
  return `${hours12}:${String(minutes).padStart(2, '0')} ${suffix}`;
}

function getCurrentMinutesInTimezone(timeZone = 'Asia/Colombo') {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date());

  const hour = Number(parts.find((part) => part.type === 'hour')?.value || 0);
  const minute = Number(parts.find((part) => part.type === 'minute')?.value || 0);
  return hour * 60 + minute;
}

function calculateAuspiciousTime(horoscopeData = {}, user = {}) {
  const ascendant = horoscopeData.ascendant;
  const moonSign = horoscopeData.moonSign || horoscopeData.rashi;
  const timezone = horoscopeData.timezone || user?.birthData?.placeOfBirth?.timezone || 'Asia/Colombo';

  if (!ascendant || !moonSign || ascendant === 'Pending' || moonSign === 'Pending') {
    return {
      time: 'Update birth details to calculate',
      reason: 'Birth chart data is required for a personalized auspicious time.',
    };
  }

  const weekday = new Intl.DateTimeFormat('en-US', { weekday: 'long', timeZone: timezone }).format(new Date());
  const dayLord = DAY_LORDS[weekday] || 'Sun';
  const ascendantLord = SIGN_LORDS[ascendant] || null;
  const moonLord = SIGN_LORDS[moonSign] || null;
  const currentMinutes = getCurrentMinutesInTimezone(timezone);
  const startSequenceIndex = HORA_SEQUENCE.indexOf(dayLord);
  const nakshatraPada = Number(horoscopeData.nakshatraPada || 1);
  const ascDegree = Number(horoscopeData.ascendantDegree || 0);

  let bestWindow = null;

  for (let index = 0; index < 12; index += 1) {
    const startMinutes = 6 * 60 + index * 60;
    const endMinutes = startMinutes + 60;
    const horaPlanet = HORA_SEQUENCE[(startSequenceIndex + index) % HORA_SEQUENCE.length];

    let score = 0;
    if (horaPlanet === ascendantLord) score += 3;
    if (horaPlanet === moonLord) score += 3.5;
    if (BENEFIC_PLANETS.has(horaPlanet)) score += 1.5;
    if (horaPlanet === dayLord) score += 1;
    if (((nakshatraPada + index + Math.floor(ascDegree / 10)) % 4) === 0) score += 0.75;
    if (endMinutes >= currentMinutes) score += 0.5;
    if (['Mars', 'Saturn'].includes(horaPlanet) && horaPlanet !== ascendantLord && horaPlanet !== moonLord) {
      score -= 1;
    }

    const candidate = {
      startMinutes,
      endMinutes,
      horaPlanet,
      score,
    };

    if (
      !bestWindow ||
      candidate.score > bestWindow.score ||
      (candidate.score === bestWindow.score && Math.abs(candidate.startMinutes - currentMinutes) < Math.abs(bestWindow.startMinutes - currentMinutes))
    ) {
      bestWindow = candidate;
    }
  }

  if (!bestWindow) {
    return {
      time: '10:30 AM - 12:00 PM',
      reason: 'Default window used while horoscope data is stabilizing.',
    };
  }

  return {
    time: `${formatMinutesAsClock(bestWindow.startMinutes)} - ${formatMinutesAsClock(bestWindow.endMinutes)}`,
    reason: `Favourable ${bestWindow.horaPlanet} hora selected for your ${ascendant} Lagna and ${moonSign} Moon sign on ${weekday}.`,
  };
}

function buildHouseDetails(ascendant, positionsSource = []) {
  const ascendantIndex = SIGNS.indexOf(ascendant);
  if (ascendantIndex === -1) {
    return [];
  }

  return Array.from({ length: 12 }, (_, index) => {
    const houseNumber = index + 1;
    const sign = SIGNS[(ascendantIndex + index) % SIGNS.length];
    const occupants = positionsSource
      .filter((position) => Number(position.house) === houseNumber)
      .map((position) => position.planet);

    return {
      house: houseNumber,
      sign,
      occupants,
      isAscendantHouse: houseNumber === 1,
    };
  });
}

function deriveManglikLabelFromUser(user = {}) {
  const positions = user?.horoscopeData?.planetaryPositions || user?.horoscope?.planetaryPositions || [];
  const mars = Array.isArray(positions) ? positions.find((position) => position?.planet === 'Mars') : null;
  const marsHouse = Number(mars?.house);

  if (!Number.isFinite(marsHouse)) return 'Pending';
  return MANGLIK_HOUSES.has(marsHouse) ? `Yes (Mars in House ${marsHouse})` : `No (Mars in House ${marsHouse})`;
}

function buildReadingHighlights(horoscopeData = {}, positionsSource = [], accuracyMeta) {
  const moonSign = horoscopeData.moonSign || horoscopeData.rashi;
  const ascendant = horoscopeData.ascendant;
  const sunSign = horoscopeData.zodiacSign;
  const venus = positionsSource.find((position) => position.planet === 'Venus');
  const jupiter = positionsSource.find((position) => position.planet === 'Jupiter');

  const highlights = [];

  if (ascendant) {
    highlights.push(`Lagna in ${ascendant} suggests ${ASCENDANT_TRAITS[ascendant] || 'a distinctive and purposeful life approach'}.`);
  }

  if (moonSign) {
    const padaText = horoscopeData.nakshatraPada ? ` (Pada ${horoscopeData.nakshatraPada})` : '';
    highlights.push(
      `Moon sign ${moonSign} in ${horoscopeData.nakshatra || 'your birth nakshatra'}${padaText} points to ${MOON_TRAITS[moonSign] || 'a sensitive and evolving emotional nature'}.`
    );
  }

  if (venus) {
    highlights.push(
      `Venus in ${venus.sign} through the ${formatHouseLabel(venus.house)} house highlights ${HOUSE_THEMES[Number(venus.house) || 1]} in love, beauty, and relationship choices.`
    );
  }

  if (jupiter || sunSign) {
    const focusPlanet = jupiter || positionsSource.find((position) => position.planet === 'Sun');
    if (focusPlanet) {
      highlights.push(
        `${focusPlanet.planet} in ${focusPlanet.sign} through the ${formatHouseLabel(focusPlanet.house)} house supports ${HOUSE_THEMES[Number(focusPlanet.house) || 1]} and long-term direction.`
      );
    }
  }

  if (accuracyMeta?.usesApproximateBirthTime) {
    highlights.push('Because the birth time is approximate, Lagna and house readings should be treated as guidance rather than as exact certainties.');
  }

  return highlights.slice(0, 4);
}

function getBirthAccuracyMeta(user) {
  const missingBirthFields = [];

  if (!user?.birthData?.dateOfBirth) missingBirthFields.push('birth date');
  if (!user?.birthData?.placeOfBirth?.city) missingBirthFields.push('birth place');
  if (user?.birthData?.knownBirthTime === false || !user?.birthData?.timeOfBirth) {
    missingBirthFields.push('exact birth time');
  }

  const usesApproximateBirthTime = missingBirthFields.includes('exact birth time');
  const hasIncompleteBirthDetails = missingBirthFields.length > 0;

  let accuracyNote = null;
  if (missingBirthFields.length === 1 && missingBirthFields[0] === 'exact birth time') {
    accuracyNote = 'Birth time was not provided, so this chart uses an approximate 12:00 time. Ascendant and house placements may be less accurate.';
  } else if (missingBirthFields.length > 0) {
    accuracyNote = `Some birth details are missing (${missingBirthFields.join(', ')}). Any generated horoscope may be less accurate until they are completed.`;
  }

  return {
    usesApproximateBirthTime,
    hasIncompleteBirthDetails,
    missingBirthFields,
    accuracyNote,
  };
}

function buildChartData(user) {
  const horoscopeData = user.horoscopeData || {};
  const accuracyMeta = getBirthAccuracyMeta(user);
  const moonSign = horoscopeData.moonSign || horoscopeData.rashi || 'Pending';
  const gana = horoscopeData.gana || deriveGanaFromNakshatra(horoscopeData.nakshatra) || 'Pending';
  const positionsSource = Array.isArray(horoscopeData.planetaryPositions) && horoscopeData.planetaryPositions.length > 0
    ? horoscopeData.planetaryPositions
    : [
        { planet: 'Sun', sign: horoscopeData.zodiacSign || moonSign, house: 1, degree: 0 },
        { planet: 'Moon', sign: moonSign, house: 2, degree: 0 },
      ];
  const sunPosition = positionsSource.find((position) => position.planet === 'Sun');

  const auspiciousTime = calculateAuspiciousTime(horoscopeData, user);

  // Manglik label — prefer stored value, fall back to live derivation
  const manglikStored = horoscopeData.manglik;
  const manglikLabel = manglikStored?.label ||
    (manglikStored?.present != null
      ? (manglikStored.present ? `Yes (Mars in House ${manglikStored.marsHouse})` : `No (Mars in House ${manglikStored.marsHouse})`)
      : deriveManglikLabelFromUser({ horoscopeData }));

  return {
    summary: {
      moonSign,
      nakshatra: horoscopeData.nakshatra || 'Pending',
      gana,
      nakshatraPada: horoscopeData.nakshatraPada || null,
      ascendant: horoscopeData.ascendant || 'Pending',
      ascendantDegree: horoscopeData.ascendantDegree ? formatDegree(horoscopeData.ascendantDegree) : 'Pending',
      sunSign: horoscopeData.zodiacSign || sunPosition?.sign || 'Pending',
      auspiciousTime: auspiciousTime.time,
      auspiciousTimeReason: auspiciousTime.reason,
      manglik: manglikLabel,
      manglikPresent: manglikStored?.present ?? null,
      manglikSeverity: manglikStored?.severity ?? null,
      kalaSarpaDosha: horoscopeData.kalaSarpaDosha || null,
      seventhHouseAnalysis: horoscopeData.seventhHouseAnalysis || null,
      sadeSati: horoscopeData.sadeSati || null,
      venusSummary: horoscopeData.venusSummary || null,
      jupiterSummary: horoscopeData.jupiterSummary || null,
      ascendantNavamsha: horoscopeData.ascendantNavamsha || null,
      rajju: horoscopeData.rajju || null,
      nadi: horoscopeData.nadi || null,
      yoni: horoscopeData.yoni || null,
      rasiLord: horoscopeData.rasiLord || null,
      chartGrade: horoscopeData.chartGrade || null,
      marriageWindow: horoscopeData.marriageWindow || [],
    },
    details: {
      gana,
      nakshatraPada: horoscopeData.nakshatraPada || null,
      ascendantDegree: horoscopeData.ascendantDegree ? formatDegree(horoscopeData.ascendantDegree) : 'Pending',
      tithi: horoscopeData.tithi || 'Pending',
      paksha: horoscopeData.paksha || 'Pending',
      yoga: horoscopeData.yoga || 'Pending',
      karana: horoscopeData.karana || 'Pending',
      vedicDay: horoscopeData.vedicDay || 'Pending',
      ayanamsa: horoscopeData.ayanamsa || 'Lahiri',
      timezone: horoscopeData.timezone || user?.birthData?.placeOfBirth?.timezone || 'Asia/Colombo',
      chartType: 'Sri Lankan Vedic / Sidereal',
      dasaInfo: horoscopeData.dasaInfo || null,
      antardasha: horoscopeData.antardasha || null,
    },
    planets: positionsSource.map((position) => ({
      name: position.planet,
      symbol: PLANET_SYMBOLS[position.planet] || position.planet.slice(0, 2),
      sign: position.sign || 'Pending',
      degree: formatDegree(position.degree),
      house: Number(position.house) || 1,
      color: PLANET_COLORS[position.planet] || '#8B1A2E',
    })),
    positions: positionsSource.map((position) => ({
      planet: position.planet,
      sign: position.sign || 'Pending',
      house: Number(position.house) || 1,
      degree: formatDegree(position.degree),
      dignity: position.dignity || null,
      retrograde: position.retrograde || false,
      navamsha: position.navamsha || null,
    })),
    houses: buildHouseDetails(horoscopeData.ascendant, positionsSource),
    insights: buildReadingHighlights(horoscopeData, positionsSource, accuracyMeta),
    highlights: {
      luckyColors: Array.isArray(horoscopeData.luckyColors) ? horoscopeData.luckyColors : [],
      auspiciousDays: Array.isArray(horoscopeData.auspiciousDays) ? horoscopeData.auspiciousDays : [],
      favorablePartners: Array.isArray(horoscopeData.favorablePartners) ? horoscopeData.favorablePartners : [],
      profileFacts: Array.isArray(horoscopeData.profileFacts) ? horoscopeData.profileFacts : [],
    },
    meta: {
      ...accuracyMeta,
      userId: user?._id ? String(user._id) : null,
      userName: user?.name || user?.personalInfo?.firstName || null,
      generatedFrom: {
        birthDate: user?.birthData?.dateOfBirth ? new Date(user.birthData.dateOfBirth).toISOString().split('T')[0] : null,
        birthTime: user?.birthData?.timeOfBirth || null,
        birthPlace: user?.birthData?.placeOfBirth?.city || null,
        knownBirthTime: user?.birthData?.knownBirthTime !== false,
      },
      timezone: horoscopeData.timezone || user?.birthData?.placeOfBirth?.timezone || 'Asia/Colombo',
      calculationVersion: Number(horoscopeData.calculationVersion || 1),
      generatedAt: horoscopeData.generatedAt || null,
    },
  };
}

function deriveProfileAstrologyDetails(horoscopeData = {}) {
  const sign = horoscopeData.moonSign || horoscopeData.rashi || horoscopeData.zodiacSign || '';
  const gana = horoscopeData.gana || deriveGanaFromNakshatra(horoscopeData.nakshatra);
  const luckyColors = LUCKY_COLORS_BY_SIGN[sign] || ['#8B1A2E', '#C9A84C'];
  const favorablePartners = FAVORABLE_PARTNERS_BY_SIGN[sign] || [];

  // Auspicious days: birth weekday + the ruling day of the Moon sign lord
  const PLANET_RULING_DAY = {
    Sun: 'Sunday', Moon: 'Monday', Mars: 'Tuesday',
    Mercury: 'Wednesday', Jupiter: 'Thursday', Venus: 'Friday', Saturn: 'Saturday',
  };
  const moonLord = SIGN_LORDS[sign] || null;
  const birthDay = horoscopeData.vedicDay || null;
  const moonLordDay = moonLord ? PLANET_RULING_DAY[moonLord] : null;
  const auspiciousDays = [...new Set([birthDay, moonLordDay].filter(Boolean))].slice(0, 2);

  const profileFacts = [
    sign ? `Moon influence in ${sign} points to ${MOON_TRAITS[sign] || 'a sensitive and adaptive emotional nature'}.` : '',
    horoscopeData.nakshatra
      ? `${horoscopeData.nakshatra}${horoscopeData.nakshatraPada ? ` (Pada ${horoscopeData.nakshatraPada})` : ''} shapes your instinctive decision-making style.`
      : '',
    gana ? `${gana} gana indicates your core temperament in traditional nakshatra matching.` : '',
    horoscopeData.ascendant
      ? `Ascendant in ${horoscopeData.ascendant} suggests ${ASCENDANT_TRAITS[horoscopeData.ascendant] || 'a distinctive life approach'}.`
      : '',
    horoscopeData.tithi ? `Birth tithi ${horoscopeData.tithi} highlights your personal rhythm and timing.` : '',
  ].filter(Boolean).slice(0, 4);

  return {
    luckyColors,
    auspiciousDays,
    favorablePartners,
    profileFacts,
  };
}

function hasGeneratedChart(user) {
  return Boolean(
    user?.horoscopeData?.rashi &&
      user?.horoscopeData?.nakshatra &&
      user?.horoscopeData?.ascendant &&
      Array.isArray(user?.horoscopeData?.planetaryPositions) &&
      user.horoscopeData.planetaryPositions.length > 0
  );
}

function normalizeBirthDateForComparison(value) {
  if (!value) return '';
  const parsed = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(parsed.getTime()) ? '' : parsed.toISOString().split('T')[0];
}

function normalizeBirthTimeForComparison(value, knownBirthTime = true) {
  if (knownBirthTime === false) {
    return '12:00';
  }

  const normalized = String(value || '').trim();
  return normalized || '12:00';
}

function hasBirthPayloadChanged(user) {
  if (!user?.birthData) return false;

  const knownBirthTime = user.birthData.knownBirthTime !== false;
  const currentBirthDate = normalizeBirthDateForComparison(user.birthData.dateOfBirth);
  const currentBirthTime = normalizeBirthTimeForComparison(user.birthData.timeOfBirth, knownBirthTime);
  const currentLat = Number(user.birthData.placeOfBirth?.latitude || 6.9271);
  const currentLon = Number(user.birthData.placeOfBirth?.longitude || 79.8612);
  const currentTimezone = String(user.birthData.placeOfBirth?.timezone || 'Asia/Colombo').trim();

  const generatedFrom = user?.horoscopeData?.generatedFrom || {};
  const generatedBirthDate = normalizeBirthDateForComparison(generatedFrom.birthDate);
  const generatedBirthTime = normalizeBirthTimeForComparison(generatedFrom.birthTime, generatedFrom.knownBirthTime !== false);
  const generatedLat = Number(generatedFrom.lat || 6.9271);
  const generatedLon = Number(generatedFrom.lon || 79.8612);
  const generatedTimezone = String(generatedFrom.timezone || 'Asia/Colombo').trim();

  const latChanged = Math.abs(currentLat - generatedLat) > 0.0001;
  const lonChanged = Math.abs(currentLon - generatedLon) > 0.0001;

  return (
    currentBirthDate !== generatedBirthDate ||
    currentBirthTime !== generatedBirthTime ||
    currentTimezone !== generatedTimezone ||
    latChanged ||
    lonChanged
  );
}

function buildBirthPayload(user) {
  if (!user?.birthData?.dateOfBirth || !user?.birthData?.placeOfBirth) {
    return null;
  }

  return {
    birthDate: user.birthData.dateOfBirth.toISOString().split('T')[0],
    birthTime: user.birthData.timeOfBirth || '12:00',
    lat: user.birthData.placeOfBirth.latitude || 6.9271,
    lon: user.birthData.placeOfBirth.longitude || 79.8612,
    timezone: user.birthData.placeOfBirth.timezone || 'Asia/Colombo',
  };
}

export async function generateAndPersistHoroscope(user, { force = false } = {}) {
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  if (
    !force &&
    hasGeneratedChart(user) &&
    Number(user?.horoscopeData?.calculationVersion || 1) >= 4 &&
    !hasBirthPayloadChanged(user)
  ) {
    return user;
  }

  const payload = buildBirthPayload(user);
  if (!payload) {
    const missingRequiredFields = getRequiredBirthFields(user);
    throw new ApiError(
      422,
      `Birth data is incomplete. Missing ${missingRequiredFields.join(' and ')}. Please update your birth details to generate a more accurate horoscope.`
    );
  }

  const pythonProcess = spawn(resolvePythonCommand(), [
    path.resolve(process.cwd(), 'server/python/horoscope_engine.py'),
    JSON.stringify(payload),
  ], {
    cwd: process.cwd(),
    stdio: ['pipe', 'pipe', 'pipe'],
  });

  let stdout = '';
  let stderr = '';

  pythonProcess.stdout.on('data', (data) => {
    stdout += data.toString();
  });

  pythonProcess.stderr.on('data', (data) => {
    stderr += data.toString();
  });

  const result = await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      pythonProcess.kill();
      reject(new ApiError(504, 'Horoscope generation timed out'));
    }, 10000);

    pythonProcess.on('close', (code) => {
      clearTimeout(timeout);

      if (code !== 0) {
        logger.error('Horoscope generation failed', { code, stderr });
        reject(new ApiError(500, `Horoscope generation failed: ${stderr || 'Python exited unexpectedly'}`));
        return;
      }

      try {
        const output = stdout.trim().split(/\r?\n/).filter(Boolean).at(-1) || '{}';
        const parsed = JSON.parse(output);

        if (!parsed.success) {
          reject(new ApiError(500, `Horoscope calculation error: ${parsed.error}`));
          return;
        }

        resolve(parsed);
      } catch (parseError) {
        logger.error('Failed to parse horoscope result', { error: parseError.message, stdout });
        reject(new ApiError(500, 'Failed to parse horoscope result'));
      }
    });

    pythonProcess.on('error', (error) => {
      clearTimeout(timeout);
      logger.error('Python process error', { error: error.message });
      reject(new ApiError(500, 'Horoscope generation process failed'));
    });
  });

  const profileDetails = deriveProfileAstrologyDetails(result);

  const horoscopeData = {
    zodiacSign: result.zodiacSign,
    moonSign: result.moonSign || result.rashi,
    rashi: result.rashi,
    nakshatra: result.nakshatra,
    gana: result.gana || deriveGanaFromNakshatra(result.nakshatra),
    nakshatraPada: result.nakshatraPada,
    ascendant: result.ascendant,
    ascendantDegree: result.ascendantDegree,
    tithi: result.tithi,
    paksha: result.paksha,
    yoga: result.yoga,
    karana: result.karana,
    vedicDay: result.vedicDay,
    ayanamsa: result.ayanamsa || 'Lahiri',
    planetaryPositions: result.planetaryPositions,
    timezone: payload.timezone || 'Asia/Colombo',
    calculationVersion: 4,
    gunaScore: 0,
    luckyColors: profileDetails.luckyColors,
    auspiciousDays: profileDetails.auspiciousDays,
    favorablePartners: profileDetails.favorablePartners,
    profileFacts: profileDetails.profileFacts,
    dasaInfo: result.dasaInfo || null,
    kalaSarpaDosha: result.kalaSarpaDosha || { present: false },
    manglik: result.manglik || null,
    seventhHouseAnalysis: result.seventhHouseAnalysis || null,
    sadeSati: result.sadeSati || null,
    venusSummary: result.venusSummary || null,
    jupiterSummary: result.jupiterSummary || null,
    ascendantNavamsha: result.ascendantNavamsha || null,
    rajju: result.rajju || null,
    nadi: result.nadi || null,
    yoni: result.yoni || null,
    rasiLord: result.rasiLord || null,
    antardasha: result.antardasha || null,
    marriageWindow: result.marriageWindow || [],
    chartGrade: result.chartGrade || null,
    generatedFrom: {
      birthDate: payload.birthDate,
      birthTime: payload.birthTime,
      lat: payload.lat,
      lon: payload.lon,
      timezone: payload.timezone,
      knownBirthTime: user?.birthData?.knownBirthTime !== false,
    },
    generatedAt: new Date(),
  };

  await Promise.all([
    Horoscope.findOneAndUpdate(
      { userId: user._id },
      { userId: user._id, ...horoscopeData },
      { upsert: true, new: true }
    ),
    User.findByIdAndUpdate(user._id, {
      $set: {
        horoscopeData,
      },
    }),
  ]);

  try {
    await redisClient.setEx(`horoscope:${user._id}`, 86400, JSON.stringify(result));
  } catch (cacheError) {
    logger.warn('Unable to cache horoscope result', { userId: String(user._id), message: cacheError.message });
  }

  logger.info('Horoscope generated successfully', { userId: user._id });

  return User.findById(user._id).lean({ virtuals: true });
}

function buildCompatibilityPayload(currentUser, partner, result) {
  return {
    overallScore: result.overallScore,
    astroScore: result.astroScore,
    personalityScore: result.personalityScore,
    lifestyleScore: result.lifestyleScore,
    familyScore: result.familyScore,
    explanation: result.explanation,
    bandLabel: result.bandLabel,
    astroBreakdown: result.astroBreakdown,
    userA: {
      name: currentUser.name,
      photo: currentUser.profilePic || currentUser.photos?.[0]?.url || null,
      gana:
        result.userAInsights?.gana ||
        currentUser.horoscopeData?.gana ||
        deriveGanaFromNakshatra(currentUser.horoscopeData?.nakshatra || currentUser.horoscope?.nakshatra) ||
        'Pending',
      manglik: result.userAInsights?.manglik || deriveManglikLabelFromUser(currentUser),
      sign:
        currentUser.horoscopeData?.moonSign ||
        currentUser.horoscopeData?.rashi ||
        currentUser.horoscope?.moonSign ||
        currentUser.horoscope?.rashi ||
        'Pending',
    },
    userB: {
      name: partner.name,
      photo: partner.profilePic || partner.photos?.[0]?.url || null,
      gana:
        result.userBInsights?.gana ||
        partner.horoscopeData?.gana ||
        deriveGanaFromNakshatra(partner.horoscopeData?.nakshatra || partner.horoscope?.nakshatra) ||
        'Pending',
      manglik: result.userBInsights?.manglik || deriveManglikLabelFromUser(partner),
      sign:
        partner.horoscopeData?.moonSign ||
        partner.horoscopeData?.rashi ||
        partner.horoscope?.moonSign ||
        partner.horoscope?.rashi ||
        'Pending',
    },
    dimensions: [
      {
        id: 'astro',
        name: 'Astrological Compatibility',
        score: Math.round(result.astroScore * 0.4),
        max: 40,
        explanation: result.explanation,
        subScores: Object.entries(result.astroBreakdown || {}).map(([name, score]) => ({
          name,
          score,
          max:
            {
              varna: 1,
              vashya: 2,
              tara: 3,
              yoni: 4,
              grahaMaitri: 5,
              gana: 6,
              bhakoot: 7,
              nadi: 8,
            }[name] || 0,
          status: score > 0 ? 'success' : 'warning',
        })),
      },
      {
        id: 'personality',
        name: 'AI Personality Analysis',
        score: Math.round(result.personalityScore * 0.25),
        max: 25,
        explanation: 'This score reflects Big Five similarity and relational style alignment.',
      },
      {
        id: 'lifestyle',
        name: 'Lifestyle Alignment',
        score: Math.round(result.lifestyleScore * 0.2),
        max: 20,
        explanation: 'This score reflects habits, preferred location, and practical life compatibility.',
      },
      {
        id: 'family',
        name: 'Family Values',
        score: Math.round(result.familyScore * 0.15),
        max: 15,
        explanation: 'This score reflects long-term family expectations and value fit.',
      },
    ],
  };
}

async function syncHoroscopeDocument(user) {
  if (!user?.horoscope) return null;

  return Horoscope.findOneAndUpdate(
    { userId: user._id },
    {
      $set: {
        zodiacSign: user.horoscopeData?.zodiacSign || user.horoscope?.zodiacSign || 'Unknown',
        rashi: user.horoscopeData?.rashi || user.horoscope?.rashi || user.horoscope?.moonSign || 'Unknown',
        nakshatra: user.horoscopeData?.nakshatra || user.horoscope?.nakshatra || 'Unknown',
        gana: user.horoscopeData?.gana || deriveGanaFromNakshatra(user.horoscopeData?.nakshatra || user.horoscope?.nakshatra) || 'Unknown',
        nakshatraPada: user.horoscopeData?.nakshatraPada,
        ascendant: user.horoscopeData?.ascendant || user.horoscope?.ascendant || 'Unknown',
        ascendantDegree: user.horoscopeData?.ascendantDegree,
        tithi: user.horoscopeData?.tithi,
        paksha: user.horoscopeData?.paksha,
        yoga: user.horoscopeData?.yoga,
        karana: user.horoscopeData?.karana,
        vedicDay: user.horoscopeData?.vedicDay,
        ayanamsa: user.horoscopeData?.ayanamsa || 'Lahiri',
        planetaryPositions:
          user.horoscopeData?.planetaryPositions?.length > 0
            ? user.horoscopeData.planetaryPositions
            : [
                {
                  planet: 'Sun',
                  sign: user.horoscopeData?.zodiacSign || user.horoscope?.zodiacSign || 'Unknown',
                  house: 7,
                  degree: 12.4,
                },
                {
                  planet: 'Moon',
                  sign: user.horoscopeData?.rashi || user.horoscope?.rashi || user.horoscope?.moonSign || 'Unknown',
                  house: 8,
                  degree: 18.1,
                },
              ],
        gunaScore: user.horoscopeData?.gunaScore || 0,
      },
    },
    { upsert: true, new: true }
  );
}

async function persistMatchResult(userAId, userBId, result) {
  const [first, second] = [String(userAId), String(userBId)].sort();

  return Match.findOneAndUpdate(
    { userAId: first, userBId: second },
    {
      $set: {
        compatibilityScore: result.overallScore,
        calculationVersion: Number(result.calculationVersion || 2),
        dimensionScores: {
          astro: result.astroScore,
          personality: result.personalityScore,
          lifestyle: result.lifestyleScore,
          family: result.familyScore,
        },
        explanation: result.explanation,
      },
    },
    { upsert: true, new: true }
  );
}

export const getMyChart = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).lean({ virtuals: true });

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  const hydratedUser = await generateAndPersistHoroscope(user);
  await syncHoroscopeDocument(hydratedUser);

  res.status(200).json({
    success: true,
    data: buildChartData(hydratedUser),
  });
});

export const postCompatibility = asyncHandler(async (req, res) => {
  const userAId = req.body?.userAId || String(req.user._id);
  const userBId = req.body?.userBId || req.body?.partnerId;

  if (!userAId || !userBId) {
    throw new ApiError(400, 'partnerId or userAId/userBId are required');
  }

  const [currentUser, partner] = await Promise.all([
    User.findById(userAId).lean({ virtuals: true }),
    User.findById(userBId).lean({ virtuals: true }),
  ]);

  if (!currentUser || !partner) {
    throw new ApiError(404, 'One or both users were not found');
  }

  const result = await compatibilityService.calculateCompatibility({ userAId, userBId });
  await Promise.all([
    syncHoroscopeDocument(currentUser),
    syncHoroscopeDocument(partner),
    persistMatchResult(userAId, userBId, result),
  ]);

  logger.info('Compatibility calculation completed', {
    userAId,
    userBId,
    overallScore: result.overallScore,
    bandLabel: result.bandLabel,
  });

  res.status(200).json({
    success: true,
    data: buildCompatibilityPayload(currentUser, partner, result),
  });
});

export const calculateCompatibility = asyncHandler(async (req, res) => {
  const { userAId, userBId, forceRefresh = false } = req.body;

  if (!userAId || !userBId) {
    throw new ApiError(400, 'userAId and userBId are required');
  }

  // Check DB first unless the client explicitly requests a fresh recalculation.
  const [first, second] = [String(userAId), String(userBId)].sort();
  const existingMatch = forceRefresh ? null : await Match.findOne({ userAId: first, userBId: second }).lean();

  if (existingMatch && Number(existingMatch.calculationVersion || 1) >= 2) {
    // Return cached DB result
    const explanationText = (existingMatch.explanation || '').toUpperCase();
    const result = {
      overallScore: existingMatch.compatibilityScore,
      astroScore: existingMatch.dimensionScores.astro,
      personalityScore: existingMatch.dimensionScores.personality,
      lifestyleScore: existingMatch.dimensionScores.lifestyle,
      familyScore: existingMatch.dimensionScores.family,
      explanation: existingMatch.explanation,
      bandLabel: explanationText.includes('EXCELLENT')
        ? 'EXCELLENT'
        : explanationText.includes('GOOD')
          ? 'GOOD'
          : explanationText.includes('MODERATE')
            ? 'MODERATE'
            : 'LOW',
      astroBreakdown: {}, // Not stored, can be empty
    };
    return res.status(200).json({
      success: true,
      data: buildCompatibilityPayload(
        await User.findById(userAId).lean({ virtuals: true }),
        await User.findById(userBId).lean({ virtuals: true }),
        result
      ),
    });
  }

  const [currentUser, partner] = await Promise.all([
    User.findById(userAId).lean({ virtuals: true }),
    User.findById(userBId).lean({ virtuals: true }),
  ]);

  if (!currentUser || !partner) {
    throw new ApiError(404, 'One or both users not found');
  }

  const currentHasChart =
    Array.isArray(currentUser?.horoscopeData?.planetaryPositions) &&
    currentUser.horoscopeData.planetaryPositions.length > 0;
  const partnerHasChart =
    Array.isArray(partner?.horoscopeData?.planetaryPositions) &&
    partner.horoscopeData.planetaryPositions.length > 0;

  if (!currentHasChart || !partnerHasChart) {
    const missing = [];
    if (!currentHasChart) missing.push('Your birth chart is not yet generated');
    if (!partnerHasChart) missing.push(`${partner.name || 'Partner'}'s birth chart is not yet generated`);
    throw new ApiError(
      422,
      `Cannot calculate compatibility: ${missing.join('. ')}. Please ensure both users have complete birth details and generate their horoscope first.`
    );
  }

  const result = await compatibilityService.calculateCompatibility({ userAId, userBId });
  await persistMatchResult(userAId, userBId, result);

  res.status(200).json({
    success: true,
    data: buildCompatibilityPayload(currentUser, partner, result),
  });
});

export const generateChart = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).lean({ virtuals: true });

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  const hydratedUser = await generateAndPersistHoroscope(user, { force: true });
  await syncHoroscopeDocument(hydratedUser);

  res.status(200).json({
    success: true,
    data: buildChartData(hydratedUser),
  });
});

export default {
  getMyChart,
  postCompatibility,
  calculateCompatibility,
  generateChart,
};
