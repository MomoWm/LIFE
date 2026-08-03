import { Stack, router } from 'expo-router';
import { Icon } from '@/components/ui/icon';
import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ListRow } from '@/components/ui/list-row';
import { Screen } from '@/components/ui/screen';
import { TextField } from '@/components/ui/text-field';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { useTheme } from '@/hooks/use-theme';
import { requestAccountLink, signOut, verifyAccountLink } from '@/lib/supabase/auth';

type LinkStep = 'closed' | 'email' | 'code' | 'done';

function SecureAccountCard() {
  const [step, setStep] = useState<LinkStep>('closed');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitEmail = async () => {
    setBusy(true);
    setError(null);
    try {
      await requestAccountLink(email.trim());
      setStep('code');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send the code. Try again.');
    } finally {
      setBusy(false);
    }
  };

  const submitCode = async () => {
    setBusy(true);
    setError(null);
    try {
      await verifyAccountLink(email.trim(), code.trim());
      setStep('done');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'That code didn’t work. Check it and retry.');
    } finally {
      setBusy(false);
    }
  };

  if (step === 'done') {
    return (
      <Card style={styles.card}>
        <ThemedText type="smallBold">Account secured</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {email.trim()} can now sign in to this account from any device.
        </ThemedText>
      </Card>
    );
  }

  return (
    <Card style={styles.card}>
      <ThemedText type="smallBold">Secure & sync</ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        This account currently exists only on this device. Attach an email to protect your data
        and use LIFE on another device.
      </ThemedText>

      {step === 'closed' ? (
        <Button title="Secure account" variant="tinted" onPress={() => setStep('email')} />
      ) : null}

      {step === 'email' ? (
        <View style={styles.linkForm}>
          <TextField
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            autoFocus
          />
          <Button
            title="Send code"
            onPress={submitEmail}
            loading={busy}
            disabled={busy || !email.includes('@')}
          />
        </View>
      ) : null}

      {step === 'code' ? (
        <View style={styles.linkForm}>
          <ThemedText type="small" themeColor="textSecondary">
            Enter the 6-digit code sent to {email.trim()}.
          </ThemedText>
          <TextField
            value={code}
            onChangeText={setCode}
            placeholder="123456"
            keyboardType="number-pad"
            maxLength={6}
            autoFocus
          />
          <Button
            title="Confirm"
            onPress={submitCode}
            loading={busy}
            disabled={busy || code.trim().length < 6}
          />
        </View>
      ) : null}

      {error ? (
        <ThemedText type="small" themeColor="danger">
          {error}
        </ThemedText>
      ) : null}
    </Card>
  );
}

export default function SettingsScreen() {
  const theme = useTheme();
  const { session } = useAuth();
  const isAnonymous = session?.user.is_anonymous ?? false;

  const handleSignOut = () => {
    if (!isAnonymous) {
      signOut();
      return;
    }
    Alert.alert(
      'Sign out?',
      'This account has no email attached — signing out means there is no way back into it. Your data stays saved, but this device won’t be able to reach it again.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign out', style: 'destructive', onPress: () => signOut() },
      ]
    );
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Settings' }} />
      <Screen>
        {isAnonymous ? (
          <SecureAccountCard />
        ) : (
          <Card style={styles.card}>
            <ThemedText type="small" themeColor="textSecondary">
              Signed in as
            </ThemedText>
            <ThemedText type="smallBold">{session?.user.email}</ThemedText>
          </Card>
        )}

        <Card style={styles.card}>
          <ListRow
            title="Notifications"
            subtitle="Prayer times, morning nudge, weekly review"
            leading={<Icon name="bell.badge.fill" size={20} tintColor={theme.textSecondary} />}
            showChevron
            onPress={() => router.push('/more/settings/notifications')}
          />
          <ListRow
            title="Prayer settings"
            subtitle="Location, calculation method, madhab"
            leading={<Icon name="moon.stars.fill" size={20} tintColor={theme.textSecondary} />}
            showChevron
            onPress={() => router.push('/more/settings/prayer')}
          />
        </Card>

        <Button title="Sign out" variant="destructive" onPress={handleSignOut} />
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: Spacing.two,
  },
  linkForm: {
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
});
