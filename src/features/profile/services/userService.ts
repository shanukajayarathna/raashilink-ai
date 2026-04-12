import axiosInstance from '@/shared/config/axiosConfig';

/**
 * User Service for RaashiLink.AI
 * Handles user profile management, photo uploads, and account settings.
 */
const userService = {
  /**
   * Get current user's profile information.
   * @returns {Promise<object>} - User profile data.
   */
  getProfile: async (options?: { includeMedia?: boolean }) => {
    const response = await axiosInstance.get('/users/profile', {
      params: options?.includeMedia === undefined ? undefined : { includeMedia: options.includeMedia },
    });
    return response.data;
  },

  searchBirthPlaces: async (query: string, limit = 5) => {
    const response = await axiosInstance.get('/auth/birth-place-suggestions', {
      params: { query, limit },
    });
    return response.data?.data || [];
  },

  requestVerificationOtp: async (channel: 'email' | 'phone') => {
    const response = await axiosInstance.post('/users/verification/request', { channel });
    return response.data;
  },

  confirmVerificationOtp: async (payload: { channel: 'email' | 'phone'; otp: string }) => {
    const response = await axiosInstance.post('/users/verification/confirm', payload);
    return response.data;
  },

  /**
   * Update current user's profile information.
   * @param {object} profileData - Updated user profile details.
   * @returns {Promise<object>} - Updated user profile data.
   */
  updateProfile: async (profileData: any) => {
    const response = await axiosInstance.put('/users/profile', profileData);
    return response.data;
  },

  /**
   * Upload current user's profile photo.
   * @param {FormData} photoData - User's profile photo file.
   * @returns {Promise<object>} - Uploaded profile photo URL.
   */
  uploadPhoto: async (photoData: FormData) => {
    const response = await axiosInstance.post('/users/profile/photo', photoData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  uploadGalleryPhoto: async (photoData: FormData) => {
    const response = await axiosInstance.post('/users/profile/photos', photoData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  /**
   * Upload cover photo for the current user.
   * @param {File} coverPhoto - The cover photo file to upload.
   * @returns {Promise<object>} - Uploaded cover photo URL.
   */
  uploadCoverPhoto: async (coverPhoto: File) => {
    const formData = new FormData();
    formData.append('coverPhoto', coverPhoto);
    const response = await axiosInstance.post('/users/profile/cover-photo', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  removePhoto: async () => {
    const response = await axiosInstance.delete('/users/profile/photo');
    return response.data;
  },

  removeGalleryPhoto: async (photoId: number) => {
    const response = await axiosInstance.delete(`/users/profile/photos/${photoId}`);
    return response.data;
  },

  removeCoverPhoto: async () => {
    const response = await axiosInstance.delete('/users/profile/cover-photo');
    return response.data;
  },

  /**
   * Permanently delete current user's account.
   * @returns {Promise<object>} - Deletion status.
   */
  deleteAccount: async () => {
    const response = await axiosInstance.delete('/users/account');
    return response.data;
  },

  /**
   * Export current user's data in JSON format.
   * @returns {Promise<object>} - Exported user data.
   */
  exportData: async () => {
    const response = await axiosInstance.get('/users/export');
    return response.data;
  },
};

export default userService;


