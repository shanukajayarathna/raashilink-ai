import axiosInstance from '@/shared/config/axiosConfig';

const LOGIN_STARTUP_RETRY_LIMIT = 4;
const LOGIN_STARTUP_RETRY_DELAY_MS = 800;
const LOGIN_STARTUP_RETRYABLE_STATUSES = new Set([502, 503, 504]);

function isStartupRetryableError(error: any) {
  return (
    error?.code === 'ERR_NETWORK' ||
    error?.code === 'ECONNABORTED' ||
    error?.code === 'ECONNREFUSED' ||
    LOGIN_STARTUP_RETRYABLE_STATUSES.has(error?.response?.status)
  );
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Authentication Service for RaashiLink.AI
 * Handles user login, registration, OTP verification, and password management.
 */
const authService = {
  /**
   * Check if email or phone is already registered
   * @param {string} email - Email to check
   * @param {string} phone - Phone to check
   * @returns {Promise<object>} - Availability status { emailAvailable, phoneAvailable }
   */
  checkAvailability: async (email?: string, phone?: string) => {
    const response = await axiosInstance.post('/auth/check-availability', { email, phone });
    return response.data?.data || {};
  },

  searchBirthPlaces: async (query: string, limit = 5) => {
    const response = await axiosInstance.get('/auth/birth-place-suggestions', {
      params: { query, limit },
    });
    return response.data?.data || [];
  },

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
    const payload = {
      identifier: credentials.identifier || credentials.email,
      password: credentials.password,
    };

    let lastError: any;

    for (let attempt = 0; attempt < LOGIN_STARTUP_RETRY_LIMIT; attempt += 1) {
      try {
        const response = await axiosInstance.post('/auth/login', payload);
        return response.data;
      } catch (error: any) {
        lastError = error;

        if (!isStartupRetryableError(error) || attempt === LOGIN_STARTUP_RETRY_LIMIT - 1) {
          break;
        }

        await wait(LOGIN_STARTUP_RETRY_DELAY_MS * (attempt + 1));
      }
    }

    throw lastError;
  },

  /**
   * Register a new user.
   * @param {object} userData - User registration details.
   * @returns {Promise<object>} - Registered user data.
   */
  register: async (userData: any) => {
    const response = await axiosInstance.post('/auth/register', userData, userData instanceof FormData
      ? { headers: { 'Content-Type': 'multipart/form-data' } }
      : undefined);
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


