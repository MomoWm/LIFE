import { useEffect } from 'react';
import { StyleSheet, useWindowDimensions, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedProps,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Path, Rect } from 'react-native-svg';

import { Domain } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const AnimatedPath = Animated.createAnimatedComponent(Path);

/** One hand-drawn organic blob, roughly centered in a -80..80 box. */
const BLOB_PATH =
  'M45.3,-58.5C58.5,-49.6,68.5,-34.5,72.6,-17.6C76.7,-0.7,74.9,18,66.5,32.6C58.1,47.2,43.1,57.8,26.6,64.4C10.1,71,-7.9,73.6,-24.5,68.7C-41.1,63.8,-56.3,51.4,-65.2,35.5C-74.1,19.6,-76.7,0.2,-72.1,-16.9C-67.5,-34,-55.7,-48.8,-41.2,-58C-26.7,-67.2,-9.5,-70.8,6.4,-69C22.3,-67.2,32.1,-67.4,45.3,-58.5Z';

/**
 * One soft decorative blob — the "illustration-forward" backdrop shape used
 * behind hero cards. No blur filter (react-native-svg doesn't carry one
 * reliably to native): softness comes from low opacity and generous size
 * instead, the same workaround the hero ring's glow already relies on.
 */
export function Blob({
  size = 220,
  color,
  opacity = 0.16,
  rotation = 0,
  style,
}: {
  size?: number;
  color?: string;
  opacity?: number;
  rotation?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const theme = useTheme();
  return (
    <Svg
      width={size}
      height={size}
      viewBox="-80 -80 160 160"
      style={style}
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants">
      <Path d={BLOB_PATH} fill={color ?? theme.tint} opacity={opacity} transform={`rotate(${rotation})`} />
    </Svg>
  );
}

/**
 * The slow living wash behind the whole app — this rewrite's replacement for
 * the old dark starfield/grain combo. A handful of oversized, low-opacity
 * candy blobs drift on long mismatched cycles so the pattern never visibly
 * repeats, sitting on the flat paper ground rather than a vignette: a light,
 * playful surface wants to stay bright at the edges, not fall off into
 * shadow the way the old dark wash did.
 */
export function AmbientBlobs() {
  const { width, height } = useWindowDimensions();
  const theme = useTheme();

  const driftA = useSharedValue(0);
  const driftB = useSharedValue(0);
  const driftC = useSharedValue(0);

  useEffect(() => {
    driftA.value = withRepeat(withTiming(1, { duration: 34_000, easing: Easing.inOut(Easing.sin) }), -1, true);
    driftB.value = withRepeat(withTiming(1, { duration: 46_000, easing: Easing.inOut(Easing.sin) }), -1, true);
    driftC.value = withRepeat(withTiming(1, { duration: 58_000, easing: Easing.inOut(Easing.sin) }), -1, true);
  }, [driftA, driftB, driftC]);

  // `<Path>` has no x/y attributes of its own (unlike Rect or Image) — a
  // path's geometry is baked into `d`, so the only way to move or scale one
  // is a transform. Both live in one `transform` string per blob (computed
  // inside `useAnimatedProps`, not split across a static prop and an
  // animated one) so there's no ambiguity about how react-native-svg would
  // order and combine them.
  const propsA = useAnimatedProps(() => ({
    transform: `translate(${width * 0.08 + driftA.value * width * 0.1}, ${height * -0.02 + driftA.value * height * 0.05}) scale(2.6)`,
  }));
  const propsB = useAnimatedProps(() => ({
    transform: `translate(${width * 0.62 - driftB.value * width * 0.08}, ${height * 0.06 + driftB.value * height * 0.06}) scale(2.1)`,
  }));
  const propsC = useAnimatedProps(() => ({
    transform: `translate(${width * 0.22 + driftC.value * width * 0.07}, ${height * 0.64 - driftC.value * height * 0.05}) scale(2.3)`,
  }));

  return (
    <Svg
      style={StyleSheet.absoluteFill}
      width={width}
      height={height}
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants">
      <Rect x="0" y="0" width="100%" height="100%" fill={theme.background} />
      <AnimatedPath d={BLOB_PATH} fill={Domain.routine} opacity={0.1} animatedProps={propsA} />
      <AnimatedPath d={BLOB_PATH} fill={Domain.prayer} opacity={0.09} animatedProps={propsB} />
      <AnimatedPath d={BLOB_PATH} fill={Domain.sleep} opacity={0.08} animatedProps={propsC} />
    </Svg>
  );
}
