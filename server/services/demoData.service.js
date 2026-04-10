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

const demoUsers = [
  {
    email: 'admin@raashilink.ai',
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
    email: 'user@raashilink.ai',
    role: 'user',
    personalInfo: {
      firstName: 'Shanuka',
      lastName: 'Jayarathna',
      phone: '+94770000003',
      age: 28,
      location: 'Colombo',
      gender: 'male',
      tagline: 'Building the future with tradition and purpose.',
      bio: 'Software engineer who values family, spiritual compatibility, and long-term commitment.',
      ethnicity: 'Sinhalese',
      height: "5'10\"",
      photos: [{ url: 'https://picsum.photos/seed/shanuka/800/800', isMain: true }],
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
      professionType: 'Technology',
    },
  },
  {
    email: 'anjali@raashilink.ai',
    role: 'user',
    personalInfo: {
      firstName: 'Anjali',
      lastName: 'Perera',
      phone: '+94770000004',
      age: 26,
      location: 'Kandy',
      gender: 'female',
      tagline: 'Grounded, curious, and family-oriented.',
      bio: 'Doctor who enjoys deep conversation, cultural traditions, and meaningful relationships.',
      ethnicity: 'Sinhalese',
      height: "5'5\"",
      photos: [{ url: 'https://picsum.photos/seed/anjali/800/800', isMain: true }],
    },
    horoscope: horoscope('Kandy', new Date('1999-07-04'), '06:20', {
      nakshatra: 'Pushya',
      rashi: 'Cancer',
      moonSign: 'Cancer',
    }),
    personality: {
      openness: 0.76,
      conscientiousness: 0.86,
      extraversion: 0.58,
      agreeableness: 0.88,
      neuroticism: 0.28,
    },
    lifestyle: {
      religion: 'Buddhist',
      diet: 'Non-veg',
      smoking: 'Never',
      drinking: 'Never',
      preferredLocation: 'Colombo',
      familyValues: 0.93,
      educationLevel: 'MBBS',
      professionType: 'Healthcare',
    },
  },
  {
    email: 'dilshan@raashilink.ai',
    role: 'user',
    personalInfo: {
      firstName: 'Dilshan',
      lastName: 'Silva',
      phone: '+94770000005',
      age: 29,
      location: 'Galle',
      gender: 'male',
      tagline: 'Creative, steady, and future-focused.',
      bio: 'Architect with a balanced outlook and strong cultural values.',
      ethnicity: 'Sinhalese',
      height: "5'11\"",
      photos: [{ url: 'https://picsum.photos/seed/dilshan/800/800', isMain: true }],
    },
    horoscope: horoscope('Galle', new Date('1996-03-12'), '10:10', {
      nakshatra: 'Revati',
      rashi: 'Pisces',
      moonSign: 'Pisces',
    }),
    personality: {
      openness: 0.81,
      conscientiousness: 0.71,
      extraversion: 0.62,
      agreeableness: 0.72,
      neuroticism: 0.31,
    },
    lifestyle: {
      religion: 'Buddhist',
      diet: 'Non-veg',
      smoking: 'Never',
      drinking: 'Socially',
      preferredLocation: 'Galle',
      familyValues: 0.78,
      educationLevel: 'BArch',
      professionType: 'Architecture',
    },
  },
  {
    email: 'kavindi@raashilink.ai',
    role: 'user',
    personalInfo: {
      firstName: 'Kavindi',
      lastName: 'Fernando',
      phone: '+94770000006',
      age: 25,
      location: 'Negombo',
      gender: 'female',
      tagline: 'Warm-hearted with a modern Sri Lankan outlook.',
      bio: 'Designer who values emotional maturity, creativity, and a close-knit family life.',
      ethnicity: 'Sinhalese',
      height: "5'4\"",
      photos: [{ url: 'https://picsum.photos/seed/kavindi/800/800', isMain: true }],
    },
    horoscope: horoscope('Negombo', new Date('2000-05-19'), '13:45', {
      nakshatra: 'Rohini',
      rashi: 'Taurus',
      moonSign: 'Taurus',
    }),
    personality: {
      openness: 0.88,
      conscientiousness: 0.73,
      extraversion: 0.71,
      agreeableness: 0.82,
      neuroticism: 0.26,
    },
    lifestyle: {
      religion: 'Catholic',
      diet: 'Non-veg',
      smoking: 'Never',
      drinking: 'Never',
      preferredLocation: 'Colombo',
      familyValues: 0.89,
      educationLevel: 'BFA',
      professionType: 'Design',
    },
  },
];

export const DEMO_USER_EMAILS = demoUsers.map((entry) => entry.email);

let seededPasswordHashPromise;

function getSeedPasswordHash() {
  if (!seededPasswordHashPromise) {
    seededPasswordHashPromise = bcrypt.hash('password123', 10);
  }

  return seededPasswordHashPromise;
}

export async function seedDemoUsers() {
  const passwordHash = await getSeedPasswordHash();
  const verification = {
    emailVerified: true,
    phoneVerified: true,
    emailVerifiedAt: new Date(),
    phoneVerifiedAt: new Date(),
  };

  await Promise.all(
    demoUsers.map(async (entry) => {
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
    })
  );

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

  logger.info('Demo users ensured for development flow', { count: demoUsers.length });
}

export default {
  seedDemoUsers,
};
