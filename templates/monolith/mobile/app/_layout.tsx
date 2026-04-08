import { ClerkProvider } from '@clerk/clerk-expo';
import { Slot } from 'expo-router';

import { env } from '../lib/env';
import { tokenCache } from '../lib/token-cache';

// ClerkProvider wraps the whole Expo app and manages the auth session on
// mobile. `<Slot />` renders whichever nested layout matches the current
// route — (auth)/ for sign-in flows, (tabs)/ for authenticated users.
//
// The Supabase client in lib/supabase/client.ts pulls the Clerk token via
// an `accessToken` callback — native 3P auth. Do NOT use the deprecated
// JWT-template pattern (passing a template name to Clerk's getToken call).
export default function RootLayout() {
  return (
    <ClerkProvider publishableKey={env.clerk.publishableKey} tokenCache={tokenCache}>
      <Slot />
    </ClerkProvider>
  );
}
