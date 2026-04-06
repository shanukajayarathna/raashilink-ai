import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { store } from '@/app/store/store';
import { logout } from '@/features/auth/store/authSlice';
import { showNotification } from '@/app/store/uiSlice';

const envApiHost =
  (typeof process !== 'undefined' ? process.env.REACT_APP_API_URL : undefined) ||
  import.meta.env.VITE_API_URL ||
  '';

function resolveApiBaseUrl() {
  if (typeof window !== 'undefined') {
    const isLocalFrontend = ['localhost', '127.0.0.1'].includes(window.location.hostname);
    if (isLocalFrontend) {
      return '/api/v1';
    }
  }

  if (!envApiHost) {
    return '/api/v1';
  }

  return envApiHost.endsWith('/api/v1') ? envApiHost : `${envApiHost}/api/v1`;
}

const API_BASE_URL = resolveApiBaseUrl();

/**
 * Axios instance configuration for RaashiLink.AI
 * Includes base URL, request/response interceptors, and error handling.
 */
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds timeout for slower compatibility and AI routes
});

// Request Interceptor: Attach JWT token to all outgoing requests
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Logging in development mode
    if (import.meta.env.MODE === 'development') {
      console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`, config.data || '');
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Handle global errors (401, 500, Network errors)
axiosInstance.interceptors.response.use(
  (response) => {
    if (import.meta.env.MODE === 'development') {
      console.log(`[API Response] ${response.status} ${response.config.url}`, response.data);
    }
    return response;
  },
  async (error: AxiosError) => {
    const { response, message } = error;
    const requestUrl = error.config?.url || '';
    const isAuthEntryRequest =
      requestUrl.includes('/auth/login') ||
      requestUrl.includes('/auth/register') ||
      requestUrl.includes('/auth/request-registration-otp') ||
      requestUrl.includes('/auth/verify-otp') ||
      requestUrl.includes('/auth/forgot-password') ||
      requestUrl.includes('/auth/reset-password');

    // Handle 401 Unauthorized (Token expired or invalid)
    if (response?.status === 401 && !isAuthEntryRequest) {
      const hasToken = !!localStorage.getItem('token');
      if (hasToken) {
        store.dispatch(logout());
        store.dispatch(showNotification({
          message: 'Session expired. Please login again.',
          type: 'error'
        }));
        // Redirect to login if not already there
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
      // If no token, user likely logged out, don't show session expired message
    }

    // Handle 500 Internal Server Error
    else if (response?.status === 500 && !isAuthEntryRequest) {
      store.dispatch(showNotification({
        message: 'Internal Server Error. Our team is working on it.',
        type: 'error'
      }));
    }

    // Handle Network Errors / Timeout
    else if (
      message === 'Network Error' ||
      error.code === 'ECONNABORTED' ||
      error.code === 'ECONNREFUSED'
    ) {
      store.dispatch(showNotification({
        message:
          'Could not reach the API server. If you are running locally, make sure the backend is running and try again.',
        type: 'error',
        action: 'retry',
      }));
    }

    // Generic error handling
    else if (response?.data) {
      const apiError = (response.data as any).message || 'An unexpected error occurred.';
      store.dispatch(showNotification({
        message: apiError,
        type: 'error'
      }));
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;


