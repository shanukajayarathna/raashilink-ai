/**
 * Seed script: Honeymoon Destinations
 * Run: node scripts/seed-honeymoon.mjs
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/raashilink';

const schema = new mongoose.Schema({
  country: String,
  region: String,
  description: String,
  activityTags: [String],
  budgetTier: String,
  bestSeason: String,
  images: [String],
  highlights: [String],
}, { versionKey: false, timestamps: true });
schema.index({ country: 1, region: 1 }, { unique: true });

const HoneymoonDestination =
  mongoose.models.HoneymoonDestination ||
  mongoose.model('HoneymoonDestination', schema);

const destinations = [
  // ── BEACH ──────────────────────────────────────────────────────────────────
  {
    country: 'Maldives',
    region: 'North Malé Atoll',
    description: 'Overwater bungalows, crystal-clear lagoons and vibrant coral reefs make the Maldives the world\'s most iconic honeymoon escape. Wake up to turquoise water beneath your glass floor and end each evening with a private sunset cruise.',
    activityTags: ['beach', 'island', 'swim', 'snorkeling', 'couples-spa', 'sunset-cruise'],
    budgetTier: 'luxury',
    bestSeason: 'November – April',
    images: ['https://images.unsplash.com/photo-1506929562872-bb421503ef21?w=1200'],
    highlights: ['Overwater Villas', 'Coral Reef Snorkeling', 'Private Sunset Dinner', 'Dolphin Watching'],
  },
  {
    country: 'Thailand',
    region: 'Koh Samui',
    description: 'Powdery white sands, coconut palms and world-class beach resorts. Koh Samui blends luxury pool villas, lush jungle interiors and vibrant nightlife into a perfectly balanced honeymoon island.',
    activityTags: ['beach', 'island', 'swim', 'couples-spa', 'fine-dining', 'nightlife'],
    budgetTier: 'mid-range',
    bestSeason: 'December – April',
    images: ['https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=1200'],
    highlights: ['Chaweng Beach', 'Couples Spa Day', 'Elephant Sanctuary Visit', 'Beachfront Fine Dining'],
  },
  {
    country: 'Sri Lanka',
    region: 'Mirissa',
    description: 'A crescent bay of golden sand fringed by swaying palms on Sri Lanka\'s south coast. Mirissa is serene, affordable and incredibly romantic — ideal for couples seeking sun, sea and whale-watching at sunrise.',
    activityTags: ['beach', 'island', 'swim', 'snorkeling', 'whale-watching'],
    budgetTier: 'budget',
    bestSeason: 'November – April',
    images: ['https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=1200'],
    highlights: ['Whale Watching at Dawn', 'Coconut Tree Hill Sunset', 'Beach Bonfire', 'Fresh Seafood by the Shore'],
  },
  // ── MOUNTAIN / ADVENTURE ───────────────────────────────────────────────────
  {
    country: 'Switzerland',
    region: 'Interlaken & Jungfrau',
    description: 'Nestled between two glacial lakes with the Jungfrau massif as a backdrop, Interlaken is pure alpine romance. Ride a cogwheel train to Europe\'s highest station, share a fondue dinner and hike through meadows bursting with wildflowers.',
    activityTags: ['mountain', 'hike', 'adventure', 'nature', 'scenic-train'],
    budgetTier: 'luxury',
    bestSeason: 'June – September',
    images: ['https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200'],
    highlights: ['Jungfraujoch Summit Ride', 'Paragliding over the Alps', 'Alpine Fondue Dinner', 'Boat Cruise on Lake Thun'],
  },
  {
    country: 'Nepal',
    region: 'Pokhara & Annapurna',
    description: 'Dramatic Himalayan peaks reflected in mirror-still Phewa Lake. Pokhara is the gateway to the Annapurna circuit and offers everything from peaceful lake-side retreats to white-water rafting and paragliding.',
    activityTags: ['mountain', 'hike', 'adventure', 'nature', 'wildlife'],
    budgetTier: 'budget',
    bestSeason: 'October – December',
    images: ['https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=1200'],
    highlights: ['Sunrise over Machapuchare', 'Paragliding off Sarangkot', 'Rowboat on Phewa Lake', 'Traditional Newari Dinner'],
  },
  {
    country: 'Sri Lanka',
    region: 'Ella & Hill Country',
    description: 'Mist-covered tea estates, mini Adam\'s Peak and the famous Nine Arch Bridge. The Sri Lankan highlands offer a cool, romantic retreat through emerald green plantations, waterfalls and candlelit bungalow stays.',
    activityTags: ['mountain', 'nature', 'hike', 'scenic-train', 'wildlife'],
    budgetTier: 'budget',
    bestSeason: 'January – April',
    images: ['https://images.unsplash.com/photo-1586861635167-e5223aadc9fe?w=1200'],
    highlights: ['Nine Arch Bridge at Sunrise', 'Tea Plucking Experience', 'Little Adam\'s Peak Hike', 'Scenic Kandy–Ella Train Ride'],
  },
  // ── CITY / CULTURE ─────────────────────────────────────────────────────────
  {
    country: 'Italy',
    region: 'Venice & Amalfi Coast',
    description: 'Gondola rides along candlelit canals, Venetian masks and limoncello sunsets over the Amalfi cliff towns. Italy is the quintessential romance destination — combining art, food and breathtaking scenery in every corner.',
    activityTags: ['city', 'culture', 'fine-dining', 'sightseeing', 'photography'],
    budgetTier: 'luxury',
    bestSeason: 'April – June, September – October',
    images: ['https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?w=1200'],
    highlights: ['Grand Canal Gondola Ride', 'Positano Cliffside Dining', 'Vatican & Colosseum Tour', 'Truffle Cooking Class'],
  },
  {
    country: 'Japan',
    region: 'Kyoto & Tokyo',
    description: 'Cherry blossoms over ancient temples, Michelin-star ramen and neon-lit izakayas — Japan merges timeless tradition with electric modernity. A honeymoon here is both deeply romantic and endlessly surprising.',
    activityTags: ['city', 'culture', 'fine-dining', 'sightseeing', 'photography'],
    budgetTier: 'mid-range',
    bestSeason: 'March – May, October – November',
    images: ['https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=1200'],
    highlights: ['Fushimi Inari Shrine at Dawn', 'Arashiyama Bamboo Grove', 'Akihabara & Shibuya Nightlife', 'Ryokan Onsen Experience'],
  },
  {
    country: 'Sri Lanka',
    region: 'Galle Fort',
    description: 'A UNESCO-listed Dutch colonial fort on the southern coast, Galle enchants couples with cobblestone lanes, boutique hotels inside 17th-century ramparts, artisan galleries and sunset walks along the fort walls.',
    activityTags: ['city', 'culture', 'fine-dining', 'sightseeing', 'photography'],
    budgetTier: 'mid-range',
    bestSeason: 'November – April',
    images: ['https://images.unsplash.com/photo-1567157577867-05ccb1388e66?w=1200'],
    highlights: ['Sunset on the Ramparts', 'Boutique Hotel in the Fort', 'Local Art Gallery Hopping', 'Surf Lesson at Jungle Beach'],
  },
  // ── WILDLIFE / SAFARI ──────────────────────────────────────────────────────
  {
    country: 'Tanzania',
    region: 'Serengeti & Zanzibar',
    description: 'Combine the thrill of witnessing the Great Migration with a white-sand beach finale on Zanzibar. This classic Africa honeymoon delivers the most dramatic landscapes on earth followed by total beachfront bliss.',
    activityTags: ['wildlife', 'safari', 'adventure', 'beach', 'island', 'nature'],
    budgetTier: 'luxury',
    bestSeason: 'July – October',
    images: ['https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?w=1200'],
    highlights: ['Wildebeest Migration Game Drive', 'Hot Air Balloon Safari', 'Spice Farm Tour in Zanzibar', 'Dhow Sunset Cruise'],
  },
  {
    country: 'Sri Lanka',
    region: 'Yala & Udawalawa',
    description: 'Sri Lanka\'s south and south-east are home to the highest density of wild leopards on the planet. Combine a thrilling safari at Yala National Park with a romantic tented camp under the stars.',
    activityTags: ['wildlife', 'safari', 'adventure', 'nature'],
    budgetTier: 'mid-range',
    bestSeason: 'February – July',
    images: ['https://images.unsplash.com/photo-1561731216-c3a4d99437d5?w=1200'],
    highlights: ['Leopard Safari at Dawn', 'Elephant Herd at Udawalawa', 'Bush Dinner under the Stars', 'Bird Watching at Bundala Lagoon'],
  },
  // ── RURAL / ROMANTIC ───────────────────────────────────────────────────────
  {
    country: 'France',
    region: 'Provence & Dordogne',
    description: 'Rolling lavender fields, medieval stone villages and vineyards stretching to every horizon. Provence moves at the gentlest pace — château wine tastings, open-air markets and candlelit dinners in village squares.',
    activityTags: ['rural', 'nature', 'fine-dining', 'culture', 'photography'],
    budgetTier: 'mid-range',
    bestSeason: 'May – September',
    images: ['https://images.unsplash.com/photo-1595113316349-9fa4eb24f884?w=1200'],
    highlights: ['Lavender Fields of Valensole', 'Château Wine Tasting', 'Gordes Village Sunset Walk', 'Truffle Hunt in Périgord'],
  },
  {
    country: 'Sri Lanka',
    region: 'Sigiriya & Cultural Triangle',
    description: 'An ancient kingdom rising from the jungle. Climb the legendary Lion Rock at sunrise, wander 2,000-year-old cave temples and stay in boutique eco-lodges with plunge pools overlooking paddy fields.',
    activityTags: ['rural', 'culture', 'nature', 'hike', 'sightseeing'],
    budgetTier: 'budget',
    bestSeason: 'May – September',
    images: ['https://images.unsplash.com/photo-1588668214407-6ea9a6d8c272?w=1200'],
    highlights: ['Sigiriya Rock Fortress Sunrise', 'Dambulla Cave Temple', 'Village Bicycle Tour', 'Ayurvedic Couples Massage'],
  },
];

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB');

  let inserted = 0;
  let skipped = 0;

  for (const dest of destinations) {
    const exists = await HoneymoonDestination.findOne({ country: dest.country, region: dest.region });
    if (exists) {
      console.log(`  ↷  Skipping (already exists): ${dest.region}, ${dest.country}`);
      skipped++;
      continue;
    }
    await HoneymoonDestination.create(dest);
    console.log(`  ✔  Inserted: ${dest.region}, ${dest.country}`);
    inserted++;
  }

  console.log(`\nDone. Inserted: ${inserted}  Skipped: ${skipped}`);
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
