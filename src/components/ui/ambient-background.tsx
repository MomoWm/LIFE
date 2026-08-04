import { useEffect, useMemo } from 'react';
import { StyleSheet, useWindowDimensions } from 'react-native';
import Animated, {
  Easing,
  useAnimatedProps,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Defs, Rect, RadialGradient, Stop } from 'react-native-svg';

import { Colors } from '@/constants/theme';

const AnimatedRadialGradient = Animated.createAnimatedComponent(RadialGradient);

/**
 * Time-of-day palettes. The app should not look identical at 6am and 11pm —
 * the ambient wash warms at dawn, cools through the working day, deepens at
 * dusk and goes quiet at night, so opening the app tells you roughly where in
 * the day you are before you read anything.
 *
 * Opacities are deliberately tiny. This is atmosphere, not decoration: it has
 * to read as the room's lighting changing, never as a coloured background.
 */
function palette(hour: number): { a: string; b: string; alphaA: number; alphaB: number } {
  if (hour >= 5 && hour < 9) return { a: '#C6AC8B', b: '#A6C1B2', alphaA: 0.30, alphaB: 0.22 };
  if (hour >= 9 && hour < 17) return { a: '#A6C1B2', b: '#93AFC0', alphaA: 0.24, alphaB: 0.20 };
  if (hour >= 17 && hour < 21) return { a: '#C6AC8B', b: '#B4A7C4', alphaA: 0.28, alphaB: 0.24 };
  return { a: '#A3ADC9', b: '#93AFC0', alphaA: 0.22, alphaB: 0.17 };
}

/**
 * A slow, living wash behind the whole app.
 *
 * Two oversized radial gradients drift on long, mismatched cycles so the
 * pattern never visibly repeats. Everything renders inside one SVG on the UI
 * thread — no blur filters, which react-native-web and native disagree about.
 */
export function AmbientBackground() {
  const { width, height } = useWindowDimensions();
  const hour = new Date().getHours();
  const { a, b, alphaA, alphaB } = useMemo(() => palette(hour), [hour]);

  const driftA = useSharedValue(0);
  const driftB = useSharedValue(0);

  useEffect(() => {
    // Long, coprime-ish durations so the two orbits stay out of phase.
    driftA.value = withRepeat(
      withTiming(1, { duration: 38_000, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );
    driftB.value = withRepeat(
      withTiming(1, { duration: 53_000, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );
  }, [driftA, driftB]);

  const propsA = useAnimatedProps(() => ({
    cx: `${18 + driftA.value * 46}%`,
    cy: `${10 + driftA.value * 22}%`,
  }));

  const propsB = useAnimatedProps(() => ({
    cx: `${82 - driftB.value * 52}%`,
    cy: `${74 - driftB.value * 26}%`,
  }));

  return (
    <Svg
      style={StyleSheet.absoluteFill}
      width={width}
      height={height}
      pointerEvents="none"
      // Purely atmospheric — never announced.
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants">
      <Defs>
        <AnimatedRadialGradient id="ambientA" r="62%" animatedProps={propsA}>
          <Stop offset="0" stopColor={a} stopOpacity={alphaA} />
          <Stop offset="1" stopColor={a} stopOpacity="0" />
        </AnimatedRadialGradient>
        <AnimatedRadialGradient id="ambientB" r="58%" animatedProps={propsB}>
          <Stop offset="0" stopColor={b} stopOpacity={alphaB} />
          <Stop offset="1" stopColor={b} stopOpacity="0" />
        </AnimatedRadialGradient>
        {/* Vignette. Without it the wash fills the frame evenly, which reads
            as a coloured background; darkening the corners makes the same
            wash read as light falling on a surface, and pulls the eye to the
            middle of the screen where the content actually is. */}
        <RadialGradient id="ambientVignette" cx="50%" cy="42%" r="78%">
          <Stop offset="0.45" stopColor="#000000" stopOpacity="0" />
          <Stop offset="1" stopColor="#000000" stopOpacity="0.5" />
        </RadialGradient>
      </Defs>
      <Rect x="0" y="0" width="100%" height="100%" fill={Colors.dark.background} />
      <Rect x="0" y="0" width="100%" height="100%" fill="url(#ambientA)" />
      <Rect x="0" y="0" width="100%" height="100%" fill="url(#ambientB)" />
      <Rect x="0" y="0" width="100%" height="100%" fill="url(#ambientVignette)" />
    </Svg>
  );
}
