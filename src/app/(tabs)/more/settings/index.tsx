import { Stack, router } from 'expo-router';
import { Icon } from '@/components/ui/icon';
import { useState } from 'react';
import { Platform, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Section, SectionDivider } from '@/components/ui/section';
import { ListRow } from '@/components/ui/list-row';
import { Screen } from '@/components/ui/screen';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { clearAllData, exportAllData } from '@/lib/db/local-table';
import { queryClient } from '@/lib/query/queryClient';

/**
 * Downloads a JSON backup. Web-only — LIFE ships as a browser/PWA build, and
 * this is the download mechanism a browser actually has: a data URI clicked
 * through a throwaway anchor. There's no server this could also do, unlike
 * the account-linking flow this section replaces — a local export is the
 * whole durability story now, since nothing here has a second copy anywhere.
 */
function downloadBackup(json: string) {
  if (Platform.OS !== 'web' || typeof document === 'undefined') return;
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `life-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function SettingsScreen() {
  const theme = useTheme();
  const [exporting, setExporting] = useState(false);
  const [confirmingReset, setConfirmingReset] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      downloadBackup(await exportAllData());
    } finally {
      setExporting(false);
    }
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Settings' }} />
      <Screen>
        <Card style={styles.card}>
          <ThemedText type="smallBold">Local data</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Everything in LIFE lives on this device only — there is no account and nothing syncs.
            Clearing this browser’s storage, or removing the app from your Home Screen, erases it
            for good. A backup is the only copy that survives either.
          </ThemedText>
          <Button
            title={exporting ? 'Preparing…' : 'Download backup'}
            variant="tinted"
            loading={exporting}
            onPress={handleExport}
          />
        </Card>

        <Section title="Preferences" contentStyle={styles.rows}>
          <ListRow
            title="Notifications"
            subtitle="Prayer times, morning nudge, weekly review"
            leading={<Icon name="bell.badge.fill" size={19} tintColor={theme.textSecondary} />}
            showChevron
            onPress={() => router.push('/more/settings/notifications')}
          />
          <SectionDivider inset={35} />
          <ListRow
            title="Prayer settings"
            subtitle="Location, calculation method, madhab"
            leading={<Icon name="moon.stars.fill" size={19} tintColor={theme.textSecondary} />}
            showChevron
            onPress={() => router.push('/more/settings/prayer')}
          />
        </Section>

        <Button
          title="Erase all local data"
          variant="destructive"
          onPress={() => setConfirmingReset(true)}
        />
      </Screen>
      <ConfirmDialog
        visible={confirmingReset}
        title="Erase everything?"
        message="Every routine, prayer log, workout, sleep entry, streak and setting on this device is deleted immediately and permanently. Download a backup first if you want any of it back."
        confirmLabel="Erase"
        destructive
        onConfirm={async () => {
          setConfirmingReset(false);
          await clearAllData();
          // The local tables are empty now, but every screen's already-cached
          // query results still hold the old numbers until something happens
          // to refetch them — clear the cache too, so Home reflects the erase
          // immediately instead of on whatever screen next happens to remount.
          queryClient.clear();
          router.replace('/');
        }}
        onCancel={() => setConfirmingReset(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: Spacing.two,
  },
  rows: {
    gap: 0,
  },
});
