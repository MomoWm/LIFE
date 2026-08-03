import { Stack, router } from 'expo-router';
import { Icon } from '@/components/ui/icon';
import { Alert, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ListRow } from '@/components/ui/list-row';
import { Screen } from '@/components/ui/screen';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { useTheme } from '@/hooks/use-theme';
import { signOut } from '@/lib/supabase/auth';

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
        <Card style={styles.card}>
          <ThemedText type="small" themeColor="textSecondary">
            {isAnonymous ? 'Using LIFE on this device' : 'Signed in as'}
          </ThemedText>
          <ThemedText type="smallBold">
            {isAnonymous ? 'No email — data lives with this browser session' : session?.user.email}
          </ThemedText>
        </Card>

        <Card style={styles.card}>
          <ListRow
            title="Notifications"
            subtitle="Prayer times, morning nudge, weekly review"
            leading={<Icon name="bell.badge.fill" size={20} tintColor={theme.danger} />}
            showChevron
            onPress={() => router.push('/more/settings/notifications')}
          />
          <ListRow
            title="Prayer settings"
            subtitle="Location, calculation method, madhab"
            leading={<Icon name="moon.stars.fill" size={20} tintColor="#7B68EE" />}
            showChevron
            onPress={() => router.push('/more/settings/prayer')}
          />
        </Card>

        <Button title="Sign out" variant="destructive" onPress={handleSignOut} />

        <ThemedText type="small" themeColor="textSecondary" style={styles.footer}>
          LIFE · your 545, prayers, training, and knocking hours in one place.
        </ThemedText>
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: Spacing.one,
  },
  footer: {
    textAlign: 'center',
    marginTop: Spacing.three,
  },
});
