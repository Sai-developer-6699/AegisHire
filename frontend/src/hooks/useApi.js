import { useState, useEffect, useCallback } from 'react';

/**
 * Generic API state management hook.
 * Handles data mapping, loading flag toggles, and server error parsing.
 * 
 * @param {Function} apiFunction - Promise-returning service function
 * @param {boolean} immediate - Whether to execute the request automatically on mount
 * @param {...any} initialArgs - Initial arguments to pass to the API function
 */
export function useApi(apiFunction, immediate = true, ...initialArgs) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState(null);

  const execute = useCallback(
    async (...args) => {
      setLoading(true);
      setError(null);
      try {
        const result = await apiFunction(...args);
        setData(result);
        return result;
      } catch (err) {
        setError(err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [apiFunction]
  );

  useEffect(() => {
    if (immediate) {
      execute(...initialArgs);
    }
  }, [execute, immediate]);

  return { data, loading, error, execute, setData };
}
export default useApi;
