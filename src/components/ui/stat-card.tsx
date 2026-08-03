import { Icon, type IconName } from '@/components/ui/icon';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { Spacing } from '@/constants/theme';

type StatCardProps = {
  label: string;
  value: string;
  unit?: string;
  symbol: IconName;
  symbolColor: string;
  footer?: ReactNode;
};

export function StatCard({ label, value, unit, symbol, symbolColor, footer }: StatCardProps) {
  return (
    <Card style={styles.card}>
      <View style={styles.labelRow}>
        <Icon name={symbol} size={15} tintColor={symbolColor} />
        <ThemedText type="small" themeColor="textSecondary">
          {label}
        </ThemedText>
      </View>
      <View style={styles.valueRow}>
        <ThemedText style={styles.value}>{value}</ThemedText>
        {unit ? (
          <ThemedText type="small" themeColor="textSecondary" style={styles.unit}>
            {unit}
          </ThemedText>
        ) : null}
      </View>
      {footer}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    gap: Spacing.one,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one + 2,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: Spacing.one,
  },
  value: {
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  unit: {
    marginBottom: 2,
  },
});
