import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from '../server/models/User.js';
import Vendor from '../server/models/Vendor.js';

dotenv.config();

const SAMPLE_PORTFOLIO = [
  'https://picsum.photos/seed/pearlgrand-1/1200/800',
  'https://picsum.photos/seed/pearlgrand-2/1200/800',
  'https://picsum.photos/seed/pearlgrand-3/1200/800',
  'https://picsum.photos/seed/pearlgrand-4/1200/800',
];

async function run() {
  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10000 });

  const user = await User.findOne({ email: 'pearlgrand@example.com' });
  if (!user) {
    console.log('Pearl Grand user not found.');
    await mongoose.disconnect();
    return;
  }

  const vendor = await Vendor.findOne({ userId: user._id });
  if (!vendor) {
    console.log('Pearl Grand vendor profile not found.');
    await mongoose.disconnect();
    return;
  }

  if (Array.isArray(vendor.portfolioImages) && vendor.portfolioImages.length > 0) {
    console.log(`Portfolio already has ${vendor.portfolioImages.length} image(s). Skipping backfill.`);
    await mongoose.disconnect();
    return;
  }

  vendor.portfolioImages = SAMPLE_PORTFOLIO;
  await vendor.save();

  console.log(`Backfilled ${SAMPLE_PORTFOLIO.length} portfolio images for Pearl Grand.`);
  await mongoose.disconnect();
}

run().catch(async (error) => {
  console.error(error?.message || error);
  try {
    await mongoose.disconnect();
  } catch {}
  process.exit(1);
});
