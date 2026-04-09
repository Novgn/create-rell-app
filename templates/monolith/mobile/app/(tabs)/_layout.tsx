import { useAuth } from '@clerk/clerk-expo';
import { Redirect, Tabs } from 'expo-router';

// Protected route group. `useAuth()` is evaluated on every render — if the
// Clerk session flips to signed-out (e.g. user signs out from a menu) the
// layout immediately bounces the user to the auth group.
//
// `isLoaded === false` is the initial Clerk-session-hydration state; we
// render null to avoid a tab-bar flash before knowing whether the user is
// authenticated.
export default function TabsLayout() {
  const { isSignedIn, isLoaded } = useAuth();

  if (!isLoaded) return null;
  if (!isSignedIn) return <Redirect href="/(auth)/sign-in" />;

  return (
    <Tabs>
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings' }} />
    </Tabs>
  );
}
