import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from '../server/models/User.js';
import Match from '../server/models/Match.js';
import MatchInterest from '../server/models/MatchInterest.js';
import Conversation from '../server/models/Conversation.js';
import Horoscope from '../server/models/Horoscope.js';
import Vendor from '../server/models/Vendor.js';
import { DEMO_USER_EMAILS } from '../server/services/demoData.service.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('Missing MONGODB_URI in environment. Set it in .env before running this script.');
  process.exit(1);
}

async function cleanupLocalUsers() {
  await mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  const keepEmails = DEMO_USER_EMAILS;
  console.log('Keeping demo user emails:', keepEmails);

  const usersToRemove = await User.find({ email: { $nin: keepEmails } }).select('_id email').lean();
  const userIds = usersToRemove.map((user) => user._id);

  if (!userIds.length) {
    console.log('No local users found to remove.');
    await mongoose.disconnect();
    return;
  }

  console.log(`Removing ${userIds.length} non-demo user(s)`);
  await User.deleteMany({ _id: { $in: userIds } });
  await Match.deleteMany({
    $or: [
      { userAId: { $in: userIds } },
      { userBId: { $in: userIds } },
    ],
  });
  await MatchInterest.deleteMany({
    $or: [
      { fromUser: { $in: userIds } },
      { toUser: { $in: userIds } },
    ],
  });
  await Conversation.deleteMany({ participants: { $in: userIds } });
  await Horoscope.deleteMany({ userId: { $in: userIds } });
  await Vendor.deleteMany({ userId: { $in: userIds } });

  console.log('Deleted non-demo users and related match data.');
  await mongoose.disconnect();
}

cleanupLocalUsers()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Cleanup failed:', error);
    process.exit(1);
  });
