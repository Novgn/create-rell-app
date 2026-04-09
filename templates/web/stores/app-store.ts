'use client';

// Zustand application store for {{projectName}}.
//
// This is the canonical global-state layer. Most per-feature state should
// stay in component state or server data — this store is reserved for
// cross-cutting UI preferences (theme, onboarding, etc.) that should
// persist between page loads.
//
// === Why `persist` with a `partialize` filter ===
// Zustand's `persist` middleware by default serializes the WHOLE state object
// to storage on every change. That is dangerous for ephemeral UI state: a
// `drawerOpen` flag would survive reloads and re-open the drawer on every
// visit, which is almost never what a user wants. `partialize` below picks the
// subset of fields that should actually be persisted, leaving ephemeral flags
// in memory only.
//
// === Why the no-op server storage fallback ===
// Next.js App Router evaluates this module from Server Components too
// (any import graph touching the store drags it onto the server). `localStorage`
// does not exist on the server, so reading it at module-eval time would crash
// the build. `createJSONStorage` accepts a storage **getter** — we return
// `undefined` on the server, which tells the middleware "skip persistence for
// now". Client-side hydration then resumes reads/writes normally.

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type Theme = 'system' | 'light' | 'dark';

export interface AppState {
  /** Persisted: user-selected color theme. */
  theme: Theme;
  /** Persisted: whether the user has completed the onboarding tour. */
  onboardingComplete: boolean;
  /** Ephemeral: global navigation drawer open state. NOT persisted. */
  drawerOpen: boolean;

  setTheme: (theme: Theme) => void;
  completeOnboarding: () => void;
  toggleDrawer: () => void;
}

const STORAGE_KEY = '{{projectNameKebab}}-app';

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      theme: 'system',
      onboardingComplete: false,
      drawerOpen: false,

      setTheme: (theme) => set({ theme }),
      completeOnboarding: () => set({ onboardingComplete: true }),
      toggleDrawer: () => set((state) => ({ drawerOpen: !state.drawerOpen })),
    }),
    {
      name: STORAGE_KEY,
      // SSR-safe storage: return undefined on the server, real localStorage in
      // the browser. See the file header for the "why".
      storage: createJSONStorage(() =>
        typeof window !== 'undefined' ? window.localStorage : (undefined as unknown as Storage),
      ),
      // Only persist the two preference-style fields. `drawerOpen` is
      // intentionally excluded so it always starts closed on a fresh visit.
      partialize: (state) => ({
        theme: state.theme,
        onboardingComplete: state.onboardingComplete,
      }),
      version: 1,
    },
  ),
);
