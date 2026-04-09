import { ScrollView, StyleSheet, Text } from 'react-native';

import { ProfileForm } from '../../components/forms/ProfileForm';

// Demo settings tab for Story 4.2. Shows the React Hook Form + Zod profile
// form. The layout handles scroll so the form stays usable with the keyboard
// up.
export default function SettingsTab() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.heading}>Profile settings</Text>
      <ProfileForm />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 12 },
  heading: { fontSize: 20, fontWeight: '600' },
});
