"use client";

import { useState, useCallback, useEffect } from "react";
import { usePageCache } from "./usePageCache";

interface UsePageDataOptions<T> {
  key: string;
  fetchFn: () => Promise<T>;
  params?: Record<string, unknown>;
  initialData?: T;
  enabled?: boolean;
}

interface UsePageDataReturn<T> {
  data: T | null;
  isLoading: boolean;
  isRefreshing: boolean;
  error: Error | null;
  refetch: (forceRefresh?: boolean) => Promise<void>;
  invalidate: () => void;
  setData: (data: T) => void;
}

/**
 * Custom hook for fetching page data with intelligent caching.
 * - Loads from cache immediately on first render
 * - Only shows loading on initial load when no cache exists
 * - Subsequent navigations use cached data without loading
 * - Background refresh available
 */
export function usePageData<T>({
  key,
  fetchFn,
  params,
  initialData,
  enabled = true,
}: UsePageDataOptions<T>): UsePageDataReturn<T> {
  const getCache = usePageCache((state) => state.getCache);
  const setCache = usePageCache((state) => state.setCache);
  const invalidateCache = usePageCache((state) => state.invalidateCache);

  const [data, setData] = useState<T | null>(initialData ?? null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Params key for cache differentiation
  const paramsKey = params ? JSON.stringify(params) : undefined;
  const cacheKey = paramsKey ? `${key}:${paramsKey}` : key;

  const fetchData = useCallback(async (forceRefresh = false) => {
    if (!enabled) return;

    // Try to get cached data first
    const cached = getCache<T>(cacheKey);
    
    // If we have cached data and not forcing refresh, use it immediately
    if (cached && !forceRefresh) {
      setData(cached);
      setIsLoading(false);
      return;
    }

    // If we have cached data but forcing refresh, show refreshing state
    if (cached && forceRefresh) {
      setIsRefreshing(true);
    } else {
      // No cache, show loading
      setIsLoading(true);
    }

    try {
      const result = await fetchFn();
      setData(result);
      setCache(cacheKey, result, params);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to fetch data"));
      // If error and we have cached data, keep using it
      if (!cached) {
        setData(null);
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [cacheKey, fetchFn, getCache, setCache, enabled, params]);

  // Initial load - only load if no cached data exists
  useEffect(() => {
    if (!enabled) return;
    
    const cached = getCache<T>(cacheKey);
    if (cached) {
      setData(cached);
      setIsLoading(false);
    } else {
      fetchData(false);
    }
  }, [cacheKey, fetchData, getCache, enabled]);

  const invalidate = useCallback(() => {
    invalidateCache(cacheKey);
  }, [cacheKey, invalidateCache]);

  return {
    data,
    isLoading,
    isRefreshing,
    error,
    refetch: fetchData,
    invalidate,
    setData,
  };
}
