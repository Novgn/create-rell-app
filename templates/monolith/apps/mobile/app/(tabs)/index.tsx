// @ts-nocheck -- template-only; the scaffold engine strips this line before writing to user projects so scaffolded output has normal TypeScript checking.
import { useAuth, useUser } from '@clerk/clerk-expo';
import { Button, StyleSheet, Text, View } from 'react-native';

import { useAppStore } from '../../stores/app-store';

// Protected home screen — guaranteed to run only for signed-in users
// because the (tabs) layout redirects otherwise. Story 4.3 adds NativeWind
// styling; for now the UI is deliberately plain.
//
// Reads `theme` from the Zustand store added in Story 4.1 just to prove the
// store works end-to-end. Swap this for real UI when you build your app.
export default function HomeScreen() {
  const { signOut } = useAuth();
  const { user } = useUser();
  const theme = useAppStore((state) => state.theme);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{{projectName}}</Text>
      <Text style={styles.subtitle}>Signed in as {user?.primaryEmailAddress?.emailAddress}</Text>
      <Text style={styles.subtitle}>Theme: {theme}</Text>
      <Button title="Sign out" onPress={() => signOut()} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 },
  title: { fontSize: 24, fontWeight: '600' },
  subtitle: { fontSize: 14, opacity: 0.7, marginBottom: 24 },
});
