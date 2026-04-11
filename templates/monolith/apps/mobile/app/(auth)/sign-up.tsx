// @ts-nocheck -- template-only; the scaffold engine strips this line before writing to user projects so scaffolded output has normal TypeScript checking.
import { useSignUp } from '@clerk/clerk-expo';
import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { Button, StyleSheet, Text, TextInput, View } from 'react-native';

// Minimal sign-up flow using Clerk Expo's useSignUp() hook. After creating
// the user Clerk emails a verification code; a full implementation would
// collect the code in a second step. This scaffold stops after user
// creation — real onboarding lands in your app.
export default function SignUpScreen() {
  const { signUp, setActive, isLoaded } = useSignUp();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function handleSignUp(): Promise<void> {
    if (!isLoaded) return;
    setError(null);
    try {
      const attempt = await signUp.create({ emailAddress: email, password });
      if (attempt.status === 'complete') {
        await setActive({ session: attempt.createdSessionId });
        router.replace('/(tabs)');
      } else {
        // Typical follow-up: send a verification code via
        // `signUp.prepareEmailAddressVerification({ strategy: 'email_code' })`
        // and collect it on a second screen.
        setError('Verification required — complete the flow in your app.');
      }
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create account</Text>
      <TextInput
        style={styles.input}
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      {error !== null ? <Text style={styles.error}>{error}</Text> : null}
      <Button title="Continue" onPress={handleSignUp} />
      <Link href="/(auth)/sign-in" style={styles.link}>
        Already have an account? Sign in
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: 'center', gap: 12 },
  title: { fontSize: 24, fontWeight: '600', marginBottom: 16 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 6, padding: 12 },
  error: { color: '#b91c1c' },
  link: { marginTop: 16, color: '#2563eb' },
});
