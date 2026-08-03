import DateTimePicker from '@react-native-community/datetimepicker';
import { Stack } from 'expo-router';
import { StyleSheet, Switch, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { Spacing } from '@/constants/theme';
import { useNotificationPrefs, useUpdateNotificationPrefs } from '@/hooks/use-notifications';

export default function NotificationSettingsScreen() {
  const { data: prefs } = useNotificationPrefs();
  const update = useUpdateNotificationPrefs();

  const morningTime = (() => {
    const [hour = 6, minute = 0] = (prefs?.five45_morning_time ?? '06:00')
      .split(':')
      .map((part) => parseInt(part, 10));
    const d = new Date();
    d.setHours(hour, minute, 0, 0);
    return d;
  })();

  return (
    <>
      <Stack.Screen options={{ title: 'Notifications', headerLargeTitle: false }} />
      <Screen>
        <Card style={styles.card}>
          <ToggleRow
            title="Prayer times"
            subtitle="A notification at each of the five prayers"
            value={prefs?.prayer_enabled ?? true}
            onChange={(value) => update.mutate({ prayer_enabled: value })}
          />
          <ToggleRow
            title="Morning 5 nudge"
            subtitle="Daily reminder to start your wake-up tasks"
            value={prefs?.five45_morning_enabled ?? true}
            onChange={(value) => update.mutate({ five45_morning_enabled: value })}
          />
          {prefs?.five45_morning_enabled ?? true ? (
            <View style={styles.timeRow}>
              <ThemedText type="small" themeColor="textSecondary">
                Nudge time
              </ThemedText>
              <DateTimePicker
                value={morningTime}
                mode="time"
                display="compact"
                onChange={(_event, date) => {
                  if (date) {
                    const time = `${String(date.getHours()).padStart(2, '0')}:${String(
                      date.getMinutes()
                    ).padStart(2, '0')}:00`;
                    update.mutate({ five45_morning_time: time });
                  }
                }}
              />
            </View>
          ) : null}
          <ToggleRow
            title="Weekly review"
            subtitle="Sunday evening goal check-in reminder"
            value={prefs?.weekly_review_enabled ?? true}
            onChange={(value) => update.mutate({ weekly_review_enabled: value })}
          />
        </Card>

        <ThemedText type="small" themeColor="textSecondary" style={styles.note}>
          Notifications are scheduled on this device each time you open the app — no data leaves
          your phone.
        </ThemedText>
      </Screen>
    </>
  );
}

function ToggleRow({
  title,
  subtitle,
  value,
  onChange,
}: {
  title: string;
  subtitle: string;
  value: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <View style={styles.toggleRow}>
      <View style={styles.toggleText}>
        <ThemedText>{title}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {subtitle}
        </ThemedText>
      </View>
      <Switch value={value} onValueChange={onChange} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: Spacing.three,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  toggleText: {
    flex: 1,
    gap: 1,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  note: {
    paddingHorizontal: Spacing.two,
    textAlign: 'center',
  },
});
