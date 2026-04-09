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

function formatDegree(value = 0) {
  const numeric = Number(value || 0);
  const whole = Math.floor(numeric);
  const minutes = Math.round((numeric - whole) * 60);
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
  const positionsSource = Array.isArray(horoscopeData.planetaryPositions) && horoscopeData.planetaryPositions.length > 0
    ? horoscopeData.planetaryPositions
    : [
        { planet: 'Sun', sign: horoscopeData.zodiacSign || moonSign, house: 1, degree: 0 },
        { planet: 'Moon', sign: moonSign, house: 2, degree: 0 },
      ];
  const sunPosition = positionsSource.find((position) => position.planet === 'Sun');

  return {
    summary: {
      moonSign,
      nakshatra: horoscopeData.nakshatra || 'Pending',
      ascendant: horoscopeData.ascendant || 'Pending',
      sunSign: horoscopeData.zodiacSign || sunPosition?.sign || 'Pending',
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
      house: formatHouseLabel(position.house),
      degree: formatDegree(position.degree),
    })),
    meta: {
      ...accuracyMeta,
      generatedFrom: {
        birthDate: user?.birthData?.dateOfBirth ? new Date(user.birthData.dateOfBirth).toISOString().split('T')[0] : null,
        birthTime: user?.birthData?.timeOfBirth || null,
        birthPlace: user?.birthData?.placeOfBirth?.city || null,
        knownBirthTime: user?.birthData?.knownBirthTime !== false,
      },
      generatedAt: horoscopeData.generatedAt || null,
    },
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

function buildBirthPayload(user) {
  if (!user?.birthData?.dateOfBirth || !user?.birthData?.placeOfBirth) {
    return null;
  }

  return {
    birthDate: user.birthData.dateOfBirth.toISOString().split('T')[0],
    birthTime: user.birthData.timeOfBirth || '12:00',
    lat: user.birthData.placeOfBirth.latitude || 6.9271,
    lon: user.birthData.placeOfBirth.longitude || 79.8612,
  };
}

async function generateAndPersistHoroscope(user, { force = false } = {}) {
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  if (!force && hasGeneratedChart(user)) {
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

  const horoscopeData = {
    zodiacSign: result.zodiacSign,
    moonSign: result.rashi,
    rashi: result.rashi,
    nakshatra: result.nakshatra,
    ascendant: result.ascendant,
    planetaryPositions: result.planetaryPositions,
    gunaScore: 0,
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
        score: Math.round(result.personalityScore * 0.2),
        max: 20,
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
        score: Math.round(result.familyScore * 0.2),
        max: 20,
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
        zodiacSign: user.horoscope.moonSign || user.horoscope.rashi || 'Unknown',
        rashi: user.horoscope.rashi || user.horoscope.moonSign || 'Unknown',
        nakshatra: user.horoscope.nakshatra || 'Unknown',
        ascendant: user.horoscopeData?.ascendant || user.horoscope.moonSign || 'Unknown',
        planetaryPositions:
          user.horoscopeData?.planetaryPositions?.length > 0
            ? user.horoscopeData.planetaryPositions
            : [
                {
                  planet: 'Sun',
                  sign: user.horoscope.moonSign || user.horoscope.rashi || 'Unknown',
                  house: 7,
                  degree: 12.4,
                },
                {
                  planet: 'Moon',
                  sign: user.horoscope.moonSign || user.horoscope.rashi || 'Unknown',
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
  const { userAId, userBId } = req.body;

  if (!userAId || !userBId) {
    throw new ApiError(400, 'userAId and userBId are required');
  }

  // Check DB first
  const [first, second] = [String(userAId), String(userBId)].sort();
  const existingMatch = await Match.findOne({ userAId: first, userBId: second }).lean();

  if (existingMatch) {
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

  // Calculate new
  const result = await compatibilityService.calculateFullCompatibility(userAId, userBId);

  const [currentUser, partner] = await Promise.all([
    User.findById(userAId).lean({ virtuals: true }),
    User.findById(userBId).lean({ virtuals: true }),
  ]);

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
