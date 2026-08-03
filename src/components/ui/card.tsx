import { StyleSheet, View, type ViewProps } from 'react-native';

import { ThemedView } from '@/components/themed-view';
import { CornerRadius, Spacing } from '@/constants/theme';

export function Card({ style, ...rest }: ViewProps) {
  return <ThemedView type="backgroundElement" style={[styles.card, style]} {...rest} />;
}

export function CardSection({ style, ...rest }: ViewProps) {
  return <View style={[styles.section, style]} {...rest} />;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: CornerRadius.large,
    padding: Spacing.three,
  },
  section: {
    gap: Spacing.two,
  },
});
