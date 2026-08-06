/**
 * src/stores/adminStore.ts
 * BNLV Studio — UI Preferences Store
 * ====================================
 * P0 MIGRATION: All server-side data mocks have been removed and replaced
 * by live PostgreSQL / Drizzle ORM API routes. This store is restricted strictly
 * to UI-only layout and preference state.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";

type UIPreferencesState = {
  sidebarCollapsed: boolean;
  theme: "light" | "dark" | "system";
  toggleSidebar: () => void;
  setTheme: (theme: "light" | "dark" | "system") => void;
};

export const useAdminStore = create<UIPreferencesState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      theme: "light",
      toggleSidebar: () => set((state: UIPreferencesState) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      setTheme: (theme: "light" | "dark" | "system") => set({ theme }),
    }),
    {
      name: "bnlv-ui-preferences",
    }
  )
);