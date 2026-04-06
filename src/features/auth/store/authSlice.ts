import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import authService from '../services/authService';
import userService from '@/features/profile/services/userService';

interface AuthState {
  user: any | null;
  token: string | null;
  role: 'user' | 'vendor' | 'admin' | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  token: localStorage.getItem('token'),
  role: (JSON.parse(localStorage.getItem('user') || 'null'))?.role || null,
  isAuthenticated: !!localStorage.getItem('token'),
  loading: false,
  error: null,
};

/**
 * Async thunk for user login.
 */
export const loginUser = createAsyncThunk(
  'auth/login',
  async (credentials: any, { rejectWithValue }) => {
    try {
      const data = await authService.login(credentials);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      return data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Login failed');
    }
  }
);

/**
 * Async thunk for user registration.
 */
export const registerUser = createAsyncThunk(
  'auth/register',
  async (userData: any, { rejectWithValue }) => {
    try {
      const data = await authService.register(userData);
      return data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Registration failed');
    }
  }
);

/**
 * Async thunk for fetching user profile.
 */
export const fetchProfile = createAsyncThunk(
  'auth/fetchProfile',
  async (_, { rejectWithValue }) => {
    try {
      const data = await userService.getProfile();
      localStorage.setItem('user', JSON.stringify(data));
      return data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch profile');
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    /**
     * Set user credentials and session.
     */
    setCredentials: (state, action: PayloadAction<{ user: any; token: string; role: any }>) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.role = action.payload.role;
      state.isAuthenticated = true;
      localStorage.setItem('token', action.payload.token);
      localStorage.setItem('user', JSON.stringify(action.payload.user));
    },
    /**
     * Logout user and clear session.
     */
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.role = null;
      state.isAuthenticated = false;
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    },
    /**
     * Update current user's information.
     */
    updateUser: (state, action: PayloadAction<any>) => {
      state.user = { ...state.user, ...action.payload };
      localStorage.setItem('user', JSON.stringify(state.user));
    },
    /**
     * Clear authentication error.
     */
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Register
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Fetch Profile
      .addCase(fetchProfile.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
      })
      .addCase(fetchProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { logout, updateUser, clearError, setCredentials } = authSlice.actions;
export default authSlice.reducer;

