import axiosInstance from '@/shared/config/axiosConfig';

/**
 * Wedding Service for RaashiLink.AI
 * Handles wedding project management, planning, and vendor coordination.
 */
const weddingService = {
  /**
   * Get current user's wedding project information.
   * @returns {Promise<object>} - Wedding project details.
   */
  getProject: async () => {
    const response = await axiosInstance.get('/wedding/project');
    return response.data;
  },

  /**
   * Update current user's wedding project information.
   * @param {object} projectData - Updated wedding project details.
   * @returns {Promise<object>} - Updated wedding project data.
   */
  updateProject: async (projectData: any) => {
    const response = await axiosInstance.put('/wedding/project', projectData);
    return response.data;
  },

  /**
   * Add a task to the wedding planning checklist.
   * @param {object} taskData - Task details (title, due date, etc.).
   * @returns {Promise<object>} - Created task data.
   */
  addTask: async (taskData: any) => {
    const response = await axiosInstance.post('/wedding/tasks', taskData);
    return response.data;
  },

  /**
   * Add an expense to the wedding budget.
   * @param {object} expenseData - Expense details (category, amount, etc.).
   * @returns {Promise<object>} - Created expense data.
   */
  addExpense: async (expenseData: any) => {
    const response = await axiosInstance.post('/wedding/expenses', expenseData);
    return response.data;
  },

  /**
   * Get current user's wedding budget breakdown.
   * @returns {Promise<object>} - Wedding budget data.
   */
  getBudget: async () => {
    const response = await axiosInstance.get('/wedding/budget');
    return response.data;
  },

  /**
   * Get a list of wedding vendors based on specific criteria.
   * @param {object} params - Query parameters for filtering vendors.
   * @returns {Promise<object>} - List of wedding vendors.
   */
  getVendors: async (params: any = {}) => {
    const response = await axiosInstance.get('/wedding/vendors', { params });
    return response.data;
  },

  /**
   * Request a quote from a specific wedding vendor.
   * @param {object} quoteData - Quote request details (vendor ID, service, etc.).
   * @returns {Promise<object>} - Quote request status.
   */
  requestQuote: async (quoteData: any) => {
    const response = await axiosInstance.post('/wedding/quotes/request', quoteData);
    return response.data;
  },

  /**
   * Update vendor booking status (shortlisted, requested, booked, cancelled).
   */
  updateVendorStatus: async (vendorId: string, status: string) => {
    const response = await axiosInstance.patch('/wedding/vendors/status', { vendorId, status });
    return response.data;
  },

  /**
   * Toggle a checklist task completed/pending by index.
   */
  toggleTask: async (index: number) => {
    const response = await axiosInstance.patch(`/wedding/tasks/${index}/toggle`);
    return response.data;
  },

  /**
   * Send a wedding planning invite to your match partner.
   */
  invitePartner: async (partnerId: string) => {
    const response = await axiosInstance.post('/wedding/couple/invite', { partnerId });
    return response.data;
  },

  acceptInvite: async (inviterId: string) => {
    const response = await axiosInstance.post('/wedding/couple/accept', { inviterId });
    return response.data;
  },

  getPendingInvite: async (): Promise<{ inviterId: string; inviterName: string; inviterProfilePic: string | null; projectId: string } | null> => {
    const response = await axiosInstance.get('/wedding/couple/pending-invite');
    return response.data?.data ?? null;
  },

  resetWedding: async (): Promise<void> => {
    await axiosInstance.post('/wedding/couple/reset');
  },

  updateExpense: async (index: number, data: { title?: string; category?: string; amount?: number; notes?: string; paid?: boolean }) => {
    const response = await axiosInstance.patch(`/wedding/expenses/${index}`, data);
    return response.data;
  },

  deleteExpense: async (index: number) => {
    const response = await axiosInstance.delete(`/wedding/expenses/${index}`);
    return response.data;
  },
};

export default weddingService;


