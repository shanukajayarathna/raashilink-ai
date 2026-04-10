import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import AuthOtp from '../models/AuthOtp.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import authenticate from '../middleware/auth.js';
import logger from '../utils/logger.js';
import { COMMON_SRI_LANKAN_LOCATIONS, resolveBirthPlace, suggestBirthPlaces } from '../utils/birthLocation.js';

const REGISTRATION_ROLES = ['partner', 'couple', 'vendor'];
const OTP_EXPIRY_MINUTES = 10;
const SRI_LANKA_MOBILE_REGEX = /^7\d{8}$/;

function buildToken(user) {
  return jwt.sign(
    {
      sub: String(user._id),
      role: user.role,
      email: user.email,
    },
    process.env.JWT_SECRET || 'dev-secret',
    { expiresIn: '7d' }
  );
}

function average(values) {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

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

function normalizeIdentifier(value = '') {
  const trimmed = value.trim();
  if (!trimmed) return { value: '', channel: 'email' };

  if (trimmed.includes('@')) {
    return { value: trimmed.toLowerCase(), channel: 'email' };
  }

  return { value: normalizePhone(trimmed), channel: 'phone' };
}

function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function mapPersonality(answers = []) {
  const safe = Array.isArray(answers) && answers.length >= 10 ? answers : new Array(10).fill(3);
  const normalize = (score) => Number(((score - 1) / 4).toFixed(2));

  return {
    extraversion: normalize(average([safe[0], safe[5]])),
    conscientiousness: normalize(average([safe[1], safe[6]])),
    neuroticism: normalize(average([safe[2], 6 - safe[9]])),
    openness: normalize(average([safe[3], safe[7]])),
    agreeableness: normalize(average([safe[4], safe[8]])),
  };
}

function sanitizeImageReference(value, { allowDataUri = false } = {}) {
  if (!value) return null;

  const normalized = String(value).trim();
  if (!normalized) return null;

  if (!allowDataUri && /^data:image\//i.test(normalized)) {
    return null;
  }

  return normalized;
}

function sanitizeUser(user) {
  const profilePic = sanitizeImageReference(
    user.personalInfo?.profilePic || user.photos?.find((photo) => photo.isMain)?.url || null
  );

  return {
    id: user._id,
    name: user.name,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phone: user.phone || null,
    role: user.role,
    profileType: user.profileType,
    location: user.location,
    profilePic,
    photos: profilePic ? [{ url: profilePic, isMain: true }] : [],
    verification: {
      emailVerified: Boolean(user.verification?.emailVerified),
      phoneVerified: Boolean(user.verification?.phoneVerified),
    },
  };
}

async function buildHoroscope(formData) {
  if (formData.role !== 'partner' || !formData.dob || !formData.pob) {
    return undefined;
  }

  const placeOfBirth = await resolveBirthPlace(formData.pob);

  return {
    dateOfBirth: new Date(formData.dob),
    timeOfBirth: formData.unknownTime ? '12:00' : formData.tob || '12:00',
    placeOfBirth,
    knownBirthTime: !formData.unknownTime,
  };
}

function splitHoroscopeData(horoscope) {
  if (!horoscope) {
    return { birthData: undefined, horoscopeData: undefined };
  }

  return {
    birthData: {
      dateOfBirth: horoscope.dateOfBirth,
      timeOfBirth: horoscope.timeOfBirth,
      placeOfBirth: horoscope.placeOfBirth,
      knownBirthTime: horoscope.knownBirthTime ?? true,
    },
    horoscopeData: {
      moonSign: horoscope.moonSign,
      rashi: horoscope.rashi,
      nakshatra: horoscope.nakshatra,
      zodiacSign: horoscope.zodiacSign || horoscope.moonSign || horoscope.rashi,
      ascendant: horoscope.ascendant,
      planetaryPositions: horoscope.planetaryPositions || [],
      generatedAt: horoscope.generatedAt,
    },
  };
}

function buildPersonalInfo(input) {
  const defaultLocation = input.pob || 'Sri Lanka';
  
  return {
    firstName: input.firstName?.trim() || '',
    lastName: input.lastName?.trim() || '',
    phone: normalizePhone(input.phone),
    profilePic: input.profilePic || undefined,
    location: defaultLocation,
    ethnicity: input.ethnicity?.trim() || '',
    bio:
      input.role === 'vendor'
        ? `${(input.businessName || input.firstName)?.trim()}'s vendor profile on RaashiLink.AI.`
        : `${input.firstName?.trim() || 'User'} is looking for a meaningful match on RaashiLink.AI.`,
    photos: input.profilePic ? [{ url: input.profilePic, isMain: true }] : [],
  };
}

function validateRegistrationInput(input) {
  const missingFields = [];

  if (!REGISTRATION_ROLES.includes(input.role)) {
    throw new ApiError(400, 'Invalid registration role');
  }

  if (!input.role) missingFields.push('Select an account type');
  if (!input.firstName?.trim()) missingFields.push('Enter your first name');
  if (!input.lastName?.trim()) missingFields.push('Enter your last name');
  if (!input.email?.trim()) missingFields.push('Enter your email address');
  if (!input.phone?.trim()) missingFields.push('Enter your phone number');
  if (!input.password) missingFields.push('Create a password');
  if (!input.confirmPassword) missingFields.push('Confirm your password');

  if (missingFields.length > 0) {
    throw new ApiError(400, 'Registration details are incomplete.', missingFields);
  }

  if (!/^\S+@\S+\.\S+$/.test(input.email)) {
    throw new ApiError(400, 'Enter a valid email address', ['Email address format is invalid']);
  }

  if (!normalizePhone(input.phone)) {
    throw new ApiError(400, 'Enter a valid phone number', [
      'Phone number must be a valid Sri Lankan mobile number in 0771234567 or 771234567 format',
    ]);
  }

  if (input.password !== input.confirmPassword) {
    throw new ApiError(400, 'Passwords do not match', ['Password and confirm password must match']);
  }

  if (String(input.password).length < 8) {
    throw new ApiError(400, 'Password must be at least 8 characters', ['Password must be at least 8 characters']);
  }

  if (!input.terms) {
    throw new ApiError(400, 'Terms must be accepted', ['Accept the terms of service and privacy policy']);
  }

  if (input.role === 'partner') {
    const partnerMissing = [];
    if (!input.dob || !input.pob) {
      if (!input.dob) partnerMissing.push('Enter your date of birth');
      if (!input.pob) partnerMissing.push('Enter your town, village, or city of birth');
    }
    if (!input.unknownTime && !input.tob) {
      partnerMissing.push('Enter your birth time or mark it as unknown');
    }
    if (partnerMissing.length > 0) {
      throw new ApiError(400, 'Birth details are required for partner registration', partnerMissing);
    }
  }

  if (input.role === 'couple') {
    const coupleMissing = [];
    if (!input.partnerName || !input.weddingDate) {
      if (!input.partnerName?.trim()) coupleMissing.push("Enter your partner's name");
      if (!input.weddingDate) coupleMissing.push('Select your planned wedding date');
    }
    if (coupleMissing.length > 0) {
      throw new ApiError(400, 'Wedding details are required for couple registration', coupleMissing);
    }
  }

  if (input.role === 'vendor') {
    const vendorMissing = [];
    if (!input.businessName || !input.businessCategory) {
      if (!input.businessName?.trim()) vendorMissing.push('Enter your business name');
      if (!input.businessCategory?.trim()) vendorMissing.push('Select your business category');
    }
    if (vendorMissing.length > 0) {
      throw new ApiError(400, 'Business details are required for vendor registration', vendorMissing);
    }
  }
}

const AUTH_USER_SELECT = [
  '_id',
  'email',
  'passwordHash',
  'role',
  'personalInfo.firstName',
  'personalInfo.lastName',
  'personalInfo.phone',
  'personalInfo.location',
  'verification.emailVerified',
  'verification.phoneVerified',
].join(' ');

async function findUserByIdentifier(identifier) {
  const normalized = normalizeIdentifier(identifier);
  if (!normalized.value) return null;

  return User.findOne(
    normalized.channel === 'email'
      ? { email: normalized.value }
      : { 'personalInfo.phone': normalized.value }
  ).select(AUTH_USER_SELECT);
}

async function createOtp({ identifier, purpose }) {
  const normalized = normalizeIdentifier(identifier);
  if (!normalized.value) {
    throw new ApiError(400, 'Email or phone is required');
  }

  const code = generateOtp();
  const codeHash = await bcrypt.hash(code, 10);
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  await AuthOtp.findOneAndUpdate(
    { identifier: normalized.value, purpose },
    {
      $set: {
        identifier: normalized.value,
        channel: normalized.channel,
        purpose,
        codeHash,
        expiresAt,
        attempts: 0,
      },
    },
    { upsert: true, new: true }
  );

  logger.info('OTP issued', {
    purpose,
    channel: normalized.channel,
    identifier: normalized.channel === 'email' ? normalized.value : 'masked-phone',
    code,
  });

  return {
    identifier: normalized.value,
    channel: normalized.channel,
    expiresAt,
    code,
  };
}

async function verifyOtpCode({ identifier, purpose, otp, consume = true }) {
  const normalized = normalizeIdentifier(identifier);
  const record = await AuthOtp.findOne({
    identifier: normalized.value,
    purpose,
  });

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

  if (consume) {
    await AuthOtp.deleteOne({ _id: record._id });
  }

  return true;
}

export const checkAvailability = asyncHandler(async (req, res) => {
  let { email, phone } = req.body ?? {};
  
  let emailAvailable = true;
  let phoneAvailable = true;
  let emailError = null;
  let phoneError = null;

  // Normalize and validate incoming values
  if (email != null) {
    email = String(email).toLowerCase().trim();
  }
  if (phone != null) {
    phone = String(phone).trim();
  }

  // Check email availability
  if (email) {
    const existingEmail = await User.findOne({ email }).lean();
    if (existingEmail) {
      emailAvailable = false;
      emailError = 'This email is already registered';
    }
  }

  // Check phone availability
  if (phone) {
    const normalizedPhone = normalizePhone(phone);
    if (normalizedPhone) {
      const existingPhone = await User.findOne({ 'personalInfo.phone': normalizedPhone }).lean();
      if (existingPhone) {
        phoneAvailable = false;
        phoneError = 'This phone number is already registered';
      }
    }
  }

  res.status(200).json({
    success: true,
    data: {
      emailAvailable,
      phoneAvailable,
      emailError,
      phoneError,
    },
  });
});

export const getBirthPlaceSuggestions = asyncHandler(async (req, res) => {
  const query = String(req.query?.query || '').trim();
  const limit = Math.max(1, Math.min(Number(req.query?.limit) || 5, 5));

  const suggestions = query
    ? await suggestBirthPlaces(query, limit)
    : COMMON_SRI_LANKAN_LOCATIONS.slice(0, limit);

  res.status(200).json({
    success: true,
    data: suggestions,
  });
});

export const requestRegistrationOtp = asyncHandler(async (req, res) => {
  const { email, phone } = req.body ?? {};
  const otpTarget = phone?.trim() ? phone : email;

  if (!otpTarget) {
    throw new ApiError(400, 'Email or phone is required to send OTP');
  }

  const existingEmail = email ? await User.findOne({ email: email.toLowerCase() }).lean() : null;
  if (existingEmail) {
    throw new ApiError(409, 'An account already exists for this email');
  }

  const normalizedPhone = phone ? normalizePhone(phone) : '';
  const existingPhone = normalizedPhone
    ? await User.findOne({ 'personalInfo.phone': normalizedPhone }).lean()
    : null;
  if (existingPhone) {
    throw new ApiError(409, 'An account already exists for this phone number');
  }

  const otp = await createOtp({ identifier: otpTarget, purpose: 'registration' });

  res.status(200).json({
    success: true,
    message: `OTP sent to your ${otp.channel}.`,
    ...(process.env.NODE_ENV !== 'production' ? { devOtp: otp.code } : {}),
  });
});

export const verifyOTP = asyncHandler(async (req, res) => {
  const { identifier, otp, purpose = 'registration' } = req.body ?? {};
  await verifyOtpCode({ identifier, purpose, otp, consume: false });

  res.status(200).json({
    success: true,
    message: 'OTP verified successfully.',
  });
});

export const register = asyncHandler(async (req, res) => {
  validateRegistrationInput(req.body ?? {});

  const {
    role,
    firstName,
    lastName,
    email,
    phone,
    password,
    profilePic,
    religion,
    ethnicity,
    pob,
    visibility,
    partnerName,
    weddingDate,
    budget,
    businessName,
    businessCategory,
    portfolioUrl,
    personality,
    otp,
  } = req.body ?? {};

  const existingEmail = await User.findOne({ email: email.toLowerCase() });
  if (existingEmail) {
    throw new ApiError(409, 'An account already exists for this email');
  }

  const normalizedPhone = phone ? normalizePhone(phone) : '';
  const existingPhone = normalizedPhone
    ? await User.findOne({ 'personalInfo.phone': normalizedPhone })
    : null;
  if (existingPhone) {
    throw new ApiError(409, 'An account already exists for this phone number');
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const normalizedRole = role === 'vendor' ? 'vendor' : 'user';
  const horoscope = await buildHoroscope(req.body);
  const { birthData, horoscopeData } = splitHoroscopeData(horoscope);
  const verification = {
    emailVerified: false,
    phoneVerified: false,
  };

  const submittedOtp = Array.isArray(otp) ? otp.join('') : String(otp || '').trim();

  if (submittedOtp.length === 6) {
    const registrationTarget = normalizedPhone || email;
    const registrationChannel = normalizedPhone ? 'phone' : 'email';

    await verifyOtpCode({
      identifier: registrationTarget,
      purpose: 'registration',
      otp: submittedOtp,
    });

    if (registrationChannel === 'phone') {
      verification.phoneVerified = true;
      verification.phoneVerifiedAt = new Date();
    } else {
      verification.emailVerified = true;
      verification.emailVerifiedAt = new Date();
    }
  }

  // Parse and validate weddingDate if provided
  let parsedWeddingDate = undefined;
  if (role === 'couple' && weddingDate) {
    const dateObj = new Date(weddingDate);
    if (!isNaN(dateObj.getTime())) {
      parsedWeddingDate = dateObj;
    }
  }

  const user = await User.create({
    email: email.toLowerCase(),
    passwordHash,
    role: normalizedRole,
    personalInfo: buildPersonalInfo(req.body),
    birthData,
    horoscopeData,
    personality: mapPersonality(personality),
    lifestyle: {
      religion,
      preferredLocation: pob || 'Sri Lanka',
      familyValues: 0.75,
      educationLevel: req.body.education || '',
      professionType: req.body.profession || '',
      smoking: 'Never',
      drinking: 'Never',
      diet: 'Not specified',
    },
    preferences: {
      maxDistanceKm: Number(req.body.locationRadius || 50),
    },
    privacySettings: {
      visibility: visibility || 'Everyone',
    },
    verification,
    weddingProject:
      role === 'couple'
        ? {
            partnerName: partnerName?.trim() || '',
            weddingDate: parsedWeddingDate,
            budget: budget?.trim() || '',
            status: 'planning',
          }
        : undefined,
    vendorProfile:
      role === 'vendor'
        ? {
            businessName: businessName?.trim() || '',
            businessCategory: businessCategory?.trim() || '',
            portfolioUrl: portfolioUrl?.trim() || '',
            verificationStatus: 'pending',
          }
        : undefined,
  });

  const token = buildToken(user);

  res.status(201).json({
    success: true,
    token,
    role: user.role,
    user: sanitizeUser(user),
  });
});

export const login = asyncHandler(async (req, res) => {
  const identifier = req.body?.identifier || req.body?.email;
  const { password } = req.body ?? {};

  if (!identifier || !password) {
    throw new ApiError(400, 'Email or phone and password are required');
  }

  const user = await findUserByIdentifier(identifier);
  if (!user) {
    throw new ApiError(401, 'Invalid credentials');
  }

  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) {
    throw new ApiError(401, 'Invalid credentials');
  }

  const token = buildToken(user);

  res.status(200).json({
    success: true,
    token,
    role: user.role,
    user: sanitizeUser(user),
  });
});

export const logout = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Logged out successfully.',
  });
});

export const refreshToken = [
  authenticate,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id).select(AUTH_USER_SELECT);
    if (!user) {
      throw new ApiError(401, 'Authenticated user not found');
    }

    const token = buildToken(user);
    res.status(200).json({
      success: true,
      token,
      role: user.role,
      user: sanitizeUser(user),
    });
  }),
];

export const forgotPassword = asyncHandler(async (req, res) => {
  const identifier = req.body?.identifier || req.body?.email;
  if (!identifier) {
    throw new ApiError(400, 'Email or phone is required');
  }

  const user = await findUserByIdentifier(identifier);
  if (!user) {
    throw new ApiError(404, 'No account found for that email or phone number');
  }

  const otp = await createOtp({ identifier, purpose: 'password_reset' });

  res.status(200).json({
    success: true,
    message: `Password reset OTP sent to your ${otp.channel}.`,
    ...(process.env.NODE_ENV !== 'production' ? { devOtp: otp.code } : {}),
  });
});

export const resetPassword = asyncHandler(async (req, res) => {
  const { identifier, otp, password, confirmPassword } = req.body ?? {};

  if (!identifier || !otp || !password) {
    throw new ApiError(400, 'Identifier, OTP, and new password are required');
  }

  if (password !== confirmPassword) {
    throw new ApiError(400, 'Passwords do not match');
  }

  const user = await findUserByIdentifier(identifier);
  if (!user) {
    throw new ApiError(404, 'No account found for that email or phone number');
  }

  await verifyOtpCode({ identifier, purpose: 'password_reset', otp });

  user.passwordHash = await bcrypt.hash(password, 10);
  await user.save();

  res.status(200).json({
    success: true,
    message: 'Password reset successfully.',
  });
});

export default {
  requestRegistrationOtp,
  verifyOTP,
  register,
  login,
  logout,
  forgotPassword,
  resetPassword,
};
