// @ts-nocheck -- template-only; the scaffold engine strips this line before writing to user projects so scaffolded output has normal TypeScript checking.
// Zustand application store — mobile (Expo / React Native).
//
// Story 4.1. Mirrors the web store's shape intentionally — only the storage
// adapter differs. Keeping the `AppState` contract identical means features
// written against the store can be shared via `shared/` code later without
// having to fork on platform.
//
// === Why MMKV instead of AsyncStorage ===
// `@react-native-async-storage/async-storage` is the "default" RN storage,
// but it is asynchronous, slow for small reads, and unencrypted. Zustand's
// `persist` middleware works better with synchronous storage (no flash of
// un-hydrated state on launch). `react-native-mmkv` is synchronous, ~30x
// faster than AsyncStorage, and supports on-device encryption — a much better
// default for an opinionated starter.
//
// === Why `partialize` ===
// Identical rationale to the web store: ephemeral UI flags (`drawerOpen`)
// must not survive across app launches. See `web/stores/app-store.ts` for
// the full explanation.

import { MMKV } from 'react-native-mmkv';
import { create } from 'zustand';
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware';

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

// Single MMKV instance for the whole app. Additional encrypted instances can
// be created later by passing `{ id, encryptionKey }` here.
const mmkv = new MMKV({ id: STORAGE_KEY });

// Adapt MMKV's string-based API to the `StateStorage` shape expected by
// `createJSONStorage`. MMKV is synchronous, so we wrap the results in
// already-resolved Promises to satisfy the interface.
const mmkvStorage: StateStorage = {
  getItem: (name) => {
    const value = mmkv.getString(name);
    return value ?? null;
  },
  setItem: (name, value) => {
    mmkv.set(name, value);
  },
  removeItem: (name) => {
    mmkv.delete(name);
  },
};

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
      storage: createJSONStorage(() => mmkvStorage),
      // Only persist the two preference-style fields. `drawerOpen` stays in
      // memory so every cold start begins with the drawer closed.
      partialize: (state) => ({
        theme: state.theme,
        onboardingComplete: state.onboardingComplete,
      }),
      version: 1,
    },
  ),
);
