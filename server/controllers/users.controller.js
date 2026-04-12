import User from '../models/User.js';
import AuthOtp from '../models/AuthOtp.js';
import Conversation from '../models/Conversation.js';
import Horoscope from '../models/Horoscope.js';
import Match from '../models/Match.js';
import MatchInterest from '../models/MatchInterest.js';
import Message from '../models/Message.js';
import Vendor from '../models/Vendor.js';
import WeddingProject from '../models/WeddingProject.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import bcrypt from 'bcrypt';
import logger from '../utils/logger.js';
import { resolveBirthPlace } from '../utils/birthLocation.js';

const OTP_EXPIRY_MINUTES = 10;
const SRI_LANKA_MOBILE_REGEX = /^7\d{8}$/;

function normalizePhone(value = '') {
  const digits = String(value).replace(/\D/g, '');
  if (!digits) return '';

  let localDigits = digits;
  if (digits.startsWith('94')) {
    localDigits = digits.slice(2);
  } else if (digits.startsWith('0')) {
    localDigits = digits.slice(1);
  }

  if (!SRI_LANKA_MOBILE_REGEX.test(localDigits)) {
    return '';
  }

  return `+94${localDigits}`;
}

function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

async function createOtp({ identifier, channel, purpose }) {
  const code = generateOtp();
  const codeHash = await bcrypt.hash(code, 10);
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  await AuthOtp.findOneAndUpdate(
    { identifier, purpose },
    {
      $set: {
        identifier,
        channel,
        purpose,
        codeHash,
        expiresAt,
        attempts: 0,
      },
    },
    { upsert: true, new: true }
  );

  logger.info('Contact verification OTP issued', {
    purpose,
    channel,
    identifier: channel === 'email' ? identifier : 'masked-phone',
  });

  return {
    code,
    channel,
    expiresAt,
  };
}

async function verifyOtp({ identifier, purpose, otp }) {
  const record = await AuthOtp.findOne({ identifier, purpose });

  if (!record || record.expiresAt < new Date()) {
    throw new ApiError(400, 'OTP is invalid or expired');
  }

  if (record.attempts >= 5) {
    await AuthOtp.deleteOne({ _id: record._id });
    throw new ApiError(429, 'OTP attempt limit exceeded. Request a new OTP.');
  }

  const isValid = await bcrypt.compare(String(otp), record.codeHash);
  if (!isValid) {
    record.attempts += 1;
    await record.save();
    throw new ApiError(400, 'OTP is invalid or expired');
  }

  await AuthOtp.deleteOne({ _id: record._id });
}

function getProfileCompletion(user) {
  const checks = [
    Boolean(user.personalInfo?.profilePic),
    Boolean(user.personalInfo?.firstName),
    Boolean(user.personalInfo?.lastName),
    Boolean(user.personalInfo?.location),
    Boolean(user.personalInfo?.bio),
    Boolean(user.personalInfo?.tagline),
    Boolean(user.personalInfo?.height),
    Boolean(user.personalInfo?.ethnicity),
    Boolean(user.birthData?.dateOfBirth),
    Boolean(user.birthData?.placeOfBirth?.city),
    Boolean(user.horoscopeData?.nakshatra || user.horoscopeData?.rashi || user.horoscopeData?.moonSign),
    Boolean(user.lifestyle?.educationLevel),
    Boolean(user.lifestyle?.professionType),
    Boolean(user.lifestyle?.religion),
    Boolean(user.lifestyle?.diet),
    Boolean(user.lifestyle?.smoking),
    Boolean(user.lifestyle?.drinking),
    Array.isArray(user.lifestyle?.languages) && user.lifestyle.languages.length > 0,
    Array.isArray(user.lifestyle?.hobbies) && user.lifestyle.hobbies.length > 0,
    Boolean(user.verification?.emailVerified),
    Boolean(user.verification?.phoneVerified),
  ];

  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

function getMissingItems(user) {
  const items = [];

  if (!user.personalInfo?.profilePic) items.push('Add Profile Photo');
  if (!user.personalInfo?.bio) items.push('Add Short Bio');
  if (!user.birthData?.dateOfBirth) items.push('Complete Birth Details');
  if (!(user.horoscopeData?.nakshatra || user.horoscopeData?.rashi || user.horoscopeData?.moonSign)) {
    items.push('Generate Horoscope Data');
  }
  if (!user.verification?.emailVerified) items.push('Verify Email');
  if (!user.verification?.phoneVerified && user.personalInfo?.phone) items.push('Verify Phone');

  return items;
}

function formatDate(value) {
  if (!value) return '';
  return new Intl.DateTimeFormat('en-LK', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value));
}

function fileToDataUri(file) {
  if (!file?.buffer || !file?.mimetype?.startsWith('image/')) {
    throw new ApiError(400, 'Please upload a valid image file.');
  }

  return `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
}

function sanitizeImageReference(value, { allowDataUri = true } = {}) {
  if (!value) return null;

  const normalized = String(value).trim();
  if (!normalized) return null;

  if (!allowDataUri && /^data:image\//i.test(normalized)) {
    return null;
  }

  return normalized;
}

function normalizeStringArray(value) {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => {
      if (typeof item === 'string') return item.trim();
      if (item && typeof item === 'object' && typeof item.label === 'string') return item.label.trim();
      return '';
    })
    .filter(Boolean);
}

function pickDefined(...values) {
  return values.find((value) => value !== undefined);
}

function parseOptionalNumber(value) {
  if (value === undefined || value === null || value === '') return undefined;

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function normalizePersonalityValue(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return undefined;
  return Math.max(0, Math.min(1, parsed));
}

function normalizePersonalityAnswers(answers) {
  const safe = Array.isArray(answers) && answers.length >= 10 ? answers.slice(0, 10) : null;
  if (!safe) return null;

  return safe.map((value) => {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return 3;
    return Math.max(1, Math.min(5, Math.round(parsed)));
  });
}

function mapProfile(user, { includeMedia = true } = {}) {
  const firstName = user.personalInfo?.firstName || '';
  const lastName = user.personalInfo?.lastName || '';
  const fullName = [firstName, lastName].filter(Boolean).join(' ').trim();
  const mainPhoto = sanitizeImageReference(
    user.photos?.find((photo) => photo.isMain)?.url || user.personalInfo?.profilePic,
    { allowDataUri: includeMedia }
  );
  const coverPhoto = sanitizeImageReference(user.personalInfo?.coverPhoto || user.coverPhoto || null, {
    allowDataUri: includeMedia,
  });
  const personality = user.personality || {};
  const languages = normalizeStringArray(user.lifestyle?.languages);
  const hobbies = normalizeStringArray(user.lifestyle?.hobbies);
  const privacy = user.privacySettings || user.privacy || {};

  return {
    _id: user._id,
    id: user._id,
    profileType: user.profileType,
    name: user.name || fullName || 'User',
    age: user.age ?? user.personalInfo?.age ?? null,
    profilePic: mainPhoto || null,
    coverPhoto: coverPhoto || null,
    tagline: user.tagline || user.personalInfo?.tagline || 'Building a meaningful future through shared values.',
    location: user.location || user.personalInfo?.location || 'Sri Lanka',
    completion: getProfileCompletion(user),
    status: 'Online Now',
    bio: user.bio || user.personalInfo?.bio || '',
    birthDate: user.birthData?.dateOfBirth ? new Date(user.birthData.dateOfBirth).toISOString().split('T')[0] : '',
    birthTime: user.birthData?.knownBirthTime === false ? '' : user.birthData?.timeOfBirth || '',
    birthPlace: user.birthData?.placeOfBirth?.city || '',
    knownBirthTime: user.birthData?.knownBirthTime !== false,
    birthData: {
      dateOfBirth: user.birthData?.dateOfBirth || null,
      timeOfBirth: user.birthData?.knownBirthTime === false ? '' : user.birthData?.timeOfBirth || '',
      knownBirthTime: user.birthData?.knownBirthTime !== false,
      placeOfBirth: user.birthData?.placeOfBirth
        ? {
            city: user.birthData.placeOfBirth.city || '',
            country: user.birthData.placeOfBirth.country || 'Sri Lanka',
            latitude: user.birthData.placeOfBirth.latitude || null,
            longitude: user.birthData.placeOfBirth.longitude || null,
            timezone: user.birthData.placeOfBirth.timezone || 'Asia/Colombo',
          }
        : null,
    },
    education: user.lifestyle?.educationLevel || '',
    occupation: user.lifestyle?.professionType || '',
    religion: user.lifestyle?.religion || '',
    ethnicity: user.ethnicity || user.personalInfo?.ethnicity || '',
    height: user.height || user.personalInfo?.height || '',
    hobbies: user.lifestyle?.hobbies || [],
    diet: user.lifestyle?.diet || 'Non-veg',
    smoking: user.lifestyle?.smoking || 'Never',
    drinking: user.lifestyle?.drinking || 'Never',
    personalInfo: {
      firstName: user.personalInfo?.firstName || 'Not provided',
      lastName: user.personalInfo?.lastName || 'Not provided',
      phone: user.phone || user.personalInfo?.phone || 'Not provided',
      age: user.age ?? user.personalInfo?.age ?? 'Not provided',
      gender: user.gender || user.personalInfo?.gender || 'Not provided',
      height: user.height || user.personalInfo?.height || 'Not provided',
      education: user.lifestyle?.educationLevel || 'Not provided',
      occupation: user.lifestyle?.professionType || 'Not provided',
      religion: user.lifestyle?.religion || 'Not provided',
      ethnicity: user.ethnicity || user.personalInfo?.ethnicity || 'Not provided',
      languages,
    },
    personality: [
      { subject: 'Openness', A: Math.round((personality.openness ?? 0.5) * 100), fullMark: 100 },
      {
        subject: 'Conscientiousness',
        A: Math.round((personality.conscientiousness ?? 0.5) * 100),
        fullMark: 100,
      },
      {
        subject: 'Extraversion',
        A: Math.round((personality.extraversion ?? 0.5) * 100),
        fullMark: 100,
      },
      {
        subject: 'Agreeableness',
        A: Math.round((personality.agreeableness ?? 0.5) * 100),
        fullMark: 100,
      },
      {
        subject: 'Neuroticism',
        A: Math.round((personality.neuroticism ?? 0.5) * 100),
        fullMark: 100,
      },
    ],
    personalityAnswers: Array.isArray(user.personalityAnswers) && user.personalityAnswers.length === 10
      ? user.personalityAnswers
      : new Array(10).fill(3),
    astrology: {
      birthDate: formatDate(user.birthData?.dateOfBirth) || 'Not provided',
      birthTime: user.birthData?.knownBirthTime === false ? 'Unknown' : user.birthData?.timeOfBirth || 'Not provided',
      birthPlace: user.birthData?.placeOfBirth?.city || user.location || 'Not provided',
      rashi: user.horoscopeData?.rashi || user.horoscopeData?.moonSign || 'Not provided',
      nakshatra: user.horoscopeData?.nakshatra || 'Not provided',
      ascendant: user.horoscopeData?.ascendant || 'Not provided',
      sunSign: user.horoscopeData?.zodiacSign || 'Not provided',
      luckyColors: Array.isArray(user.horoscopeData?.luckyColors) ? user.horoscopeData.luckyColors : [],
      auspiciousDays: Array.isArray(user.horoscopeData?.auspiciousDays) ? user.horoscopeData.auspiciousDays : [],
      favorablePartners: Array.isArray(user.horoscopeData?.favorablePartners) ? user.horoscopeData.favorablePartners : [],
      profileFacts: Array.isArray(user.horoscopeData?.profileFacts) ? user.horoscopeData.profileFacts : [],
    },
    lifestyle: {
      hobbies,
      exercise: user.lifestyle?.exercise || 'Not provided',
      diet: user.lifestyle?.diet || 'Not provided',
      smoking: user.lifestyle?.smoking || 'Not provided',
      drinking: user.lifestyle?.drinking || 'Not provided',
      careerAmbitions: user.lifestyle?.careerAmbitions || user.lifestyle?.professionType || 'Not provided',
      familyPlans: user.lifestyle?.familyPlans || 'Not provided',
      socialPreference: user.lifestyle?.socialPreference ?? Math.round((user.personality?.extraversion ?? 0.5) * 100),
    },
    photos: includeMedia
      ? user.photos?.length > 0
        ? user.photos
            .map((photo, index) => ({
              id: index + 1,
              url: sanitizeImageReference(photo.url, { allowDataUri: true }),
              isMain: photo.isMain,
            }))
            .filter((photo) => photo.url)
        : mainPhoto
          ? [{ id: 1, url: mainPhoto, isMain: true }]
          : []
      : mainPhoto
        ? [{ id: 1, url: mainPhoto, isMain: true }]
        : [],
    privacy: {
      showLastSeen: privacy.showLastSeen ?? true,
      showHoroscope: privacy.showHoroscope ?? true,
      showPhone: privacy.showPhone ?? false,
      whoCanMessage: privacy.whoCanMessage || 'Matches Only',
      whoCanSeePhotos: privacy.whoCanSeePhotos || 'Matches Only',
    },
    verification: {
      email: user.email,
      phone: user.phone || '',
      emailVerified: user.verification?.emailVerified ?? false,
      phoneVerified: user.verification?.phoneVerified ?? false,
      missingItems: getMissingItems(user),
    },
    weddingProject: user.weddingProject
      ? {
          partnerName: user.weddingProject.partnerName || '',
          weddingDate: user.weddingProject.weddingDate || null,
          budget: user.weddingProject.budget || '',
          status: user.weddingProject.status || 'planning',
        }
      : null,
  };
}

export const getProfile = asyncHandler(async (req, res) => {
  const includeMedia = req.query.includeMedia !== 'false';

  const profileQuery = User.findById(req.user._id);
  if (!includeMedia) {
    profileQuery.select('-personalInfo.profilePic -personalInfo.coverPhoto -personalInfo.photos');
  }

  const user = await profileQuery.lean({ virtuals: true });

  if (!user) {
    throw new ApiError(404, 'User profile not found');
  }

  res.status(200).json(mapProfile(user, { includeMedia }));
});

export const updateProfile = asyncHandler(async (req, res) => {
  const currentUser = await User.findById(req.user._id).lean({ virtuals: true });

  if (!currentUser) {
    throw new ApiError(404, 'User profile not found');
  }

  const updates = {};
  const body = req.body ?? {};
  const personalInfoBody = body.personalInfo && typeof body.personalInfo === 'object' ? body.personalInfo : {};
  const lifestyleBody = body.lifestyle && typeof body.lifestyle === 'object' ? body.lifestyle : {};
  const privacyBody = body.privacy && typeof body.privacy === 'object' ? body.privacy : {};
  const astrologyBody = body.astrology && typeof body.astrology === 'object' ? body.astrology : {};

  const incomingName = pickDefined(body.name, personalInfoBody.name);
  if (incomingName) {
    const [firstName, ...rest] = String(incomingName).trim().split(/\s+/);
    updates['personalInfo.firstName'] = firstName || currentUser.personalInfo?.firstName || '';
    updates['personalInfo.lastName'] = rest.join(' ') || currentUser.personalInfo?.lastName || '';
  }

  const fieldMap = {
    tagline: 'personalInfo.tagline',
    bio: 'personalInfo.bio',
    location: 'personalInfo.location',
    age: 'personalInfo.age',
    ethnicity: 'personalInfo.ethnicity',
    height: 'personalInfo.height',
    coverPhoto: 'personalInfo.coverPhoto',
    education: 'lifestyle.educationLevel',
    occupation: 'lifestyle.professionType',
    religion: 'lifestyle.religion',
    diet: 'lifestyle.diet',
    exercise: 'lifestyle.exercise',
    smoking: 'lifestyle.smoking',
    drinking: 'lifestyle.drinking',
    careerAmbitions: 'lifestyle.careerAmbitions',
    familyPlans: 'lifestyle.familyPlans',
    socialPreference: 'lifestyle.socialPreference',
  };

  for (const [incomingKey, targetPath] of Object.entries(fieldMap)) {
    const incomingValue = pickDefined(
      body[incomingKey],
      personalInfoBody[incomingKey],
      lifestyleBody[incomingKey]
    );

    if (incomingValue !== undefined) {
      updates[targetPath] = incomingKey === 'age' || incomingKey === 'socialPreference'
        ? parseOptionalNumber(incomingValue)
        : incomingValue;
    }
  }

  const incomingLanguages = pickDefined(body.languages, personalInfoBody.languages, lifestyleBody.languages);
  if (incomingLanguages !== undefined) {
    updates['lifestyle.languages'] = normalizeStringArray(incomingLanguages);
  }

  const incomingHobbies = pickDefined(body.hobbies, lifestyleBody.hobbies);
  if (incomingHobbies !== undefined) {
    updates['lifestyle.hobbies'] = normalizeStringArray(incomingHobbies);
  }

  const personalityBody = body.personality && typeof body.personality === 'object' ? body.personality : null;
  if (personalityBody) {
    const personalityKeys = ['openness', 'conscientiousness', 'extraversion', 'agreeableness', 'neuroticism'];

    for (const key of personalityKeys) {
      if (personalityBody[key] !== undefined) {
        const normalized = normalizePersonalityValue(personalityBody[key]);
        if (normalized !== undefined) {
          updates[`personality.${key}`] = normalized;
        }
      }
    }
  }

  const incomingPersonalityAnswers = normalizePersonalityAnswers(body.personalityAnswers);
  if (incomingPersonalityAnswers) {
    updates.personalityAnswers = incomingPersonalityAnswers;
  }

  if (Object.keys(privacyBody).length > 0) {
    const privacyMap = {
      showLastSeen: 'privacySettings.showLastSeen',
      showHoroscope: 'privacySettings.showHoroscope',
      showPhone: 'privacySettings.showPhone',
      whoCanMessage: 'privacySettings.whoCanMessage',
      whoCanSeePhotos: 'privacySettings.whoCanSeePhotos',
    };

    for (const [incomingKey, targetPath] of Object.entries(privacyMap)) {
      if (privacyBody[incomingKey] !== undefined) {
        updates[targetPath] = privacyBody[incomingKey];
      }
    }
  }

  // Only enter birth-update branch when a birth date is explicitly and non-emptily supplied.
  // Sending knownBirthTime=true or birthTime='' (which the profile payload always does) must
  // NOT trigger this path; only an intentional birthDate edit should.
  const explicitBirthDate = String(pickDefined(body.birthDate, astrologyBody.birthDate) || '').trim();
  const birthFieldsProvided = explicitBirthDate !== '';

  if (birthFieldsProvided) {
    const birthDate = String(
      pickDefined(body.birthDate, astrologyBody.birthDate) !== undefined
        ? pickDefined(body.birthDate, astrologyBody.birthDate)
        : currentUser.birthData?.dateOfBirth
          ? new Date(currentUser.birthData.dateOfBirth).toISOString().split('T')[0]
          : ''
    ).trim();
    const birthPlace = String(
      pickDefined(body.birthPlace, astrologyBody.birthPlace) !== undefined
        ? pickDefined(body.birthPlace, astrologyBody.birthPlace)
        : currentUser.birthData?.placeOfBirth?.city || ''
    ).trim();
    const knowsBirthTime =
      pickDefined(body.knownBirthTime, astrologyBody.knownBirthTime) !== undefined
        ? pickDefined(body.knownBirthTime, astrologyBody.knownBirthTime) === true ||
          pickDefined(body.knownBirthTime, astrologyBody.knownBirthTime) === 'true'
        : pickDefined(body.birthTime, astrologyBody.birthTime) !== undefined
          ? Boolean(String(pickDefined(body.birthTime, astrologyBody.birthTime) || '').trim())
          : currentUser.birthData?.knownBirthTime !== false;
    const providedBirthTime =
      pickDefined(body.birthTime, astrologyBody.birthTime) !== undefined
        ? String(pickDefined(body.birthTime, astrologyBody.birthTime) || '').trim()
        : currentUser.birthData?.knownBirthTime === false
          ? ''
          : currentUser.birthData?.timeOfBirth || '';

    if (!birthDate || !birthPlace) {
      throw new ApiError(400, 'Birth date and birth place are required to update horoscope details.');
    }

    if (knowsBirthTime && !providedBirthTime) {
      throw new ApiError(400, 'Please provide your birth time or mark it as unknown.');
    }

    const placeOfBirth = await resolveBirthPlace(birthPlace);
    updates['birthData.dateOfBirth'] = new Date(birthDate);
    updates['birthData.timeOfBirth'] = knowsBirthTime ? providedBirthTime : '12:00';
    updates['birthData.placeOfBirth'] = placeOfBirth;
    updates['birthData.knownBirthTime'] = knowsBirthTime;
    updates.horoscopeData = {};
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { $set: updates },
    { new: true, runValidators: true }
  ).lean({ virtuals: true });

  if (!user) {
    throw new ApiError(404, 'User profile not found');
  }

  res.status(200).json(mapProfile(user));
});

export const requestContactVerification = asyncHandler(async (req, res) => {
  const { channel } = req.body ?? {};
  if (!['email', 'phone'].includes(channel)) {
    throw new ApiError(400, 'Verification channel must be email or phone');
  }

  const user = await User.findById(req.user._id).lean({ virtuals: true });
  if (!user) {
    throw new ApiError(404, 'User profile not found');
  }

  const identifier = channel === 'email' ? user.email : normalizePhone(user.phone || '');
  if (!identifier) {
    throw new ApiError(400, `No ${channel} is available for verification`);
  }

  const alreadyVerified =
    channel === 'email' ? user.verification?.emailVerified : user.verification?.phoneVerified;

  if (alreadyVerified) {
    throw new ApiError(400, `${channel === 'email' ? 'Email' : 'Phone number'} is already verified`);
  }

  const otp = await createOtp({
    identifier,
    channel,
    purpose: channel === 'email' ? 'email_verification' : 'phone_verification',
  });

  res.status(200).json({
    success: true,
    message: `Verification OTP sent to your ${channel}.`,
    ...(process.env.NODE_ENV !== 'production' ? { devOtp: otp.code } : {}),
  });
});

export const confirmContactVerification = asyncHandler(async (req, res) => {
  const { channel, otp } = req.body ?? {};
  if (!['email', 'phone'].includes(channel)) {
    throw new ApiError(400, 'Verification channel must be email or phone');
  }
  if (!otp || String(otp).trim().length !== 6) {
    throw new ApiError(400, 'A valid 6-digit OTP is required');
  }

  const user = await User.findById(req.user._id);
  if (!user) {
    throw new ApiError(404, 'User profile not found');
  }

  const identifier = channel === 'email' ? user.email : normalizePhone(user.phone || '');
  if (!identifier) {
    throw new ApiError(400, `No ${channel} is available for verification`);
  }

  await verifyOtp({
    identifier,
    purpose: channel === 'email' ? 'email_verification' : 'phone_verification',
    otp,
  });

  if (channel === 'email') {
    user.verification = {
      ...(user.verification?.toObject?.() || user.verification || {}),
      emailVerified: true,
      emailVerifiedAt: new Date(),
    };
  } else {
    user.verification = {
      ...(user.verification?.toObject?.() || user.verification || {}),
      phoneVerified: true,
      phoneVerifiedAt: new Date(),
    };
  }

  await user.save();

  res.status(200).json({
    success: true,
    message: `${channel === 'email' ? 'Email' : 'Phone number'} verified successfully.`,
    verification: {
      emailVerified: user.verification?.emailVerified ?? false,
      phoneVerified: user.verification?.phoneVerified ?? false,
    },
  });
});

export const uploadCoverPhoto = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(400, 'No cover photo file provided');
  }

  const user = await User.findById(req.user._id);
  if (!user) {
    throw new ApiError(404, 'User profile not found');
  }

  const coverPhotoUrl = fileToDataUri(req.file);
  user.personalInfo = user.personalInfo || {};
  user.personalInfo.coverPhoto = coverPhotoUrl;
  await user.save({ validateModifiedOnly: true });

  res.status(200).json({
    success: true,
    coverPhoto: user.personalInfo?.coverPhoto || coverPhotoUrl,
    message: 'Cover photo uploaded successfully',
  });
});

export const removeCoverPhoto = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) {
    throw new ApiError(404, 'User profile not found');
  }

  user.set('personalInfo.coverPhoto', undefined);
  await user.save({ validateModifiedOnly: true });

  res.status(200).json({
    success: true,
    coverPhoto: null,
    message: 'Cover photo removed successfully',
  });
});

export const uploadProfilePhoto = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(400, 'No profile photo file provided');
  }

  const existingUser = await User.findById(req.user._id).lean({ virtuals: true });
  if (!existingUser) {
    throw new ApiError(404, 'User profile not found');
  }

  const profilePhotoUrl = fileToDataUri(req.file);
  const remainingPhotos = (existingUser.personalInfo?.photos || [])
    .filter((photo) => photo?.url && !photo.isMain)
    .slice(0, 5);

  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        'personalInfo.profilePic': profilePhotoUrl,
        'personalInfo.photos': [{ url: profilePhotoUrl, isMain: true }, ...remainingPhotos],
      },
    },
    { new: true, runValidators: true }
  ).lean({ virtuals: true });

  res.status(200).json({
    success: true,
    profilePic: user?.profilePic || profilePhotoUrl,
    message: 'Profile photo uploaded successfully',
  });
});

export const removeProfilePhoto = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) {
    throw new ApiError(404, 'User profile not found');
  }

  const remainingPhotos = (user.personalInfo?.photos || []).filter((photo) => photo?.url && !photo.isMain);
  const nextMainPhoto = remainingPhotos[0] || null;
  const normalizedPhotos = nextMainPhoto
    ? [
        { url: nextMainPhoto.url, isMain: true },
        ...remainingPhotos.slice(1).map((photo) => ({ url: photo.url, isMain: false })),
      ]
    : [];

  user.set('personalInfo.profilePic', nextMainPhoto?.url || undefined);
  user.set('personalInfo.photos', normalizedPhotos);
  await user.save({ validateModifiedOnly: true });

  res.status(200).json({
    success: true,
    profilePic: nextMainPhoto?.url || null,
    photos: normalizedPhotos,
    message: 'Profile photo removed successfully',
  });
});

export const uploadGalleryPhoto = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(400, 'No gallery photo file provided');
  }

  const user = await User.findById(req.user._id);
  if (!user) {
    throw new ApiError(404, 'User profile not found');
  }

  const photoUrl = fileToDataUri(req.file);
  const photos = (user.personalInfo?.photos || []).filter((photo) => photo?.url);

  const hasMain = photos.some((photo) => photo.isMain);
  const normalizedPhotos = [
    ...photos,
    { url: photoUrl, isMain: !hasMain },
  ].slice(0, 6);

  const mainPhoto = normalizedPhotos.find((photo) => photo.isMain) || normalizedPhotos[0] || null;
  const finalPhotos = normalizedPhotos.map((photo, index) => ({
    url: photo.url,
    isMain: index === 0 ? photo.url === mainPhoto?.url : photo.isMain,
  }));

  user.set('personalInfo.photos', finalPhotos);
  user.set('personalInfo.profilePic', mainPhoto?.url || undefined);
  await user.save({ validateModifiedOnly: true });

  const updated = await User.findById(req.user._id).lean({ virtuals: true });

  res.status(200).json({
    success: true,
    ...(mapProfile(updated) || {}),
    message: 'Gallery photo uploaded successfully',
  });
});

export const removeGalleryPhoto = asyncHandler(async (req, res) => {
  const photoId = Number(req.params.photoId);
  if (!Number.isInteger(photoId) || photoId < 1) {
    throw new ApiError(400, 'Invalid photo id');
  }

  const user = await User.findById(req.user._id);
  if (!user) {
    throw new ApiError(404, 'User profile not found');
  }

  const photos = (user.personalInfo?.photos || []).filter((photo) => photo?.url);
  if (!photos.length || photoId > photos.length) {
    throw new ApiError(404, 'Photo not found');
  }

  const targetPhoto = photos[photoId - 1];
  const remaining = photos.filter((_photo, index) => index !== photoId - 1);
  let normalizedPhotos = remaining;

  if (targetPhoto?.isMain && remaining.length) {
    normalizedPhotos = [
      { url: remaining[0].url, isMain: true },
      ...remaining.slice(1).map((photo) => ({ url: photo.url, isMain: false })),
    ];
  }

  user.set('personalInfo.photos', normalizedPhotos);
  user.set('personalInfo.profilePic', normalizedPhotos.find((photo) => photo.isMain)?.url || undefined);
  await user.save({ validateModifiedOnly: true });

  const updated = await User.findById(req.user._id).lean({ virtuals: true });

  res.status(200).json({
    success: true,
    ...(mapProfile(updated) || {}),
    message: 'Gallery photo removed successfully',
  });
});

export const deleteAccount = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const user = await User.findById(userId).lean({ virtuals: true });

  if (!user) {
    throw new ApiError(404, 'User profile not found');
  }

  const userIdString = String(userId);
  const participantConversations = await Conversation.find({ participants: userId }).select('_id').lean();
  const conversationIds = participantConversations.map((conversation) => conversation._id);

  // Remove user-owned/linked records from all first-party collections.
  await Promise.all([
    conversationIds.length
      ? Message.deleteMany({ conversationId: { $in: conversationIds } })
      : Promise.resolve(),
    Message.deleteMany({ $or: [{ senderId: userId }, { receiverId: userId }] }),
    Conversation.deleteMany({ participants: userId }),
    Match.deleteMany({ $or: [{ userAId: userId }, { userBId: userId }] }),
    MatchInterest.deleteMany({ $or: [{ fromUser: userId }, { toUser: userId }] }),
    Horoscope.deleteMany({ userId }),
    WeddingProject.updateMany({ coupleUserIds: userId }, { $pull: { coupleUserIds: userId } }),
    WeddingProject.deleteMany({ coupleUserIds: { $size: 0 } }),
    Vendor.deleteMany({ userId }),
    AuthOtp.deleteMany({
      $or: [{ identifier: user.email }, { identifier: normalizePhone(user.phone || '') }, { identifier: userIdString }],
    }),
  ]);

  // Finally delete the account record itself.
  await User.findByIdAndDelete(userId);

  res.status(200).json({
    success: true,
    message: 'Account deleted successfully',
  });
});

export const exportUserData = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const user = await User.findById(userId).lean({ virtuals: true });
  if (!user) {
    throw new ApiError(404, 'User profile not found');
  }

  const conversations = await Conversation.find({ participants: userId }).lean();
  const conversationIds = conversations.map((conversation) => conversation._id);

  const [messages, matches, matchInterests, horoscope, vendor, weddingProjects] = await Promise.all([
    conversationIds.length ? Message.find({ conversationId: { $in: conversationIds } }).lean() : [],
    Match.find({ $or: [{ userAId: userId }, { userBId: userId }] }).lean(),
    MatchInterest.find({ $or: [{ fromUser: userId }, { toUser: userId }] }).lean(),
    Horoscope.findOne({ userId }).lean(),
    Vendor.findOne({ userId }).lean(),
    WeddingProject.find({ coupleUserIds: userId }).lean(),
  ]);

  res.status(200).json({
    success: true,
    exportedAt: new Date().toISOString(),
    data: {
      user,
      conversations,
      messages,
      matches,
      matchInterests,
      horoscope,
      vendor,
      weddingProjects,
    },
  });
});

export default {
  getProfile,
  updateProfile,
  uploadCoverPhoto,
  removeCoverPhoto,
  uploadProfilePhoto,
  removeProfilePhoto,
  uploadGalleryPhoto,
  removeGalleryPhoto,
  requestContactVerification,
  confirmContactVerification,
  exportUserData,
  deleteAccount,
};
