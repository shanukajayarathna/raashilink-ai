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
    const adminEmail = 'admin@gmail.com';
    const adminPassword = '11111111';
    const adminPhone = '+94771234567';

    // Update existing admin account (by role or email) so credentials are always in sync.
    const existingAdmin = await User.findOne({
      $or: [{ role: 'admin' }, { email: adminEmail }, { email: 'admin@raashilink.ai' }],
    });
    if (existingAdmin) {
      existingAdmin.email = adminEmail;
      existingAdmin.passwordHash = await bcrypt.hash(adminPassword, 10);
      existingAdmin.role = 'admin';
      existingAdmin.personalInfo = {
        ...(existingAdmin.personalInfo || {}),
        firstName: existingAdmin.personalInfo?.firstName || 'Admin',
        lastName: existingAdmin.personalInfo?.lastName || 'User',
        phone: existingAdmin.personalInfo?.phone || adminPhone,
      };
      existingAdmin.verification = {
        ...(existingAdmin.verification || {}),
        emailVerified: true,
        phoneVerified: true,
      };

      await existingAdmin.save();

      console.log('\n✅ Existing admin user updated successfully!\n');
      console.log('📧 Email: admin@gmail.com');
      console.log('🔑 Password: 11111111');
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
    console.log('📧 Email: admin@gmail.com');
    console.log('🔑 Password: 11111111');
    console.log('\n⚠️  Please save these credentials securely and change the password after first login.\n');

    process.exit(0);
  } catch (error) {
    console.error('Error creating admin user:', error);
    process.exit(1);
  }
}

createAdmin();
