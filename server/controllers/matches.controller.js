import mongoose from 'mongoose';
import path from 'path';
import { spawn } from 'child_process';
import User from '../models/User.js';
import MatchInterest from '../models/MatchInterest.js';
import Conversation from '../models/Conversation.js';
import Match from '../models/Match.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import compatibilityService from '../services/compatibility.service.js';
import redisClient from '../lib/redis.js';
import logger from '../utils/logger.js';
import { resolvePythonCommand } from '../utils/pythonRuntime.js';

function mainPhoto(user) {
  return (
    user.photos?.find((photo) => photo.isMain)?.url ||
    user.profilePic ||
    `https://picsum.photos/seed/${user._id}/800/800`
  );
}

function ensureObjectId(id, field) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, `Invalid ${field}`);
  }
}

function orderedPair(userAId, userBId) {
  const [first, second] = [String(userAId), String(userBId)].sort();
  return { first, second };
}

async function persistMatch(userAId, userBId, compatibility, mutualInterest = false) {
  const { first, second } = orderedPair(userAId, userBId);

  return Match.findOneAndUpdate(
    { userAId: first, userBId: second },
    {
      $set: {
        compatibilityScore: compatibility.overallScore,
        dimensionScores: {
          astro: compatibility.astroScore,
          personality: compatibility.personalityScore,
          lifestyle: compatibility.lifestyleScore,
          family: compatibility.familyScore,
        },
        mutualInterest,
        explanation: compatibility.explanation,
      },
    },
    { upsert: true, new: true }
  );
}

function buildCard(user, compatibility, mutualMatch) {
  return {
    id: String(user._id),
    name: user.name,
    age: user.age || 25,
    location: user.location || 'Sri Lanka',
    job: user.lifestyle?.professionType || 'Professional',
    education: user.lifestyle?.educationLevel || 'Not specified',
    score: compatibility.overallScore,
    band: compatibility.bandLabel,
    img: mainPhoto(user),
    isOnline: true,
    bio: user.bio || 'Looking for a meaningful long-term connection.',
    compatibility,
    mutualMatch,
    moonSign: user.horoscopeData?.moonSign || user.horoscopeData?.rashi || user.horoscope?.moonSign || user.horoscope?.rashi || 'Pending',
  };
}

function buildDetail(user, compatibility, mutualMatch) {
  return {
    id: String(user._id),
    name: user.name,
    age: user.age || 25,
    location: user.location || 'Sri Lanka',
    job: user.lifestyle?.professionType || 'Professional',
    education: user.lifestyle?.educationLevel || 'Not specified',
    score: compatibility.overallScore,
    band: compatibility.bandLabel,
    bio: user.bio || 'Looking for a meaningful long-term connection.',
    dimensions: [
      { label: 'Astrological', value: compatibility.astroScore },
      { label: 'Personality', value: compatibility.personalityScore },
      { label: 'Lifestyle', value: compatibility.lifestyleScore },
      { label: 'Family Values', value: compatibility.familyScore },
    ],
    traits: [
      { subject: 'Traditional', A: Math.round((user.lifestyle?.familyValues ?? 0.5) * 100), fullMark: 100 },
      { subject: 'Ambitious', A: 80, fullMark: 100 },
      { subject: 'Adventurous', A: Math.round((user.personality?.openness ?? 0.5) * 100), fullMark: 100 },
      { subject: 'Family-Oriented', A: Math.round((user.lifestyle?.familyValues ?? 0.5) * 100), fullMark: 100 },
      { subject: 'Modern', A: Math.round((1 - (user.personality?.neuroticism ?? 0.5)) * 100), fullMark: 100 },
    ],
    horoscope: {
      rashi: user.horoscopeData?.rashi || user.horoscopeData?.moonSign || user.horoscope?.rashi || user.horoscope?.moonSign || 'Pending',
      nakshatra: user.horoscopeData?.nakshatra || user.horoscope?.nakshatra || 'Pending',
      ascendant: user.horoscopeData?.ascendant || user.horoscopeData?.moonSign || user.horoscope?.moonSign || 'Pending',
    },
    lifestyle: {
      hobbies: ['Travel', 'Reading', 'Family time'],
      interests: ['Culture', 'Growth', 'Connection'],
      career: user.lifestyle?.professionType || 'Professional',
      familyPlans: 'Looking for a serious relationship that can lead to marriage',
    },
    photos: user.photos?.length > 0 ? user.photos.map((photo) => photo.url) : [mainPhoto(user)],
    mutualMatch,
    explanation: compatibility.explanation,
  };
}

export const getRecommendations = asyncHandler(async (req, res) => {
  const currentUserId = String(req.user._id);
  const page = Math.max(1, Number(req.query.page) || 1);
  const pageSize = Math.min(20, Number(req.query.pageSize) || 10);
  const skip = (page - 1) * pageSize;

  // Check cache first
  const cacheKey = `recommendations:${currentUserId}:${page}:${pageSize}`;
  try {
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      logger.info('Recommendations cache hit', { cacheKey });
      return res.status(200).json(JSON.parse(cached));
    }
  } catch (error) {
    logger.warn('Cache read failed, continuing', { message: error.message });
  }

  // Select only necessary fields for performance
  const users = await User.find({
    _id: { $ne: req.user._id },
    role: 'user',
    birthData: { $exists: true, $ne: null },
  })
    .select('_id personalInfo photos lifestyle personality birthData horoscopeData')
    .lean({ virtuals: true })
    .skip(skip)
    .limit(pageSize);

  const scored = [];

  for (const candidate of users) {
    const compatibility = await compatibilityService.calculateCompatibility({
      userAId: currentUserId,
      userBId: String(candidate._id),
    });

    const mutualInterest = await MatchInterest.findOne({
      $or: [
        { fromUser: req.user._id, toUser: candidate._id, status: 'mutual' },
        { fromUser: candidate._id, toUser: req.user._id, status: 'mutual' },
      ],
    }).lean().select('_id');

    await persistMatch(req.user._id, candidate._id, compatibility, Boolean(mutualInterest));

    scored.push(buildCard(candidate, compatibility, Boolean(mutualInterest)));
  }

  scored.sort((a, b) => b.score - a.score);

  const response = {
    success: true,
    data: {
      items: scored,
      total: scored.length,
      page,
      pageSize,
    },
  };

  // Cache for 1 hour (3600 seconds)
  try {
    await redisClient.setEx(cacheKey, 3600, JSON.stringify(response));
  } catch (error) {
    logger.warn('Cache write failed, continuing without cache', { message: error.message });
  }

  res.status(200).json(response);
});

export const getMatchDetail = asyncHandler(async (req, res) => {
  ensureObjectId(req.params.id, 'matchId');

  const user = await User.findById(req.params.id).lean({ virtuals: true });
  if (!user || user.role !== 'user') {
    throw new ApiError(404, 'Match not found');
  }

  const compatibility = await compatibilityService.calculateCompatibility({
    userAId: String(req.user._id),
    userBId: String(user._id),
  });

  const mutualInterest = await MatchInterest.findOne({
    $or: [
      { fromUser: req.user._id, toUser: user._id, status: 'mutual' },
      { fromUser: user._id, toUser: req.user._id, status: 'mutual' },
    ],
  }).lean();

  await persistMatch(req.user._id, user._id, compatibility, Boolean(mutualInterest));

  res.status(200).json({
    success: true,
    data: buildDetail(user, compatibility, Boolean(mutualInterest)),
  });
});

export const expressInterest = asyncHandler(async (req, res) => {
  ensureObjectId(req.params.id, 'matchId');

  if (String(req.user._id) === String(req.params.id)) {
    throw new ApiError(400, 'You cannot express interest in your own profile');
  }

  const candidate = await User.findById(req.params.id).lean();
  if (!candidate || candidate.role !== 'user') {
    throw new ApiError(404, 'Match not found');
  }

  let interest = await MatchInterest.findOneAndUpdate(
    { fromUser: req.user._id, toUser: req.params.id },
    { $setOnInsert: { status: 'pending' } },
    { upsert: true, new: true }
  );

  const reverseInterest = await MatchInterest.findOne({
    fromUser: req.params.id,
    toUser: req.user._id,
  });

  let conversation = null;
  let matched = false;

  if (reverseInterest) {
    matched = true;
    interest.status = 'mutual';
    await interest.save();
    reverseInterest.status = 'mutual';
    await reverseInterest.save();

    conversation = await Conversation.findOne({
      matchUsers: { $all: [req.user._id, req.params.id] },
    });

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [req.user._id, req.params.id],
        matchUsers: [req.user._id, req.params.id],
        lastMessageAt: new Date(),
      });
    }
  }

  const existingMatch = await Match.findOne({
    userAId: orderedPair(req.user._id, req.params.id).first,
    userBId: orderedPair(req.user._id, req.params.id).second,
  });

  if (existingMatch) {
    existingMatch.mutualInterest = matched;
    await existingMatch.save();
  }

  res.status(200).json({
    success: true,
    data: {
      matched,
      conversationId: conversation ? String(conversation._id) : null,
      message: matched
        ? 'Mutual match unlocked. You can now message each other.'
        : 'Interest expressed successfully.',
    },
  });
});

export const undoInterest = asyncHandler(async (req, res) => {
  ensureObjectId(req.params.id, 'matchId');

  await MatchInterest.deleteOne({ fromUser: req.user._id, toUser: req.params.id });

  res.status(200).json({
    success: true,
    data: { message: 'Interest removed' },
  });
});

export const getTodayMatches = asyncHandler(async (req, res) => {
  const userId = String(req.user._id);
  const cacheKey = `matches:today:${userId}`;

  // Check cache first
  try {
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      logger.info('Today matches cache hit', { userId, cacheKey });
      const parsed = JSON.parse(cached);
      return res.status(200).json({
        success: true,
        data: {
          items: parsed.recommendations || [],
          fromCache: true,
          generatedAt: parsed.generatedAt
        }
      });
    }
  } catch (error) {
    logger.warn('Cache read failed, calling engine directly', { message: error.message });
  }

  // Cache miss - call hybrid engine on demand
  try {
    const currentUser = await User.findById(req.user._id).lean();
    if (!currentUser) {
      throw new ApiError(404, 'User not found');
    }

    // Get interaction count
    const interactionCount = await MatchInterest.countDocuments({
      fromUser: req.user._id
    });

    // Build user profile
    const userProfile = {
      id: userId,
      personalInfo: {
        firstName: currentUser.personalInfo?.firstName || '',
        lastName: currentUser.personalInfo?.lastName || '',
        age: currentUser.personalInfo?.age || 28,
        gender: currentUser.personalInfo?.gender || 'male',
        location: currentUser.personalInfo?.location || 'Colombo'
      },
      personality: currentUser.personality || {},
      lifestyle: currentUser.lifestyle || {},
      interactions: {
        interestsSent: interactionCount,
        interestsReceived: await MatchInterest.countDocuments({
          toUser: req.user._id
        })
      }
    };

    // Get exclude IDs
    const existingInterests = await MatchInterest.find({
      fromUser: req.user._id
    }).select('toUser').lean();
    const excludeIds = existingInterests.map(i => String(i.toUser));

    // Call hybrid engine
    const pythonCmd = resolvePythonCommand();
    const hybridEnginePath = path.resolve(process.cwd(), 'server/python/recommendation/hybrid_engine.py');

    const engineOutput = await new Promise((resolve, reject) => {
      const enginePayload = {
        userProfile,
        topN: 10,
        excludeIds,
        interactionCount
      };

      const child = spawn(pythonCmd, [hybridEnginePath, JSON.stringify(enginePayload)], {
        stdio: ['pipe', 'pipe', 'pipe'],
        timeout: 10000
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
          reject(new Error(`Engine failed: ${stderr || 'Unknown error'}`));
        } else {
          try {
            const result = JSON.parse(stdout.trim());
            resolve(result);
          } catch (e) {
            reject(new Error(`Failed to parse engine output: ${e.message}`));
          }
        }
      });

      child.on('error', (error) => {
        reject(new Error(`Process error: ${error.message}`));
      });
    });

    if (engineOutput.success && engineOutput.recommendations && engineOutput.recommendations.length > 0) {
      // Cache the results for 24 hours
      await redisClient.setEx(
        cacheKey,
        86400,
        JSON.stringify({
          recommendations: engineOutput.recommendations,
          generatedAt: new Date().toISOString()
        })
      );
    }

    res.status(200).json({
      success: true,
      data: {
        items: engineOutput.recommendations || [],
        fromCache: false,
        generatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('Failed to generate today matches', { message: error.message });
    throw error;
  }
});

export default {
  getRecommendations,
  getMatchDetail,
  expressInterest,
  undoInterest,
  getTodayMatches,
};
