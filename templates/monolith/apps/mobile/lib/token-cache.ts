// @ts-nocheck -- template-only; the scaffold engine strips this line before writing to user projects so scaffolded output has normal TypeScript checking.
// Secure token cache for Clerk Expo.
//
// Clerk's `<ClerkProvider>` on React Native needs a `tokenCache` prop so the
// session survives app restarts. We persist tokens in expo-secure-store
// (Keychain on iOS, Keystore on Android) — **not** AsyncStorage, which is
// unencrypted and would leak tokens on rooted devices.
//
// This shape matches Clerk Expo's `TokenCache` interface.

import * as SecureStore from 'expo-secure-store';

export const tokenCache = {
  async getToken(key: string): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(key);
    } catch (err) {
      console.error('[tokenCache] failed to read token for %s: %s', key, err);
      return null;
    }
  },
  async saveToken(key: string, value: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch (err) {
      console.error('[tokenCache] failed to save token for %s: %s', key, err);
    }
  },
};
