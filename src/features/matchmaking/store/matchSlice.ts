import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import matchService from '../services/matchService';

interface MatchState {
  matches: any[];
  currentMatch: any | null;
  interestTracking: {
    interested: string[];
    pending: string[];
  };
  loading: boolean;
  error: string | null;
}

const initialState: MatchState = {
  matches: [],
  currentMatch: null,
  interestTracking: {
    interested: [],
    pending: [],
  },
  loading: false,
  error: null,
};

/**
 * Async thunk for fetching match recommendations.
 */
export const fetchRecommendations = createAsyncThunk(
  'match/fetchRecommendations',
  async (params: any = {}, { rejectWithValue }) => {
    try {
      const data = await matchService.getRecommendations(params);
      return data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch recommendations');
    }
  }
);

/**
 * Async thunk for fetching match details.
 */
export const fetchMatchDetail = createAsyncThunk(
  'match/fetchMatchDetail',
  async (matchId: string, { rejectWithValue }) => {
    try {
      const data = await matchService.getMatchDetail(matchId);
      return data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch match details');
    }
  }
);

/**
 * Async thunk for expressing interest in a match.
 */
export const expressInterest = createAsyncThunk(
  'match/expressInterest',
  async (matchId: string, { rejectWithValue }) => {
    try {
      const data = await matchService.expressInterest(matchId);
      return { matchId, data };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to express interest');
    }
  }
);

const matchSlice = createSlice({
  name: 'match',
  initialState,
  reducers: {
    /**
     * Set current match in state.
     */
    setCurrentMatch: (state, action: PayloadAction<any>) => {
      state.currentMatch = action.payload;
    },
    /**
     * Clear current match from state.
     */
    clearCurrentMatch: (state) => {
      state.currentMatch = null;
    },
    /**
     * Clear match error.
     */
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Recommendations
      .addCase(fetchRecommendations.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRecommendations.fulfilled, (state, action) => {
        state.loading = false;
        state.matches = action.payload;
      })
      .addCase(fetchRecommendations.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Fetch Match Detail
      .addCase(fetchMatchDetail.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMatchDetail.fulfilled, (state, action) => {
        state.loading = false;
        state.currentMatch = action.payload;
      })
      .addCase(fetchMatchDetail.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Express Interest
      .addCase(expressInterest.pending, (state, action) => {
        state.interestTracking.pending.push(action.meta.arg);
      })
      .addCase(expressInterest.fulfilled, (state, action) => {
        state.interestTracking.pending = state.interestTracking.pending.filter(id => id !== action.payload.matchId);
        state.interestTracking.interested.push(action.payload.matchId);
      })
      .addCase(expressInterest.rejected, (state, action) => {
        state.interestTracking.pending = state.interestTracking.pending.filter(id => id !== action.meta.arg);
        state.error = action.payload as string;
      });
  },
});

export const { setCurrentMatch, clearCurrentMatch, clearError } = matchSlice.actions;
export default matchSlice.reducer;

