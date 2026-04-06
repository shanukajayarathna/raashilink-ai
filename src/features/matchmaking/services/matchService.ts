import axiosInstance from '@/shared/config/axiosConfig';

/**
 * Match Service for RaashiLink.AI
 * Handles user matchmaking, recommendations, and interest tracking.
 */
const matchService = {
  /**
   * Get personalized match recommendations for the current user.
   * @param {object} params - Query parameters for filtering recommendations.
   * @returns {Promise<object>} - List of match recommendations.
   */
  getRecommendations: async (params: any = {}) => {
    const response = await axiosInstance.get('/matches/recommendations', { params });
    return response.data;
  },

  /**
   * Get detailed information for a specific match.
   * @param {string} matchId - ID of the match to retrieve.
   * @returns {Promise<object>} - Match details and compatibility report.
   */
  getMatchDetail: async (matchId: string) => {
    const response = await axiosInstance.get(`/matches/${matchId}`);
    return response.data;
  },

  /**
   * Express interest in a specific match.
   * @param {string} matchId - ID of the match to express interest in.
   * @returns {Promise<object>} - Interest status.
   */
  expressInterest: async (matchId: string) => {
    const response = await axiosInstance.post(`/matches/${matchId}/interest`);
    return response.data;
  },

  /**
   * Undo interest in a specific match.
   * @param {string} matchId - ID of the match to undo interest in.
   * @returns {Promise<object>} - Undo interest status.
   */
  undoInterest: async (matchId: string) => {
    const response = await axiosInstance.delete(`/matches/${matchId}/interest`);
    return response.data;
  },

  /**
   * Filter matches based on specific criteria.
   * @param {object} filters - Filtering criteria (age, location, etc.).
   * @returns {Promise<object>} - Filtered list of matches.
   */
  filterMatches: async (filters: any) => {
    const response = await axiosInstance.post('/matches/filter', filters);
    return response.data;
  },
};

export default matchService;


