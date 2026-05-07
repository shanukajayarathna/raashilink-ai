import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Horoscope from '../models/Horoscope.js';
import Match from '../models/Match.js';
import redisClient from '../lib/redis.js';
import ApiError from '../utils/ApiError.js';
import logger from '../utils/logger.js';
import { resolvePythonCommand } from '../utils/pythonRuntime.js';
import { calculateGunaMilan } from '../utils/gunaMilan.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SCORER_PATH = path.resolve(__dirname, '../python/compatibility/scorer.py');
const CACHE_TTL_SECONDS = 60 * 60 * 24;
const COMPATIBILITY_VERSION = 4;
const MANGLIK_HOUSES = new Set([1, 2, 4, 7, 8, 12]);

export function buildCacheKey(userAId, userBId) {
  const [first, second] = [String(userAId), String(userBId)].sort();
  return `horoscope:compatibility:v${COMPATIBILITY_VERSION}:${first}:${second}`;
}

function validateObjectId(id, fieldName) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, `Invalid ${fieldName}`);
  }
}

function toBigFiveVector(personality = {}) {
  return [
    personality.openness ?? 0.5,
    personality.conscientiousness ?? 0.5,
    personality.extraversion ?? 0.5,
    personality.agreeableness ?? 0.5,
    personality.neuroticism ?? 0.5,
  ];
}

function cosineSimilarity(vectorA, vectorB) {
  const dot = vectorA.reduce((sum, value, index) => sum + value * vectorB[index], 0);
  const magnitudeA = Math.sqrt(vectorA.reduce((sum, value) => sum + value * value, 0));
  const magnitudeB = Math.sqrt(vectorB.reduce((sum, value) => sum + value * value, 0));

  if (!magnitudeA || !magnitudeB) {
    return 0;
  }

  return dot / (magnitudeA * magnitudeB);
}

function normalizeScore(score, max = 1) {
  return Math.max(0, Math.min(100, Number(((score / max) * 100).toFixed(2))));
}

function normalizeText(value) {
  return String(value || '').trim().toLowerCase();
}

function hasMeaningfulValue(value) {
  const normalized = normalizeText(value);
  return Boolean(normalized && normalized !== 'pending' && normalized !== 'unknown' && normalized !== 'not provided');
}

function normalizedArray(value) {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.map((item) => normalizeText(item)).filter(Boolean))];
}

function exactMatchSimilarity(valueA, valueB) {
  if (!hasMeaningfulValue(valueA) || !hasMeaningfulValue(valueB)) return null;
  return normalizeText(valueA) === normalizeText(valueB) ? 1 : 0;
}

function tokenSimilarity(valueA, valueB) {
  if (!hasMeaningfulValue(valueA) || !hasMeaningfulValue(valueB)) return null;

  const tokensA = new Set(normalizeText(valueA).split(/[^a-z0-9]+/).filter(Boolean));
  const tokensB = new Set(normalizeText(valueB).split(/[^a-z0-9]+/).filter(Boolean));
  if (!tokensA.size || !tokensB.size) return null;

  const intersection = [...tokensA].filter((token) => tokensB.has(token)).length;
  const union = new Set([...tokensA, ...tokensB]).size;
  return union ? intersection / union : null;
}

function setSimilarity(valuesA, valuesB) {
  const setA = normalizedArray(valuesA);
  const setB = normalizedArray(valuesB);
  if (!setA.length || !setB.length) return null;

  const bSet = new Set(setB);
  const intersection = setA.filter((value) => bSet.has(value)).length;
  const union = new Set([...setA, ...setB]).size;
  return union ? intersection / union : null;
}

function closenessSimilarity(valueA, valueB, maxDelta = 100) {
  const a = Number(valueA);
  const b = Number(valueB);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
  return Math.max(0, 1 - Math.abs(a - b) / maxDelta);
}

function deriveManglikStatus(user) {
  const positions = user?.horoscopeData?.planetaryPositions || user?.horoscope?.planetaryPositions || [];
  const mars = Array.isArray(positions) ? positions.find((position) => position?.planet === 'Mars') : null;
  const marsHouse = Number(mars?.house);

  if (!Number.isFinite(marsHouse)) {
    return { value: null, label: 'Pending', marsHouse: null };
  }

  const isManglik = MANGLIK_HOUSES.has(marsHouse);
  return {
    value: isManglik,
    label: isManglik ? `Yes (Mars in House ${marsHouse})` : `No (Mars in House ${marsHouse})`,
    marsHouse,
  };
}

function isKnownPoruthamValue(value) {
  const normalized = normalizeText(value);
  return Boolean(normalized && normalized !== 'unknown' && normalized !== 'pending');
}

function calculatePoruthamScore(userA, userB, astroSubScores = {}) {
  const components = [];
  const rajjuA = userA?.horoscopeData?.rajju;
  const rajjuB = userB?.horoscopeData?.rajju;
  const nadiA = userA?.horoscopeData?.nadi;
  const nadiB = userB?.horoscopeData?.nadi;

  if (isKnownPoruthamValue(rajjuA) && isKnownPoruthamValue(rajjuB)) {
    components.push({
      key: 'rajju',
      weight: 0.4,
      score: normalizeText(rajjuA) === normalizeText(rajjuB) ? 0 : 100,
      detail: `${rajjuA} vs ${rajjuB}`,
    });
  }

  if (Number.isFinite(Number(astroSubScores.nadi))) {
    components.push({
      key: 'nadi',
      weight: 0.25,
      score: normalizeScore(Number(astroSubScores.nadi), 8),
      detail: String(astroSubScores.nadi),
    });
  } else if (isKnownPoruthamValue(nadiA) && isKnownPoruthamValue(nadiB)) {
    components.push({
      key: 'nadi',
      weight: 0.25,
      score: normalizeText(nadiA) === normalizeText(nadiB) ? 0 : 100,
      detail: `${nadiA} vs ${nadiB}`,
    });
  }

  if (Number.isFinite(Number(astroSubScores.yoni))) {
    components.push({
      key: 'yoni',
      weight: 0.2,
      score: normalizeScore(Number(astroSubScores.yoni), 4),
      detail: String(astroSubScores.yoni),
    });
  }

  if (Number.isFinite(Number(astroSubScores.gana))) {
    components.push({
      key: 'gana',
      weight: 0.15,
      score: normalizeScore(Number(astroSubScores.gana), 6),
      detail: String(astroSubScores.gana),
    });
  }

  if (!components.length) {
    return null;
  }

  const totalWeight = components.reduce((sum, item) => sum + item.weight, 0);
  const weighted = components.reduce((sum, item) => sum + item.score * item.weight, 0);
  const poruthamScore = Number((weighted / totalWeight).toFixed(2));

  return {
    score: poruthamScore,
    components,
  };
}

function calculatePersonalityScore(userA, userB) {
  const vectorSimilarity = cosineSimilarity(toBigFiveVector(userA.personality), toBigFiveVector(userB.personality));
  const traitCloseness = [
    closenessSimilarity(userA.personality?.openness, userB.personality?.openness, 1),
    closenessSimilarity(userA.personality?.conscientiousness, userB.personality?.conscientiousness, 1),
    closenessSimilarity(userA.personality?.extraversion, userB.personality?.extraversion, 1),
    closenessSimilarity(userA.personality?.agreeableness, userB.personality?.agreeableness, 1),
    closenessSimilarity(userA.personality?.neuroticism, userB.personality?.neuroticism, 1),
  ].filter((value) => value != null);

  const closenessAverage = traitCloseness.length
    ? traitCloseness.reduce((sum, value) => sum + value, 0) / traitCloseness.length
    : 0.5;
  const score = vectorSimilarity * 0.65 + closenessAverage * 0.35;
  return normalizeScore(score, 1);
}

function calculateLifestyleScore(userA, userB) {
  const lifestyleA = userA.lifestyle || {};
  const lifestyleB = userB.lifestyle || {};

  let weightedScore = 0;
  let totalWeight = 0;

  const weightedSimilarities = [
    { weight: 0.08, similarity: exactMatchSimilarity(lifestyleA.religion, lifestyleB.religion) },
    { weight: 0.1, similarity: exactMatchSimilarity(lifestyleA.diet, lifestyleB.diet) },
    { weight: 0.1, similarity: exactMatchSimilarity(lifestyleA.smoking, lifestyleB.smoking) },
    { weight: 0.1, similarity: exactMatchSimilarity(lifestyleA.drinking, lifestyleB.drinking) },
    { weight: 0.08, similarity: exactMatchSimilarity(lifestyleA.exercise, lifestyleB.exercise) },
    { weight: 0.08, similarity: tokenSimilarity(lifestyleA.preferredLocation, lifestyleB.preferredLocation) },
    { weight: 0.08, similarity: tokenSimilarity(lifestyleA.educationLevel, lifestyleB.educationLevel) },
    { weight: 0.08, similarity: tokenSimilarity(lifestyleA.professionType, lifestyleB.professionType) },
    { weight: 0.12, similarity: setSimilarity(lifestyleA.hobbies, lifestyleB.hobbies) },
    { weight: 0.08, similarity: setSimilarity(lifestyleA.languages, lifestyleB.languages) },
    { weight: 0.1, similarity: closenessSimilarity(lifestyleA.socialPreference, lifestyleB.socialPreference, 100) },
  ];

  for (const item of weightedSimilarities) {
    if (item.similarity == null) continue;
    totalWeight += item.weight;
    weightedScore += item.similarity * item.weight;
  }

  if (!totalWeight) {
    return 50;
  }

  return normalizeScore(weightedScore, totalWeight);
}

function calculateFamilyScore(userA, userB) {
  const lifestyleA = userA.lifestyle || {};
  const lifestyleB = userB.lifestyle || {};

  let weightedScore = 0;
  let totalWeight = 0;

  const familyValuesSimilarity = closenessSimilarity(lifestyleA.familyValues, lifestyleB.familyValues, 1);
  if (familyValuesSimilarity != null) {
    totalWeight += 0.65;
    weightedScore += familyValuesSimilarity * 0.65;
  }

  const familyPlansSimilarity = tokenSimilarity(lifestyleA.familyPlans, lifestyleB.familyPlans);
  if (familyPlansSimilarity != null) {
    totalWeight += 0.35;
    weightedScore += familyPlansSimilarity * 0.35;
  }

  if (!totalWeight) {
    return 50;
  }

  return normalizeScore(weightedScore, totalWeight);
}

function determineBandLabel(overallScore) {
  if (overallScore >= 85) return 'EXCELLENT';
  if (overallScore >= 70) return 'GOOD';
  if (overallScore >= 55) return 'MODERATE';
  return 'LOW';
}

function buildExplanation({ astroScore, personalityScore, lifestyleScore, familyScore, bandLabel }) {
  return [
    `Astrological compatibility is ${astroScore >= 75 ? 'strong' : astroScore >= 55 ? 'balanced' : 'challenging'} based on Ashtakoota Guna Milan.`,
    `Personality alignment is ${personalityScore >= 75 ? 'high' : personalityScore >= 55 ? 'moderate' : 'limited'} from Big Five cosine similarity.`,
    `Lifestyle harmony is ${lifestyleScore >= 75 ? 'well matched' : lifestyleScore >= 55 ? 'reasonable' : 'mixed'} across habits and preferences.`,
    `Family value alignment is ${familyScore >= 75 ? 'strong' : familyScore >= 55 ? 'acceptable' : 'weak'}.`,
    `Overall compatibility band: ${bandLabel}.`,
  ].join(' ');
}

async function runCompatibilityEngine(payload) {
  return new Promise((resolve, reject) => {
    const child = spawn(resolvePythonCommand(), [SCORER_PATH], {
      cwd: path.dirname(SCORER_PATH),
      stdio: ['pipe', 'pipe', 'pipe'],
      timeout: 30000,
    });

    let stdout = '';
    let stderr = '';
    let isResolved = false;

    const timeout = setTimeout(() => {
      if (!isResolved) {
        isResolved = true;
        if (!child.killed) {
          child.kill('SIGTERM');
          setTimeout(() => {
            if (!child.killed) child.kill('SIGKILL');
          }, 2000);
        }
        reject(new ApiError(500, 'Compatibility engine timeout - process exceeded 30 seconds'));
      }
    }, 30000);

    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    child.on('error', (error) => {
      if (!isResolved) {
        isResolved = true;
        clearTimeout(timeout);
        reject(new ApiError(500, 'Failed to launch compatibility engine', { cause: error.message }));
      }
    });

    child.on('close', (code) => {
      if (!isResolved) {
        isResolved = true;
        clearTimeout(timeout);

        if (code !== 0) {
          logger.warn('Compatibility engine exited with non-zero code', { code, stderr });
          reject(new ApiError(500, 'Compatibility engine execution failed', { stderr, exitCode: code }));
          return;
        }

        try {
          const output = stdout.trim().split(/\r?\n/).filter(Boolean).at(-1) || '{}';
          const result = JSON.parse(output);
          if (result.success === false) {
            reject(new ApiError(500, result.error || 'Compatibility engine returned an error'));
            return;
          }
          resolve(result);
        } catch (error) {
          logger.error('Invalid compatibility engine response', { stdout, stderr });
          reject(new ApiError(500, 'Invalid compatibility engine response', { stdout, stderr }));
        }
      }
    });

    try {
      child.stdin.write(JSON.stringify(payload));
      child.stdin.end();
    } catch (error) {
      if (!isResolved) {
        isResolved = true;
        clearTimeout(timeout);
        reject(new ApiError(500, 'Failed to send data to compatibility engine', { cause: error.message }));
      }
    }
  });
}

export async function calculateCompatibility({ userAId, userBId, fastMode = false, skipCache = false }) {
  validateObjectId(userAId, 'userAId');
  validateObjectId(userBId, 'userBId');

  if (String(userAId) === String(userBId)) {
    throw new ApiError(400, 'Compatibility requires two different users');
  }

  const cacheKey = buildCacheKey(userAId, userBId);

  if (!skipCache) {
    try {
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        logger.info('Compatibility cache hit', { cacheKey });
        return JSON.parse(cached);
      }
    } catch (error) {
      logger.warn('Redis read failed, continuing without cache', { message: error.message, cacheKey });
    }
  }

  const compatibilityFieldSelection = [
    '_id',
    'birthData.dateOfBirth',
    'birthData.timeOfBirth',
    'birthData.placeOfBirth',
    'birthData.knownBirthTime',
    'horoscopeData.nakshatra',
    'horoscopeData.rashi',
    'horoscopeData.moonSign',
    'horoscopeData.zodiacSign',
    'horoscopeData.ascendant',
    'horoscopeData.gana',
    'horoscopeData.rajju',
    'horoscopeData.planetaryPositions',
    'personality.openness',
    'personality.conscientiousness',
    'personality.extraversion',
    'personality.agreeableness',
    'personality.neuroticism',
    'lifestyle.religion',
    'lifestyle.diet',
    'lifestyle.smoking',
    'lifestyle.drinking',
    'lifestyle.exercise',
    'lifestyle.preferredLocation',
    'lifestyle.educationLevel',
    'lifestyle.professionType',
    'lifestyle.familyValues',
    'lifestyle.familyPlans',
    'lifestyle.socialPreference',
    'lifestyle.hobbies',
    'lifestyle.languages',
  ].join(' ');

  const [userA, userB] = await Promise.all([
    User.findById(userAId).select(compatibilityFieldSelection).lean({ virtuals: true }),
    User.findById(userBId).select(compatibilityFieldSelection).lean({ virtuals: true }),
  ]);

  if (!userA || !userB) {
    throw new ApiError(404, 'One or both users were not found');
  }

  const userAHoroscope = userA.horoscope || (userA.birthData ? {
    dateOfBirth: userA.birthData.dateOfBirth,
    timeOfBirth: userA.birthData.timeOfBirth || '12:00',
    placeOfBirth: userA.birthData.placeOfBirth,
    nakshatra: userA.horoscopeData?.nakshatra,
    rashi: userA.horoscopeData?.rashi,
    moonSign: userA.horoscopeData?.moonSign,
  } : null);

  const userBHoroscope = userB.horoscope || (userB.birthData ? {
    dateOfBirth: userB.birthData.dateOfBirth,
    timeOfBirth: userB.birthData.timeOfBirth || '12:00',
    placeOfBirth: userB.birthData.placeOfBirth,
    nakshatra: userB.horoscopeData?.nakshatra,
    rashi: userB.horoscopeData?.rashi,
    moonSign: userB.horoscopeData?.moonSign,
  } : null);

  let astroScore = 50;
  let astroResponse = { totalScore: 18, subScores: {} };
  let astroNotes = [];
  const manglikA = deriveManglikStatus(userA);
  const manglikB = deriveManglikStatus(userB);

  if (fastMode) {
    astroNotes.push('Using quick compatibility mode for dashboard recommendations.');
  } else if (userAHoroscope && userBHoroscope) {
    logger.info('Running horoscope compatibility calculation', {
      userAId: String(userAId),
      userBId: String(userBId),
    });

    try {
      const astroResponseRaw = await runCompatibilityEngine({
        userA: userAHoroscope,
        userB: userBHoroscope,
      });

      const baseAstroScore = normalizeScore(astroResponseRaw.gunaTotal ?? astroResponseRaw.totalScore ?? 18, 36);
      astroResponse = {
        ...astroResponseRaw,
        subScores: astroResponseRaw.gunaDetails ?? astroResponseRaw.subScores ?? {},
      };

      const poruthamResult = calculatePoruthamScore(userA, userB, astroResponse.subScores);
      astroScore = poruthamResult
        ? Number((baseAstroScore * 0.8 + poruthamResult.score * 0.2).toFixed(2))
        : baseAstroScore;

      if (poruthamResult) {
        astroResponse.poruthamScore = poruthamResult.score;
        astroResponse.poruthamComponents = poruthamResult.components;
      }

      if (manglikA.value != null && manglikB.value != null && manglikA.value !== manglikB.value) {
        astroScore = Math.max(0, Number((astroScore - 8).toFixed(2)));
        astroNotes.push('Manglik mismatch detected, lowering astrological compatibility.');
      }
    } catch (error) {
      logger.error('Horoscope engine failed, using fallback', {
        userAId: String(userAId),
        userBId: String(userBId),
        message: error.message,
      });
      astroNotes.push('Astrological engine unavailable, using baseline score.');
      astroScore = 50;
    }
  } else {
    if (!userAHoroscope && !userBHoroscope) {
      astroNotes.push('Neither user had horoscope data, using baseline astrological compatibility.');
    } else if (!userAHoroscope) {
      astroNotes.push('Current user is missing horoscope data, using baseline astrological compatibility.');
    } else if (!userBHoroscope) {
      astroNotes.push('Matching candidate is missing horoscope data, using baseline astrological compatibility.');
    }
  }

  if (astroNotes.length) {
    logger.warn('Missing horoscope details for compatibility calculation', {
      userAId: String(userAId),
      userBId: String(userBId),
      notes: astroNotes,
    });
  }

  const personalityScore = calculatePersonalityScore(userA, userB);
  const lifestyleScore = calculateLifestyleScore(userA, userB);
  const familyScore = calculateFamilyScore(userA, userB);

  const overallScore = Number(
    (
      astroScore * 0.4 +
      personalityScore * 0.25 +
      lifestyleScore * 0.2 +
      familyScore * 0.15
    ).toFixed(2)
  );

  const bandLabel = determineBandLabel(overallScore);
  const explanation = buildExplanation({
    astroScore,
    personalityScore,
    lifestyleScore,
    familyScore,
    bandLabel,
  });

  const result = {
    overallScore,
    astroScore,
    personalityScore,
    lifestyleScore,
    familyScore,
    explanation,
    bandLabel,
    astroBreakdown: astroResponse.subScores,
    userAInsights: {
      gana: userA.horoscopeData?.gana || userA.horoscope?.gana || null,
      manglik: manglikA.label,
    },
    userBInsights: {
      gana: userB.horoscopeData?.gana || userB.horoscope?.gana || null,
      manglik: manglikB.label,
    },
    calculationVersion: COMPATIBILITY_VERSION,
  };

  try {
    await redisClient.set(cacheKey, JSON.stringify(result), {
      EX: CACHE_TTL_SECONDS,
    });
  } catch (error) {
    logger.warn('Redis write failed, continuing without cache', { message: error.message, cacheKey });
  }

  return result;
}

/**
 * Zero-DB fast path — computes compatibility from already-loaded user objects.
 * Used by the recommendations list to avoid N×2 extra database round-trips.
 * Only available in fastMode (no Python scorer).
 */
export function calculateCompatibilityFromData(userA, userB) {
  const personalityScore = calculatePersonalityScore(userA, userB);
  const lifestyleScore = calculateLifestyleScore(userA, userB);
  const familyScore = calculateFamilyScore(userA, userB);

  // Use JS Guna Milan for real astroScore using stored nakshatra/rashi data
  const nakA = userA.horoscopeData?.nakshatra;
  const rashiA = userA.horoscopeData?.rashi;
  const nakB = userB.horoscopeData?.nakshatra;
  const rashiB = userB.horoscopeData?.rashi;
  const gunaResult = (nakA && rashiA && nakB && rashiB)
    ? calculateGunaMilan(nakA, rashiA, nakB, rashiB)
    : null;
  const baseAstroScore = gunaResult ? gunaResult.astroScore : 50;
  const poruthamResult = calculatePoruthamScore(userA, userB, gunaResult?.subScores ?? {});
  let astroScore = poruthamResult
    ? Number((baseAstroScore * 0.8 + poruthamResult.score * 0.2).toFixed(2))
    : baseAstroScore;

  // Apply same Manglik deduction as the full Python path
  const manglikA = deriveManglikStatus(userA);
  const manglikB = deriveManglikStatus(userB);
  if (manglikA.value != null && manglikB.value != null && manglikA.value !== manglikB.value) {
    astroScore = Math.max(0, Number((astroScore - 8).toFixed(2)));
  }

  const overallScore = Number(
    (astroScore * 0.4 + personalityScore * 0.25 + lifestyleScore * 0.2 + familyScore * 0.15).toFixed(2)
  );
  const bandLabel = determineBandLabel(overallScore);
  return {
    overallScore,
    astroScore,
    personalityScore,
    lifestyleScore,
    familyScore,
    bandLabel,
    explanation: buildExplanation({ astroScore, personalityScore, lifestyleScore, familyScore, bandLabel }),
    astroBreakdown: {
      ...(gunaResult?.subScores ?? {}),
      poruthamScore: poruthamResult?.score,
      poruthamComponents: poruthamResult?.components ?? [],
    },
    astroNotes: [],
    calculationVersion: COMPATIBILITY_VERSION,
  };
}

async function runScorerEngine(payload) {
  return new Promise((resolve, reject) => {
    const pythonBinary = process.platform === 'win32' ? 'python' : 'python3';
    const child = spawn(pythonBinary, [SCORER_PATH, JSON.stringify(payload)], {
      cwd: process.cwd(),
      stdio: ['pipe', 'pipe', 'pipe'],
      timeout: 10000, // 10 second timeout
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    child.on('close', (code) => {
      if (code !== 0) {
        logger.error('Scorer engine failed', { code, stderr });
        reject(new ApiError(500, `Scorer engine failed: ${stderr}`));
        return;
      }

      try {
        const result = JSON.parse(stdout.trim());
        if (!result.success) {
          reject(new ApiError(500, `Scorer calculation error: ${result.error}`));
        } else {
          resolve(result);
        }
      } catch (parseError) {
        logger.error('Failed to parse scorer result', { error: parseError.message, stdout });
        reject(new ApiError(500, 'Failed to parse scorer result'));
      }
    });

    child.on('error', (error) => {
      logger.error('Scorer process error', { error: error.message });
      reject(new ApiError(500, 'Scorer process failed'));
    });
  });
}

export async function calculateFullCompatibility(userAId, userBId) {
  validateObjectId(userAId, 'userAId');
  validateObjectId(userBId, 'userBId');

  if (String(userAId) === String(userBId)) {
    throw new ApiError(400, 'Compatibility requires two different users');
  }

  const cacheKey = `compat:${userAId}:${userBId}`;

  try {
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      logger.info('Compatibility cache hit', { cacheKey });
      return JSON.parse(cached);
    }
  } catch (error) {
    logger.warn('Redis read failed, continuing without cache', { message: error.message, cacheKey });
  }

  // Fetch Horoscope docs
  const [horoscopeA, horoscopeB] = await Promise.all([
    Horoscope.findOne({ userId: userAId }).lean(),
    Horoscope.findOne({ userId: userBId }).lean(),
  ]);

  if (!horoscopeA || !horoscopeB) {
    throw new ApiError(422, 'Horoscope data not available for one or both users');
  }

  // Fetch User docs
  const [userA, userB] = await Promise.all([
    User.findById(userAId).lean(),
    User.findById(userBId).lean(),
  ]);

  if (!userA || !userB) {
    throw new ApiError(404, 'One or both users were not found');
  }

  // Build data
  const dataA = {
    nakshatra: horoscopeA.nakshatra,
    rashi: horoscopeA.rashi,
    personality: userA.personality || {},
    lifestyle: userA.lifestyle || {},
    family: { familyValues: userA.lifestyle?.familyValues || 0.5 },
  };

  const dataB = {
    nakshatra: horoscopeB.nakshatra,
    rashi: horoscopeB.rashi,
    personality: userB.personality || {},
    lifestyle: userB.lifestyle || {},
    family: { familyValues: userB.lifestyle?.familyValues || 0.5 },
  };

  // Run scorer
  const result = await runScorerEngine({ userA: dataA, userB: dataB });

  // Save to Match
  const [first, second] = [String(userAId), String(userBId)].sort();
  await Match.findOneAndUpdate(
    { userAId: first, userBId: second },
    {
      $set: {
        compatibilityScore: result.overallScore,
        calculationVersion: Number(result.calculationVersion || COMPATIBILITY_VERSION),
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

  // Cache
  try {
    await redisClient.setEx(cacheKey, CACHE_TTL_SECONDS, JSON.stringify(result));
  } catch (error) {
    logger.warn('Redis write failed, continuing without cache', { message: error.message, cacheKey });
  }

  return result;
}

export default {
  calculateCompatibility,
  calculateFullCompatibility,
};
