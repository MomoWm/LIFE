import { format, parseISO } from 'date-fns';
import { Stack } from 'expo-router';
import { StyleSheet } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { BarChart } from '@/components/ui/bar-chart';
import { Card } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { StatCard } from '@/components/ui/stat-card';
import { Spacing } from '@/constants/theme';
import { useScoreHistory } from '@/hooks/use-score-history';
import { useTheme } from '@/hooks/use-theme';

/**
 * Minimum days of real (non-null) history before showing a trend statement —
 * fewer than this and a "you're up 20%" claim is just noise. See
 * DECISIONS.md: analytics must not overstate confidence from a small sample.
 */
const MIN_SAMPLE_FOR_TREND = 5;

export default function InsightsScreen() {
  const theme = useTheme();
  const { data: last30 } = useScoreHistory(30);

  const scored30 = (last30 ?? []).filter((d): d is { date: string; score: number } => d.score != null);

  const avg = (rows: { score: number }[]) =>
    rows.length > 0 ? rows.reduce((sum, r) => sum + r.score, 0) / rows.length : null;

  const avg30 = avg(scored30);
  const avg7 = avg(scored30.slice(-7));
  const best = scored30.reduce<{ date: string; score: number } | null>(
    (max, row) => (max == null || row.score > max.score ? row : max),
    null
  );

  const chartData = (last30 ?? []).map((row) => ({
    label: format(parseISO(row.date), 'MMM d'),
    value: Math.round((row.score ?? 0) * 100),
  }));

  const hasEnoughForTrend = scored30.length >= MIN_SAMPLE_FOR_TREND;
  const trendDelta = hasEnoughForTrend && avg30 != null && avg7 != null ? avg7 - avg30 : null;

  return (
    <>
      <Stack.Screen options={{ title: 'Insights' }} />
      <Screen>
        <Animated.View entering={FadeInDown.duration(300)} style={styles.statRow}>
          <StatCard
            label="7-day avg"
            value={avg7 != null ? String(Math.round(avg7 * 100)) : '—'}
            unit="score"
            symbol="chart.xyaxis.line"
            symbolColor={theme.textSecondary}
          />
          <StatCard
            label="Best day (30d)"
            value={best ? String(Math.round(best.score * 100)) : '—'}
            unit={best ? format(parseISO(best.date), 'MMM d') : undefined}
            symbol="trophy.fill"
            symbolColor={theme.textSecondary}
          />
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(300).delay(60)}>
          <Card style={styles.chartCard}>
            <ThemedText type="smallBold">Last 30 days</ThemedText>
            {chartData.some((d) => d.value > 0) ? (
              <BarChart data={chartData} formatValue={(v) => `${v}`} color={theme.tint} />
            ) : (
              <ThemedText type="small" themeColor="textSecondary">
                No scored days yet — your daily score saves automatically once the Today tab has
                something to measure.
              </ThemedText>
            )}
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(300).delay(120)}>
          <Card style={styles.noteCard}>
            {hasEnoughForTrend && trendDelta != null ? (
              <ThemedText type="small" themeColor="textSecondary">
                This week averaged {trendDelta >= 0 ? '+' : ''}
                {Math.round(trendDelta * 100)} points against your 30-day average — based on{' '}
                {scored30.length} scored day{scored30.length === 1 ? '' : 's'}.
              </ThemedText>
            ) : (
              <ThemedText type="small" themeColor="textSecondary">
                Trend comparisons need at least {MIN_SAMPLE_FOR_TREND} scored days to mean
                anything. Keep using LIFE daily and this fills in — {scored30.length} so far.
              </ThemedText>
            )}
          </Card>
        </Animated.View>
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  statRow: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  chartCard: {
    gap: Spacing.two,
  },
  noteCard: {
    gap: Spacing.one,
  },
});
