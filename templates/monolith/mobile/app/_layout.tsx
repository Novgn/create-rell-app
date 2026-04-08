import { Stack } from 'expo-router';

// Root stack navigator for the Expo Router app. Story 2.3 adds (auth) and
// (tabs) groups; for now we render a single screen from app/index.tsx.
export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: '{{projectName}}' }} />
    </Stack>
  );
}
