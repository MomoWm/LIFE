import { Image, StyleSheet } from 'react-native';

const GRAIN = require('@/assets/images/grain.png');

/**
 * A tiled film-grain overlay across the whole app.
 *
 * Large dark gradients are where 8-bit colour runs out of steps, so they band
 * into visible rings; grain dithers those away. It also does the less
 * measurable half of the job — a perfectly smooth surface reads as a render,
 * and a few percent of texture reads as material.
 *
 * Sits above the ambient wash and below content, so it textures the ground
 * without dusting the type.
 */
export function Grain() {
  return (
    <Image
      source={GRAIN}
      style={styles.grain}
      // Tiled at its native 160pt rather than stretched — scaling grain up
      // turns it into blotches.
      resizeMode="repeat"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    />
  );
}

const styles = StyleSheet.create({
  grain: {
    ...StyleSheet.absoluteFillObject,
    // Style rather than prop: RN's Image types don't accept pointerEvents.
    pointerEvents: 'none',
    // The tile itself carries per-pixel alpha; this sets the overall strength.
    // Past ~0.1 it stops reading as texture and starts reading as noise.
    opacity: 0.055,
  },
});
