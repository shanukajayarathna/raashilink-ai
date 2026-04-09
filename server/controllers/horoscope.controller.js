import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import compatibilityService from '../services/compatibility.service.js';
import logger from '../utils/logger.js';
import User from '../models/User.js';
import Horoscope from '../models/Horoscope.js';
import Match from '../models/Match.js';
import { spawn } from 'child_process';
import { redisClient } from '../lib/redis.js';

function buildChartData(user) {
  const horoscope = user.horoscope || {};
  const moonSign = horoscope.moonSign || horoscope.rashi || 'Pending';

  return {
    summary: {
      moonSign,
      nakshatra: horoscope.nakshatra || 'Pending',
      ascendant: moonSign,
      sunSign: moonSign,
    },
    planets: [
      { name: 'Sun', symbol: 'Su', sign: moonSign, degree: '12° 24\'', house: 7, color: '#FFD700' },
      { name: 'Moon', symbol: 'Mo', sign: moonSign, degree: '18° 10\'', house: 8, color: '#C0C0C0' },
      { name: 'Mars', symbol: 'Ma', sign: horoscope.rashi || moonSign, degree: '05° 45\'', house: 5, color: '#FF4500' },
      { name: 'Mercury', symbol: 'Me', sign: horoscope.rashi || moonSign, degree: '22° 15\'', house: 6, color: '#32CD32' },
      { name: 'Jupiter', symbol: 'Ju', sign: moonSign, degree: '15° 30\'', house: 12, color: '#DAA520' },
    ],
    positions: [
      { planet: 'Sun', sign: moonSign, house: '7th', degree: '12° 24\'' },
      { planet: 'Moon', sign: moonSign, house: '8th', degree: '18° 10\'' },
      { planet: 'Mars', sign: horoscope.rashi || moonSign, house: '5th', degree: '05° 45\'' },
      { planet: 'Mercury', sign: horoscope.rashi || moonSign, house: '6th', degree: '22° 15\'' },
      { planet: 'Jupiter', sign: moonSign, house: '12th', degree: '15° 30\'' },
    ],
  };
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
      sign: currentUser.horoscope?.moonSign || currentUser.horoscope?.rashi || 'Pending',
    },
    userB: {
      name: partner.name,
      photo: partner.profilePic || partner.photos?.[0]?.url || null,
      sign: partner.horoscope?.moonSign || partner.horoscope?.rashi || 'Pending',
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

  if (!user.horoscope) {
    throw new ApiError(422, 'Horoscope data is not available for this account');
  }

  await syncHoroscopeDocument(user);

  res.status(200).json({
    success: true,
    data: buildChartData(user),
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
    const result = {
      overallScore: existingMatch.compatibilityScore,
      astroScore: existingMatch.dimensionScores.astro,
      personalityScore: existingMatch.dimensionScores.personality,
      lifestyleScore: existingMatch.dimensionScores.lifestyle,
      familyScore: existingMatch.dimensionScores.family,
      explanation: existingMatch.explanation,
      bandLabel: existingMatch.explanation.includes('Excellent') ? 'Excellent' :
                 existingMatch.explanation.includes('Good') ? 'Good' :
                 existingMatch.explanation.includes('Moderate') ? 'Moderate' : 'Low',
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
  const user = await User.findById(req.user._id).lean();

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  if (!user.birthData || !user.birthData.dateOfBirth || !user.birthData.timeOfBirth || !user.birthData.placeOfBirth) {
    throw new ApiError(422, 'Birth data is incomplete. Please complete your profile.');
  }

  const birthDate = user.birthData.dateOfBirth.toISOString().split('T')[0];
  const birthTime = user.birthData.timeOfBirth;
  const lat = user.birthData.placeOfBirth.latitude || 6.9271; // Colombo default
  const lon = user.birthData.placeOfBirth.longitude || 79.8612; // Colombo default

  // TODO: If User.js doesn't have lat/lon, use geocoding service to get from placeOfBirth.city/country

  const pythonCmd = process.platform === 'win32' ? 'python' : 'python3';
  const pythonArgs = [JSON.stringify({
    birthDate,
    birthTime,
    lat,
    lon
  })];

  const pythonProcess = spawn(pythonCmd, [
    './server/python/horoscope_engine.py',
    ...pythonArgs
  ], {
    cwd: process.cwd(),
    stdio: ['pipe', 'pipe', 'pipe']
  });

  let stdout = '';
  let stderr = '';

  pythonProcess.stdout.on('data', (data) => {
    stdout += data.toString();
  });

  pythonProcess.stderr.on('data', (data) => {
    stderr += data.toString();
  });

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      pythonProcess.kill();
      reject(new ApiError(504, 'Horoscope generation timed out'));
    }, 10000); // 10 seconds

    pythonProcess.on('close', async (code) => {
      clearTimeout(timeout);

      if (code !== 0) {
        logger.error('Horoscope generation failed', { code, stderr });
        return reject(new ApiError(500, `Horoscope generation failed: ${stderr}`));
      }

      try {
        const result = JSON.parse(stdout.trim());

        if (!result.success) {
          return reject(new ApiError(500, `Horoscope calculation error: ${result.error}`));
        }

        // Save to Horoscope model
        const horoscopeData = {
          userId: user._id,
          zodiacSign: result.zodiacSign,
          moonSign: result.rashi, // Map rashi to moonSign for compatibility
          rashi: result.rashi,
          nakshatra: result.nakshatra,
          ascendant: result.ascendant,
          planetaryPositions: result.planetaryPositions,
          gunaScore: 0, // Will be calculated separately
          generatedAt: new Date(),
        };

        await Horoscope.findOneAndUpdate(
          { userId: user._id },
          horoscopeData,
          { upsert: true, new: true }
        );

        // Update User model horoscopeData
        await User.findByIdAndUpdate(user._id, {
          $set: {
            'horoscopeData': horoscopeData,
            'horoscope': {
              dateOfBirth: user.birthData.dateOfBirth,
              timeOfBirth: user.birthData.timeOfBirth,
              placeOfBirth: user.birthData.placeOfBirth,
              nakshatra: result.nakshatra,
              rashi: result.rashi,
              moonSign: result.rashi,
            }
          }
        });

        // Cache in Redis
        const cacheKey = `horoscope:${user._id}`;
        await redisClient.setEx(cacheKey, 86400, JSON.stringify(result));

        logger.info('Horoscope generated successfully', { userId: user._id });

        res.status(200).json({
          success: true,
          data: result,
        });

        resolve();

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
});

export default {
  getMyChart,
  postCompatibility,
  calculateCompatibility,
  generateChart,
};
