import axiosInstance from '@/shared/config/axiosConfig';

/**
 * Authentication Service for RaashiLink.AI
 * Handles user login, registration, OTP verification, and password management.
 */
const authService = {
  requestRegistrationOtp: async (payload: any) => {
    const response = await axiosInstance.post('/auth/request-registration-otp', payload);
    return response.data;
  },

  /**
   * Login user with email and password.
   * @param {object} credentials - User email and password.
   * @returns {Promise<object>} - User data and JWT token.
   */
  login: async (credentials: any) => {
    const response = await axiosInstance.post('/auth/login', {
      identifier: credentials.identifier || credentials.email,
      password: credentials.password,
    });
    return response.data;
  },

  /**
   * Register a new user.
   * @param {object} userData - User registration details.
   * @returns {Promise<object>} - Registered user data.
   */
  register: async (userData: any) => {
    const response = await axiosInstance.post('/auth/register', userData);
    return response.data;
  },

  /**
   * Verify OTP for user registration or password reset.
   * @param {object} otpData - User email and OTP code.
   * @returns {Promise<object>} - Verification status.
   */
  verifyOTP: async (otpData: any) => {
    const response = await axiosInstance.post('/auth/verify-otp', otpData);
    return response.data;
  },

  /**
   * Logout user and clear session.
   * @returns {Promise<object>} - Logout status.
   */
  logout: async () => {
    const response = await axiosInstance.post('/auth/logout');
    return response.data;
  },

  /**
   * Refresh JWT access token using refresh token.
   * @returns {Promise<object>} - New access token.
   */
  refreshToken: async () => {
    const response = await axiosInstance.post('/auth/refresh-token');
    return response.data;
  },

  /**
   * Send a password reset OTP to the user's registered email or phone.
   * @param {string} identifier - User's registered email or phone.
   * @returns {Promise<object>} - Request status.
   */
  forgotPassword: async (identifier: string) => {
    const response = await axiosInstance.post('/auth/forgot-password', { identifier });
    return response.data;
  },

  /**
   * Reset user password using reset token.
   * @param {object} resetData - Reset token and new password.
   * @returns {Promise<object>} - Reset status.
   */
  resetPassword: async (resetData: any) => {
    const response = await axiosInstance.post('/auth/reset-password', resetData);
    return response.data;
  },
};

export default authService;


