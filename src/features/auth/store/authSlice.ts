import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import authService from '../services/authService';
import userService from '@/features/profile/services/userService';

interface AuthState {
  user: any | null;
  token: string | null;
  role: 'user' | 'vendor' | 'admin' | null;
  isAuthenticated: boolean;
  onboardingComplete: boolean;
  loading: boolean;
  error: string | null;
}

const MAX_CACHED_MEDIA_URL_LENGTH = 2048;

function isCacheableMediaUrl(value: unknown) {
  return typeof value === 'string' && value.length > 0 && value.length <= MAX_CACHED_MEDIA_URL_LENGTH && !value.startsWith('data:');
}

function sanitizeCachedUser(user: any) {
  if (!user) return null;

  const sourcePhotos = Array.isArray(user.photos)
    ? user.photos
    : Array.isArray(user.personalInfo?.photos)
      ? user.personalInfo.photos
      : [];
  const cacheablePhotos = sourcePhotos
    .filter((photo: any) => isCacheableMediaUrl(photo?.url))
    .map((photo: any) => ({ ...photo, url: photo.url }));
  const mainPhoto = cacheablePhotos.find((photo: any) => photo?.isMain)?.url || cacheablePhotos[0]?.url || null;
  const rawProfilePic = user.profilePic || user.personalInfo?.profilePic || mainPhoto || null;
  const profilePic = isCacheableMediaUrl(rawProfilePic) ? rawProfilePic : mainPhoto;

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
    userType: user.userType || null,
    onboardingComplete: user.onboardingComplete !== false,
    profileType: user.profileType || null,
    location: user.location || user.personalInfo?.location || 'Sri Lanka',
    age: user.age ?? user.personalInfo?.age ?? null,
    gender: user.gender || user.personalInfo?.gender || null,
    tagline: user.tagline || '',
    bio: user.bio || '',
    birthDate:
      user.birthDate ||
      (user.birthData?.dateOfBirth ? new Date(user.birthData.dateOfBirth).toISOString().split('T')[0] : ''),
    birthTime:
      user.knownBirthTime === false || user.birthData?.knownBirthTime === false
        ? ''
        : user.birthTime || user.birthData?.timeOfBirth || '',
    birthPlace: user.birthPlace || user.birthData?.placeOfBirth?.city || '',
    knownBirthTime:
      typeof user.knownBirthTime === 'boolean'
        ? user.knownBirthTime
        : user.birthData?.knownBirthTime !== false,
    birthData: user.birthData
      ? {
          dateOfBirth: user.birthData.dateOfBirth || null,
          timeOfBirth: user.birthData.knownBirthTime === false ? '' : user.birthData.timeOfBirth || '',
          knownBirthTime: user.birthData.knownBirthTime !== false,
          placeOfBirth: user.birthData.placeOfBirth || null,
        }
      : undefined,
    horoscopeData: user.horoscopeData || undefined,
    personality: user.personality || undefined,
    personalityAnswers: Array.isArray(user.personalityAnswers) ? user.personalityAnswers : undefined,
    ethnicity: user.ethnicity || user.personalInfo?.ethnicity || '',
    height: user.height || user.personalInfo?.height || '',
    profilePic,
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
    photos: profilePic ? [{ url: profilePic, isMain: true }] : cacheablePhotos,
  };
}

function normalizeUserForState(user: any) {
  if (!user) return null;

  const sanitized = sanitizeCachedUser(user);
  if (!sanitized) return null;

  const sourcePhotos = Array.isArray(user.photos)
    ? user.photos
    : Array.isArray(user.personalInfo?.photos)
      ? user.personalInfo.photos
      : [];

  const normalizedPhotos = sourcePhotos
    .filter((photo: any) => typeof photo?.url === 'string' && photo.url.length > 0)
    .map((photo: any) => ({ ...photo, url: photo.url }));
  const mainPhoto = normalizedPhotos.find((photo: any) => photo?.isMain)?.url || normalizedPhotos[0]?.url || null;
  const rawProfilePic = user.profilePic || user.personalInfo?.profilePic || mainPhoto || sanitized.profilePic || null;

  return {
    ...sanitized,
    profilePic: typeof rawProfilePic === 'string' && rawProfilePic.length > 0 ? rawProfilePic : null,
    photos:
      typeof rawProfilePic === 'string' && rawProfilePic.length > 0
        ? [{ url: rawProfilePic, isMain: true }]
        : normalizedPhotos,
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

  try {
    if (sanitized) {
      localStorage.setItem('user', JSON.stringify(sanitized));
    } else {
      localStorage.removeItem('user');
    }
  } catch {
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
  onboardingComplete: cachedUser?.onboardingComplete !== false,
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
 * Async thunk for Google OAuth sign-in.
 */
export const googleLogin = createAsyncThunk(
  'auth/googleLogin',
  async (credential: string, { rejectWithValue }) => {
    try {
      const data = await authService.googleAuth(credential);
      localStorage.setItem('token', data.data.token);
      if (data.data.onboardingComplete !== false) {
        persistCachedUser(data.data.user);
      }
      return data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Google sign-in failed');
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
  async (_, { rejectWithValue, getState }) => {
    try {
      const data = await userService.getProfile({ includeMedia: true });
      const existingUser = (getState() as { auth?: AuthState })?.auth?.user || readCachedUser();
      const mergedUser = {
        ...(existingUser || {}),
        ...data,
        profilePic: data?.profilePic || existingUser?.profilePic || null,
        photos:
          Array.isArray(data?.photos) && data.photos.length > 0
            ? data.photos
            : existingUser?.photos || [],
        coverPhoto: data?.coverPhoto || existingUser?.coverPhoto || null,
      };

      persistCachedUser(mergedUser);
      return mergedUser;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch profile');
    }
  },
  {
    condition: (_, { getState }) => {
      const state = getState() as { auth?: AuthState };
      return !state.auth?.loading;
    },
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    /**
     * Set user credentials and session.
     */
    setCredentials: (state, action: PayloadAction<{ user: any; token: string; role: any; onboardingComplete?: boolean }>) => {
      const mergedUser = { ...(state.user || {}), ...(action.payload.user || {}) };
      persistCachedUser(mergedUser);
      const normalizedUser = normalizeUserForState(mergedUser);
      state.user = normalizedUser;
      state.token = action.payload.token;
      state.role = action.payload.role || normalizedUser?.role || null;
      state.isAuthenticated = true;
      state.onboardingComplete = action.payload.onboardingComplete !== false;
      localStorage.setItem('token', action.payload.token);
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
      const mergedUser = { ...state.user, ...action.payload };
      persistCachedUser(mergedUser);
      state.user = normalizeUserForState(mergedUser);
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
        const mergedUser = { ...(state.user || {}), ...(action.payload.user || {}) };
        persistCachedUser(mergedUser);
        state.user = normalizeUserForState(mergedUser);
        state.token = action.payload.token;
        state.role = action.payload.role || action.payload.user?.role || null;
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
        state.user = normalizeUserForState(action.payload);
      })
      .addCase(fetchProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Google Login
      .addCase(googleLogin.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(googleLogin.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.token = action.payload.token;
        state.onboardingComplete = action.payload.onboardingComplete !== false;
        const normalizedUser = normalizeUserForState(action.payload.user);
        state.user = normalizedUser;
        state.role = action.payload.user?.role || null;
      })
      .addCase(googleLogin.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

  },
});

export const { logout, updateUser, clearError, setCredentials } = authSlice.actions;
export default authSlice.reducer;

