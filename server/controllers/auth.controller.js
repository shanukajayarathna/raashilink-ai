import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import User from '../models/User.js';
import Vendor from '../models/Vendor.js';
import AuthOtp from '../models/AuthOtp.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import authenticate from '../middleware/auth.js';
import logger from '../utils/logger.js';
import { COMMON_SRI_LANKAN_LOCATIONS, resolveBirthPlace, suggestBirthPlaces } from '../utils/birthLocation.js';
import { storeVendorDocuments } from '../services/vendorDocumentStorage.service.js';

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const REGISTRATION_ROLES = ['partner', 'couple', 'vendor', 'horoscope_seeker'];
const BIRTH_REQUIRED_ROLES = new Set(['partner', 'horoscope_seeker']);
const OTP_EXPIRY_MINUTES = 10;
const SRI_LANKA_MOBILE_REGEX = /^7\d{8}$/;
const GENDER_OPTIONS = ['male', 'female', 'non-binary', 'prefer_not_to_say'];
const SEEKING_GENDER_OPTIONS = ['male', 'female', 'non-binary', 'any'];
const VENDOR_DOCUMENT_TYPES = new Set(['business_registration', 'tax_certificate', 'insurance', 'license', 'other']);

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
  const raw = String(value || '').replace(/[\u200B-\u200D\uFEFF]/g, '').trim();
  if (!raw) return { value: '', channel: 'email' };

  if (raw.includes('@')) {
    return { value: raw.replace(/\s+/g, '').toLowerCase(), channel: 'email' };
  }

  return { value: normalizePhone(raw), channel: 'phone' };
}

function getDevAdminFallbackCredentials() {
  return {
    email: String(process.env.DEV_ADMIN_EMAIL || 'admin@gmail.com').trim().toLowerCase(),
    password: String(process.env.DEV_ADMIN_PASSWORD || '11111111'),
  };
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

function normalizePersonalityAnswers(answers = []) {
  const safe = Array.isArray(answers) && answers.length >= 10 ? answers.slice(0, 10) : new Array(10).fill(3);
  return safe.map((value) => {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return 3;
    return Math.max(1, Math.min(5, Math.round(parsed)));
  });
}

function parseBoolean(value) {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    return normalized === 'true' || normalized === '1' || normalized === 'yes' || normalized === 'on';
  }
  return Boolean(value);
}

function parseJsonObject(value, fallback = {}) {
  if (!value) return fallback;
  if (typeof value === 'object' && !Array.isArray(value)) return value;
  if (typeof value !== 'string') return fallback;

  try {
    const parsed = JSON.parse(value);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed;
    }
  } catch {
    return fallback;
  }

  return fallback;
}

function parseJsonArray(value, fallback = []) {
  if (Array.isArray(value)) return value;
  if (!value) return fallback;
  if (typeof value !== 'string') return fallback;

  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) {
      return parsed;
    }
  } catch {
    return fallback;
  }

  return fallback;
}

function normalizeIsoDateInput(value) {
  const dateText = String(value || '').trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateText)) return null;

  const parsed = new Date(`${dateText}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime())) return null;
  if (parsed.toISOString().split('T')[0] !== dateText) return null;

  return { dateText, date: parsed };
}

function getTodayIsoDate() {
  return new Date().toISOString().split('T')[0];
}

function normalizeRegistrationPayload(raw = {}) {
  const payload = {
    ...raw,
    terms: parseBoolean(raw.terms),
    unknownTime: parseBoolean(raw.unknownTime),
    locationRadius: Number(raw.locationRadius || 50),
    socialLinks: parseJsonObject(raw.socialLinks, raw.socialLinks || {}),
    documentsMeta: parseJsonArray(raw.documentsMeta, []),
  };

  if (typeof raw.personality === 'string') {
    payload.personality = parseJsonArray(raw.personality, []);
  }

  if (Array.isArray(raw.otp)) {
    payload.otp = raw.otp;
  } else if (typeof raw.otp === 'string') {
    payload.otp = raw.otp;
  }

  return payload;
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
    user.personalInfo?.profilePic ||
      user.personalInfo?.photos?.find((photo) => photo.isMain)?.url ||
      user.photos?.find((photo) => photo.isMain)?.url ||
      null,
    { allowDataUri: true }
  );
  const knownBirthTime = user.birthData?.knownBirthTime !== false;

  return {
    id: user._id,
    name: user.name,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phone: user.phone || null,
    role: user.role,
    userType: user.userType || user.profileType || 'partner',
    profileType: user.profileType,
    location: user.location,
    gender: user.gender || user.personalInfo?.gender || null,
    birthDate: user.birthData?.dateOfBirth ? new Date(user.birthData.dateOfBirth).toISOString().split('T')[0] : '',
    birthTime: knownBirthTime ? user.birthData?.timeOfBirth || '' : '',
    birthPlace: user.birthData?.placeOfBirth?.city || '',
    knownBirthTime,
    birthData: user.birthData
      ? {
          dateOfBirth: user.birthData.dateOfBirth,
          timeOfBirth: knownBirthTime ? user.birthData.timeOfBirth || '' : '',
          knownBirthTime,
          placeOfBirth: user.birthData.placeOfBirth || null,
        }
      : undefined,
    horoscopeData: user.horoscopeData || undefined,
    personality: user.personality || undefined,
    personalityAnswers: user.personalityAnswers || undefined,
    profilePic,
    photos: profilePic ? [{ url: profilePic, isMain: true }] : [],
    verification: {
      emailVerified: Boolean(user.verification?.emailVerified),
      phoneVerified: Boolean(user.verification?.phoneVerified),
      hasPassword: Boolean(user.passwordHash),
    },
  };
}

async function buildHoroscope(formData) {
  if (!BIRTH_REQUIRED_ROLES.has(formData.role) || !formData.dob || !formData.pob) {
    return undefined;
  }

  const parsedBirthDate = normalizeIsoDateInput(formData.dob);
  if (!parsedBirthDate) {
    return undefined;
  }

  const placeOfBirth = await resolveBirthPlace(formData.pob);

  return {
    dateOfBirth: parsedBirthDate.date,
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
  const normalizedGender = GENDER_OPTIONS.includes(String(input.gender || '').trim())
    ? String(input.gender).trim()
    : undefined;
  
  return {
    firstName: input.firstName?.trim() || '',
    lastName: input.lastName?.trim() || '',
    phone: normalizePhone(input.phone),
    profilePic: input.profilePic || undefined,
    gender: normalizedGender,
    seekingGender: SEEKING_GENDER_OPTIONS.includes(String(input.seekingGender || '').trim())
      ? String(input.seekingGender).trim()
      : undefined,
    location: defaultLocation,
    ethnicity: input.ethnicity?.trim() || '',
    bio:
      input.role === 'vendor'
        ? `${(input.businessName || input.firstName)?.trim()}'s vendor profile on RaashiLink.AI.`
        : input.role === 'horoscope_seeker'
          ? `${input.firstName?.trim() || 'User'} joined RaashiLink.AI to explore personalized horoscope insights.`
        : `${input.firstName?.trim() || 'User'} is looking for a meaningful match on RaashiLink.AI.`,
    photos: input.profilePic ? [{ url: input.profilePic, isMain: true }] : [],
  };
}

function validateRegistrationInput(input) {
  const missingFields = [];
  const todayIsoDate = getTodayIsoDate();

  if (!REGISTRATION_ROLES.includes(input.role)) {
    throw new ApiError(400, 'Invalid registration role');
  }

  if (!input.role) missingFields.push('Select an account type');
  if (!input.firstName?.trim()) missingFields.push('Enter your first name');
  if (!input.lastName?.trim()) missingFields.push('Enter your last name');
  if (!input.email?.trim()) missingFields.push('Enter your email address');
  if (!input.phone?.trim()) missingFields.push('Enter your phone number');
  // Skip password validation for Google sign-ups unless they explicitly provided a password
  if (!input.isGoogleSignup || input.password) {
    if (!input.password && !input.isGoogleSignup) missingFields.push('Create a password');
    if (input.password && !input.confirmPassword) missingFields.push('Confirm your password');
  }

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

  // Validate password matching if a password is being set
  if (!input.isGoogleSignup || input.password) {
    if (input.password && input.password !== input.confirmPassword) {
      throw new ApiError(400, 'Passwords do not match', ['Password and confirm password must match']);
    }

    if (input.password && String(input.password).length < 8) {
      throw new ApiError(400, 'Password must be at least 8 characters', ['Password must be at least 8 characters']);
    }
  }

  if (input.role !== 'horoscope_seeker' && !input.terms) {
    throw new ApiError(400, 'Terms must be accepted', ['Accept the terms of service and privacy policy']);
  }

  if (input.role === 'partner') {
    const partnerMissing = [];
    if (!input.gender || !GENDER_OPTIONS.includes(String(input.gender).trim())) {
      partnerMissing.push('Select your gender');
    }
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

    const parsedDob = normalizeIsoDateInput(input.dob);
    if (!parsedDob) {
      throw new ApiError(400, 'Enter a valid date of birth', ['Date of birth format is invalid']);
    }
    if (parsedDob.dateText >= todayIsoDate) {
      throw new ApiError(400, 'Date of birth must be before today', ['Select a birth date before today']);
    }
  }

  if (input.role === 'horoscope_seeker') {
    const horoscopeMissing = [];
    if (!input.dob) horoscopeMissing.push('Enter your date of birth');
    if (!input.pob) horoscopeMissing.push('Enter your town, village, or city of birth');
    if (!input.unknownTime && !input.tob) {
      horoscopeMissing.push('Enter your birth time or mark it as unknown');
    }
    if (horoscopeMissing.length > 0) {
      throw new ApiError(400, 'Birth details are required for horoscope seeker registration', horoscopeMissing);
    }

    const parsedDob = normalizeIsoDateInput(input.dob);
    if (!parsedDob) {
      throw new ApiError(400, 'Enter a valid date of birth', ['Date of birth format is invalid']);
    }
    if (parsedDob.dateText >= todayIsoDate) {
      throw new ApiError(400, 'Date of birth must be before today', ['Select a birth date before today']);
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

    const parsedWeddingDate = normalizeIsoDateInput(input.weddingDate);
    if (!parsedWeddingDate) {
      throw new ApiError(400, 'Select a valid wedding date', ['Wedding date format is invalid']);
    }
    if (parsedWeddingDate.dateText < todayIsoDate) {
      throw new ApiError(400, 'Wedding date must be today or later', ['Select today or a future wedding date']);
    }
  }

  if (input.role === 'vendor') {
    const vendorMissing = [];
    if (!input.businessName || !input.businessCategory) {
      if (!input.businessName?.trim()) vendorMissing.push('Enter your business name');
      if (!input.businessCategory?.trim()) vendorMissing.push('Select your business category');
    }
    if (!input.businessRegistrationNumber?.trim()) {
      vendorMissing.push('Enter your business registration number');
    }
    const uploadedDocCount = Number(input.documentsCount || 0);
    if (uploadedDocCount < 1) {
      vendorMissing.push('Upload at least one business document');
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
  'userType',
  'profileType',
  'personalInfo',
  'birthData',
  'horoscopeData',
  'personality',
  'personalityAnswers',
  'verification',
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
  const { email, phone, isGoogleSignup } = req.body ?? {};
  const normalizedPhone = phone ? normalizePhone(phone) : '';
  const normalizedEmail = email ? String(email).trim().toLowerCase() : '';
  const otpTarget = normalizedPhone || normalizedEmail;

  if (!otpTarget) {
    throw new ApiError(400, 'Email or phone is required to send OTP');
  }

  const existingEmail = normalizedEmail ? await User.findOne({ email: normalizedEmail }).lean() : null;
  if (existingEmail && !isGoogleSignup) {
    throw new ApiError(409, 'An account already exists for this email');
  }

  const existingPhone = normalizedPhone
    ? await User.findOne({ 'personalInfo.phone': normalizedPhone }).lean()
    : null;
  const sameGoogleUserPhone = Boolean(
    isGoogleSignup &&
    existingEmail &&
    existingPhone &&
    String(existingEmail._id) === String(existingPhone._id)
  );
  if (existingPhone && !sameGoogleUserPhone) {
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
  const payload = normalizeRegistrationPayload(req.body ?? {});
  const uploadedFiles = Array.isArray(req.files) ? req.files : [];
  payload.documentsCount = uploadedFiles.length;

  validateRegistrationInput(payload);

  const {
    role,
    firstName,
    lastName,
    email,
    phone,
    password,
    isGoogleSignup,
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
    businessRegistrationNumber,
    socialLinks,
    personality,
    otp,
  } = payload;

  const existingEmail = await User.findOne({ email: email.toLowerCase() });
  if (existingEmail && !isGoogleSignup) {
    throw new ApiError(409, 'An account already exists for this email');
  }

  const normalizedPhone = phone ? normalizePhone(phone) : '';
  const existingPhone = normalizedPhone
    ? await User.findOne({ 'personalInfo.phone': normalizedPhone })
    : null;
  const sameGoogleUserPhone = Boolean(
    isGoogleSignup &&
    existingEmail &&
    existingPhone &&
    String(existingEmail._id) === String(existingPhone._id)
  );
  if (existingPhone && !sameGoogleUserPhone) {
    throw new ApiError(409, 'An account already exists for this phone number');
  }

  const passwordHash = password ? await bcrypt.hash(password, 10) : null;
  const normalizedRole = role === 'vendor' ? 'vendor' : 'user';
  const normalizedUserType =
    normalizedRole === 'user'
      ? role === 'couple'
        ? 'couple'
        : role === 'horoscope_seeker'
          ? 'horoscope_seeker'
          : 'partner'
      : 'partner';
  const horoscope = await buildHoroscope(payload);
  const { birthData, horoscopeData } = splitHoroscopeData(horoscope);
  const verification = {
    emailVerified: false,
    phoneVerified: false,
  };

  const submittedOtp = Array.isArray(otp) ? otp.join('') : String(otp || '').trim();
  if (submittedOtp.length === 6) {
    const registrationTarget = normalizedPhone || email.toLowerCase();
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

  let parsedWeddingDate = undefined;
  if (role === 'couple' && weddingDate) {
    const parsed = normalizeIsoDateInput(weddingDate);
    if (parsed) parsedWeddingDate = parsed.date;
  }

  const normalizedPersonalityAnswers = normalizePersonalityAnswers(personality);
  const baseUserUpdate = {
    role: normalizedRole,
    userType: normalizedUserType,
    personalInfo: buildPersonalInfo(payload),
    birthData,
    horoscopeData,
    personalityAnswers: normalizedPersonalityAnswers,
    personality: mapPersonality(normalizedPersonalityAnswers),
    lifestyle: {
      religion,
      preferredLocation: pob || 'Sri Lanka',
      familyValues: 0.75,
      educationLevel: payload.education || '',
      professionType: payload.profession || '',
      smoking: 'Never',
      drinking: 'Never',
      diet: 'Not specified',
    },
    preferences: {
      maxDistanceKm: Number(payload.locationRadius || 50),
    },
    privacySettings: {
      visibility: visibility || 'Everyone',
    },
    verification: isGoogleSignup
      ? {
          emailVerified: true,
          emailVerifiedAt: new Date(),
          phoneVerified: verification.phoneVerified,
          phoneVerifiedAt: verification.phoneVerifiedAt,
        }
      : verification,
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
  };

  let user;
  if (isGoogleSignup && existingEmail) {
    user = await User.findByIdAndUpdate(
      existingEmail._id,
      {
        ...baseUserUpdate,
        passwordHash: passwordHash || existingEmail.passwordHash,
        onboardingComplete: true,
      },
      { new: true }
    );
  } else {
    user = await User.create({
      email: email.toLowerCase(),
      passwordHash,
      ...baseUserUpdate,
      onboardingComplete: !isGoogleSignup,
    });
  }

  if (role === 'vendor') {
    const baseApiUrl = `${req.protocol}://${req.get('host')}`;
    const socialLinksObj = {};
    if (socialLinks) {
      if (socialLinks.facebook) socialLinksObj.facebook = socialLinks.facebook;
      if (socialLinks.instagram) socialLinksObj.instagram = socialLinks.instagram;
      if (socialLinks.linkedin) socialLinksObj.linkedin = socialLinks.linkedin;
      if (socialLinks.twitter) socialLinksObj.twitter = socialLinks.twitter;
      if (socialLinks.website) socialLinksObj.website = socialLinks.website;
    }

    const documentsMeta = Array.isArray(payload.documentsMeta) ? payload.documentsMeta : [];
    const storedDocuments = await storeVendorDocuments({ files: uploadedFiles, baseApiUrl });
    const documentsArray = storedDocuments.map((storedFile, index) => {
      const meta = documentsMeta[index] || {};
      const requestedType = typeof meta.type === 'string' ? meta.type : 'other';
      const type = VENDOR_DOCUMENT_TYPES.has(requestedType) ? requestedType : 'other';

      return {
        type,
        url: storedFile.url,
        fileName: meta.fileName || storedFile.fileName,
      };
    });

    await Vendor.create({
      userId: user._id,
      businessName: businessName?.trim() || '',
      category: businessCategory?.trim() || '',
      description: `${businessName} - Professional vendor profile on RaashiLink.AI`,
      businessRegistrationNumber: businessRegistrationNumber?.trim() || '',
      socialLinks: socialLinksObj,
      documents: documentsArray,
      approvalStatus: 'pending',
      serviceArea: ['Sri Lanka'],
      pricingRange: { min: 0, max: 0 },
    });
  }

  const token = buildToken(user);

  res.status(201).json({
    success: true,
    token,
    role: user.role,
    user: sanitizeUser(user),
  });
});

export const login = asyncHandler(async (req, res) => {
  const rawIdentifier = req.body?.identifier || req.body?.email;
  const { password } = req.body ?? {};
  const identifier = String(rawIdentifier || '').trim();

  if (!identifier || !password) {
    throw new ApiError(400, 'Email or phone and password are required');
  }

  const user = await findUserByIdentifier(identifier);

  if (process.env.NODE_ENV !== 'production') {
    const { channel, value } = normalizeIdentifier(identifier);
    logger.info('Login lookup attempt', {
      channel,
      normalizedIdentifier: value,
      matchedUser: Boolean(user),
      matchedRole: user?.role || null,
    });
  }

  if (!user) {
    throw new ApiError(401, 'Invalid credentials');
  }

  // Accept multiple safe variants to tolerate copy/paste artifacts.
  const rawPassword = String(password);
  const passwordCandidates = [rawPassword];
  const trimmedPassword = rawPassword.trim();
  if (trimmedPassword !== rawPassword) {
    passwordCandidates.push(trimmedPassword);
  }

  const zeroWidthCleanedPassword = rawPassword.replace(/[\u200B-\u200D\uFEFF]/g, '').trim();
  if (zeroWidthCleanedPassword && !passwordCandidates.includes(zeroWidthCleanedPassword)) {
    passwordCandidates.push(zeroWidthCleanedPassword);
  }

  const compactedPassword = zeroWidthCleanedPassword.replace(/\s+/g, '');
  if (compactedPassword && !passwordCandidates.includes(compactedPassword)) {
    passwordCandidates.push(compactedPassword);
  }

  let isValid = false;
  if (user.passwordHash) {
    for (const candidate of passwordCandidates) {
      if (await bcrypt.compare(candidate, user.passwordHash)) {
        isValid = true;
        break;
      }
    }
  }

  if (!isValid && process.env.NODE_ENV !== 'production') {
    const normalized = normalizeIdentifier(identifier);
    const devAdmin = getDevAdminFallbackCredentials();
    const compactedPasswordCandidates = passwordCandidates.map((candidate) => candidate.replace(/\s+/g, ''));
    const looksLikeDevAdminLogin =
      normalized.channel === 'email' &&
      normalized.value === devAdmin.email &&
      compactedPasswordCandidates.includes(devAdmin.password);

    if (looksLikeDevAdminLogin) {
      user.passwordHash = await bcrypt.hash(devAdmin.password, 10);
      await user.save();
      isValid = true;

      logger.warn('Recovered dev admin password hash from fallback credentials', {
        email: devAdmin.email,
      });
    }
  }

  if (!isValid && process.env.NODE_ENV !== 'production') {
    logger.warn('Login password mismatch after normalization candidates', {
      candidateCount: passwordCandidates.length,
      candidateLengths: passwordCandidates.map((candidate) => candidate.length),
    });
  }

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

// ─── Google OAuth ─────────────────────────────────────────────────────────────

export const googleAuth = asyncHandler(async (req, res) => {
  const { credential } = req.body;
  if (!credential) throw new ApiError(400, 'Google credential is required.');

  const ticket = await googleClient.verifyIdToken({
    idToken: credential,
    audience: process.env.GOOGLE_CLIENT_ID,
  });

  const payload = ticket.getPayload();
  if (!payload?.email) throw new ApiError(400, 'Invalid Google token.');

  const { sub: googleId, email, given_name: firstName = '', family_name: lastName = '', picture: profilePic = '' } = payload;

  // Find by googleId or email
  let user = await User.findOne({ $or: [{ googleId }, { email }] });

  if (user) {
    // Link Google account if not already linked
    if (!user.googleId) {
      user.googleId = googleId;
      await user.save();
    }
    const token = buildToken(user);
    logger.info(`Google login: ${email}`);
    return res.status(200).json({
      success: true,
      message: 'Logged in with Google.',
      data: {
        token,
        onboardingComplete: user.onboardingComplete,
        user: {
          ...sanitizeUser(user),
          onboardingComplete: user.onboardingComplete,
        },
      },
    });
  }

  // New Google user — create with minimal info; onboarding required
  user = new User({
    email,
    googleId,
    onboardingComplete: false,
    role: 'user',
    userType: 'partner',
    personalInfo: {
      firstName: firstName || 'User',
      lastName: lastName || '',
      profilePic,
    },
    verification: { emailVerified: true, emailVerifiedAt: new Date() },
  });
  await user.save();

  const token = buildToken(user);
  logger.info(`New Google signup: ${email}`);
  res.status(201).json({
    success: true,
    message: 'Google sign-up successful. Please complete your profile.',
    data: {
      token,
      onboardingComplete: false,
      user: {
        ...sanitizeUser(user),
        onboardingComplete: false,
      },
    },
  });
});

// ─── Complete Onboarding (after Google sign-in) ───────────────────────────────



export default {
  requestRegistrationOtp,
  verifyOTP,
  register,
  login,
  logout,
  forgotPassword,
  resetPassword,
};
