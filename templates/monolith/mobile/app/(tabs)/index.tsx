import { useAuth, useUser } from '@clerk/clerk-expo';
import { Button, StyleSheet, Text, View } from 'react-native';

// Protected home screen — guaranteed to run only for signed-in users
// because the (tabs) layout redirects otherwise. Story 4.3 adds NativeWind
// styling; for now the UI is deliberately plain.
export default function HomeScreen() {
  const { signOut } = useAuth();
  const { user } = useUser();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{{projectName}}</Text>
      <Text style={styles.subtitle}>Signed in as {user?.primaryEmailAddress?.emailAddress}</Text>
      <Button title="Sign out" onPress={() => signOut()} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 },
  title: { fontSize: 24, fontWeight: '600' },
  subtitle: { fontSize: 14, opacity: 0.7, marginBottom: 24 },
});
