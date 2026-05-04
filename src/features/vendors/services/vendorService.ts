import axiosInstance from '@/shared/config/axiosConfig';

/**
 * Vendor Service for RaashiLink.AI
 * Handles vendor search, details, quotes, and reviews.
 */
const vendorService = {
  /**
   * Search for wedding vendors based on specific criteria.
   * @param {object} params - Query parameters for filtering vendors.
   * @returns {Promise<object>} - List of wedding vendors.
   */
  searchVendors: async (params: any = {}) => {
    const response = await axiosInstance.get('/vendors/search', { params });
    return response.data;
  },

  /**
   * Get detailed information for a specific wedding vendor.
   * @param {string} vendorId - ID of the vendor to retrieve.
   * @returns {Promise<object>} - Vendor details and service packages.
   */
  getVendorDetail: async (vendorId: string) => {
    const response = await axiosInstance.get(`/vendors/${vendorId}`);
    return response.data;
  },

  /**
   * Submit a quote request to a specific wedding vendor.
   * @param {object} quoteData - Quote request details (vendor ID, service, etc.).
   * @returns {Promise<object>} - Quote request status.
   */
  submitQuote: async (quoteData: any) => {
    const response = await axiosInstance.post('/vendors/quotes/submit', quoteData);
    return response.data;
  },

  getQuoteInbox: async () => {
    const response = await axiosInstance.get('/vendors/quotes/inbox');
    return response.data;
  },

  getVendorProfile: async () => {
    const response = await axiosInstance.get('/vendors/profile');
    return response.data;
  },

  updateVendorProfile: async (data: any) => {
    const response = await axiosInstance.patch('/vendors/profile', data);
    return response.data;
  },

  updateQuoteRequest: async (quoteRequestId: string, data: any) => {
    const response = await axiosInstance.patch(`/vendors/quotes/${quoteRequestId}`, data);
    return response.data;
  },

  uploadPortfolioImages: async (files: File[], onProgress?: (percent: number) => void) => {
    const formData = new FormData();
    files.forEach((file) => formData.append('images', file));
    const response = await axiosInstance.post('/vendors/portfolio/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: onProgress
        ? (event) => {
            const percent = event.total ? Math.round((event.loaded * 100) / event.total) : 0;
            onProgress(percent);
          }
        : undefined,
    });
    return response.data;
  },

  removePortfolioImage: async (imageUrl: string) => {
    const response = await axiosInstance.delete('/vendors/portfolio/image', { data: { imageUrl } });
    return response.data;
  },

  /**
   * Get reviews for a specific wedding vendor.
   * @param {string} vendorId - ID of the vendor to retrieve reviews for.
   * @param {object} params - Query parameters for pagination and filtering.
   * @returns {Promise<object>} - List of vendor reviews.
   */
  getReviews: async (vendorId: string, params: any = {}) => {
    const response = await axiosInstance.get(`/vendors/${vendorId}/reviews`, { params });
    return response.data;
  },
};

export default vendorService;


