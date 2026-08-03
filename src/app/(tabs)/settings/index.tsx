import { Stack, router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { StyleSheet } from 'react-native';

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

  return (
    <>
      <Stack.Screen options={{ title: 'Settings' }} />
      <Screen>
        <Card style={styles.card}>
          <ThemedText type="small" themeColor="textSecondary">
            Signed in as
          </ThemedText>
          <ThemedText type="smallBold">{session?.user.email}</ThemedText>
        </Card>

        <Card style={styles.card}>
          <ListRow
            title="Notifications"
            subtitle="Prayer times, morning nudge, weekly review"
            leading={<SymbolView name="bell.badge.fill" size={20} tintColor={theme.danger} />}
            showChevron
            onPress={() => router.push('/settings/notifications')}
          />
          <ListRow
            title="Prayer settings"
            subtitle="Location, calculation method, madhab"
            leading={<SymbolView name="moon.stars.fill" size={20} tintColor="#7B68EE" />}
            showChevron
            onPress={() => router.push('/settings/prayer')}
          />
        </Card>

        <Button title="Sign out" variant="destructive" onPress={() => signOut()} />

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
