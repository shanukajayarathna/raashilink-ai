import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import User from '../server/models/User.js';
import Vendor from '../server/models/Vendor.js';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('MONGODB_URI is not defined in .env');
  process.exit(1);
}

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const email = 'pearlgrand@example.com';
    const password = 'PearlGrand@123';
    const hashedPassword = await bcrypt.hash(password, 10);

    // 1. Create or Update User
    let user = await User.findOne({ email });
    if (user) {
      console.log('User already exists, updating password and role...');
      user.role = 'vendor';
      user.passwordHash = hashedPassword;
      // Ensure personalInfo exists
      if (!user.personalInfo) {
        user.personalInfo = {
          firstName: 'Pearl Grand',
          lastName: 'Venue',
          phone: '+94712345678'
        };
      }
      await user.save();
    } else {
      user = new User({
        email,
        passwordHash: hashedPassword,
        role: 'vendor',
        personalInfo: {
          firstName: 'Pearl Grand',
          lastName: 'Venue',
          phone: '+94712345678'
        },
        verification: {
          emailVerified: true,
          phoneVerified: true
        }
      });
      await user.save();
      console.log('User created');
    }

    // 2. Create or Update Vendor Profile
    let vendor = await Vendor.findOne({ userId: user._id });
    if (vendor) {
      console.log('Vendor profile already exists, updating...');
      vendor.businessName = 'Pearl Grand Venue';
      vendor.category = 'Venue';
      vendor.packageSummary = [
        'Classic Hall Package',
        'Royal Wedding Package',
        'Premium Reception Package'
      ];
      vendor.packages = [
        {
          packageId: 'pearl-classic',
          name: 'Classic Hall Package',
          description: 'Main hall, basic decor, and coordination support.',
          price: 850000,
          currency: 'LKR',
          durationHours: 8,
          isActive: true,
        },
        {
          packageId: 'pearl-royal',
          name: 'Royal Wedding Package',
          description: 'Luxury hall setup, premium decor, and full-day service.',
          price: 1350000,
          currency: 'LKR',
          durationHours: 10,
          isActive: true,
        },
        {
          packageId: 'pearl-premium',
          name: 'Premium Reception Package',
          description: 'Reception-focused package with buffet and stage styling.',
          price: 1100000,
          currency: 'LKR',
          durationHours: 7,
          isActive: true,
        }
      ];
      vendor.verified = true;
      vendor.approvalStatus = 'approved';
      await vendor.save();
    } else {
      vendor = new Vendor({
        userId: user._id,
        businessName: 'Pearl Grand Venue',
        category: 'Venue',
        description: 'A luxurious venue for your dream wedding at the heart of the city.',
        serviceArea: ['Colombo'],
        pricingRange: { min: 500000, max: 2000000 },
        packageSummary: [
          'Classic Hall Package',
          'Royal Wedding Package',
          'Premium Reception Package'
        ],
        packages: [
          {
            packageId: 'pearl-classic',
            name: 'Classic Hall Package',
            description: 'Main hall, basic decor, and coordination support.',
            price: 850000,
            currency: 'LKR',
            durationHours: 8,
            isActive: true,
          },
          {
            packageId: 'pearl-royal',
            name: 'Royal Wedding Package',
            description: 'Luxury hall setup, premium decor, and full-day service.',
            price: 1350000,
            currency: 'LKR',
            durationHours: 10,
            isActive: true,
          },
          {
            packageId: 'pearl-premium',
            name: 'Premium Reception Package',
            description: 'Reception-focused package with buffet and stage styling.',
            price: 1100000,
            currency: 'LKR',
            durationHours: 7,
            isActive: true,
          }
        ],
        verified: true,
        approvalStatus: 'approved'
      });
      await vendor.save();
      console.log('Vendor profile created');
    }

    console.log('--------------------------------------------------');
    console.log('VENDOR ACCOUNT CREATED SUCCESSFULLY');
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
    console.log('--------------------------------------------------');
    
    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err);
    process.exit(1);
  }
}

seed();
