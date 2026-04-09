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
   * Generate current user's birth chart by calling Python horoscope engine.
   * @returns {Promise<object>} - Generated horoscope data with planets, rashi, nakshatra, ascendant.
   */
  generateMyChart: async () => {
    const response = await axiosInstance.post('/horoscope/generate');
    return response.data;
  },

  /**
   * Calculate compatibility between two users' birth charts.
   * @param {string} userAId - ID of the first user (usually current user).
   * @param {string} userBId - ID of the second user to calculate compatibility with.
   * @returns {Promise<object>} - Compatibility score, dimension breakdown, and explanation.
   */
  calculateCompatibility: async (userAId: string, userBId: string) => {
    const response = await axiosInstance.post('/horoscope/compatibility', { userAId, userBId });
    return response.data;
  },

  /**
   * Get detailed compatibility report between two users.
   * @param {string} matchId - ID of the match to retrieve report for.
   * @returns {Promise<object>} - Detailed compatibility report with all dimensions.
   */
  getCompatibilityReport: async (matchId: string) => {
    const response = await axiosInstance.get(`/horoscope/compatibility/${matchId}`);
    return response.data;
  },
};

export default horoscopeService;


