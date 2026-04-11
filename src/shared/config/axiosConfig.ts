import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { showNotification } from '@/app/store/uiSlice';

// Extend InternalAxiosRequestConfig to include metadata
declare module 'axios' {
  interface InternalAxiosRequestConfig {
    metadata?: {
      startTime: number;
      retryCount: number;
    };
  }
}

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

async function getAppStore() {
  const storeModule = await import('@/app/store/store');
  return storeModule.store;
}

/**
 * Axios instance configuration for RaashiLink.AI
 * Includes base URL, request/response interceptors, error handling, and retry logic.
 */
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds timeout for slower compatibility and AI routes
});

// Retry configuration
const RETRY_CONFIG = {
  maxRetries: 3,
  retryDelay: 1000, // Start with 1 second
  retryableStatuses: [408, 429, 500, 502, 503, 504],
  retryableMethods: ['GET', 'HEAD', 'OPTIONS', 'PUT', 'DELETE', 'PATCH'],
};

// Request Interceptor: Attach JWT token to all outgoing requests
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Initialize retry count
    if (!config.metadata) {
      config.metadata = { startTime: Date.now(), retryCount: 0 };
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
    const { response, message, config } = error;
    const requestUrl = error.config?.url || '';
    const isAuthEntryRequest =
      requestUrl.includes('/auth/login') ||
      requestUrl.includes('/auth/register') ||
      requestUrl.includes('/auth/request-registration-otp') ||
      requestUrl.includes('/auth/verify-otp') ||
      requestUrl.includes('/auth/forgot-password') ||
      requestUrl.includes('/auth/reset-password');

    // Exponential backoff retry logic for network errors and retryable status codes
    if (config) {
      const metadata = (config as any).metadata || { retryCount: 0 };
      const isRetryableStatus = RETRY_CONFIG.retryableStatuses.includes(response?.status || 0);
      const isRetryableMethod = RETRY_CONFIG.retryableMethods.includes(config.method?.toUpperCase() || 'GET');
      const isNetworkError =
        message === 'Network Error' ||
        error.code === 'ECONNABORTED' ||
        error.code === 'ECONNREFUSED' ||
        message === 'ECONNRESET';

      // Retry if conditions are met and we haven't exceeded max retries
      if (
        (isRetryableStatus || isNetworkError) &&
        isRetryableMethod &&
        metadata.retryCount < RETRY_CONFIG.maxRetries &&
        !isAuthEntryRequest
      ) {
        metadata.retryCount += 1;
        const exponentialDelay = RETRY_CONFIG.retryDelay * Math.pow(2, metadata.retryCount - 1);

        console.warn(
          `[Retry ${metadata.retryCount}/${RETRY_CONFIG.maxRetries}] ${config.method?.toUpperCase()} ${config.url} after ${exponentialDelay}ms`
        );

        // Update config metadata and retry
        (config as any).metadata = metadata;

        // Wait before retrying
        await new Promise((resolve) => setTimeout(resolve, exponentialDelay));

        return axiosInstance.request(config);
      }
    }

    // Handle 401 Unauthorized (Token expired or invalid)
    if (response?.status === 401 && !isAuthEntryRequest) {
      const hasToken = !!localStorage.getItem('token');
      if (hasToken) {
        const [{ logout }, appStore] = await Promise.all([
          import('@/features/auth/store/authSlice'),
          getAppStore(),
        ]);

        appStore.dispatch(logout());
        appStore.dispatch(
          showNotification({
            message: 'Session expired. Please login again.',
            type: 'error',
          })
        );
        // Redirect to login if not already there
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
      // If no token, user likely logged out, don't show session expired message
    } else if (response?.status === 500 && !isAuthEntryRequest) {
      const appStore = await getAppStore();
      appStore.dispatch(
        showNotification({
          message: 'Internal Server Error. Our team is working on it.',
          type: 'error',
        })
      );
    } else if (
      message === 'Network Error' ||
      error.code === 'ECONNABORTED' ||
      error.code === 'ECONNREFUSED'
    ) {
      // Only show this if we've exhausted all retries
      if ((config as any)?.metadata?.retryCount >= RETRY_CONFIG.maxRetries || !config) {
        const appStore = await getAppStore();
        appStore.dispatch(
          showNotification({
            message:
              'Could not reach the API server. If you are running locally, make sure the backend is running and try again.',
            type: 'error',
            action: 'retry',
          })
        );
      }
    } else if (response?.data) {
      const apiError = (response.data as any).message || 'An unexpected error occurred.';
      const appStore = await getAppStore();
      appStore.dispatch(
        showNotification({
          message: apiError,
          type: 'error',
        })
      );
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;


