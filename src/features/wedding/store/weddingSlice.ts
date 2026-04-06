import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import weddingService from '../services/weddingService';

interface WeddingState {
  project: any | null;
  tasks: any[];
  expenses: any[];
  budget: {
    total: number;
    spent: number;
    remaining: number;
    breakdown: any[];
  };
  vendors: any[];
  loading: boolean;
  error: string | null;
}

const initialState: WeddingState = {
  project: null,
  tasks: [],
  expenses: [],
  budget: {
    total: 0,
    spent: 0,
    remaining: 0,
    breakdown: [],
  },
  vendors: [],
  loading: false,
  error: null,
};

/**
 * Async thunk for fetching wedding project details.
 */
export const fetchWeddingProject = createAsyncThunk(
  'wedding/fetchProject',
  async (_, { rejectWithValue }) => {
    try {
      const data = await weddingService.getProject();
      return data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch wedding project');
    }
  }
);

/**
 * Async thunk for fetching wedding budget details.
 */
export const fetchWeddingBudget = createAsyncThunk(
  'wedding/fetchBudget',
  async (_, { rejectWithValue }) => {
    try {
      const data = await weddingService.getBudget();
      return data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch wedding budget');
    }
  }
);

/**
 * Async thunk for adding a wedding task.
 */
export const addWeddingTask = createAsyncThunk(
  'wedding/addTask',
  async (taskData: any, { rejectWithValue }) => {
    try {
      const data = await weddingService.addTask(taskData);
      return data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to add task');
    }
  }
);

const weddingSlice = createSlice({
  name: 'wedding',
  initialState,
  reducers: {
    /**
     * Update wedding project in state.
     */
    updateProject: (state, action: PayloadAction<any>) => {
      state.project = { ...state.project, ...action.payload };
    },
    /**
     * Clear wedding project from state.
     */
    clearProject: (state) => {
      state.project = null;
    },
    /**
     * Clear wedding error.
     */
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Wedding Project
      .addCase(fetchWeddingProject.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchWeddingProject.fulfilled, (state, action) => {
        state.loading = false;
        state.project = action.payload;
        state.tasks = action.payload.tasks || [];
        state.expenses = action.payload.expenses || [];
      })
      .addCase(fetchWeddingProject.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Fetch Wedding Budget
      .addCase(fetchWeddingBudget.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchWeddingBudget.fulfilled, (state, action) => {
        state.loading = false;
        state.budget = action.payload;
      })
      .addCase(fetchWeddingBudget.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Add Wedding Task
      .addCase(addWeddingTask.fulfilled, (state, action) => {
        state.tasks.push(action.payload);
      });
  },
});

export const { updateProject, clearProject, clearError } = weddingSlice.actions;
export default weddingSlice.reducer;

