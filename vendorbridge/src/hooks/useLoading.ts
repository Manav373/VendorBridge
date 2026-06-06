import { useState, useCallback } from 'react';

interface UseLoadingReturn {
  isLoading: boolean;
  withLoading: <T>(fn: () => Promise<T>) => Promise<T>;
}

export function useLoading(initial = false): UseLoadingReturn {
  const [isLoading, setIsLoading] = useState(initial);

  const withLoading = useCallback(async <T>(fn: () => Promise<T>): Promise<T> => {
    setIsLoading(true);
    try {
      return await fn();
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { isLoading, withLoading };
}
