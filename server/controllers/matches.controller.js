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

function escapeRegex(value = '') {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function parseRange(input, fallbackMin, fallbackMax) {
  if (Array.isArray(input) && input.length >= 2) {
    const min = Number(input[0]);
    const max = Number(input[1]);
    if (Number.isFinite(min) && Number.isFinite(max)) {
      return [min, max];
    }
  }

  if (typeof input === 'string' && input.includes(',')) {
    const [rawMin, rawMax] = input.split(',');
    const min = Number(rawMin);
    const max = Number(rawMax);
    if (Number.isFinite(min) && Number.isFinite(max)) {
      return [min, max];
    }
  }

  return [fallbackMin, fallbackMax];
}

function parseStringList(input) {
  if (Array.isArray(input)) {
    return input.map((item) => String(item).trim()).filter(Boolean);
  }

  if (typeof input === 'string') {
    return input
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

function parseHeightToCm(heightValue) {
  if (!heightValue) return null;
  const text = String(heightValue).trim();
  const feetInches = text.match(/(\d+)\s*['ft]+\s*(\d+)?/i);
  if (feetInches) {
    const feet = Number(feetInches[1] || 0);
    const inches = Number(feetInches[2] || 0);
    if (Number.isFinite(feet) && Number.isFinite(inches)) {
      return Math.round(((feet * 12) + inches) * 2.54);
    }
  }

  const centimeters = text.match(/(\d+(?:\.\d+)?)\s*cm/i);
  if (centimeters) {
    const cm = Number(centimeters[1]);
    return Number.isFinite(cm) ? Math.round(cm) : null;
  }

  const asNumber = Number(text);
  if (Number.isFinite(asNumber) && asNumber >= 100 && asNumber <= 250) {
    return Math.round(asNumber);
  }

  return null;
}

function profileField(user, field) {
  return user?.[field] ?? user?.personalInfo?.[field] ?? null;
}

function levenshteinDistance(a = '', b = '') {
  const source = String(a).toLowerCase();
  const target = String(b).toLowerCase();
  const rows = source.length + 1;
  const cols = target.length + 1;

  const matrix = Array.from({ length: rows }, () => new Array(cols).fill(0));

  for (let i = 0; i < rows; i += 1) matrix[i][0] = i;
  for (let j = 0; j < cols; j += 1) matrix[0][j] = j;

  for (let i = 1; i < rows; i += 1) {
    for (let j = 1; j < cols; j += 1) {
      const cost = source[i - 1] === target[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }

  return matrix[rows - 1][cols - 1];
}

function isFuzzyNameMatch(candidate, query) {
  const normalizedQuery = String(query || '').trim().toLowerCase();
  if (!normalizedQuery) return false;

  const candidateName = [profileField(candidate, 'firstName'), profileField(candidate, 'lastName')]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  if (!candidateName) return false;

  if (candidateName.includes(normalizedQuery)) return true;

  const tokens = candidateName.split(/\s+/).filter(Boolean);
  const maxDistance = normalizedQuery.length >= 7 ? 2 : 1;

  return tokens.some((token) => levenshteinDistance(token, normalizedQuery) <= maxDistance);
}

function buildDidYouMeanSuggestions(candidates = [], query = '', limit = 3) {
  const normalizedQuery = String(query || '').trim().toLowerCase();
  if (!normalizedQuery) return [];

  const uniqueNames = [...new Set(candidates
    .map((candidate) => [profileField(candidate, 'firstName'), profileField(candidate, 'lastName')].filter(Boolean).join(' ').trim())
    .filter(Boolean))];

  const scored = uniqueNames.map((name) => {
    const normalizedName = name.toLowerCase();
    const tokens = normalizedName.split(/\s+/).filter(Boolean);
    const tokenDistances = tokens.map((token) => levenshteinDistance(token, normalizedQuery));
    const score = Math.min(levenshteinDistance(normalizedName, normalizedQuery), ...tokenDistances);
    return { name, score };
  });

  return scored
    .filter((entry) => entry.score <= (normalizedQuery.length >= 7 ? 2 : 1))
    .sort((a, b) => a.score - b.score)
    .slice(0, limit)
    .map((entry) => entry.name);
}

function fallbackInitials(name = '') {
  const chunks = String(name)
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (chunks.length === 0) return 'RL';
  if (chunks.length === 1) return chunks[0].slice(0, 2).toUpperCase();
  return `${chunks[0][0]}${chunks[1][0]}`.toUpperCase();
}

function mainPhoto(user) {
  return (
    user.photos?.find((photo) => photo.isMain)?.url ||
    user.profilePic ||
    null
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
  const fullName = user.name || [profileField(user, 'firstName'), profileField(user, 'lastName')].filter(Boolean).join(' ').trim() || 'Member';
  return {
    id: String(user._id),
    name: fullName,
    initials: fallbackInitials(fullName),
    age: user.age ?? profileField(user, 'age'),
    location: user.location || profileField(user, 'location') || 'Not provided',
    job: user.lifestyle?.professionType || 'Not provided',
    education: user.lifestyle?.educationLevel || 'Not provided',
    score: compatibility.overallScore,
    band: compatibility.bandLabel,
    img: mainPhoto(user),
    isOnline: true,
    bio: user.bio || profileField(user, 'bio') || '',
    compatibility,
    mutualMatch,
    moonSign: user.horoscopeData?.moonSign || user.horoscopeData?.rashi || user.horoscope?.moonSign || user.horoscope?.rashi || 'Pending',
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

function buildDetail(user, compatibility, mutualMatch) {
  const fullName = user.name || [profileField(user, 'firstName'), profileField(user, 'lastName')].filter(Boolean).join(' ').trim() || 'Member';
  const hobbies = Array.isArray(user.lifestyle?.hobbies) ? user.lifestyle.hobbies.filter(Boolean) : [];
  return {
    id: String(user._id),
    name: fullName,
    initials: fallbackInitials(fullName),
    age: user.age ?? profileField(user, 'age'),
    location: user.location || profileField(user, 'location') || 'Not provided',
    job: user.lifestyle?.professionType || 'Not provided',
    education: user.lifestyle?.educationLevel || 'Not provided',
    score: compatibility.overallScore,
    band: compatibility.bandLabel,
    bio: user.bio || profileField(user, 'bio') || 'Bio not provided yet.',
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
      hobbies,
      interests: Array.isArray(user.lifestyle?.languages) ? user.lifestyle.languages.filter(Boolean) : [],
      career: user.lifestyle?.professionType || 'Not provided',
      familyPlans: user.lifestyle?.familyPlans || 'Not provided',
    },
    photos: user.photos?.length > 0 ? user.photos.map((photo) => photo.url) : [],
    profileImage: mainPhoto(user),
    mutualMatch,
    explanation: compatibility.explanation,
  };
}

export const getRecommendations = asyncHandler(async (req, res) => {
  const currentUserId = String(req.user._id);
  const page = Math.max(1, Number(req.query.page) || 1);
  const pageSize = Math.min(20, Number(req.query.pageSize) || 10);
  const fastMode = req.query.fast === 'true';
  const forceRefresh = req.query.refresh === 'true';
  const sortBy = ['compatibility', 'newest', 'active'].includes(String(req.query.sortBy || ''))
    ? String(req.query.sortBy)
    : 'compatibility';

  const [ageMin, ageMax] = parseRange(req.query.ageRange, 18, 90);
  const [heightMin, heightMax] = parseRange(req.query.heightRange, 140, 200);
  const isHeightFilterActive = !(heightMin === 140 && heightMax === 200);
  const selectedReligions = parseStringList(req.query.religions);
  const selectedDistrict = String(req.query.district || '').trim();
  const selectedGender = String(req.query.gender || '').trim().toLowerCase();
  const searchTerm = String(req.query.search || '').trim();
  const skip = (page - 1) * pageSize;
  const currentUserGender = String(req.user.personalInfo?.gender || req.user.gender || '').toLowerCase();

  const candidateQuery = {
    _id: { $ne: req.user._id },
    role: 'user',
    birthData: { $exists: true, $ne: null },
    // Keep matches page strictly for "Looking for a Partner" registrations.
    'weddingProject.partnerName': { $in: [null, ''] },
  };

  if (Number.isFinite(ageMin) && Number.isFinite(ageMax)) {
    candidateQuery['personalInfo.age'] = { $gte: ageMin, $lte: ageMax };
  }

  if (selectedReligions.length > 0) {
    candidateQuery['lifestyle.religion'] = { $in: selectedReligions };
  }

  if (selectedDistrict) {
    candidateQuery['personalInfo.location'] = { $regex: new RegExp(`^${escapeRegex(selectedDistrict)}$`, 'i') };
  }

  if (selectedGender && ['male', 'female', 'non-binary', 'prefer_not_to_say'].includes(selectedGender)) {
    candidateQuery['personalInfo.gender'] = selectedGender;
  }

  // Keep broad discovery behavior during explicit search so users can find profiles
  // even when gender is missing on older registrations.
  if (!searchTerm && !selectedGender) {
    if (currentUserGender === 'male') {
      candidateQuery['personalInfo.gender'] = { $in: ['female', 'non-binary', 'prefer_not_to_say', null] };
    } else if (currentUserGender === 'female') {
      candidateQuery['personalInfo.gender'] = { $in: ['male', 'non-binary', 'prefer_not_to_say', null] };
    }
  }

  // Check cache first
  const cacheKey = `recommendations:${currentUserId}:${page}:${pageSize}:${sortBy}:${ageMin}-${ageMax}:${heightMin}-${heightMax}:${selectedReligions.join('|')}:${selectedDistrict}:${selectedGender}:${searchTerm}:${fastMode}`;
  if (!forceRefresh) {
    try {
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        logger.info('Recommendations cache hit', { cacheKey });
        return res.status(200).json(JSON.parse(cached));
      }
    } catch (error) {
      logger.warn('Cache read failed, continuing', { message: error.message });
    }
  }

  // Select only necessary fields for performance
  const users = await User.find(candidateQuery)
    .select([
      '_id',
      'personalInfo.firstName',
      'personalInfo.lastName',
      'personalInfo.age',
      'personalInfo.location',
      'personalInfo.bio',
      'personalInfo.height',
      'lifestyle.professionType',
      'lifestyle.educationLevel',
      'lifestyle.familyValues',
      'lifestyle.religion',
      'lifestyle.familyPlans',
      'lifestyle.hobbies',
      'lifestyle.languages',
      'personality.openness',
      'personality.neuroticism',
      'birthData.dateOfBirth',
      'horoscopeData.moonSign',
      'horoscopeData.rashi',
      'horoscopeData.nakshatra',
      'createdAt',
      'updatedAt',
    ].join(' '))
    .lean({ virtuals: true });

  const baseFilteredUsers = isHeightFilterActive
    ? users.filter((candidate) => {
        const candidateHeightCm = parseHeightToCm(profileField(candidate, 'height'));
        if (!candidateHeightCm) {
          return false;
        }
        return candidateHeightCm >= heightMin && candidateHeightCm <= heightMax;
      })
    : users;

  let filteredUsers = baseFilteredUsers;

  if (searchTerm) {
    const normalizedSearch = searchTerm.toLowerCase();
    filteredUsers = filteredUsers.filter((candidate) => {
      const searchableText = [
        profileField(candidate, 'firstName'),
        profileField(candidate, 'lastName'),
        profileField(candidate, 'location'),
        candidate.lifestyle?.professionType,
        profileField(candidate, 'bio'),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return searchableText.includes(normalizedSearch) || isFuzzyNameMatch(candidate, normalizedSearch);
    });
  }

  const didYouMean = searchTerm && filteredUsers.length === 0
    ? buildDidYouMeanSuggestions(baseFilteredUsers, searchTerm)
    : [];

  const scored = await Promise.all(
    filteredUsers.map(async (candidate) => {
      const [compatibility, mutualInterest] = await Promise.all([
        compatibilityService.calculateCompatibility({
          userAId: currentUserId,
          userBId: String(candidate._id),
          fastMode,
        }),
        MatchInterest.findOne({
          $or: [
            { fromUser: req.user._id, toUser: candidate._id, status: 'mutual' },
            { fromUser: candidate._id, toUser: req.user._id, status: 'mutual' },
          ],
        }).lean().select('_id'),
      ]);

      if (!fastMode) {
        void persistMatch(req.user._id, candidate._id, compatibility, Boolean(mutualInterest)).catch((error) => {
          logger.warn('Unable to persist match cache after recommendation calculation', {
            userAId: String(req.user._id),
            userBId: String(candidate._id),
            message: error.message,
          });
        });
      }

      return buildCard(candidate, compatibility, Boolean(mutualInterest));
    })
  );

  if (sortBy === 'newest') {
    scored.sort((a, b) => Number(new Date(b.createdAt || 0)) - Number(new Date(a.createdAt || 0)));
  } else if (sortBy === 'active') {
    scored.sort((a, b) => Number(new Date(b.updatedAt || 0)) - Number(new Date(a.updatedAt || 0)) || b.score - a.score);
  } else {
    scored.sort((a, b) => b.score - a.score);
  }

  const pagedItems = scored.slice(skip, skip + pageSize);

  const response = {
    success: true,
    data: {
      items: pagedItems,
      total: scored.length,
      page,
      pageSize,
      didYouMean,
    },
  };

  // Cache for 1 hour (3600 seconds)
  if (!forceRefresh) {
    try {
      await redisClient.setEx(cacheKey, 3600, JSON.stringify(response));
    } catch (error) {
      logger.warn('Cache write failed, continuing without cache', { message: error.message });
    }
  }

  res.status(200).json(response);
});

export const getMatchDetail = asyncHandler(async (req, res) => {
  ensureObjectId(req.params.id, 'matchId');

  const user = await User.findById(req.params.id)
    .select([
      '_id',
      'role',
      'personalInfo.firstName',
      'personalInfo.lastName',
      'personalInfo.age',
      'personalInfo.location',
      'personalInfo.profilePic',
      'personalInfo.bio',
      'personalInfo.photos',
      'lifestyle.professionType',
      'lifestyle.educationLevel',
      'lifestyle.familyValues',
      'personality.openness',
      'personality.neuroticism',
      'horoscopeData.moonSign',
      'horoscopeData.rashi',
      'horoscopeData.nakshatra',
      'horoscopeData.ascendant',
    ].join(' '))
    .lean({ virtuals: true });
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

  const candidate = await User.findById(req.params.id).select('_id role').lean();
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
