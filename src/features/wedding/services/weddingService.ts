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
   * Update a checklist task by index.
   */
  updateTask: async (index: number, taskData: any) => {
    const response = await axiosInstance.patch(`/wedding/tasks/${index}`, taskData);
    return response.data;
  },

  /**
   * Delete a checklist task by index.
   */
  deleteTask: async (index: number) => {
    const response = await axiosInstance.delete(`/wedding/tasks/${index}`);
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

  clearAllTasks: async () => {
    const res = await axiosInstance.get('/wedding/project');
    const checklist = res.data?.data?.checklist || [];
    // Delete in reverse to maintain stable indices and emit partner realtime updates.
    for (let i = checklist.length - 1; i >= 0; i--) {
      await axiosInstance.delete(`/wedding/tasks/${i}`);
    }
    return { success: true };
  },

  clearAllExpenses: async () => {
    try {
      const response = await axiosInstance.put('/wedding/budget', { expenses: [] });
      return response.data;
    } catch (err) {
      console.warn('Bulk clear all expenses failed, falling back to individual deletes', err);
      const res = await axiosInstance.get('/wedding/budget');
      const expenses = res.data?.data?.expenses || [];
      // Delete in reverse to maintain indices
      for (let i = expenses.length - 1; i >= 0; i--) {
        await axiosInstance.delete(`/wedding/expenses/${i}`);
      }
    }
  },

  deleteMultipleTasks: async (indices: number[]) => {
    const sortedUniqueIndices = [...new Set(indices)]
      .filter((idx) => Number.isInteger(idx) && idx >= 0)
      .sort((a, b) => b - a);

    for (const idx of sortedUniqueIndices) {
      await axiosInstance.delete(`/wedding/tasks/${idx}`);
    }

    return { success: true };
  },

  deleteMultipleExpenses: async (indices: number[]) => {
    try {
      const budgetRes = await axiosInstance.get('/wedding/budget');
      const expenses = budgetRes.data?.data?.expenses || [];
      const updated = expenses.filter((_: any, idx: number) => !indices.includes(idx));
      return await axiosInstance.put('/wedding/budget', { expenses: updated });
    } catch (err) {
      console.warn('Bulk delete multiple expenses failed, falling back to individual deletes', err);
      const sortedIndices = [...indices].sort((a, b) => b - a);
      for (const idx of sortedIndices) {
        await axiosInstance.delete(`/wedding/expenses/${idx}`);
      }
    }
  }
};

export default weddingService;

