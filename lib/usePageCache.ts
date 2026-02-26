import { create } from "zustand";
import { persist } from "zustand/middleware";

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  params?: Record<string, unknown>;
}

interface CacheState {
  caches: Record<string, CacheEntry<unknown>>;
  setCache: <T>(key: string, data: T, params?: Record<string, unknown>) => void;
  getCache: <T>(key: string, params?: Record<string, unknown>) => T | null;
  invalidateCache: (key: string) => void;
  invalidateAll: () => void;
}

// Cache TTL: 5 minutes
const CACHE_TTL = 5 * 60 * 1000;

export const usePageCache = create<CacheState>()(
  persist(
    (set, get) => ({
      caches: {},
      setCache: <T,>(key: string, data: T, params?: Record<string, unknown>) => {
        set((state) => ({
          caches: {
            ...state.caches,
            [key]: {
              data,
              timestamp: Date.now(),
              params,
            },
          },
        }));
      },
      getCache: <T,>(key: string, params?: Record<string, unknown>): T | null => {
        const entry = get().caches[key] as CacheEntry<T> | undefined;
        if (!entry) return null;
        
        // Check if cache is expired
        if (Date.now() - entry.timestamp > CACHE_TTL) {
          // Remove expired cache
          set((state) => {
            const newCaches = { ...state.caches };
            delete newCaches[key];
            return { caches: newCaches };
          });
          return null;
        }
        
        // If params are provided, check if they match
        if (params && entry.params) {
          const paramsMatch = JSON.stringify(params) === JSON.stringify(entry.params);
          if (!paramsMatch) return null;
        }
        
        return entry.data;
      },
      invalidateCache: (key: string) => {
        set((state) => {
          const newCaches = { ...state.caches };
          delete newCaches[key];
          return { caches: newCaches };
        });
      },
      invalidateAll: () => {
        set({ caches: {} });
      },
    }),
    {
      name: "page-cache-storage",
      partialize: (state) => ({ caches: state.caches }),
    }
  )
);

// Helper hook for fetching data with caching
export function useCachedData<T>({
  key,
  fetchFn,
  params,
  enabled = true,
}: {
  key: string;
  fetchFn: () => Promise<T>;
  params?: Record<string, unknown>;
  enabled?: boolean;
}) {
  const getCache = usePageCache((state) => state.getCache);
  const setCache = usePageCache((state) => state.setCache);
  const invalidateCache = usePageCache((state) => state.invalidateCache);

  const cachedData = getCache<T>(key, params);

  const fetchData = async (forceRefresh = false): Promise<T> => {
    if (!forceRefresh && cachedData) {
      return cachedData;
    }

    const data = await fetchFn();
    setCache(key, data, params);
    return data;
  };

  return {
    cachedData,
    fetchData,
    invalidateCache: () => invalidateCache(key),
  };
}
