import { ClerkProvider } from '@clerk/clerk-expo';
import { Stack } from 'expo-router';

import { env } from '../lib/env';
import { tokenCache } from '../lib/token-cache';

// ClerkProvider wraps the Expo Router stack and manages the auth session on
// mobile. The `tokenCache` prop persists tokens in expo-secure-store so the
// session survives app restarts (see lib/token-cache.ts).
//
// The Supabase client in lib/supabase/client.ts pulls the Clerk token via
// an `accessToken` callback — native 3P auth. Do NOT use the deprecated
// JWT-template pattern (passing a template name to Clerk's getToken call).
export default function RootLayout() {
  return (
    <ClerkProvider publishableKey={env.clerk.publishableKey} tokenCache={tokenCache}>
      <Stack>
        <Stack.Screen name="index" options={{ title: '{{projectName}}' }} />
      </Stack>
    </ClerkProvider>
  );
}
