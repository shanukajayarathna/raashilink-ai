import axiosInstance from '@/shared/config/axiosConfig';
import SRI_LANKAN_DESTINATIONS from '../data/sriLankanDestinations';

const ACTIVITY_KEYWORDS: Record<string, string[]> = {
  beach: ['beach', 'ocean', 'sea', 'surf', 'snorkel', 'whale', 'lagoon', 'river', 'sunset', 'water'],
  mountain: ['mountain', 'hill', 'tea', 'waterfall', 'hike', 'view', 'cloud', 'peak', 'plantation'],
  city: ['city', 'culture', 'shopping', 'nightlife', 'dining', 'museum', 'urban', 'heritage'],
  wildlife: ['wildlife', 'safari', 'leopard', 'elephant', 'bird', 'national park', 'nature'],
  rural: ['rural', 'village', 'plantation', 'country', 'relaxation', 'tea', 'farm'],
};

const honeymoonService = {
  getDestinations: async (params: any = {}) => {
    // Use real Sri Lankan destinations data
    let filtered = SRI_LANKAN_DESTINATIONS;

    // Filter by activity/vibe if provided
    if (params.activity) {
      const activity = String(params.activity).toLowerCase();
      const keywords = ACTIVITY_KEYWORDS[activity] || [activity];

      filtered = filtered.filter((dest) => {
        const lowerTags = Array.isArray(dest.activityTags)
          ? dest.activityTags.map((tag) => String(tag).toLowerCase())
          : [];

        const lowerText = [
          dest.region,
          dest.description,
          ...(Array.isArray(dest.highlights) ? dest.highlights : []),
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        return keywords.some((keyword) =>
          lowerTags.some((tag) => tag.includes(keyword)) || lowerText.includes(keyword)
        );
      });
    }

    // Filter by budget tier if provided
    if (params.budgetTier) {
      filtered = filtered.filter((dest) => dest.budgetTier === params.budgetTier);
    }

    // Filter by country if provided
    if (params.country) {
      filtered = filtered.filter((dest) => dest.country.toLowerCase() === params.country.toLowerCase());
    }

    // Default to returning all if none filtered
    const items = filtered.length > 0 ? filtered : SRI_LANKAN_DESTINATIONS;

    return { data: { items } };
  },

  getDestination: async (destinationId: string) => {
    // Find destination by ID in the real data
    const destination = SRI_LANKAN_DESTINATIONS.find(d => d._id === destinationId);
    return { data: destination || SRI_LANKAN_DESTINATIONS[0] };
  },
};

export default honeymoonService;
