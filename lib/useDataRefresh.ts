"use client";

import { useEffect, useCallback } from "react";
import { usePageCache } from "./usePageCache";

// Event types for data refresh
export type DataRefreshEvent =
  | "dashboard"
  | "products"
  | "inventory"
  | "checkout"
  | "reports"
  | "categories"
  | "suppliers"
  | "purchases"
  | "users"
  | "all";

/**
 * Hook to listen for data refresh events and trigger refetch
 */
export function useDataRefresh(
  eventTypes: DataRefreshEvent[],
  onRefresh: () => void,
) {
  useEffect(() => {
    const handleRefresh = (event: Event) => {
      const customEvent = event as CustomEvent<DataRefreshEvent>;
      const eventType = customEvent.detail;
      if (eventTypes.includes(eventType) || eventTypes.includes("all")) {
        onRefresh();
      }
    };

    // Listen for custom refresh events
    window.addEventListener("data-refresh", handleRefresh as EventListener);

    return () => {
      window.removeEventListener(
        "data-refresh",
        handleRefresh as EventListener,
      );
    };
  }, [eventTypes, onRefresh]);
}

/**
 * Hook to trigger data refresh events
 */
export function useDataRefresher() {
  // We no longer invalidate cache here to support Stale-While-Revalidate pattern.
  // We keep the old data in cache so we can show it immediately, and then
  // the 'data-refresh' event triggers a background fetch to update it.
  const triggerRefresh = useCallback((eventType: DataRefreshEvent) => {
    if (typeof window !== "undefined") {
      // Dispatch the event
      const event = new CustomEvent("data-refresh", { detail: eventType });
      window.dispatchEvent(event);
    }
  }, []);

  return { triggerRefresh };
}

/**
 * Utility function to trigger refresh (can be used outside components)
 */
export function triggerDataRefresh(eventType: DataRefreshEvent) {
  if (typeof window !== "undefined") {
    // We no longer invalidate local storage cache to support Stale-While-Revalidate pattern.
    // We keep the old data in cache so we can show it immediately, and then
    // the 'data-refresh' event triggers a background fetch to update it.
    const event = new CustomEvent("data-refresh", { detail: eventType });
    window.dispatchEvent(event);
  }
}
