/**
 * Hook for managing loading states from SWR
 * 
 * @param data - The data from SWR
 * @param error - The error from SWR
 * @param isLoading - Whether SWR is loading (initial load)
 * @param isValidating - Whether SWR is validating (refreshing)
 * @returns Loading state information
 */
export function useLoadingState<T>(
  data: T | undefined,
  error: Error | undefined,
  isLoading: boolean,
  isValidating: boolean
) {
  // Initial loading: no data yet and SWR is loading
  const isInitialLoading = isLoading && !data;
  
  // Refreshing: has data but SWR is validating (background refresh)
  const isRefreshing = isValidating && !!data && !isLoading;
  
  // Has error
  const hasError = !!error;
  
  // Has data
  const hasData = !!data;
  
  // Empty state: not loading, no error, but no data
  const isEmpty = !isLoading && !error && !data;
  
  return {
    isInitialLoading,
    isRefreshing,
    hasError,
    hasData,
    isEmpty,
  };
}

