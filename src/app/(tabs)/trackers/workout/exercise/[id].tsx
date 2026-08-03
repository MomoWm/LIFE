import { format, parseISO } from 'date-fns';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { Spacing } from '@/constants/theme';
import { useExerciseProgress, type ExercisePoint } from '@/hooks/use-workout';
import { useTheme } from '@/hooks/use-theme';

export default function ExerciseProgressScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data } = useExerciseProgress(id);

  const points = data?.points ?? [];
  const latest = points[points.length - 1];
  const best = points.reduce((max, p) => Math.max(max, p.topWeight), 0);

  return (
    <>
      <Stack.Screen options={{ title: data?.name ?? 'Progress', headerLargeTitle: false }} />
      <Screen>
        <View style={styles.statRow}>
          <Card style={styles.stat}>
            <ThemedText type="small" themeColor="textSecondary">
              Latest top set
            </ThemedText>
            <ThemedText style={styles.statValue}>
              {latest ? `${latest.topWeight} lb` : '—'}
            </ThemedText>
          </Card>
          <Card style={styles.stat}>
            <ThemedText type="small" themeColor="textSecondary">
              All-time best
            </ThemedText>
            <ThemedText style={styles.statValue}>{best > 0 ? `${best} lb` : '—'}</ThemedText>
          </Card>
        </View>

        <Card style={styles.chartCard}>
          <ThemedText type="smallBold">Top-set weight over time</ThemedText>
          {points.length >= 2 ? (
            <LineChart points={points} />
          ) : (
            <ThemedText type="small" themeColor="textSecondary">
              Log this exercise in at least two sessions to see a trend line.
            </ThemedText>
          )}
        </Card>
      </Screen>
    </>
  );
}

function LineChart({ points }: { points: ExercisePoint[] }) {
  const theme = useTheme();
  const [width, setWidth] = useState(0);
  const height = 160;
  const pad = 10;

  const min = Math.min(...points.map((p) => p.topWeight));
  const max = Math.max(...points.map((p) => p.topWeight));
  const range = Math.max(1, max - min);

  const x = (i: number) => pad + (i / (points.length - 1)) * (width - pad * 2);
  const y = (value: number) => pad + (1 - (value - min) / range) * (height - pad * 2);

  const path = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${x(i).toFixed(1)} ${y(p.topWeight).toFixed(1)}`)
    .join(' ');

  return (
    <View style={styles.chartWrap} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      {width > 0 ? (
        <Svg width={width} height={height}>
          <Path d={path} stroke={theme.tint} strokeWidth={2.5} fill="none" strokeLinejoin="round" />
          {points.map((p, i) => (
            <Circle key={p.date} cx={x(i)} cy={y(p.topWeight)} r={3.5} fill={theme.tint} />
          ))}
        </Svg>
      ) : null}
      <View style={styles.axisLabels}>
        <ThemedText type="small" themeColor="textSecondary">
          {format(parseISO(points[0].date), 'MMM d')}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {format(parseISO(points[points.length - 1].date), 'MMM d')}
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  statRow: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  stat: {
    flex: 1,
    gap: Spacing.one,
  },
  statValue: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  chartCard: {
    gap: Spacing.two,
  },
  chartWrap: {
    gap: Spacing.one,
  },
  axisLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
