import { configureStore } from '@reduxjs/toolkit';
import authReducer from '@/features/auth/store/authSlice';
import matchReducer from '@/features/matchmaking/store/matchSlice';
import weddingReducer from '@/features/wedding/store/weddingSlice';
import uiReducer from './uiSlice';

/**
 * Redux Store Configuration for RaashiLink.AI
 * Combines all application slices into a single store.
 */
export const store = configureStore({
  reducer: {
    auth: authReducer,
    match: matchReducer,
    wedding: weddingReducer,
    ui: uiReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false, // Disable serializable check for complex objects if needed
    }),
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;


