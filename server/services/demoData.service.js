import bcrypt from 'bcrypt';
import User from '../models/User.js';
import Vendor from '../models/Vendor.js';
import HoneymoonDestination from '../models/HoneymoonDestination.js';
import Horoscope from '../models/Horoscope.js';
import logger from '../utils/logger.js';

const CITY_COORDS = {
  Colombo: { latitude: 6.9271, longitude: 79.8612 },
  Kandy: { latitude: 7.2906, longitude: 80.6337 },
  Galle: { latitude: 6.0535, longitude: 80.221 },
  Jaffna: { latitude: 9.6615, longitude: 80.0255 },
  Negombo: { latitude: 7.2084, longitude: 79.8358 },
  Kurunegala: { latitude: 7.4863, longitude: 80.3647 },
  Gampaha: { latitude: 7.0907, longitude: 79.9997 },
  Matara: { latitude: 5.9549, longitude: 80.5550 },
};

function horoscope(city, dateOfBirth, timeOfBirth, overrides = {}) {
  const coords = CITY_COORDS[city] || CITY_COORDS.Colombo;
  return {
    dateOfBirth,
    timeOfBirth,
    placeOfBirth: {
      ...coords,
      timezone: 'Asia/Colombo',
      city,
      country: 'Sri Lanka',
    },
    ...overrides,
  };
}

function mapHoroscopeFields(horoscopeValue) {
  if (!horoscopeValue) {
    return {};
  }

  return {
    birthData: {
      dateOfBirth: horoscopeValue.dateOfBirth,
      timeOfBirth: horoscopeValue.timeOfBirth,
      placeOfBirth: horoscopeValue.placeOfBirth,
      knownBirthTime: true,
    },
    horoscopeData: {
      zodiacSign: horoscopeValue.moonSign || horoscopeValue.rashi || 'Unknown',
      moonSign: horoscopeValue.moonSign,
      rashi: horoscopeValue.rashi,
      nakshatra: horoscopeValue.nakshatra,
    },
  };
}

const baseUsers = [
  {
    email: 'admin@raashilink.ai',
    password: 'password123',
    role: 'admin',
    personalInfo: {
      firstName: 'Admin',
      lastName: 'User',
      phone: '+94770000001',
      bio: 'Platform administrator for RaashiLink.AI.',
      location: 'Sri Lanka',
    },
  },
  {
    email: 'vendor@raashilink.ai',
    password: 'password123',
    role: 'vendor',
    personalInfo: {
      firstName: 'Vendor',
      lastName: 'Partner',
      phone: '+94770000002',
      location: 'Colombo',
      bio: 'Trusted wedding vendor ready for new bookings.',
    },
    vendorProfile: {
      businessName: 'Golden Lotus Events',
      businessCategory: 'Photography',
      portfolioUrl: 'https://example.com/portfolio',
      verificationStatus: 'verified',
      packageSummary: ['Full-day wedding coverage', 'Pre-shoot package'],
    },
  },
  {
    email: 'shanuka@gmail.com',
    password: '11111111',
    forcePasswordSync: true,
    role: 'user',
    personalInfo: {
      firstName: 'Shanuka',
      lastName: 'Jayasinghe',
      phone: '+94770000003',
      age: 28,
      location: 'Colombo',
      gender: 'male',
      tagline: 'Grounded values, modern mindset.',
      bio: 'Product engineer looking for a serious relationship leading to marriage.',
      ethnicity: 'Sinhalese',
      height: "5'10\"",
      photos: [],
    },
    horoscope: horoscope('Colombo', new Date('1997-11-15'), '08:30', {
      nakshatra: 'Jyeshtha',
      rashi: 'Scorpio',
      moonSign: 'Scorpio',
    }),
    personality: {
      openness: 0.84,
      conscientiousness: 0.79,
      extraversion: 0.65,
      agreeableness: 0.8,
      neuroticism: 0.35,
    },
    lifestyle: {
      religion: 'Buddhist',
      diet: 'Non-veg',
      smoking: 'Never',
      drinking: 'Never',
      preferredLocation: 'Colombo',
      familyValues: 0.9,
      educationLevel: 'BSc Computer Science',
      professionType: 'Product Engineering',
      familyPlans: 'Looking to settle down in the next 2-3 years',
      hobbies: ['Reading', 'Badminton', 'Travel'],
      languages: ['Sinhala', 'English'],
    },
  },
];

function buildCandidateUsers() {
  const profiles = [
    {
      firstName: 'Nadeesha',
      lastName: 'Perera',
      email: 'nadeesha.perera@raashilink.ai',
      phone: '+94770001001',
      age: 26,
      location: 'Colombo',
      religion: 'Buddhist',
      professionType: 'Software Engineering',
      educationLevel: 'BSc Information Technology',
      familyValues: 0.91,
      openness: 0.82,
      conscientiousness: 0.81,
      extraversion: 0.63,
      agreeableness: 0.86,
      neuroticism: 0.24,
      city: 'Colombo',
      dob: '1999-06-03',
      tob: '07:10',
      nakshatra: 'Pushya',
      rashi: 'Cancer',
      moonSign: 'Cancer',
      bio: 'Engineer with strong family values and a calm, optimistic outlook.',
    },
    {
      firstName: 'Ishari',
      lastName: 'Ranasinghe',
      email: 'ishari.ranasinghe@raashilink.ai',
      phone: '+94770001002',
      age: 27,
      location: 'Kandy',
      religion: 'Buddhist',
      professionType: 'Medical Officer',
      educationLevel: 'MBBS',
      familyValues: 0.94,
      openness: 0.75,
      conscientiousness: 0.87,
      extraversion: 0.57,
      agreeableness: 0.9,
      neuroticism: 0.25,
      city: 'Kandy',
      dob: '1998-11-09',
      tob: '05:50',
      nakshatra: 'Rohini',
      rashi: 'Taurus',
      moonSign: 'Taurus',
      bio: 'Doctor who values trust, stability, and shared long-term goals.',
    },
    {
      firstName: 'Chathuri',
      lastName: 'Fernando',
      email: 'chathuri.fernando@raashilink.ai',
      phone: '+94770001003',
      age: 25,
      location: 'Gampaha',
      religion: 'Catholic',
      professionType: 'UX Designer',
      educationLevel: 'BDes',
      familyValues: 0.84,
      openness: 0.9,
      conscientiousness: 0.69,
      extraversion: 0.71,
      agreeableness: 0.8,
      neuroticism: 0.3,
      city: 'Negombo',
      dob: '2000-03-20',
      tob: '13:15',
      nakshatra: 'Swati',
      rashi: 'Libra',
      moonSign: 'Libra',
      bio: 'Creative and warm-hearted, hoping to build a grounded partnership.',
    },
    {
      firstName: 'Umasha',
      lastName: 'Jayawardena',
      email: 'umasha.jayawardena@raashilink.ai',
      phone: '+94770001004',
      age: 29,
      location: 'Matara',
      religion: 'Buddhist',
      professionType: 'Chartered Accountant',
      educationLevel: 'CIMA',
      familyValues: 0.88,
      openness: 0.72,
      conscientiousness: 0.9,
      extraversion: 0.52,
      agreeableness: 0.79,
      neuroticism: 0.28,
      city: 'Galle',
      dob: '1997-02-12',
      tob: '09:40',
      nakshatra: 'Anuradha',
      rashi: 'Scorpio',
      moonSign: 'Scorpio',
      bio: 'Finance professional with a practical mindset and deep commitment to family.',
    },
    {
      firstName: 'Kavini',
      lastName: 'Bandara',
      email: 'kavini.bandara@raashilink.ai',
      phone: '+94770001005',
      age: 24,
      location: 'Kurunegala',
      religion: 'Buddhist',
      professionType: 'Teacher',
      educationLevel: 'BA Education',
      familyValues: 0.92,
      openness: 0.7,
      conscientiousness: 0.82,
      extraversion: 0.6,
      agreeableness: 0.88,
      neuroticism: 0.22,
      city: 'Kurunegala',
      dob: '2001-08-01',
      tob: '11:05',
      nakshatra: 'Hasta',
      rashi: 'Virgo',
      moonSign: 'Virgo',
      bio: 'Teacher who values patience, kindness, and a peaceful home life.',
    },
    {
      firstName: 'Tharushi',
      lastName: 'Gunawardena',
      email: 'tharushi.gunawardena@raashilink.ai',
      phone: '+94770001006',
      age: 28,
      location: 'Colombo',
      religion: 'Buddhist',
      professionType: 'Data Analyst',
      educationLevel: 'BSc Statistics',
      familyValues: 0.86,
      openness: 0.81,
      conscientiousness: 0.84,
      extraversion: 0.55,
      agreeableness: 0.83,
      neuroticism: 0.27,
      city: 'Colombo',
      dob: '1998-05-17',
      tob: '10:20',
      nakshatra: 'Revati',
      rashi: 'Pisces',
      moonSign: 'Pisces',
      bio: 'Analytical and empathetic, looking for a mature and respectful partner.',
    },
    // ── New male profiles ────────────────────────────────────────────
    {
      firstName: 'Dinesh',
      lastName: 'Wijesinghe',
      email: 'dinesh.wijesinghe@raashilink.ai',
      phone: '+94770002001',
      age: 31,
      gender: 'male',
      location: 'Kandy',
      religion: 'Buddhist',
      professionType: 'Civil Engineer',
      educationLevel: 'BEng Civil Engineering',
      familyValues: 0.88,
      openness: 0.73,
      conscientiousness: 0.85,
      extraversion: 0.6,
      agreeableness: 0.82,
      neuroticism: 0.3,
      city: 'Kandy',
      dob: '1994-04-20',
      tob: '06:30',
      nakshatra: 'Bharani',
      rashi: 'Aries',
      moonSign: 'Aries',
      height: "5'11\"",
      ethnicity: 'Sinhalese',
      password: '11111111',
      forcePasswordSync: true,
      bio: 'Civil engineer who values discipline, family, and a peaceful life in the hills.',
    },
    {
      firstName: 'Ruwan',
      lastName: 'Pathirana',
      email: 'ruwan.pathirana@raashilink.ai',
      phone: '+94770002002',
      age: 34,
      gender: 'male',
      location: 'Colombo',
      religion: 'Buddhist',
      professionType: 'Lawyer',
      educationLevel: 'LLB',
      familyValues: 0.85,
      openness: 0.77,
      conscientiousness: 0.88,
      extraversion: 0.69,
      agreeableness: 0.79,
      neuroticism: 0.26,
      city: 'Colombo',
      dob: '1991-09-14',
      tob: '09:15',
      nakshatra: 'Hasta',
      rashi: 'Virgo',
      moonSign: 'Virgo',
      height: "6'0\"",
      ethnicity: 'Sinhalese',
      password: '11111111',
      forcePasswordSync: true,
      bio: 'Attorney with a sharp mind and a gentle heart, seeking a grounded life partner.',
    },
    {
      firstName: 'Kasun',
      lastName: 'Mendis',
      email: 'kasun.mendis@raashilink.ai',
      phone: '+94770002003',
      age: 27,
      gender: 'male',
      location: 'Gampaha',
      religion: 'Catholic',
      professionType: 'IT Consultant',
      educationLevel: 'BSc Computer Science',
      familyValues: 0.81,
      openness: 0.86,
      conscientiousness: 0.78,
      extraversion: 0.72,
      agreeableness: 0.84,
      neuroticism: 0.32,
      city: 'Gampaha',
      dob: '1998-06-05',
      tob: '14:45',
      nakshatra: 'Ardra',
      rashi: 'Gemini',
      moonSign: 'Gemini',
      height: "5'9\"",
      ethnicity: 'Sinhalese',
      password: '11111111',
      forcePasswordSync: true,
      bio: 'Tech consultant who loves deep conversations, travel, and building a meaningful future.',
    },
    {
      firstName: 'Tharaka',
      lastName: 'Silva',
      email: 'tharaka.silva@raashilink.ai',
      phone: '+94770002004',
      age: 38,
      gender: 'male',
      location: 'Galle',
      religion: 'Buddhist',
      professionType: 'Entrepreneur',
      educationLevel: 'MBA',
      familyValues: 0.9,
      openness: 0.8,
      conscientiousness: 0.82,
      extraversion: 0.75,
      agreeableness: 0.77,
      neuroticism: 0.24,
      city: 'Galle',
      dob: '1987-01-28',
      tob: '08:00',
      nakshatra: 'Shatabhisha',
      rashi: 'Aquarius',
      moonSign: 'Aquarius',
      height: "5'10\"",
      ethnicity: 'Sinhalese',
      password: '11111111',
      forcePasswordSync: true,
      bio: 'Business owner from Galle seeking a mature, caring partner to share life with.',
    },
    // ── New female profiles ──────────────────────────────────────────
    {
      firstName: 'Priya',
      lastName: 'Rajapaksha',
      email: 'priya.rajapaksha@raashilink.ai',
      phone: '+94770002005',
      age: 32,
      gender: 'female',
      location: 'Colombo',
      religion: 'Hindu',
      professionType: 'Marketing Manager',
      educationLevel: 'MBA Marketing',
      familyValues: 0.87,
      openness: 0.83,
      conscientiousness: 0.8,
      extraversion: 0.78,
      agreeableness: 0.85,
      neuroticism: 0.28,
      city: 'Colombo',
      dob: '1993-08-11',
      tob: '11:30',
      nakshatra: 'Purva Phalguni',
      rashi: 'Leo',
      moonSign: 'Leo',
      height: "5'5\"",
      ethnicity: 'Tamil',
      password: '11111111',
      forcePasswordSync: true,
      bio: 'Marketing professional who values ambition, warmth, and a strong family bond.',
    },
    {
      firstName: 'Ashni',
      lastName: 'Ratnayake',
      email: 'ashni.ratnayake@raashilink.ai',
      phone: '+94770002006',
      age: 35,
      gender: 'female',
      location: 'Jaffna',
      religion: 'Hindu',
      professionType: 'University Lecturer',
      educationLevel: 'PhD Literature',
      familyValues: 0.89,
      openness: 0.88,
      conscientiousness: 0.86,
      extraversion: 0.54,
      agreeableness: 0.91,
      neuroticism: 0.21,
      city: 'Jaffna',
      dob: '1990-11-03',
      tob: '07:45',
      nakshatra: 'Anuradha',
      rashi: 'Scorpio',
      moonSign: 'Scorpio',
      height: "5'4\"",
      ethnicity: 'Tamil',
      password: '11111111',
      forcePasswordSync: true,
      bio: 'Academic who finds joy in learning, literature, and quiet evenings with loved ones.',
    },
    {
      firstName: 'Nilufar',
      lastName: 'De Silva',
      email: 'nilufar.desilva@raashilink.ai',
      phone: '+94770002007',
      age: 30,
      gender: 'female',
      location: 'Colombo',
      religion: 'Catholic',
      professionType: 'Architect',
      educationLevel: 'BArch',
      familyValues: 0.83,
      openness: 0.91,
      conscientiousness: 0.76,
      extraversion: 0.68,
      agreeableness: 0.81,
      neuroticism: 0.33,
      city: 'Colombo',
      dob: '1995-03-22',
      tob: '10:50',
      nakshatra: 'Ashwini',
      rashi: 'Aries',
      moonSign: 'Aries',
      height: "5'6\"",
      ethnicity: 'Burgher',
      password: '11111111',
      forcePasswordSync: true,
      bio: 'Architect with a creative soul, looking for a partner who appreciates beauty and adventure.',
    },
    {
      firstName: 'Chamari',
      lastName: 'Wickramasinghe',
      email: 'chamari.wickramasinghe@raashilink.ai',
      phone: '+94770002008',
      age: 36,
      gender: 'female',
      location: 'Kurunegala',
      religion: 'Buddhist',
      professionType: 'Pharmacist',
      educationLevel: 'BPharm',
      familyValues: 0.93,
      openness: 0.69,
      conscientiousness: 0.89,
      extraversion: 0.56,
      agreeableness: 0.9,
      neuroticism: 0.2,
      city: 'Kurunegala',
      dob: '1989-07-17',
      tob: '16:20',
      nakshatra: 'Pushya',
      rashi: 'Cancer',
      moonSign: 'Cancer',
      height: "5'3\"",
      ethnicity: 'Sinhalese',
      password: '11111111',
      forcePasswordSync: true,
      bio: 'Pharmacist who believes in quiet strength, loyalty, and building a nurturing home.',
    },
  ];

  return profiles.map((profile, index) => ({
    email: profile.email,
    password: profile.password || 'password123',
    forcePasswordSync: profile.forcePasswordSync || false,
    role: 'user',
    personalInfo: {
      firstName: profile.firstName,
      lastName: profile.lastName,
      phone: profile.phone,
      age: profile.age,
      location: profile.location,
      gender: profile.gender || 'female',
      bio: profile.bio,
      ethnicity: profile.ethnicity || 'Sinhalese',
      height: profile.height || `${5 + ((index + 2) % 2)}'${3 + (index % 5)}"`,
      photos: [],
    },
    horoscope: horoscope(profile.city, new Date(profile.dob), profile.tob, {
      nakshatra: profile.nakshatra,
      rashi: profile.rashi,
      moonSign: profile.moonSign,
    }),
    personality: {
      openness: profile.openness,
      conscientiousness: profile.conscientiousness,
      extraversion: profile.extraversion,
      agreeableness: profile.agreeableness,
      neuroticism: profile.neuroticism,
    },
    lifestyle: {
      religion: profile.religion,
      diet: 'Non-veg',
      smoking: 'Never',
      drinking: 'Never',
      preferredLocation: 'Colombo',
      familyValues: profile.familyValues,
      educationLevel: profile.educationLevel,
      professionType: profile.professionType,
      familyPlans: 'Looking for a stable relationship with long-term commitment.',
      hobbies: ['Reading', 'Travel', 'Music'],
      languages: ['Sinhala', 'English'],
    },
  }));
}

const demoUsers = [...baseUsers, ...buildCandidateUsers()];
const LEGACY_DEMO_EMAILS = [
  'user@raashilink.ai',
  'anjali@raashilink.ai',
  'dilshan@raashilink.ai',
  'kavindi@raashilink.ai',
];

export const DEMO_USER_EMAILS = demoUsers.map((entry) => entry.email);

const passwordHashCache = new Map();

async function getSeedPasswordHash(password = 'password123') {
  if (!passwordHashCache.has(password)) {
    passwordHashCache.set(password, bcrypt.hash(password, 10));
  }

  return passwordHashCache.get(password);
}

export async function seedDemoUsers() {
  const verification = {
    emailVerified: true,
    phoneVerified: true,
    emailVerifiedAt: new Date(),
    phoneVerifiedAt: new Date(),
  };

  await Promise.all(
    demoUsers.map(async (entry) => {
      const passwordHash = await getSeedPasswordHash(entry.password);
      const existingUser = await User.findOne({ email: entry.email }).select('_id').lean();

      await User.updateOne(
        { email: entry.email },
        {
          $setOnInsert: {
            ...entry,
            ...mapHoroscopeFields(entry.horoscope),
            passwordHash,
            verification,
          },
        },
        { upsert: true }
      );

      const updates = {
        // Only set verification for NEW users ($setOnInsert handles it above).
        // Existing users keep their real verification state so resets are not overwritten on restart.
        ...(!existingUser ? { verification } : {}),
        // Always sync gender so DB stays consistent with seed data.
        ...(entry.personalInfo?.gender ? { 'personalInfo.gender': entry.personalInfo.gender } : {}),
        // Preserve real user edits on restart. Seed horoscope/birth only for first-time inserts.
        ...(!existingUser && entry.horoscope ? mapHoroscopeFields(entry.horoscope) : {}),
      };

      await User.updateOne(
        { email: entry.email },
        {
          $set: updates,
        }
      );

      if (entry.forcePasswordSync) {
        await User.updateOne(
          { email: entry.email },
          {
            $set: { passwordHash },
          }
        );
      }
    })
  );

  await User.deleteMany({ email: { $in: LEGACY_DEMO_EMAILS } });

  const vendorOwner = await User.findOne({ email: 'vendor@raashilink.ai' }).select('_id');
  const DEMO_VENDORS = [
    {
      businessName: 'Golden Lotus Events',
      category: 'Photography',
      description: 'Award-winning wedding photography and cinematic videography across Sri Lanka.',
      serviceArea: ['Colombo', 'Kandy', 'Galle'],
      pricingRange: { min: 150000, max: 450000, currency: 'LKR' },
      portfolioImages: [
        'https://images.unsplash.com/photo-1537633552985-df8429e8048b?w=800&q=75',
        'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&q=75',
      ],
      ratings: { average: 4.8, count: 24 },
    },
    {
      businessName: 'Spice Garden Catering',
      category: 'Catering',
      description: 'Premium Sri Lankan and international buffet catering for weddings up to 1500 guests.',
      serviceArea: ['Colombo', 'Negombo', 'Gampaha'],
      pricingRange: { min: 200000, max: 1200000, currency: 'LKR' },
      portfolioImages: [
        'https://images.unsplash.com/photo-1555244162-803834f70033?w=800&q=75',
        'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=75',
      ],
      ratings: { average: 4.6, count: 38 },
    },
    {
      businessName: 'Pearl Grand Venue',
      category: 'Venue',
      description: 'Luxury ballroom and outdoor garden venues in Colombo with capacity for 500+ guests.',
      serviceArea: ['Colombo'],
      pricingRange: { min: 500000, max: 3000000, currency: 'LKR' },
      portfolioImages: [
        'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=800&q=75',
        'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=800&q=75',
      ],
      ratings: { average: 4.9, count: 52 },
    },
    {
      businessName: 'Blossom Floral Decor',
      category: 'Decor',
      description: 'Elegant floral arrangements, mandap decorations, and stage design for all wedding styles.',
      serviceArea: ['Colombo', 'Kandy', 'Kurunegala'],
      pricingRange: { min: 80000, max: 600000, currency: 'LKR' },
      portfolioImages: [
        'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=800&q=75',
        'https://images.unsplash.com/photo-1487530811015-780c2fde6bef?w=800&q=75',
      ],
      ratings: { average: 4.7, count: 19 },
    },
    {
      businessName: 'Signature Bridal Couture',
      category: 'Attire',
      description: 'Custom bridal lehengas, sarees, and western gowns with full alteration services.',
      serviceArea: ['Colombo', 'Galle'],
      pricingRange: { min: 120000, max: 800000, currency: 'LKR' },
      portfolioImages: [
        'https://images.unsplash.com/photo-1594552072238-b8a33785b6cd?w=800&q=75',
        'https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?w=800&q=75',
      ],
      ratings: { average: 4.5, count: 31 },
    },
    {
      businessName: 'Rhythm & Beats',
      category: 'Music',
      description: 'Live bands, DJs, and traditional Baila orchestra for receptions and Poruwa ceremonies.',
      serviceArea: ['Colombo', 'Kandy', 'Negombo', 'Galle'],
      pricingRange: { min: 60000, max: 350000, currency: 'LKR' },
      portfolioImages: [
        'https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?w=800&q=75',
      ],
      ratings: { average: 4.4, count: 45 },
    },
    {
      businessName: 'Eternal Moments Planning',
      category: 'Planner',
      description: 'Full-service wedding coordination from engagement to honeymoon, handling every detail.',
      serviceArea: ['Colombo', 'Kandy', 'Galle', 'Kurunegala'],
      pricingRange: { min: 250000, max: 1000000, currency: 'LKR' },
      portfolioImages: [
        'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=75',
      ],
      ratings: { average: 4.9, count: 17 },
    },
    {
      businessName: 'Island Horizons Travel',
      category: 'Travel',
      description: 'Honeymoon packages, guest transport coordination, and destination wedding logistics.',
      serviceArea: ['Colombo', 'Galle', 'Nuwara Eliya', 'Mirissa'],
      pricingRange: { min: 300000, max: 2000000, currency: 'LKR' },
      portfolioImages: [
        'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800&q=75',
      ],
      ratings: { average: 4.6, count: 28 },
    },
  ];

  if (vendorOwner) {
    await Promise.all(
      DEMO_VENDORS.map((v, idx) =>
        Vendor.findOneAndUpdate(
          { businessName: v.businessName },
          {
            $set: {
              userId: vendorOwner._id,
              ...v,
              reviews: [],
              verified: true,
              availabilityCalendar: [],
            },
          },
          { upsert: true, new: true }
        )
      )
    );
  }

  const horoscopeUsers = await User.find({ role: 'user' })
    .select('_id birthData horoscopeData')
    .lean({ virtuals: true });

  await Promise.all(
    horoscopeUsers.map(async (user) => {
      const sourceHoroscope = user.horoscope || (user.birthData
        ? {
            dateOfBirth: user.birthData.dateOfBirth,
            timeOfBirth: user.birthData.timeOfBirth,
            placeOfBirth: user.birthData.placeOfBirth,
            moonSign: user.horoscopeData?.moonSign,
            rashi: user.horoscopeData?.rashi,
            nakshatra: user.horoscopeData?.nakshatra,
          }
        : null);

      if (!sourceHoroscope) {
        return;
      }

      await Horoscope.findOneAndUpdate(
        { userId: user._id },
        {
          $set: {
            userId: user._id,
            zodiacSign: sourceHoroscope.moonSign || sourceHoroscope.rashi || 'Unknown',
            rashi: sourceHoroscope.rashi || sourceHoroscope.moonSign || 'Unknown',
            nakshatra: sourceHoroscope.nakshatra || 'Unknown',
            ascendant: user.horoscopeData?.ascendant || sourceHoroscope.moonSign || 'Unknown',
            planetaryPositions:
              user.horoscopeData?.planetaryPositions?.length > 0
                ? user.horoscopeData.planetaryPositions
                : [
                    {
                      planet: 'Sun',
                      sign: sourceHoroscope.moonSign || sourceHoroscope.rashi || 'Unknown',
                      house: 7,
                      degree: 12.4,
                    },
                  ],
            gunaScore: user.horoscopeData?.gunaScore || 0,
          },
        },
        { upsert: true, new: true }
      );
    })
  );

  await HoneymoonDestination.findOneAndUpdate(
    { country: 'Sri Lanka', region: 'Ella' },
    {
      $set: {
        country: 'Sri Lanka',
        region: 'Ella',
        description: 'Hill country escape with tea estates, scenic train rides, and boutique stays.',
        activityTags: ['nature', 'romantic', 'sightseeing'],
        budgetTier: 'mid-range',
        bestSeason: 'December to April',
        images: ['https://picsum.photos/seed/ella/1200/800'],
        highlights: ['Nine Arches Bridge', 'Little Adam\'s Peak', 'Tea plantation stays'],
      },
    },
    { upsert: true, new: true }
  );

  logger.info('Match scenario users ensured for development flow', { count: demoUsers.length });
}

export default {
  seedDemoUsers,
};
