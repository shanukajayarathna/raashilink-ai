import { useState, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { showNotification } from '@/app/store/uiSlice';

interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

/**
 * Custom hook for handling API calls with consistent loading and error states.
 * @param {Function} apiFunction - The API service function to execute.
 * @param {boolean} showToast - Whether to show a global notification on error.
 * @returns {object} - { data, loading, error, execute }
 */
export function useApi<T = any, P extends any[] = any[]>(
  apiFunction: (...args: P) => Promise<T>,
  showToast: boolean = true
) {
  const [state, setState] = useState<ApiState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const dispatch = useDispatch();

  const execute = useCallback(
    async (...args: P) => {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      try {
        const result = await apiFunction(...args);
        setState({ data: result, loading: false, error: null });
        return result;
      } catch (err: any) {
        const errorMessage = err.response?.data?.message || err.message || 'An unexpected error occurred.';
        setState({ data: null, loading: false, error: errorMessage });
        
        if (showToast) {
          dispatch(showNotification({
            message: errorMessage,
            type: 'error'
          }));
        }
        
        throw err;
      }
    },
    [apiFunction, dispatch, showToast]
  );

  return {
    ...state,
    execute,
    setData: (data: T) => setState((prev) => ({ ...prev, data })),
    clearError: () => setState((prev) => ({ ...prev, error: null })),
  };
}

export default useApi;


