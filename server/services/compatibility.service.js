import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mongoose from 'mongoose';
import User from '../models/User.js';
import redisClient from '../lib/redis.js';
import ApiError from '../utils/ApiError.js';
import logger from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PYTHON_ENGINE_PATH = path.resolve(__dirname, '../python/horoscope_engine.py');
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

async function runHoroscopeEngine(payload) {
  return new Promise((resolve, reject) => {
    const pythonBinary = process.env.PYTHON_BIN || 'python';
    const child = spawn(pythonBinary, [PYTHON_ENGINE_PATH], {
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    child.on('error', (error) => {
      reject(new ApiError(500, 'Failed to launch horoscope engine', { cause: error.message }));
    });

    child.on('close', (code) => {
      if (code !== 0) {
        reject(new ApiError(500, 'Horoscope engine execution failed', { stderr, exitCode: code }));
        return;
      }

      try {
        resolve(JSON.parse(stdout));
      } catch (error) {
        reject(new ApiError(500, 'Invalid horoscope engine response', { stdout, stderr }));
      }
    });

    child.stdin.write(JSON.stringify(payload));
    child.stdin.end();
  });
}

export async function calculateCompatibility({ userAId, userBId }) {
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

  const [userA, userB] = await Promise.all([
    User.findById(userAId).lean({ virtuals: true }),
    User.findById(userBId).lean({ virtuals: true }),
  ]);

  if (!userA || !userB) {
    throw new ApiError(404, 'One or both users were not found');
  }

  if (!userA.horoscope || !userB.horoscope) {
    throw new ApiError(422, 'Both users must have horoscope data');
  }

  logger.info('Running horoscope compatibility calculation', {
    userAId: String(userAId),
    userBId: String(userBId),
  });

  const astroResponse = await runHoroscopeEngine({
    userA: userA.horoscope,
    userB: userB.horoscope,
  });

  const astroScore = normalizeScore(astroResponse.totalScore, 36);
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

export default {
  calculateCompatibility,
};
