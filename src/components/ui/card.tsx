import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View, type ViewProps } from 'react-native';

import { CornerRadius, Spacing, Surface } from '@/constants/theme';

type CardProps = ViewProps & {
  /** One tonal step brighter — for the interactive/hero surface on a screen. */
  raised?: boolean;
};

/**
 * The standard LIFE surface.
 *
 * A flat fill reads as cardboard. Real materials catch light: this is a
 * top-lit vertical gradient with a hairline specular edge along the top,
 * so every card looks like it's sitting under a light source rather than
 * being a painted rectangle. Depth comes from that light, never drop shadows.
 */
export function Card({ style, raised, children, ...rest }: CardProps) {
  return (
    <View style={[styles.card, style]} {...rest}>
      <LinearGradient
        colors={raised ? Surface.cardRaised : Surface.card}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      <View style={styles.edge} pointerEvents="none" />
      {children}
    </View>
  );
}

export function CardSection({ style, ...rest }: ViewProps) {
  return <View style={[styles.section, style]} {...rest} />;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: CornerRadius.large,
    padding: Spacing.four,
    overflow: 'hidden',
  },
  // Specular top edge: brightest where light would strike, fading immediately.
  edge: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: Surface.edgeHighlight,
  },
  section: {
    gap: Spacing.two,
  },
});
