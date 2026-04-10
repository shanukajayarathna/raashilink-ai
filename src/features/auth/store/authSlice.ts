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

function sanitizeCachedUser(user: any) {
  if (!user) return null;

  const mainPhoto = Array.isArray(user.photos)
    ? user.photos.find((photo: any) => photo?.isMain)?.url || user.photos[0]?.url || null
    : null;

  return {
    id: user.id || user._id || null,
    _id: user._id || user.id || null,
    name:
      user.name ||
      [user.firstName || user.personalInfo?.firstName, user.lastName || user.personalInfo?.lastName]
        .filter(Boolean)
        .join(' ')
        .trim() ||
      'User',
    firstName: user.firstName || user.personalInfo?.firstName || '',
    lastName: user.lastName || user.personalInfo?.lastName || '',
    email: user.email || '',
    phone: user.phone || user.personalInfo?.phone || '',
    role: user.role || null,
    profileType: user.profileType || null,
    location: user.location || user.personalInfo?.location || 'Sri Lanka',
    age: user.age ?? user.personalInfo?.age ?? null,
    gender: user.gender || user.personalInfo?.gender || null,
    tagline: user.tagline || '',
    bio: user.bio || '',
    ethnicity: user.ethnicity || user.personalInfo?.ethnicity || '',
    height: user.height || user.personalInfo?.height || '',
    profilePic: user.profilePic || mainPhoto || null,
    verification: user.verification || {},
    personalInfo: {
      firstName: user.firstName || user.personalInfo?.firstName || '',
      lastName: user.lastName || user.personalInfo?.lastName || '',
      phone: user.phone || user.personalInfo?.phone || '',
      age: user.age ?? user.personalInfo?.age ?? null,
      gender: user.gender || user.personalInfo?.gender || null,
      location: user.location || user.personalInfo?.location || 'Sri Lanka',
      ethnicity: user.ethnicity || user.personalInfo?.ethnicity || '',
      height: user.height || user.personalInfo?.height || '',
    },
    lifestyle: user.lifestyle
      ? {
          educationLevel: user.lifestyle.educationLevel || '',
          professionType: user.lifestyle.professionType || '',
          religion: user.lifestyle.religion || '',
          languages: Array.isArray(user.lifestyle.languages) ? user.lifestyle.languages : [],
          hobbies: Array.isArray(user.lifestyle.hobbies) ? user.lifestyle.hobbies : [],
          diet: user.lifestyle.diet || '',
          smoking: user.lifestyle.smoking || '',
          drinking: user.lifestyle.drinking || '',
        }
      : undefined,
    photos: user.profilePic || mainPhoto ? [{ url: user.profilePic || mainPhoto, isMain: true }] : [],
  };
}

function readCachedUser() {
  try {
    return sanitizeCachedUser(JSON.parse(localStorage.getItem('user') || 'null'));
  } catch {
    localStorage.removeItem('user');
    return null;
  }
}

function persistCachedUser(user: any) {
  const sanitized = sanitizeCachedUser(user);

  if (sanitized) {
    localStorage.setItem('user', JSON.stringify(sanitized));
  } else {
    localStorage.removeItem('user');
  }

  return sanitized;
}

const cachedUser = readCachedUser();

const initialState: AuthState = {
  user: cachedUser,
  token: localStorage.getItem('token'),
  role: cachedUser?.role || null,
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
      persistCachedUser(data.user);
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
      const data = await userService.getProfile({ includeMedia: false });
      persistCachedUser(data);
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
      persistCachedUser(action.payload.user);
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
      persistCachedUser(state.user);
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

