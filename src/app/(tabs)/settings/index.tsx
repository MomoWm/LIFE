import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { signOut } from '@/lib/supabase/auth';

export default function SettingsScreen() {
  const { session } = useAuth();

  return (
    <SafeAreaView style={styles.safeArea}>
      <ThemedView style={styles.container}>
        <ThemedText type="title">Settings</ThemedText>

        <Card style={styles.card}>
          <ThemedText themeColor="textSecondary" type="small">
            Signed in as
          </ThemedText>
          <ThemedText>{session?.user.email}</ThemedText>
          <Button title="Sign out" variant="destructive" onPress={() => signOut()} />
        </Card>

        <ThemedText themeColor="textSecondary" type="small">
          Notification, location, and review preferences land in later phases.
        </ThemedText>
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  card: {
    gap: Spacing.two,
  },
});
