import axiosInstance from '@/shared/config/axiosConfig';

/**
 * Horoscope Service for RaashiLink.AI
 * Handles user birth chart retrieval and compatibility calculations.
 */
const horoscopeService = {
  /**
   * Get current user's birth chart information.
   * @returns {Promise<object>} - User birth chart data.
   */
  getMyChart: async () => {
    const response = await axiosInstance.get('/horoscope/my-chart');
    return response.data;
  },

  /**
   * Calculate compatibility between two users' birth charts.
   * @param {string} partnerId - ID of the partner to calculate compatibility with.
   * @returns {Promise<object>} - Compatibility score and summary.
   */
  calculateCompatibility: async (partnerId: string) => {
    const response = await axiosInstance.post('/horoscope/compatibility', { partnerId });
    return response.data;
  },

  /**
   * Get detailed compatibility report between two users.
   * @param {string} partnerId - ID of the partner to retrieve report for.
   * @returns {Promise<object>} - Detailed compatibility report.
   */
  getCompatibilityReport: async (partnerId: string) => {
    const response = await axiosInstance.get(`/horoscope/compatibility/${partnerId}/report`);
    return response.data;
  },
};

export default horoscopeService;


