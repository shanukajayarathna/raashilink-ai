import axios from 'axios';
import { store } from '@/app/store/store';

const envApiHost =
  (typeof process !== 'undefined' ? process.env.REACT_APP_API_URL : undefined) ||
  import.meta.env.VITE_API_URL ||
  '';

function resolveApiHost() {
  if (typeof window !== 'undefined') {
    const isLocalFrontend = ['localhost', '127.0.0.1'].includes(window.location.hostname);
    if (isLocalFrontend) {
      return '';
    }
  }

  return envApiHost;
}

const api = axios.create({
  baseURL: resolveApiHost(),
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add JWT token
api.interceptors.request.use(
  (config) => {
    const state = store.getState();
    const token = state.auth.token || localStorage.getItem('token');
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized (e.g., logout)
      // store.dispatch(logout());
    }
    return Promise.reject(error);
  }
);

export default api;


