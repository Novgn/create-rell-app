// @ts-nocheck -- template-only; the scaffold engine strips this line before writing to user projects so scaffolded output has normal TypeScript checking.
import { useAuth } from '@clerk/clerk-expo';
import { Redirect, Stack } from 'expo-router';

// Layout for the (auth) group — sign-in and sign-up screens. If the user is
// already signed in, bounce them to the protected (tabs) area so they never
// see the auth UI twice.
export default function AuthLayout() {
  const { isSignedIn, isLoaded } = useAuth();

  if (!isLoaded) return null;
  if (isSignedIn) return <Redirect href="/(tabs)" />;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="sign-in" />
      <Stack.Screen name="sign-up" />
    </Stack>
  );
}
