import { useState } from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Spacing } from '@/constants/theme';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import { continueAnonymously } from '@/lib/supabase/auth';

export default function SignInScreen() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isSupabaseConfigured) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ThemedView style={styles.container}>
          <Card>
            <ThemedText type="subtitle">Connect Supabase</ThemedText>
            <ThemedText themeColor="textSecondary" style={styles.setupText}>
              LIFE needs a Supabase project to sync your data. Create one at supabase.com, then
              add its URL and anon key to `.env.local` (see `.env.example`) and restart the app.
            </ThemedText>
          </Card>
        </ThemedView>
      </SafeAreaView>
    );
  }

  const handleContinue = async () => {
    setError(null);
    setIsSubmitting(true);
    try {
      await continueAnonymously();
      // Session listener in useAuth() picks this up and the root layout redirects.
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Could not start a session. Check your connection and try again.'
      );
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ThemedView style={styles.container}>
        <ThemedText type="title" style={styles.title}>
          LIFE
        </ThemedText>
        <ThemedText themeColor="textSecondary" style={styles.subtitle}>
          Your 545, prayers, retention, sleep, workouts, and work tracking — synced to this
          device.
        </ThemedText>

        <Card style={styles.card}>
          {error ? (
            <ThemedText themeColor="danger" type="small">
              {error}
            </ThemedText>
          ) : null}

          <Button
            title={isSubmitting ? 'Starting…' : 'Get started'}
            onPress={handleContinue}
            disabled={isSubmitting}
          />
        </Card>
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
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
    gap: Spacing.two,
  },
  title: {
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: Spacing.four,
  },
  setupText: {
    marginTop: Spacing.two,
  },
  card: {
    gap: Spacing.three,
  },
});
