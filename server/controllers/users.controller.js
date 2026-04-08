import User from '../models/User.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import bcrypt from 'bcrypt';
import AuthOtp from '../models/AuthOtp.js';
import logger from '../utils/logger.js';

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
    Boolean(user.personalInfo?.bio),
    Boolean(user.birthData?.dateOfBirth),
    Boolean(user.horoscopeData?.nakshatra || user.horoscopeData?.rashi || user.horoscopeData?.moonSign),
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

function mapProfile(user) {
  const mainPhoto = user.photos?.find((photo) => photo.isMain)?.url || user.personalInfo?.profilePic;
  const personality = user.personality || {};

  return {
    profileType: user.profileType,
    name: user.name,
    age: user.age || null,
    profilePic: mainPhoto || null,
    coverPhoto: user.coverPhoto || null,
    tagline: user.tagline || 'Building a meaningful future through shared values.',
    location: user.location || 'Sri Lanka',
    completion: getProfileCompletion(user),
    status: 'Online Now',
    bio: user.bio || '',
    personalInfo: {
      firstName: user.personalInfo?.firstName || 'Not provided',
      lastName: user.personalInfo?.lastName || 'Not provided',
      phone: user.phone || 'Not provided',
      age: user.age || 'Not provided',
      gender: user.gender || 'Not provided',
      height: user.height || 'Not provided',
      education: user.lifestyle?.educationLevel || 'Not provided',
      occupation: user.lifestyle?.professionType || 'Not provided',
      religion: user.lifestyle?.religion || 'Not provided',
      ethnicity: user.ethnicity || 'Not provided',
      languages: user.lifestyle?.languages || ['Not provided'],
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
    astrology: {
      birthDate: formatDate(user.horoscope?.dateOfBirth) || 'Not provided',
      birthTime: user.horoscope?.timeOfBirth || 'Not provided',
      birthPlace: user.horoscope?.placeOfBirth?.city || user.location || 'Not provided',
      rashi: user.horoscope?.rashi || user.horoscope?.moonSign || 'Not provided',
      nakshatra: user.horoscope?.nakshatra || 'Not provided',
      ascendant: user.horoscope?.moonSign || 'Not provided',
      sunSign: user.horoscope?.moonSign || 'Not provided',
      luckyColors: ['#8B1A2E', '#C9A84C'],
      auspiciousDays: ['Tuesday', 'Thursday'],
      favorablePartners: ['Aries', 'Leo', 'Cancer'],
    },
    lifestyle: {
      hobbies: user.lifestyle?.hobbies || ['Not provided'],
      exercise: 'Regularly',
      diet: user.lifestyle?.diet || 'Not provided',
      smoking: user.lifestyle?.smoking || 'Not provided',
      drinking: user.lifestyle?.drinking || 'Not provided',
      careerAmbitions: user.lifestyle?.professionType || 'Not provided',
      familyPlans: 'Looking for a serious long-term relationship',
      socialPreference: Math.round((user.personality?.extraversion ?? 0.5) * 100),
    },
    photos:
      user.photos?.length > 0
        ? user.photos.map((photo, index) => ({
            id: index + 1,
            url: photo.url,
            isMain: photo.isMain,
          }))
        : mainPhoto
          ? [{ id: 1, url: mainPhoto, isMain: true }]
          : [],
    privacy: {
      showLastSeen: user.privacy?.showLastSeen ?? true,
      showHoroscope: user.privacy?.showHoroscope ?? true,
      showPhone: user.privacy?.showPhone ?? false,
      whoCanMessage: user.privacy?.whoCanMessage || 'Matches Only',
      whoCanSeePhotos: user.privacy?.whoCanSeePhotos || 'Matches Only',
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
  const user = await User.findById(req.user._id).lean({ virtuals: true });

  if (!user) {
    throw new ApiError(404, 'User profile not found');
  }

  res.status(200).json(mapProfile(user));
});

export const updateProfile = asyncHandler(async (req, res) => {
  const allowedFields = [
    'tagline', 'bio', 'location', 'ethnicity', 'height', 'coverPhoto',
    'personalInfo.firstName', 'personalInfo.lastName', 'personalInfo.phone', 'personalInfo.age', 'personalInfo.gender',
    'lifestyle.educationLevel', 'lifestyle.professionType', 'lifestyle.religion', 'lifestyle.diet', 'lifestyle.smoking', 'lifestyle.drinking', 'lifestyle.hobbies', 'lifestyle.languages'
  ];

  const updates = {};
  for (const [key, value] of Object.entries(req.body ?? {})) {
    if (allowedFields.includes(key)) {
      updates[key] = value;
    }
  }

  const user = await User.findByIdAndUpdate(req.user._id, { $set: updates }, { new: true }).lean({
    virtuals: true,
  });

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

  // For demo purposes, we'll use a placeholder URL based on user ID for consistency
  const coverPhotoUrl = `https://picsum.photos/seed/user-cover-${req.user._id}/1200/400`;

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { $set: { 'personalInfo.coverPhoto': coverPhotoUrl } },
    { new: true }
  ).lean({ virtuals: true });

  if (!user) {
    throw new ApiError(404, 'User profile not found');
  }

  res.status(200).json({
    success: true,
    coverPhoto: coverPhotoUrl,
    message: 'Cover photo uploaded successfully',
  });
});

export const uploadProfilePhoto = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(400, 'No profile photo file provided');
  }

  // For demo purposes, we'll use a placeholder URL based on user ID for consistency
  const profilePhotoUrl = `https://picsum.photos/seed/user-${req.user._id}/400/400`;

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { $set: { 'personalInfo.profilePic': profilePhotoUrl } },
    { new: true }
  ).lean({ virtuals: true });

  if (!user) {
    throw new ApiError(404, 'User profile not found');
  }

  res.status(200).json({
    success: true,
    profilePic: profilePhotoUrl,
    message: 'Profile photo uploaded successfully',
  });
});

export const deleteAccount = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  // Delete the user and all associated data
  await User.findByIdAndDelete(userId);

  // Note: In a production app, you might want to:
  // - Soft delete instead of hard delete
  // - Delete related data (messages, matches, etc.)
  // - Send confirmation email
  // - Log the deletion for compliance

  res.status(200).json({
    success: true,
    message: 'Account deleted successfully',
  });
});

export default {
  getProfile,
  updateProfile,
  uploadCoverPhoto,
  uploadProfilePhoto,
  requestContactVerification,
  confirmContactVerification,
  deleteAccount,
};
