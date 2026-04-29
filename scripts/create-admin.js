import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import User from '../server/models/User.js';
import 'dotenv/config';

async function createAdmin() {
  try {
    // Connect to MongoDB
    const mongoUrl = process.env.MONGODB_URI || 'mongodb://localhost:27017/raashilink';
    await mongoose.connect(mongoUrl);
    console.log('Connected to MongoDB');

    // Admin credentials
    const adminEmail = 'admin@raashilink.ai';
    const adminPassword = 'Admin@RaashiLink2024';
    const adminPhone = '+94771234567';

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: adminEmail });
    if (existingAdmin) {
      console.log('Admin user already exists with email:', adminEmail);
      process.exit(0);
    }

    // Hash password
    const passwordHash = await bcrypt.hash(adminPassword, 10);

    // Create admin user
    const admin = await User.create({
      email: adminEmail,
      passwordHash,
      role: 'admin',
      personalInfo: {
        firstName: 'Admin',
        lastName: 'User',
        phone: adminPhone,
      },
      verification: {
        emailVerified: true,
        phoneVerified: true,
      },
    });

    console.log('\n✅ Admin user created successfully!\n');
    console.log('📧 Email: admin@raashilink.ai');
    console.log('🔑 Password: Admin@RaashiLink2024');
    console.log('\n⚠️  Please save these credentials securely and change the password after first login.\n');

    process.exit(0);
  } catch (error) {
    console.error('Error creating admin user:', error);
    process.exit(1);
  }
}

createAdmin();
