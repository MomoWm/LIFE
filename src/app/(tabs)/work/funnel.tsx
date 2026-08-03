import { Stack } from 'expo-router';
import { Icon } from '@/components/ui/icon';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { CornerRadius, Spacing } from '@/constants/theme';
import { computeFunnel, formatRate } from '@/lib/funnel/funnel';
import { useWorkRange } from '@/hooks/use-work';
import { useTheme } from '@/hooks/use-theme';

const WINDOWS = [
  { days: 1, label: 'Today' },
  { days: 7, label: '7 days' },
  { days: 30, label: '30 days' },
  { days: 90, label: '90 days' },
] as const;

export default function FunnelScreen() {
  const theme = useTheme();
  const [days, setDays] = useState<number>(7);
  const { data } = useWorkRange(days);

  const counts = data?.counts ?? { door: 0, interaction: 0, pitch: 0, appointment: 0 };
  const rates = computeFunnel({
    doors: counts.door,
    interactions: counts.interaction,
    pitches: counts.pitch,
    appointments: counts.appointment,
  });

  const stages = [
    { label: 'Doors', value: counts.door, color: theme.tint, rate: null as string | null },
    { label: 'Interactions', value: counts.interaction, color: theme.success, rate: formatRate(rates.interactionRate) },
    { label: 'Pitches', value: counts.pitch, color: theme.warning, rate: formatRate(rates.pitchRate) },
    { label: 'Appointments', value: counts.appointment, color: '#7B68EE', rate: formatRate(rates.appointmentRate) },
  ];
  const max = Math.max(1, ...stages.map((s) => s.value));

  return (
    <>
      <Stack.Screen options={{ title: 'Funnel', headerLargeTitle: false }} />
      <Screen>
        <View style={styles.chips}>
          {WINDOWS.map((window) => {
            const selected = window.days === days;
            return (
              <Pressable
                key={window.days}
                onPress={() => setDays(window.days)}
                style={[
                  styles.chip,
                  { backgroundColor: selected ? theme.tint : theme.backgroundElement },
                ]}>
                <ThemedText
                  type="smallBold"
                  style={{ color: selected ? '#fff' : theme.textSecondary }}>
                  {window.label}
                </ThemedText>
              </Pressable>
            );
          })}
        </View>

        <Animated.View key={days} entering={FadeInDown.duration(250)}>
          <Card style={styles.funnelCard}>
            {stages.map((stage) => (
              <View key={stage.label} style={styles.stageBlock}>
                <View style={styles.stageHeader}>
                  <ThemedText type="smallBold">{stage.label}</ThemedText>
                  <View style={styles.stageNumbers}>
                    {stage.rate ? (
                      <ThemedText type="small" themeColor="textSecondary">
                        {stage.rate} of previous
                      </ThemedText>
                    ) : null}
                    <ThemedText type="smallBold" style={styles.stageValue}>
                      {stage.value}
                    </ThemedText>
                  </View>
                </View>
                <View style={[styles.barTrack, { backgroundColor: theme.backgroundSelected }]}>
                  <View
                    style={[
                      styles.barFill,
                      {
                        backgroundColor: stage.color,
                        width: `${Math.max(2, (stage.value / max) * 100)}%`,
                      },
                    ]}
                  />
                </View>
              </View>
            ))}

            <View style={[styles.overallRow, { borderTopColor: theme.separator }]}>
              <Icon name="arrow.down.right.circle.fill" size={16} tintColor={theme.tint} />
              <ThemedText type="small" themeColor="textSecondary" style={styles.overallText}>
                Overall: {formatRate(rates.overallRate)} of doors become appointments
                {data ? ` · ${data.activeDayCount} active day${data.activeDayCount === 1 ? '' : 's'}` : ''}
              </ThemedText>
            </View>
          </Card>
        </Animated.View>

        <ThemedText type="small" themeColor="textSecondary" style={styles.hint}>
          Low interaction rate → knock more / better hours. Low pitch rate → tighten your opener.
          Low appointment rate → work the close.
        </ThemedText>
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  chips: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  chip: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: CornerRadius.xlarge,
  },
  funnelCard: {
    gap: Spacing.three,
  },
  stageBlock: {
    gap: Spacing.one,
  },
  stageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stageNumbers: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  stageValue: {
    fontVariant: ['tabular-nums'],
  },
  barTrack: {
    height: 22,
    borderRadius: CornerRadius.small,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: CornerRadius.small,
  },
  overallRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: Spacing.two,
  },
  overallText: {
    flex: 1,
  },
  hint: {
    textAlign: 'center',
    paddingHorizontal: Spacing.three,
  },
});
