import axiosInstance from '@/shared/config/axiosConfig';
import SRI_LANKAN_DESTINATIONS from '../data/sriLankanDestinations';

const honeymoonService = {
  getDestinations: async (params: any = {}) => {
    // Use real Sri Lankan destinations data
    let filtered = SRI_LANKAN_DESTINATIONS;
    
    // Filter by activity/vibe if provided
    if (params.activity) {
      filtered = filtered.filter((dest) => 
        dest.activityTags.some(tag => tag.toLowerCase().includes(params.activity.toLowerCase()))
      );
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
