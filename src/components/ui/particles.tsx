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

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const COUNT = 34;

/**
 * White, not the domain hues.
 *
 * Tinted motes were the wrong call twice over: at this size and opacity the
 * colour never actually reads — a 2pt sage dot on graphite is just a grey dot —
 * and the domain hues carry meaning everywhere else in the app, so spending
 * them on decoration weakens them. White is the only colour that reads as
 * light rather than as a mark, which is what these are meant to be.
 */
const MOTE = '#FFFFFF';

type Spec = {
  x: number;
  r: number;
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
  return Array.from({ length: COUNT }, () => {
    // One roll drives both size and brightness so the two stay correlated:
    // near motes are bigger *and* brighter, far ones smaller and fainter.
    // Independent rolls produce big dim blobs and tiny bright pinpricks, which
    // reads as noise rather than as depth.
    const depth = rand();
    return {
      x: rand(),
      // Measured rather than guessed: at r 1-3.7 every mote rendered, and none
      // of them read — a 2pt dot at 40% white on graphite is below the
      // threshold where the eye registers it as anything. Size is the lever
      // that matters at these opacities, not count.
      r: 1.7 + depth * 3.3,
      opacity: 0.34 + depth * 0.5,
      duration: 20_000 + rand() * 24_000,
      delay: rand() * 16_000,
      drift: (rand() - 0.5) * 0.16,
    };
  });
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

  return <AnimatedCircle r={spec.r} fill={MOTE} animatedProps={props} />;
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
  const { width, height } = useWindowDimensions();
  const reduceMotion = useReducedMotion();
  const field = useMemo(() => specs(), []);

  // Continuous ambient motion is exactly what reduce-motion exists to stop.
  if (reduceMotion) return null;

  return (
    <Svg
      style={StyleSheet.absoluteFill}
      // Explicit dimensions, not just an absolute-fill style. Without them
      // react-native-svg renders an <svg> with no intrinsic size on web: the
      // circles still lay out and still report positions, so this looks
      // correct to anything that inspects the DOM — but the collapsed SVG
      // viewport clips every one of them and nothing is ever painted.
      width={width}
      height={height}
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants">
      {field.map((spec, i) => (
        <Mote key={i} spec={spec} height={height} />
      ))}
    </Svg>
  );
}
