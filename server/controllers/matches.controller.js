import mongoose from 'mongoose';
import path from 'path';
import { spawn } from 'child_process';
import User from '../models/User.js';
import MatchInterest from '../models/MatchInterest.js';
import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import Match from '../models/Match.js';
import WeddingProject from '../models/WeddingProject.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import { calculateCompatibilityFromData, buildCacheKey } from '../services/compatibility.service.js';
import redisClient from '../lib/redis.js';
import logger from '../utils/logger.js';
import Notification from '../models/Notification.js';
import { resolvePythonCommand } from '../utils/pythonRuntime.js';
import { emitToUser } from '../lib/socket.js';
import { deriveGanaFromNakshatra } from '../utils/gana.js';

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
  const allPhotos = [
    ...(user.personalInfo?.photos || []),
    ...(user.photos || []),
  ].filter((p) => p?.url);
  return (
    allPhotos.find((p) => p.isMain)?.url ||
    allPhotos[0]?.url ||
    user.personalInfo?.profilePic ||
    user.profilePic ||
    null
  );
}

function normalizeDisplayValue(value, fallback = 'Not provided') {
  if (value === undefined || value === null) return fallback;

  if (typeof value === 'string') {
    const normalized = value.trim();
    return normalized || fallback;
  }

  return value;
}

function buildSearchableText(candidate) {
  const fullName = [profileField(candidate, 'firstName'), profileField(candidate, 'lastName')]
    .filter(Boolean)
    .join(' ');

  return [
    fullName,
    candidate.name,
    candidate.email,
    profileField(candidate, 'location'),
    candidate.lifestyle?.professionType,
    candidate.lifestyle?.educationLevel,
    candidate.lifestyle?.religion,
    candidate.lifestyle?.careerAmbitions,
    candidate.lifestyle?.familyPlans,
    profileField(candidate, 'bio'),
    ...(Array.isArray(candidate.lifestyle?.hobbies) ? candidate.lifestyle.hobbies : []),
    ...(Array.isArray(candidate.lifestyle?.languages) ? candidate.lifestyle.languages : []),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
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
        calculationVersion: Number(compatibility.calculationVersion || 2),
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
    location: normalizeDisplayValue(user.location || profileField(user, 'location')),
    job: normalizeDisplayValue(user.lifestyle?.professionType || user.lifestyle?.careerAmbitions),
    education: normalizeDisplayValue(user.lifestyle?.educationLevel),
    score: compatibility.overallScore,
    band: compatibility.bandLabel,
    img: mainPhoto(user),
    isOnline: true,
    bio: normalizeDisplayValue(user.bio || profileField(user, 'bio'), 'Not provided'),
    compatibility,
    mutualMatch,
    moonSign: user.horoscopeData?.moonSign || user.horoscopeData?.rashi || user.horoscope?.moonSign || user.horoscope?.rashi || 'Pending',
    ascendant: user.horoscopeData?.ascendant || user.horoscope?.ascendant || 'Pending',
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
    gender: normalizeDisplayValue(profileField(user, 'gender')),
    height: normalizeDisplayValue(profileField(user, 'height')),
    ethnicity: normalizeDisplayValue(profileField(user, 'ethnicity')),
    location: normalizeDisplayValue(user.location || profileField(user, 'location')),
    job: normalizeDisplayValue(user.lifestyle?.professionType || user.lifestyle?.careerAmbitions),
    education: normalizeDisplayValue(user.lifestyle?.educationLevel),
    religion: normalizeDisplayValue(user.lifestyle?.religion),
    score: compatibility.overallScore,
    band: compatibility.bandLabel,
    bio: normalizeDisplayValue(user.bio || profileField(user, 'bio')),
    tagline: normalizeDisplayValue(user.tagline || user.personalInfo?.tagline || null),
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
      gana: user.horoscopeData?.gana || deriveGanaFromNakshatra(user.horoscopeData?.nakshatra || user.horoscope?.nakshatra) || 'Pending',
      ascendant: user.horoscopeData?.ascendant || user.horoscopeData?.moonSign || user.horoscope?.moonSign || 'Pending',
    },
    lifestyle: {
      hobbies,
      interests: Array.isArray(user.lifestyle?.languages) ? user.lifestyle.languages.filter(Boolean) : [],
      career: normalizeDisplayValue(user.lifestyle?.professionType || user.lifestyle?.careerAmbitions),
      familyPlans: normalizeDisplayValue(user.lifestyle?.familyPlans),
      diet: normalizeDisplayValue(user.lifestyle?.diet),
      smoking: normalizeDisplayValue(user.lifestyle?.smoking),
      drinking: normalizeDisplayValue(user.lifestyle?.drinking),
    },
    photos: (user.personalInfo?.photos || user.photos || []).filter((p) => p?.url).map((p) => p.url),
    profileImage: mainPhoto(user),
    mutualMatch,
    explanation: compatibility.explanation,
  };
}

export const getRecommendations = asyncHandler(async (req, res) => {
  const currentUserId = String(req.user._id);
  const page = Math.max(1, Number(req.query.page) || 1);
  const pageSize = Math.min(20, Number(req.query.pageSize) || 10);
  // Fast mode is the default for the recommendations list — Python is only needed
  // for the per-match detail page. Pass ?fast=false explicitly to enable deep scoring.
  const fastMode = req.query.fast !== 'false';
  const forceRefresh = req.query.refresh === 'true';
  const sortBy = ['compatibility', 'newest', 'active'].includes(String(req.query.sortBy || ''))
    ? String(req.query.sortBy)
    : 'compatibility';

  const [ageMin, ageMax] = parseRange(req.query.ageRange, 18, 90);
  const isAgeFilterActive = !(ageMin === 18 && ageMax === 90);
  const [heightMin, heightMax] = parseRange(req.query.heightRange, 140, 200);
  const isHeightFilterActive = !(heightMin === 140 && heightMax === 200);
  const selectedReligions = parseStringList(req.query.religions);
  const selectedDistrict = String(req.query.district || '').trim();
  const selectedGender = String(req.query.gender || '').trim().toLowerCase();
  const searchTerm = String(req.query.search || '').trim();
  const hasExplicitDiscoveryFilters = Boolean(
    searchTerm ||
    selectedReligions.length > 0 ||
    selectedDistrict ||
    selectedGender ||
    isAgeFilterActive ||
    isHeightFilterActive
  );
  const skip = (page - 1) * pageSize;

  // Fetch current user's gender and seekingGender to power automatic filtering
  const currentUserProfile = await User.findById(req.user._id)
    .select('personalInfo.gender personalInfo.seekingGender')
    .lean();
  const currentUserGender = String(currentUserProfile?.personalInfo?.gender || '').toLowerCase();
  // What gender is the current user seeking? Use explicit profile value; fall back to
  // opposite-binary logic; fall back to 'any' if gender is unknown.
  const storedSeekingGender = String(currentUserProfile?.personalInfo?.seekingGender || '').toLowerCase();
  const inferredSeekingGender = currentUserGender === 'male' ? 'female'
    : currentUserGender === 'female' ? 'male'
    : 'any';
  const effectiveSeekingGender = storedSeekingGender || inferredSeekingGender;

  const candidateQuery = {
    _id: { $ne: req.user._id },
    role: 'user',
    // Keep matches page strictly for "Looking for a Partner" registrations.
    'weddingProject.partnerName': { $in: [null, ''] },
  };

  if (isAgeFilterActive && Number.isFinite(ageMin) && Number.isFinite(ageMax)) {
    candidateQuery['personalInfo.age'] = { $gte: ageMin, $lte: ageMax };
  }

  if (selectedReligions.length > 0) {
    candidateQuery['lifestyle.religion'] = { $in: selectedReligions };
  }

  if (selectedDistrict) {
    candidateQuery['personalInfo.location'] = { $regex: new RegExp(escapeRegex(selectedDistrict), 'i') };
  }

  if (selectedGender && ['male', 'female', 'non-binary', 'prefer_not_to_say'].includes(selectedGender)) {
    // Explicit UI filter overrides the automatic seeking-gender filter
    candidateQuery['personalInfo.gender'] = selectedGender;
  } else if (effectiveSeekingGender !== 'any') {
    // Auto-filter: only show candidates whose gender matches what the current user is seeking
    candidateQuery['personalInfo.gender'] = effectiveSeekingGender;
  }

  // Mutual seeking filter: candidates must also be seeking the current user's gender (or 'any')
  if (currentUserGender && !selectedGender) {
    candidateQuery.$or = [
      { 'personalInfo.seekingGender': currentUserGender },
      { 'personalInfo.seekingGender': 'any' },
      { 'personalInfo.seekingGender': null },
      { 'personalInfo.seekingGender': { $exists: false } },
    ];
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

  // Run all three independent DB queries in parallel — one Atlas round-trip instead of three sequential ones
  const compatibilityFieldSelection = [
    '_id',
    'personality.openness', 'personality.conscientiousness', 'personality.extraversion',
    'personality.agreeableness', 'personality.neuroticism',
    'lifestyle.religion', 'lifestyle.diet', 'lifestyle.smoking', 'lifestyle.drinking',
    'lifestyle.exercise', 'lifestyle.preferredLocation', 'lifestyle.educationLevel', 'lifestyle.professionType',
    'lifestyle.familyValues', 'lifestyle.familyPlans', 'lifestyle.socialPreference',
    'lifestyle.hobbies', 'lifestyle.languages',
    'horoscopeData.nakshatra', 'horoscopeData.rashi',
    'horoscopeData.rajju', 'horoscopeData.planetaryPositions',
  ].join(' ');

  const [users, currentUserData, allMutualInterests] = await Promise.all([
    User.find(candidateQuery)
      .select([
        '_id',
        'email',
        'personalInfo.firstName',
        'personalInfo.lastName',
        'personalInfo.age',
        'personalInfo.gender',
        'personalInfo.location',
        'personalInfo.bio',
        'personalInfo.height',
        'personalInfo.profilePic',
        'personalInfo.photos',
        'personality.openness',
        'personality.conscientiousness',
        'personality.extraversion',
        'personality.agreeableness',
        'personality.neuroticism',
        'lifestyle.professionType',
        'lifestyle.careerAmbitions',
        'lifestyle.educationLevel',
        'lifestyle.familyValues',
        'lifestyle.religion',
        'lifestyle.diet',
        'lifestyle.smoking',
        'lifestyle.drinking',
        'lifestyle.exercise',
        'lifestyle.preferredLocation',
        'lifestyle.familyPlans',
        'lifestyle.socialPreference',
        'lifestyle.hobbies',
        'lifestyle.languages',
        'birthData.dateOfBirth',
        'birthData.timeOfBirth',
        'birthData.placeOfBirth',
        'birthData.knownBirthTime',
        'horoscopeData.moonSign',
        'horoscopeData.rashi',
        'horoscopeData.nakshatra',
        'horoscopeData.ascendant',
        'horoscopeData.rajju',
        'horoscopeData.planetaryPositions',
        'createdAt',
        'updatedAt',
      ].join(' '))
      .lean({ virtuals: true }),
    User.findById(currentUserId).select(compatibilityFieldSelection).lean(),
    // Fetch all this user's mutual interests without needing candidate IDs first
    MatchInterest.find({
      $or: [
        { fromUser: req.user._id, status: 'mutual' },
        { toUser: req.user._id, status: 'mutual' },
      ],
    }).select('fromUser toUser').lean(),
  ]);

  // Defensive: strip the current user from results even if the DB $ne missed them
  // (covers type-mismatch edge cases between ObjectId and string comparisons)
  const usersExcludingSelf = users.filter((u) => String(u._id) !== currentUserId);

  const baseFilteredUsers = isHeightFilterActive
    ? usersExcludingSelf.filter((candidate) => {
        const candidateHeightCm = parseHeightToCm(profileField(candidate, 'height'));
        if (!candidateHeightCm) return false;
        return candidateHeightCm >= heightMin && candidateHeightCm <= heightMax;
      })
    : usersExcludingSelf;

  let filteredUsers = baseFilteredUsers;

  if (searchTerm) {
    const normalizedSearch = searchTerm.toLowerCase();
    filteredUsers = filteredUsers.filter((candidate) => {
      const searchableText = buildSearchableText(candidate);
      return searchableText.includes(normalizedSearch) || isFuzzyNameMatch(candidate, normalizedSearch);
    });
  }

  const didYouMean = searchTerm && filteredUsers.length === 0
    ? buildDidYouMeanSuggestions(baseFilteredUsers, searchTerm)
    : [];

  // Build mutual-interest set from the pre-fetched results
  const mutualSet = new Set(
    allMutualInterests.map((mi) =>
      String(mi.fromUser) === currentUserId ? String(mi.toUser) : String(mi.fromUser)
    )
  );

  // Fast-path scores for all candidates
  const fastScores = new Map();
  for (const candidate of filteredUsers) {
    const compatibility = currentUserData
      ? calculateCompatibilityFromData(currentUserData, candidate)
      : { overallScore: 50, astroScore: 50, personalityScore: 50, lifestyleScore: 50, familyScore: 50, bandLabel: 'MODERATE', explanation: '', astroBreakdown: {} };
    fastScores.set(String(candidate._id), compatibility);
  }

  // Overlay with any cached full-engine results (written by getMatchDetail)
  try {
    const cacheKeys = filteredUsers.map((c) => buildCacheKey(currentUserId, String(c._id)));
    if (cacheKeys.length > 0) {
      const cachedValues = await redisClient.mGet(cacheKeys);
      cachedValues.forEach((val, idx) => {
        if (val) {
          try {
            const parsed = JSON.parse(val);
            if (parsed && typeof parsed.overallScore === 'number') {
              fastScores.set(String(filteredUsers[idx]._id), parsed);
            }
          } catch { /* ignore */ }
        }
      });
    }
  } catch (err) {
    logger.warn('Redis mGet for cached compat scores failed', { message: err.message });
  }

  const scored = filteredUsers.map((candidate) => {
    const compatibility = fastScores.get(String(candidate._id));
    const mutualMatch = mutualSet.has(String(candidate._id));
    return buildCard(candidate, compatibility, mutualMatch);
  });

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

  const compatFieldSelection = [
    '_id',
    'role',
    'personalInfo.firstName',
    'personalInfo.lastName',
    'personalInfo.age',
    'personalInfo.gender',
    'personalInfo.height',
    'personalInfo.ethnicity',
    'personalInfo.location',
    'personalInfo.profilePic',
    'personalInfo.bio',
    'personalInfo.tagline',
    'personalInfo.photos',
    'lifestyle.professionType',
    'lifestyle.careerAmbitions',
    'lifestyle.educationLevel',
    'lifestyle.familyValues',
    'lifestyle.familyPlans',
    'lifestyle.hobbies',
    'lifestyle.religion',
    'lifestyle.diet',
    'lifestyle.smoking',
    'lifestyle.drinking',
    'lifestyle.exercise',
    'lifestyle.preferredLocation',
    'lifestyle.socialPreference',
    'lifestyle.languages',
    'personality.openness',
    'personality.conscientiousness',
    'personality.extraversion',
    'personality.agreeableness',
    'personality.neuroticism',
    'horoscopeData.moonSign',
    'horoscopeData.rashi',
    'horoscopeData.nakshatra',
    'horoscopeData.ascendant',
    'horoscopeData.gana',
    'horoscopeData.rajju',
    'horoscopeData.planetaryPositions',
    'photos',
  ].join(' ');

  const [user, currentUser] = await Promise.all([
    User.findById(req.params.id).select(compatFieldSelection).lean({ virtuals: true }),
    User.findById(req.user._id).select(compatFieldSelection).lean({ virtuals: true }),
  ]);

  if (!user || user.role !== 'user') {
    throw new ApiError(404, 'Match not found');
  }
  if (!currentUser) {
    throw new ApiError(404, 'Current user not found');
  }

  // Use the same fast JS path as the recommendations list so the score is always consistent
  const compatibility = calculateCompatibilityFromData(currentUser, user);

  // Cache this score so future recommendations list loads overlay the same value
  const cacheKey = buildCacheKey(String(req.user._id), String(user._id));
  try {
    await redisClient.set(cacheKey, JSON.stringify(compatibility), { EX: 60 * 60 * 24 });
  } catch { /* non-critical */ }

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

  const candidate = await User.findById(req.params.id)
    .select('_id role personalInfo.firstName personalInfo.lastName personalInfo.profilePic')
    .lean();
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

  // --- Notifications ---
  const senderFull = await User.findById(req.user._id)
    .select('personalInfo lifestyle photos')
    .lean();
  const senderName = [senderFull?.personalInfo?.firstName, senderFull?.personalInfo?.lastName]
    .filter(Boolean).join(' ') || 'Someone';
  const senderPic = senderFull?.personalInfo?.profilePic || null;
  // Build a full card payload so the receiver can update their UI without a round-trip
  const senderCardData = {
    id: String(req.user._id),
    name: senderName,
    initials: senderName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || '??',
    age: senderFull?.personalInfo?.age ?? null,
    location: normalizeDisplayValue(senderFull?.personalInfo?.location),
    height: normalizeDisplayValue(senderFull?.personalInfo?.height),
    job: normalizeDisplayValue(senderFull?.lifestyle?.professionType || senderFull?.lifestyle?.careerAmbitions),
    education: normalizeDisplayValue(senderFull?.lifestyle?.educationLevel),
    img: mainPhoto(senderFull),
    receivedAt: new Date().toISOString(),
  };
  const recipientName = [candidate?.personalInfo?.firstName, candidate?.personalInfo?.lastName]
    .filter(Boolean).join(' ') || 'Someone';
  const recipientPic = candidate?.personalInfo?.profilePic || null;

  if (matched) {
    // Notify both users of the mutual match
    await Notification.create([
      {
        userId: req.params.id,
        type: 'mutual_match',
        fromUserId: req.user._id,
        fromUserName: senderName,
        fromUserProfilePic: senderPic,
        conversationId: conversation._id,
      },
      {
        userId: req.user._id,
        type: 'mutual_match',
        fromUserId: req.params.id,
        fromUserName: recipientName,
        fromUserProfilePic: recipientPic,
        conversationId: conversation._id,
      },
    ]);
  } else {
    // Notify the recipient that someone expressed interest
    await Notification.create({
      userId: req.params.id,
      type: 'interest_received',
      fromUserId: req.user._id,
      fromUserName: senderName,
      fromUserProfilePic: senderPic,
    });

    // Check if current user is accepting a received interest (i.e. reverse pending exists)
    // The reverse interest was already found above — if there was a reverseInterest that led
    // to mutual, we already handled it. Here we check if our express is a direct accept
    // of a pending interest that the OTHER user sent us previously.
    const theyHadSentToUs = await MatchInterest.findOne({
      fromUser: req.params.id,
      toUser: req.user._id,
    }).lean();
    if (theyHadSentToUs) {
      // They sent interest first, we just accepted → notify them of the acceptance
      await Notification.create({
        userId: req.params.id,
        type: 'interest_accepted',
        fromUserId: req.user._id,
        fromUserName: senderName,
        fromUserProfilePic: senderPic,
      });
    }
  }
  // --- End Notifications ---

  // --- Real-time events ---
  if (matched) {
    emitToUser(req.params.id, 'mutual_match', {
      fromUserId: String(req.user._id),
      fromUserName: senderName,
      fromUserProfilePic: senderPic,
      conversationId: conversation ? String(conversation._id) : null,
    });
    emitToUser(req.user._id, 'mutual_match', {
      fromUserId: String(req.params.id),
      fromUserName: recipientName,
      fromUserProfilePic: recipientPic,
      conversationId: conversation ? String(conversation._id) : null,
    });
  } else {
    emitToUser(req.params.id, 'interest_received', {
      fromUserId: String(req.user._id),
      fromUserName: senderName,
      fromUserProfilePic: senderPic,
      senderCard: senderCardData,
    });

    // If this was an acceptance of a previously-received interest, also fire interest_accepted
    const theyHadSentCheck = await MatchInterest.findOne({
      fromUser: req.params.id,
      toUser: req.user._id,
    }).lean();
    if (theyHadSentCheck) {
      emitToUser(req.params.id, 'interest_accepted', {
        fromUserId: String(req.user._id),
        fromUserName: senderName,
        fromUserProfilePic: senderPic,
      });
    }
  }
  // --- End Real-time events ---

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
  const otherId = req.params.id;

  // Delete both directions so a mutual match is fully removed
  await MatchInterest.deleteMany({
    $or: [
      { fromUser: req.user._id, toUser: otherId },
      { fromUser: otherId, toUser: req.user._id },
    ],
  });

  // Also wipe the conversation and all messages between them
  const conversation = await Conversation.findOne({
    participants: { $all: [req.user._id, otherId] },
  });
  if (conversation) {
    await Message.deleteMany({ conversationId: conversation._id });
    await conversation.deleteOne();
  }

  // Delete mutual_match and interest_received notifications between both users
  await Notification.deleteMany({
    $or: [
      { userId: req.user._id, fromUserId: otherId, type: { $in: ['mutual_match', 'interest_received'] } },
      { userId: otherId, fromUserId: req.user._id, type: { $in: ['mutual_match', 'interest_received'] } },
    ],
  });

  // ── Wedding project cleanup ──────────────────────────────────────────────
  // If these two users share a wedding project (accepted invite), split it:
  // - Remove the remover from the shared project (they keep their own new solo one)
  // - The other user keeps the original project (solo again)
  // - Clean up wedding_invite / wedding_accepted notifications between them
  const sharedWeddingProject = await WeddingProject.findOne({
    coupleUserIds: { $all: [req.user._id, otherId] },
  });
  if (sharedWeddingProject) {
    // Remove the current user from the couple — other user retains the project solo
    sharedWeddingProject.coupleUserIds = sharedWeddingProject.coupleUserIds.filter(
      (id) => String(id) !== String(req.user._id)
    );
    sharedWeddingProject.pendingInvite = { inviteeId: null, status: 'declined' };
    await sharedWeddingProject.save();

    // Clean up wedding notifications between both users
    await Notification.deleteMany({
      $or: [
        { userId: req.user._id, fromUserId: otherId, type: { $in: ['wedding_invite', 'wedding_accepted'] } },
        { userId: otherId, fromUserId: req.user._id, type: { $in: ['wedding_invite', 'wedding_accepted'] } },
      ],
    });

    // Tell the other user their wedding project was reset
    emitToUser(otherId, 'wedding_reset', { byUserId: String(req.user._id) });
  }

  // Notify the other user that the match was removed
  const remover = await User.findById(req.user._id).select('firstName lastName name profilePic').lean();
  const removerName = remover?.firstName || remover?.name || 'Someone';
  await Notification.create({
    userId: otherId,
    type: 'match_removed',
    fromUserId: req.user._id,
    fromUserName: removerName,
    fromUserProfilePic: remover?.profilePic || null,
  });

  emitToUser(otherId, 'match_removed', { byUserId: String(req.user._id) });

  res.status(200).json({
    success: true,
    data: { message: 'Match removed' },
  });
});

/**
 * Decline a pending interest sent to the current user by another user.
 * Unlike undoInterest, this only removes the one-way pending record and
 * notifies the sender — it does NOT wipe conversations or mutual data.
 */
export const declineInterest = asyncHandler(async (req, res) => {
  ensureObjectId(req.params.id, 'senderId');
  const senderId = req.params.id;

  // Only delete the pending interest FROM them TO us
  const deleted = await MatchInterest.findOneAndDelete({
    fromUser: senderId,
    toUser: req.user._id,
    status: 'pending',
  });

  if (!deleted) {
    throw new ApiError(404, 'No pending interest from that user found');
  }

  // Clean up the interest_received notification they triggered
  await Notification.deleteMany({
    userId: req.user._id,
    fromUserId: senderId,
    type: 'interest_received',
  });

  // Build current user's display info for the notification
  const decliner = await User.findById(req.user._id)
    .select('personalInfo.firstName personalInfo.lastName personalInfo.profilePic')
    .lean();
  const declinerName = [decliner?.personalInfo?.firstName, decliner?.personalInfo?.lastName]
    .filter(Boolean).join(' ') || 'Someone';
  const declinerPic = decliner?.personalInfo?.profilePic || null;

  // Notify the sender that their interest was declined
  await Notification.create({
    userId: senderId,
    type: 'interest_declined',
    fromUserId: req.user._id,
    fromUserName: declinerName,
    fromUserProfilePic: declinerPic,
  });

  emitToUser(senderId, 'interest_declined', {
    fromUserId: String(req.user._id),
    fromUserName: declinerName,
    fromUserProfilePic: declinerPic,
  });

  res.status(200).json({
    success: true,
    data: { message: 'Interest declined' },
  });
});

export const getPendingInterests = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const [sentRecords, receivedRecords] = await Promise.all([
    MatchInterest.find({ fromUser: userId, status: 'pending' }).lean(),
    MatchInterest.find({ toUser: userId, status: 'pending' }).lean(),
  ]);

  const sentUserIds = sentRecords.map((i) => i.toUser);
  const receivedUserIds = receivedRecords.map((i) => i.fromUser);

  const userFields = [
    '_id',
    'personalInfo.firstName', 'personalInfo.lastName',
    'personalInfo.age', 'personalInfo.location', 'personalInfo.profilePic',
    'personalInfo.height',
    'lifestyle.professionType', 'lifestyle.careerAmbitions', 'lifestyle.educationLevel',
    'horoscopeData.moonSign', 'horoscopeData.rashi', 'horoscopeData.ascendant',
    'photos',
  ].join(' ');

  const [sentUsers, receivedUsers] = await Promise.all([
    User.find({ _id: { $in: sentUserIds } }).select(userFields).lean(),
    User.find({ _id: { $in: receivedUserIds } }).select(userFields).lean(),
  ]);

  const sentMap = Object.fromEntries(sentUsers.map((u) => [String(u._id), u]));
  const receivedMap = Object.fromEntries(receivedUsers.map((u) => [String(u._id), u]));

  const formatUser = (u) => {
    const fullName = [u.personalInfo?.firstName, u.personalInfo?.lastName].filter(Boolean).join(' ') || 'Member';
    const initials = fullName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || '??';
    return {
      id: String(u._id),
      name: fullName,
      initials,
      age: u.personalInfo?.age ?? null,
      location: normalizeDisplayValue(u.personalInfo?.location),
      height: normalizeDisplayValue(u.personalInfo?.height),
      job: normalizeDisplayValue(u.lifestyle?.professionType || u.lifestyle?.careerAmbitions),
      education: normalizeDisplayValue(u.lifestyle?.educationLevel),
      img: mainPhoto(u),
      moonSign: u.horoscopeData?.moonSign || u.horoscopeData?.rashi || 'Pending',
      ascendant: u.horoscopeData?.ascendant || 'Pending',
    };
  };

  const sent = sentRecords
    .map((i) => {
      const u = sentMap[String(i.toUser)];
      return u ? { ...formatUser(u), sentAt: i.createdAt } : null;
    })
    .filter(Boolean);

  const received = receivedRecords
    .map((i) => {
      const u = receivedMap[String(i.fromUser)];
      return u ? { ...formatUser(u), receivedAt: i.createdAt } : null;
    })
    .filter(Boolean);

  res.status(200).json({ success: true, data: { sent, received } });
});

export const getMutualMatches = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  // Find all mutual MatchInterest records involving this user
  const mutualInterests = await MatchInterest.find({
    $or: [{ fromUser: userId }, { toUser: userId }],
    status: 'mutual',
  }).lean();

  if (!mutualInterests.length) {
    return res.status(200).json({ success: true, data: { items: [] } });
  }

  // Get the other user's ID from each mutual interest
  const otherIds = mutualInterests.map((mi) =>
    String(mi.fromUser) === String(userId) ? mi.toUser : mi.fromUser
  );

  const [otherUsers, currentUserData, conversations] = await Promise.all([
    User.find({ _id: { $in: otherIds } })
      .select([
        '_id', 'personalInfo.firstName', 'personalInfo.lastName', 'personalInfo.age',
        'personalInfo.location', 'personalInfo.bio', 'personalInfo.profilePic',
        'personalInfo.photos', 'personality', 'lifestyle', 'horoscopeData', 'createdAt',
      ].join(' '))
      .lean(),
    User.findById(userId).lean(),
    Conversation.find({
      participants: { $in: [userId] },
    }).lean(),
  ]);

  // Build a map: otherUserId → conversationId
  const convByUser = {};
  for (const conv of conversations) {
    const otherId = conv.participants.find((p) => String(p) !== String(userId));
    if (otherId) convByUser[String(otherId)] = String(conv._id);
  }

  const items = otherUsers.map((u) => {
    const compat = calculateCompatibilityFromData(currentUserData, u);
    const card = buildCard(u, compat, true);
    card.conversationId = convByUser[String(u._id)] || null;
    return card;
  });

  res.status(200).json({ success: true, data: { items } });
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
  declineInterest,
  getPendingInterests,
  getMutualMatches,
  getTodayMatches,
};
