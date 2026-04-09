import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import horoscopeService from '../services/horoscopeService';

interface CompatibilityCache {
  [key: string]: any; // key format: "userAId:userBId"
}

interface HoroscopeState {
  myChart: any | null;
  compatibility: any | null;
  compatibilityCache: CompatibilityCache;
  isLoading: boolean;
  isCalculating: boolean;
  error: string | null;
}

const initialState: HoroscopeState = {
  myChart: null,
  compatibility: null,
  compatibilityCache: {},
  isLoading: false,
  isCalculating: false,
  error: null,
};

// Async thunk for fetching user's birth chart
export const fetchMyChart = createAsyncThunk(
  'horoscope/fetchMyChart',
  async (_, { rejectWithValue }) => {
    try {
      return await horoscopeService.getMyChart();
    } catch (error: any) {
      if ([404, 422].includes(error.response?.status)) {
        try {
          return await horoscopeService.generateMyChart();
        } catch (generateError: any) {
          return rejectWithValue(generateError.response?.data?.message || 'Failed to generate birth chart');
        }
      }

      return rejectWithValue(error.response?.data?.message || 'Failed to load birth chart');
    }
  }
);

// Async thunk for calculating compatibility between two users
export const calculateCompatibility = createAsyncThunk(
  'horoscope/calculateCompatibility',
  async ({ userAId, userBId }: { userAId: string; userBId: string }, { rejectWithValue }) => {
    try {
      const response = await horoscopeService.calculateCompatibility(userAId, userBId);
      return { data: response.data, cacheKey: `${userAId}:${userBId}` };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to calculate compatibility');
    }
  }
);

const horoscopeSlice = createSlice({
  name: 'horoscope',
  initialState,
  reducers: {
    clearCompatibility: (state) => {
      state.compatibility = null;
      state.error = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch My Chart
    builder
      .addCase(fetchMyChart.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchMyChart.fulfilled, (state, action) => {
        state.isLoading = false;
        state.myChart = action.payload;
      })
      .addCase(fetchMyChart.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Calculate Compatibility
    builder
      .addCase(calculateCompatibility.pending, (state) => {
        state.isCalculating = true;
        state.error = null;
      })
      .addCase(calculateCompatibility.fulfilled, (state, action) => {
        state.isCalculating = false;
        state.compatibility = action.payload.data;
        state.compatibilityCache[action.payload.cacheKey] = action.payload.data;
      })
      .addCase(calculateCompatibility.rejected, (state, action) => {
        state.isCalculating = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearCompatibility, clearError } = horoscopeSlice.actions;
export default horoscopeSlice.reducer;
