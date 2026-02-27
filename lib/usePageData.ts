"use client";

import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { usePageCache } from "./usePageCache";
import { useNavigationStore } from "./useNavigationStore";

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
 * - Only shows loading on initial load when no cache exists AND is first visit
 * - Subsequent navigations use cached data without full page loading
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

  const isFirstVisit = useNavigationStore((state) => state.isFirstVisit);
  const markAsVisited = useNavigationStore((state) => state.markAsVisited);

  // Params key for cache differentiation
  const paramsKey = params ? JSON.stringify(params) : undefined;
  const cacheKey = paramsKey ? `${key}:${paramsKey}` : key;

  // Synchronously check cache for immediate data
  const cachedData = useMemo(() => {
    if (typeof window === "undefined") return null;
    return getCache<T>(cacheKey);
  }, [cacheKey, getCache]);

  const [data, setData] = useState<T | null>(initialData ?? cachedData ?? null);

  // Decide if we should show initial loading skeleton
  // Only show if: no data exists AND it's the first time visiting this page in this session
  const [isLoading, setIsLoading] = useState(() => {
    if (!enabled) return false;
    if (initialData || cachedData) return false;
    return isFirstVisit(key);
  });

  // Track which cacheKey we already initiated a fetch for, to prevent infinite loops
  const fetchedForCacheKey = useRef<string | null>(null);

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(
    async (forceRefresh = false) => {
      if (!enabled) return;

      // Try to get cached data first
      const cached = getCache<T>(cacheKey);

      // If we have cached data and not forcing refresh, use it immediately
      if (cached && !forceRefresh) {
        setData(cached);
        setIsLoading(false);
        // Do not return here: continue to fetch fresh data in background (SWR pattern)
      }

      // Refreshing vs Loading state
      if (cached || data) {
        setIsRefreshing(true);
      } else {
        // Only set loading if we truly have no data to show
        setIsLoading(true);
      }

      try {
        const result = await fetchFn();
        setData(result);
        setCache(cacheKey, result, params);
        setError(null);
        // Mark as visited once we've successfully loaded or found data
        markAsVisited(key);
      } catch (err) {
        setError(
          err instanceof Error ? err : new Error("Failed to fetch data"),
        );
        if (!cached && !data) {
          setData(null);
        }
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [
      cacheKey,
      fetchFn,
      getCache,
      setCache,
      enabled,
      params,
      key,
      markAsVisited,
      data,
    ],
  );

  // Initial load effect
  useEffect(() => {
    if (!enabled) return;

    // Prevent infinite loops when fetchFn or data changes
    if (fetchedForCacheKey.current === cacheKey) {
      return;
    }
    fetchedForCacheKey.current = cacheKey;

    // If we already have data (from initialData or sync cache check),
    // mark as visited. Always trigger a background refresh to ensure fresh data.
    if (data) {
      markAsVisited(key);
    }
    fetchData(false);
  }, [cacheKey, fetchData, enabled, key, markAsVisited, data]);

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
