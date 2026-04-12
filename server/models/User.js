import mongoose from 'mongoose';

const { Schema } = mongoose;
const SRI_LANKA_PHONE_REGEX = /^\+947\d{8}$/;

const urlValidator = {
  validator: (value) => !value || /^https?:\/\/.+/i.test(value) || /^data:image\/[a-zA-Z+.-]+;base64,/i.test(value),
  message: 'Must be a valid URL or image data URI',
};

const photoSchema = new Schema(
  {
    url: { type: String, required: true, trim: true, validate: urlValidator },
    isMain: { type: Boolean, default: false },
  },
  { _id: false }
);

const personalInfoSchema = new Schema(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 50,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 50,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
      match: [SRI_LANKA_PHONE_REGEX, 'Phone number must be a valid Sri Lankan mobile number'],
    },
    age: { type: Number, min: 18, max: 90 },
    gender: {
      type: String,
      enum: ['male', 'female', 'non-binary', 'prefer_not_to_say'],
    },
    profilePic: { type: String, trim: true, validate: urlValidator },
    coverPhoto: { type: String, trim: true, validate: urlValidator },
    bio: { type: String, trim: true, maxlength: 2000 },
    tagline: { type: String, trim: true, maxlength: 160 },
    location: { type: String, trim: true, maxlength: 120 },
    ethnicity: { type: String, trim: true, maxlength: 80 },
    height: { type: String, trim: true, maxlength: 20 },
    maritalStatus: {
      type: String,
      enum: ['single', 'engaged', 'married', 'divorced', 'widowed'],
      default: 'single',
    },
    photos: { type: [photoSchema], default: [] },
  },
  { _id: false }
);

const birthPlaceSchema = new Schema(
  {
    city: { type: String, required: true, trim: true, maxlength: 120 },
    country: { type: String, required: true, trim: true, maxlength: 120, default: 'Sri Lanka' },
    latitude: { type: Number, min: -90, max: 90, required: true },
    longitude: { type: Number, min: -180, max: 180, required: true },
    timezone: { type: String, trim: true, default: 'Asia/Colombo' },
  },
  { _id: false }
);

const birthDataSchema = new Schema(
  {
    dateOfBirth: { type: Date, required: true },
    timeOfBirth: {
      type: String,
      required: true,
      match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'Time of birth must be HH:mm format'],
    },
    placeOfBirth: { type: birthPlaceSchema, required: true },
    knownBirthTime: { type: Boolean, default: true },
  },
  { _id: false }
);

const planetaryPositionSchema = new Schema(
  {
    planet: {
      type: String,
      required: true,
      enum: ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu'],
    },
    sign: { type: String, required: true, trim: true, maxlength: 30 },
    house: { type: Number, required: true, min: 1, max: 12 },
    degree: { type: Number, required: true, min: 0, max: 360 },
  },
  { _id: false }
);

const horoscopeDataSchema = new Schema(
  {
    zodiacSign: { type: String, trim: true, maxlength: 30 },
    moonSign: { type: String, trim: true, maxlength: 30 },
    rashi: { type: String, trim: true, maxlength: 30 },
    nakshatra: { type: String, trim: true, maxlength: 30 },
    nakshatraPada: { type: Number, min: 1, max: 4 },
    ascendant: { type: String, trim: true, maxlength: 30 },
    ascendantDegree: { type: Number, min: 0, max: 360 },
    tithi: { type: String, trim: true, maxlength: 40 },
    paksha: { type: String, trim: true, maxlength: 40 },
    yoga: { type: String, trim: true, maxlength: 40 },
    karana: { type: String, trim: true, maxlength: 40 },
    vedicDay: { type: String, trim: true, maxlength: 20 },
    ayanamsa: { type: String, trim: true, maxlength: 40, default: 'Lahiri' },
    timezone: { type: String, trim: true, default: 'Asia/Colombo' },
    calculationVersion: { type: Number, default: 3 },
    gunaScore: { type: Number, min: 0, max: 36, default: 0 },
    planetaryPositions: { type: [planetaryPositionSchema], default: [] },
    luckyColors: { type: [String], default: [] },
    auspiciousDays: { type: [String], default: [] },
    favorablePartners: { type: [String], default: [] },
    profileFacts: { type: [String], default: [] },
    generatedAt: { type: Date },
  },
  { _id: false }
);

const bigFiveSchema = new Schema(
  {
    openness: { type: Number, min: 0, max: 1, default: 0.5 },
    conscientiousness: { type: Number, min: 0, max: 1, default: 0.5 },
    extraversion: { type: Number, min: 0, max: 1, default: 0.5 },
    agreeableness: { type: Number, min: 0, max: 1, default: 0.5 },
    neuroticism: { type: Number, min: 0, max: 1, default: 0.5 },
  },
  { _id: false }
);

const lifestyleSchema = new Schema(
  {
    religion: { type: String, trim: true, maxlength: 80 },
    diet: { type: String, trim: true, maxlength: 60 },
    exercise: { type: String, trim: true, maxlength: 60 },
    smoking: { type: String, trim: true, maxlength: 60 },
    drinking: { type: String, trim: true, maxlength: 60 },
    careerAmbitions: { type: String, trim: true, maxlength: 500 },
    familyPlans: { type: String, trim: true, maxlength: 500 },
    socialPreference: { type: Number, min: 0, max: 100 },
    preferredLocation: { type: String, trim: true, maxlength: 120 },
    familyValues: { type: Number, min: 0, max: 1, default: 0.5 },
    educationLevel: { type: String, trim: true, maxlength: 120 },
    professionType: { type: String, trim: true, maxlength: 120 },
    languages: { type: [String], default: [] },
    hobbies: { type: [String], default: [] },
  },
  { _id: false }
);

const preferencesSchema = new Schema(
  {
    ageRange: {
      min: { type: Number, min: 18, max: 90, default: 21 },
      max: { type: Number, min: 18, max: 90, default: 40 },
    },
    preferredReligions: { type: [String], default: [] },
    preferredLocations: { type: [String], default: [] },
    maxDistanceKm: { type: Number, min: 0, max: 1000, default: 50 },
    acceptableZodiacSigns: { type: [String], default: [] },
  },
  { _id: false }
);

const privacySettingsSchema = new Schema(
  {
    visibility: { type: String, enum: ['Everyone', 'Matches Only', 'Private'], default: 'Everyone' },
    showLastSeen: { type: Boolean, default: true },
    showHoroscope: { type: Boolean, default: true },
    showPhone: { type: Boolean, default: false },
    whoCanMessage: { type: String, enum: ['Everyone', 'Matches Only', 'No One'], default: 'Matches Only' },
    whoCanSeePhotos: {
      type: String,
      enum: ['Everyone', 'Matches Only', 'Profile Viewers'],
      default: 'Matches Only',
    },
  },
  { _id: false }
);

const verificationSchema = new Schema(
  {
    emailVerified: { type: Boolean, default: false },
    phoneVerified: { type: Boolean, default: false },
    emailVerifiedAt: { type: Date },
    phoneVerifiedAt: { type: Date },
  },
  { _id: false }
);

const vendorProfileSchema = new Schema(
  {
    businessName: { type: String, trim: true, maxlength: 160 },
    businessCategory: { type: String, trim: true, maxlength: 120 },
    portfolioUrl: { type: String, trim: true, validate: urlValidator },
    verificationStatus: { type: String, enum: ['pending', 'verified', 'rejected'], default: 'pending' },
    packageSummary: { type: [String], default: [] },
    availabilityCalendar: { type: [String], default: [] },
    rating: { type: Number, min: 0, max: 5, default: 0 },
    reviewsCount: { type: Number, min: 0, default: 0 },
  },
  { _id: false }
);

const weddingProjectSnapshotSchema = new Schema(
  {
    partnerName: { type: String, trim: true, maxlength: 120 },
    weddingDate: { type: Date },
    budget: { type: String, trim: true, maxlength: 60 },
    status: { type: String, enum: ['planning', 'booked', 'completed', 'cancelled'], default: 'planning' },
  },
  { _id: false }
);

const userSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Email format is invalid'],
      index: true,
    },
    passwordHash: { type: String, required: true, minlength: 6 },
    role: { type: String, enum: ['user', 'vendor', 'admin'], default: 'user', index: true },
    personalInfo: { type: personalInfoSchema, required: true },
    birthData: { type: birthDataSchema },
    horoscopeData: { type: horoscopeDataSchema, default: () => ({}) },
    personality: { type: bigFiveSchema, default: () => ({}) },
    personalityAnswers: {
      type: [Number],
      default: () => new Array(10).fill(3),
      validate: {
        validator: (value) =>
          Array.isArray(value) &&
          value.length === 10 &&
          value.every((item) => Number.isInteger(item) && item >= 1 && item <= 5),
        message: 'Personality answers must include exactly 10 values between 1 and 5',
      },
    },
    lifestyle: { type: lifestyleSchema, default: () => ({}) },
    preferences: { type: preferencesSchema, default: () => ({}) },
    privacySettings: { type: privacySettingsSchema, default: () => ({}) },
    verification: { type: verificationSchema, default: () => ({}) },
    vendorProfile: { type: vendorProfileSchema, default: () => ({}) },
    weddingProject: { type: weddingProjectSnapshotSchema, default: () => ({}) },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

userSchema.index({ role: 1, 'personalInfo.location': 1 });
userSchema.index({ role: 1, 'personalInfo.gender': 1, 'personalInfo.location': 1 });
userSchema.index({ 'preferences.ageRange.min': 1, 'preferences.ageRange.max': 1, role: 1 });
userSchema.index({ 'personalInfo.phone': 1 }, { unique: true, sparse: true });

userSchema.virtual('name').get(function getName() {
  return [this.personalInfo?.firstName, this.personalInfo?.lastName].filter(Boolean).join(' ').trim();
});

[
  'firstName',
  'lastName',
  'phone',
  'age',
  'gender',
  'profilePic',
  'coverPhoto',
  'bio',
  'tagline',
  'location',
  'ethnicity',
  'height',
].forEach((field) => {
  userSchema
    .virtual(field)
    .get(function getField() {
      return this.personalInfo?.[field];
    })
    .set(function setField(value) {
      this.personalInfo = this.personalInfo || {};
      this.personalInfo[field] = value;
    });
});

userSchema.virtual('profileType').get(function getProfileType() {
  if (this.role === 'admin') return 'admin';
  if (this.role === 'vendor') return 'vendor';
  return this.weddingProject?.partnerName ? 'couple' : 'partner';
});

userSchema.virtual('horoscope')
  .get(function getHoroscope() {
    if (!this.birthData) return undefined;
    return {
      dateOfBirth: this.birthData.dateOfBirth,
      timeOfBirth: this.birthData.timeOfBirth,
      placeOfBirth: this.birthData.placeOfBirth,
      nakshatra: this.horoscopeData?.nakshatra,
      rashi: this.horoscopeData?.rashi,
      moonSign: this.horoscopeData?.moonSign,
    };
  })
  .set(function setHoroscope(value) {
    if (!value) {
      this.birthData = undefined;
      this.horoscopeData = undefined;
      return;
    }

    this.birthData = {
      dateOfBirth: value.dateOfBirth,
      timeOfBirth: value.timeOfBirth,
      placeOfBirth: value.placeOfBirth,
      knownBirthTime: value.knownBirthTime ?? true,
    };

    this.horoscopeData = {
      ...(this.horoscopeData?.toObject?.() || this.horoscopeData || {}),
      nakshatra: value.nakshatra,
      rashi: value.rashi,
      moonSign: value.moonSign,
    };
  });

userSchema.virtual('privacy')
  .get(function getPrivacy() {
    return this.privacySettings;
  })
  .set(function setPrivacy(value) {
    this.privacySettings = value;
  });

userSchema.virtual('photos')
  .get(function getPhotos() {
    return this.personalInfo?.photos || [];
  })
  .set(function setPhotos(value) {
    this.personalInfo = this.personalInfo || {};
    this.personalInfo.photos = value;
  });

userSchema.set('toJSON', { virtuals: true });
userSchema.set('toObject', { virtuals: true });

const User = mongoose.models.User || mongoose.model('User', userSchema);

export default User;
