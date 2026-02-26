"use client";

import { useEffect, useCallback } from "react";
import { usePageCache } from "./usePageCache";

// Event types for data refresh
export type DataRefreshEvent =
  | 'dashboard'
  | 'products'
  | 'inventory'
  | 'checkout'
  | 'reports'
  | 'categories'
  | 'all';

/**
 * Hook to listen for data refresh events and trigger refetch
 */
export function useDataRefresh(
  eventTypes: DataRefreshEvent[],
  onRefresh: () => void
) {
  useEffect(() => {
    const handleRefresh = (event: Event) => {
      const customEvent = event as CustomEvent<DataRefreshEvent>;
      const eventType = customEvent.detail;
      if (eventTypes.includes(eventType) || eventTypes.includes('all')) {
        onRefresh();
      }
    };

    // Listen for custom refresh events
    window.addEventListener('data-refresh', handleRefresh as EventListener);

    return () => {
      window.removeEventListener('data-refresh', handleRefresh as EventListener);
    };
  }, [eventTypes, onRefresh]);
}

/**
 * Hook to trigger data refresh events
 */
export function useDataRefresher() {
  const invalidateCache = usePageCache((state) => state.invalidateCache);

  const triggerRefresh = useCallback((eventType: DataRefreshEvent) => {
    if (typeof window !== 'undefined') {
      // Invalidate related caches
      if (eventType === 'dashboard' || eventType === 'checkout' || eventType === 'all') {
        invalidateCache('dashboard');
      }
      if (eventType === 'products' || eventType === 'inventory' || eventType === 'all') {
        invalidateCache('products');
      }
      if (eventType === 'reports' || eventType === 'all') {
        invalidateCache('reports');
      }
      
      // Dispatch the event
      const event = new CustomEvent('data-refresh', { detail: eventType });
      window.dispatchEvent(event);
    }
  }, [invalidateCache]);

  return { triggerRefresh };
}

/**
 * Utility function to trigger refresh (can be used outside components)
 */
export function triggerDataRefresh(eventType: DataRefreshEvent) {
  if (typeof window !== 'undefined') {
    // Also invalidate cache when triggering refresh
    const cacheInvalidation: Record<DataRefreshEvent, string[]> = {
      'dashboard': ['dashboard'],
      'checkout': ['dashboard'],
      'products': ['products'],
      'inventory': ['products', 'inventory'],
      'reports': ['reports', 'dashboard'],
      'categories': ['categories'],
      'all': ['dashboard', 'products', 'reports', 'categories', 'inventory'],
    };
    
    const cachesToInvalidate = cacheInvalidation[eventType] || [];
    cachesToInvalidate.forEach(key => {
      try {
        const stored = localStorage.getItem('page-cache-storage');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed.caches && parsed.caches[key]) {
            delete parsed.caches[key];
            localStorage.setItem('page-cache-storage', JSON.stringify(parsed));
          }
        }
      } catch (e) {
        console.error('Failed to invalidate cache:', e);
      }
    });
    
    const event = new CustomEvent('data-refresh', { detail: eventType });
    window.dispatchEvent(event);
  }
}
