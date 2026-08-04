import { useEffect, useMemo } from 'react';
import { StyleSheet, useWindowDimensions } from 'react-native';
import Animated, {
  Easing,
  useAnimatedProps,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';

import { Domain } from '@/constants/theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const COUNT = 24;
const HUES = [Domain.routine, Domain.prayer, Domain.work, Domain.training, Domain.sleep];

type Spec = {
  x: number;
  r: number;
  hue: string;
  opacity: number;
  duration: number;
  delay: number;
  drift: number;
};

/**
 * Deterministic layout for the field.
 *
 * Randomising on every mount makes the background visibly rearrange itself
 * each time the app is opened, which reads as a glitch rather than as
 * atmosphere. A fixed hash keeps the field the same field.
 */
function specs(): Spec[] {
  let seed = 0x9e3779b9;
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 0xffffffff;
  };
  return Array.from({ length: COUNT }, () => ({
    x: rand(),
    r: 1 + rand() * 2.6,
    hue: HUES[Math.floor(rand() * HUES.length)],
    // Small motes stay fainter than large ones, so the field reads as having
    // depth rather than as scattered dots on one plane.
    opacity: 0.18 + rand() * 0.34,
    duration: 22_000 + rand() * 26_000,
    delay: rand() * 18_000,
    drift: (rand() - 0.5) * 0.16,
  }));
}

function Mote({ spec, height }: { spec: Spec; height: number }) {
  const t = useSharedValue(0);

  useEffect(() => {
    t.value = withDelay(
      spec.delay,
      // Linear, and never reversed: a mote that eased or drifted back down
      // would read as tethered. These rise, leave, and start again.
      withRepeat(withTiming(1, { duration: spec.duration, easing: Easing.linear }), -1, false)
    );
  }, [spec.delay, spec.duration, t]);

  const props = useAnimatedProps(() => ({
    cy: height + 12 - t.value * (height + 24),
    cx: `${(spec.x + spec.drift * t.value) * 100}%`,
    // Fade in and out at the ends of the run so nothing pops into or out of
    // existence at the screen edge.
    opacity: spec.opacity * Math.min(1, Math.min(t.value, 1 - t.value) * 6),
  }));

  return <AnimatedCircle r={spec.r} fill={spec.hue} animatedProps={props} />;
}

/**
 * A slow field of motes drifting up behind the app.
 *
 * The ambient wash gives the ground light and the grain gives it texture, but
 * both are static — nothing on screen moved unless the user made it move, and
 * a screen that never changes on its own reads as a document. Motion at this
 * speed isn't noticed directly; what gets noticed is that the app feels alive
 * when you look up from it.
 *
 * Kept deliberately sparse and dim. Particles are the easiest thing in this
 * whole app to overdo, and the failure mode — a screensaver you have to read
 * text through — is much worse than not having them.
 */
export function Particles() {
  const { height } = useWindowDimensions();
  const reduceMotion = useReducedMotion();
  const field = useMemo(() => specs(), []);

  // Continuous ambient motion is exactly what reduce-motion exists to stop.
  if (reduceMotion) return null;

  return (
    <Svg
      style={StyleSheet.absoluteFill}
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants">
      {field.map((spec, i) => (
        <Mote key={i} spec={spec} height={height} />
      ))}
    </Svg>
  );
}
