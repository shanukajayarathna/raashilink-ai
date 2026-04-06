import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Notification {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  action?: 'retry' | 'dismiss';
}

interface UIState {
  language: 'en' | 'si' | 'ta';
  notifications: Notification[];
  globalLoading: boolean;
  sidebarOpen: boolean;
  theme: 'light' | 'dark';
}

const initialState: UIState = {
  language: (localStorage.getItem('language') as any) || 'en',
  notifications: [],
  globalLoading: false,
  sidebarOpen: true,
  theme: (localStorage.getItem('theme') as any) || 'light',
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    /**
     * Set application language.
     */
    setLanguage: (state, action: PayloadAction<'en' | 'si' | 'ta'>) => {
      state.language = action.payload;
      localStorage.setItem('language', action.payload);
    },
    /**
     * Show a global notification.
     */
    showNotification: (state, action: PayloadAction<Omit<Notification, 'id'>>) => {
      const id = Date.now().toString();
      state.notifications.push({ ...action.payload, id });
    },
    /**
     * Dismiss a global notification.
     */
    dismissNotification: (state, action: PayloadAction<string>) => {
      state.notifications = state.notifications.filter(n => n.id !== action.payload);
    },
    /**
     * Set global loading state.
     */
    setGlobalLoading: (state, action: PayloadAction<boolean>) => {
      state.globalLoading = action.payload;
    },
    /**
     * Toggle sidebar visibility.
     */
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    /**
     * Set application theme.
     */
    setTheme: (state, action: PayloadAction<'light' | 'dark'>) => {
      state.theme = action.payload;
      localStorage.setItem('theme', action.payload);
    },
  },
});

export const {
  setLanguage,
  showNotification,
  dismissNotification,
  setGlobalLoading,
  toggleSidebar,
  setTheme,
} = uiSlice.actions;

// Backward-compatible aliases for the global UI system API.
export const showToast = showNotification;
export const setLoading = setGlobalLoading;

export default uiSlice.reducer;

