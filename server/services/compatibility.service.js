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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SCORER_PATH = path.resolve(__dirname, '../python/compatibility/scorer.py');
const CACHE_TTL_SECONDS = 60 * 60 * 24;

function buildCacheKey(userAId, userBId) {
  const [first, second] = [String(userAId), String(userBId)].sort();
  return `horoscope:compatibility:${first}:${second}`;
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

function calculatePersonalityScore(userA, userB) {
  const score = cosineSimilarity(toBigFiveVector(userA.personality), toBigFiveVector(userB.personality));
  return normalizeScore(score, 1);
}

function calculateLifestyleScore(userA, userB) {
  const lifestyleA = userA.lifestyle || {};
  const lifestyleB = userB.lifestyle || {};

  const rules = [
    { key: 'religion', weight: 0.2 },
    { key: 'diet', weight: 0.15 },
    { key: 'smoking', weight: 0.15 },
    { key: 'drinking', weight: 0.15 },
    { key: 'preferredLocation', weight: 0.15 },
    { key: 'educationLevel', weight: 0.1 },
    { key: 'professionType', weight: 0.1 },
  ];

  let weightedScore = 0;
  let totalWeight = 0;

  for (const rule of rules) {
    const valueA = lifestyleA[rule.key];
    const valueB = lifestyleB[rule.key];

    if (valueA && valueB) {
      totalWeight += rule.weight;
      weightedScore += valueA === valueB ? rule.weight : 0;
    }
  }

  const familyDelta = Math.abs((lifestyleA.familyValues ?? 0.5) - (lifestyleB.familyValues ?? 0.5));
  const familyWeight = 0.2;
  totalWeight += familyWeight;
  weightedScore += (1 - Math.min(1, familyDelta)) * familyWeight;

  if (!totalWeight) {
    return 50;
  }

  return normalizeScore(weightedScore, totalWeight);
}

function calculateFamilyScore(userA, userB) {
  const valueA = userA.lifestyle?.familyValues ?? 0.5;
  const valueB = userB.lifestyle?.familyValues ?? 0.5;
  return normalizeScore(1 - Math.abs(valueA - valueB), 1);
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

export async function calculateCompatibility({ userAId, userBId, fastMode = false }) {
  validateObjectId(userAId, 'userAId');
  validateObjectId(userBId, 'userBId');

  if (String(userAId) === String(userBId)) {
    throw new ApiError(400, 'Compatibility requires two different users');
  }

  const cacheKey = buildCacheKey(userAId, userBId);

  try {
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      logger.info('Compatibility cache hit', { cacheKey });
      return JSON.parse(cached);
    }
  } catch (error) {
    logger.warn('Redis read failed, continuing without cache', { message: error.message, cacheKey });
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
    'personality.openness',
    'personality.conscientiousness',
    'personality.extraversion',
    'personality.agreeableness',
    'personality.neuroticism',
    'lifestyle.religion',
    'lifestyle.diet',
    'lifestyle.smoking',
    'lifestyle.drinking',
    'lifestyle.preferredLocation',
    'lifestyle.educationLevel',
    'lifestyle.professionType',
    'lifestyle.familyValues',
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

      astroScore = normalizeScore(astroResponseRaw.gunaTotal ?? astroResponseRaw.totalScore ?? 18, 36);
      astroResponse = {
        ...astroResponseRaw,
        subScores: astroResponseRaw.gunaDetails ?? astroResponseRaw.subScores ?? {},
      };
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
  const astroScore = 50; // baseline — full engine only runs on detail view
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
    astroBreakdown: {},
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
