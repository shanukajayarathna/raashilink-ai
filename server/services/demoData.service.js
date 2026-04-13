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
  ];

  return profiles.map((profile, index) => ({
    email: profile.email,
    password: 'password123',
    role: 'user',
    personalInfo: {
      firstName: profile.firstName,
      lastName: profile.lastName,
      phone: profile.phone,
      age: profile.age,
      location: profile.location,
      gender: 'female',
      bio: profile.bio,
      ethnicity: 'Sinhalese',
      height: `${5 + ((index + 2) % 2)}'${3 + (index % 5)}\"`,
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
        verification,
        ...(entry.horoscope ? mapHoroscopeFields(entry.horoscope) : {}),
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
  if (vendorOwner) {
    await Vendor.findOneAndUpdate(
      { userId: vendorOwner._id },
      {
        $set: {
          userId: vendorOwner._id,
          businessName: 'Golden Lotus Events',
          category: 'Photography',
          description: 'Wedding photography and pre-shoot services across Sri Lanka.',
          serviceArea: ['Colombo', 'Kandy', 'Galle'],
          pricingRange: { min: 150000, max: 450000, currency: 'LKR' },
          portfolioImages: ['https://picsum.photos/seed/vendor1/1200/800'],
          ratings: { average: 4.8, count: 24 },
          reviews: [],
          verified: true,
          availabilityCalendar: [],
        },
      },
      { upsert: true, new: true }
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
