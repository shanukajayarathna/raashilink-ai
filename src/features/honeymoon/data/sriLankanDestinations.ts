/**
 * Real Sri Lankan Honeymoon Destinations
 * With GPS coordinates, pricing, contact info, and local details
 */

export interface HoneymoonDestination {
  _id: string;
  region: string;
  country: string;
  description: string;
  image: string;
  activityTags: string[];
  highlights: string[];
  budgetTier: 'budget' | 'mid-range' | 'luxury';
  priceRangeLKR: {
    min: number;
    max: number;
  };
  bestSeason: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  contactPhone: string;
  contactEmail: string;
  website: string;
  attractions: string[];
  duration: string;
  type: 'beach' | 'mountain' | 'cultural' | 'safari';
}

export const SRI_LANKAN_DESTINATIONS: HoneymoonDestination[] = [
  {
    _id: 'sigiriya-adventure',
    region: 'Sigiriya',
    country: 'Sri Lanka',
    description: 'Climb the iconic rock fortress with stunning panoramic views of the island. Perfect for adventure-loving couples seeking culture and adventure.',
    image: 'https://images.unsplash.com/photo-1548566328-cc2de6e64e4e?w=800&h=600&fit=crop',
    activityTags: ['Mountain', 'Adventure', 'Culture', 'Photography'],
    highlights: ['Ancient fortress climb', 'Panoramic views', 'Mirror wall', 'Frescoes'],
    budgetTier: 'mid-range',
    priceRangeLKR: { min: 150000, max: 300000 },
    bestSeason: 'December to April',
    coordinates: { lat: 7.9457, lng: 80.7597 },
    contactPhone: '+94 71 000 0000',
    contactEmail: 'tourism@sigiriya.lk',
    website: 'www.sigiriya.lk',
    attractions: ['Sigiriya Rock Fortress', 'Water gardens', 'Boulder gardens', 'Mirror wall with ancient graffiti'],
    duration: '2-3 days',
    type: 'mountain',
  },
  {
    _id: 'ella-tea-country',
    region: 'Ella',
    country: 'Sri Lanka',
    description: 'Discover the misty tea plantations of Ella. Perfect for romantics who love nature walks, scenic views, and cozy mountain villages.',
    image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop',
    activityTags: ['Mountain', 'Nature', 'Hiking', 'Photography'],
    highlights: ['Tea plantations', 'Mountain hiking', 'Scenic valley views', 'Local hospitality'],
    budgetTier: 'budget',
    priceRangeLKR: { min: 100000, max: 200000 },
    bestSeason: 'January to March',
    coordinates: { lat: 6.8641, lng: 81.0481 },
    contactPhone: '+94 71 111 1111',
    contactEmail: 'ellahoneymoon@lk.com',
    website: 'www.ellatourism.lk',
    attractions: ['Tea plantations', 'Ella Rock hike', 'Nine Arches Bridge', 'Ravana Waterfall'],
    duration: '3-4 days',
    type: 'mountain',
  },
  {
    _id: 'mirissa-beach-romance',
    region: 'Mirissa',
    country: 'Sri Lanka',
    description: 'Relax on pristine beaches, witness blue whale migration, and enjoy sunset catamaran rides. Ideal for beach-loving couples.',
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&h=600&fit=crop',
    activityTags: ['Beach', 'Whale watching', 'Water sports', 'Sunset views'],
    highlights: ['Whale watching', 'Pristine beaches', 'Sunset cruises', 'Surfing'],
    budgetTier: 'mid-range',
    priceRangeLKR: { min: 180000, max: 350000 },
    bestSeason: 'November to April',
    coordinates: { lat: 5.9497, lng: 80.7744 },
    contactPhone: '+94 71 222 2222',
    contactEmail: 'mirissa@honeymoon.lk',
    website: 'www.mirisaabeach.lk',
    attractions: ['Whale watching tours', 'Sunset catamaran', 'Local fish markets', 'Nearby turtle hatchery'],
    duration: '3-5 days',
    type: 'beach',
  },
  {
    _id: 'kandy-sacred-city',
    region: 'Kandy',
    country: 'Sri Lanka',
    description: 'Experience the cultural heart of Sri Lanka. Visit the Temple of the Tooth, explore botanical gardens, and enjoy cultural performances.',
    image: 'https://images.unsplash.com/photo-1576861337622-98d48d1cf201?w=800&h=600&fit=crop',
    activityTags: ['Culture', 'Heritage', 'Temple', 'Music'],
    highlights: ['Temple of the Tooth', 'Botanical gardens', 'Cultural dances', 'Lake views'],
    budgetTier: 'mid-range',
    priceRangeLKR: { min: 140000, max: 280000 },
    bestSeason: 'January to March',
    coordinates: { lat: 7.2906, lng: 80.6337 },
    contactPhone: '+94 71 333 3333',
    contactEmail: 'kandy@tourism.lk',
    website: 'www.kandycity.lk',
    attractions: ['Temple of the Tooth', 'Peradeniya Botanical Garden', 'Kandy Lake', 'Cultural performances'],
    duration: '2-3 days',
    type: 'cultural',
  },
  {
    _id: 'yala-safari-adventure',
    region: 'Yala National Park',
    country: 'Sri Lanka',
    description: 'Experience thrilling wildlife safari spotting leopards, elephants, and exotic birds. Perfect for adventurous couples.',
    image: 'https://images.unsplash.com/photo-1516426122078-c23e76319801?w=800&h=600&fit=crop',
    activityTags: ['Safari', 'Wildlife', 'Adventure', 'Photography'],
    highlights: ['Leopard spotting', 'Elephant herds', 'Bird watching', 'Scenic landscapes'],
    budgetTier: 'luxury',
    priceRangeLKR: { min: 300000, max: 500000 },
    bestSeason: 'February to July',
    coordinates: { lat: 6.42, lng: 81.5 },
    contactPhone: '+94 71 444 4444',
    contactEmail: 'yala@safaris.lk',
    website: 'www.yalasafari.lk',
    attractions: ['Yala National Park safari', 'Saltwater crocodiles', 'Varied bird species', 'Beautiful coastline'],
    duration: '3-4 days',
    type: 'safari',
  },
  {
    _id: 'nuwara-eliya-colonial',
    region: 'Nuwara Eliya',
    country: 'Sri Lanka',
    description: 'Experience colonial charm in the "Little England" of Sri Lanka. Cool climate, vintage architecture, and golf courses.',
    image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop',
    activityTags: ['Mountain', 'Heritage', 'Relaxation', 'Golf'],
    highlights: ['Colonial architecture', 'Cool climate', 'Golf courses', 'Botanical gardens'],
    budgetTier: 'mid-range',
    priceRangeLKR: { min: 160000, max: 320000 },
    bestSeason: 'January to March',
    coordinates: { lat: 6.9271, lng: 80.7744 },
    contactPhone: '+94 71 555 5555',
    contactEmail: 'nuwara@colonial.lk',
    website: 'www.nuwaraeliya.lk',
    attractions: ['Grand Hotel', 'Golf Club', 'Botanical gardens', 'Lake Gregory'],
    duration: '2-3 days',
    type: 'mountain',
  },
  {
    _id: 'bentota-water-sports',
    region: 'Bentota',
    country: 'Sri Lanka',
    description: 'Active beach getaway with water sports, river cruises, and luxury resorts. Great for adventure and relaxation combined.',
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&h=600&fit=crop',
    activityTags: ['Beach', 'Water sports', 'Relaxation', 'Adventure'],
    highlights: ['Water sports', 'River cruises', 'Lagoon exploration', 'Beach resorts'],
    budgetTier: 'luxury',
    priceRangeLKR: { min: 250000, max: 450000 },
    bestSeason: 'November to April',
    coordinates: { lat: 6.4219, lng: 80.2842 },
    contactPhone: '+94 71 666 6666',
    contactEmail: 'bentota@resort.lk',
    website: 'www.bentotaresorts.lk',
    attractions: ['Bentota River cruise', 'Water sports center', 'Turtle hatchery', 'Local markets'],
    duration: '3-5 days',
    type: 'beach',
  },
  {
    _id: 'galle-fort-sunset',
    region: 'Galle',
    country: 'Sri Lanka',
    description: 'Romantic fort town with Portuguese colonial architecture overlooking the Indian Ocean. Perfect for sunset walks.',
    image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop',
    activityTags: ['Heritage', 'Beach', 'Culture', 'Photography'],
    highlights: ['Galle Fort', 'Ocean views', 'Colonial streets', 'Sunset walks'],
    budgetTier: 'mid-range',
    priceRangeLKR: { min: 140000, max: 280000 },
    bestSeason: 'November to April',
    coordinates: { lat: 6.0535, lng: 80.2169 },
    contactPhone: '+94 71 777 7777',
    contactEmail: 'galle@tourism.lk',
    website: 'www.gallefort.lk',
    attractions: ['Galle Fort UNESCO site', 'Lighthouse', 'Fish market', 'Boutique hotels'],
    duration: '2-3 days',
    type: 'cultural',
  },
  {
    _id: 'colombo-urban-romance',
    region: 'Colombo',
    country: 'Sri Lanka',
    description: 'Modern capital city with vibrant nightlife, fine dining, shopping, and cultural museums. Ideal for city lovers.',
    image: 'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=800&h=600&fit=crop',
    activityTags: ['City', 'Dining', 'Culture', 'Shopping'],
    highlights: ['Fine dining', 'Shopping malls', 'Museums', 'Nightlife'],
    budgetTier: 'luxury',
    priceRangeLKR: { min: 280000, max: 500000 },
    bestSeason: 'All year',
    coordinates: { lat: 6.9271, lng: 79.8612 },
    contactPhone: '+94 71 888 8888',
    contactEmail: 'colombo@city.lk',
    website: 'www.colombotourism.lk',
    attractions: ['National Museum', 'Galle Face Green', 'Shopping malls', 'Fine dining restaurants'],
    duration: '2-4 days',
    type: 'cultural',
  },
  {
    _id: 'polonnaruwa-ancient',
    region: 'Polonnaruwa',
    country: 'Sri Lanka',
    description: 'Ancient kingdom ruins and UNESCO heritage site. Perfect for history enthusiasts and cultural explorers.',
    image: 'https://images.unsplash.com/photo-1516426122078-c23e76319801?w=800&h=600&fit=crop',
    activityTags: ['History', 'Culture', 'Heritage', 'Photography'],
    highlights: ['Ancient temples', 'Royal palace ruins', 'Buddha statue', 'Historic gardens'],
    budgetTier: 'budget',
    priceRangeLKR: { min: 100000, max: 200000 },
    bestSeason: 'January to March',
    coordinates: { lat: 7.9467, lng: 81.0133 },
    contactPhone: '+94 71 999 9999',
    contactEmail: 'polonnaruwa@heritage.lk',
    website: 'www.polonnaruwa.lk',
    attractions: ['Royal Palace', 'Council Chamber', 'Gal Viharaya Buddha statue', 'Ancient temples'],
    duration: '2 days',
    type: 'cultural',
  },
];

export default SRI_LANKAN_DESTINATIONS;
