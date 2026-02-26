import { create } from "zustand";

interface NavigationState {
  visitedPages: Set<string>;
  markAsVisited: (pageKey: string) => void;
  isFirstVisit: (pageKey: string) => boolean;
  resetNavigation: () => void;
}

export const useNavigationStore = create<NavigationState>((set, get) => ({
  visitedPages: new Set<string>(),
  markAsVisited: (pageKey: string) => {
    set((state) => {
      const newVisited = new Set(state.visitedPages);
      newVisited.add(pageKey);
      return { visitedPages: newVisited };
    });
  },
  isFirstVisit: (pageKey: string) => {
    return !get().visitedPages.has(pageKey);
  },
  resetNavigation: () => {
    set({ visitedPages: new Set<string>() });
  },
}));
