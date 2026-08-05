import { useEffect, useMemo } from 'react';
import { StyleSheet, useWindowDimensions } from 'react-native';
import Animated, {
  Easing,
  useAnimatedProps,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, G, LinearGradient, Rect, Stop } from 'react-native-svg';

import { Colors } from '@/constants/theme';

const AnimatedG = Animated.createAnimatedComponent(G);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const STAR = '#FFFFFF';
/** Ground colour, used to wash the field out toward the reading area. */
const GROUND = Colors.dark.background;

/**
 * Three depth planes, far to near.
 *
 * Parallax is the whole trick. A single plane of dots moving together reads as
 * dots on a pane of glass no matter how many there are or how slowly they go;
 * planes moving at different speeds read as distance, which is what makes a
 * starfield look like space rather than like confetti. Far stars are smaller,
 * dimmer and slower — all three cues agreeing is what sells it, and any one of
 * them disagreeing breaks it.
 */
const PLANES = [
  // Opacities are higher than they look like they should be. Rendered and
  // measured: a 0.6pt dot at 16% white on graphite does not register at all —
  // below about 1pt, opacity has to carry the whole star, because there aren't
  // enough pixels left for size to carry any of it.
  { count: 62, minR: 0.6, maxR: 1.0, minO: 0.22, maxO: 0.36, seconds: 150 },
  { count: 38, minR: 0.9, maxR: 1.4, minO: 0.34, maxO: 0.5, seconds: 100 },
  { count: 20, minR: 1.3, maxR: 2.0, minO: 0.48, maxO: 0.7, seconds: 68 },
];

/** Stars that pulse. A handful, not the field — see the twinkle note below. */
const TWINKLE_COUNT = 14;

type Star = { x: number; y: number; r: number; o: number; phase: number };

/**
 * Deterministic layout.
 *
 * Randomising per mount makes the sky visibly rearrange itself every launch,
 * which reads as a glitch. A fixed seed keeps it the same sky.
 */
function makeRand(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

function planeStars(index: number, height: number): Star[] {
  const plane = PLANES[index];
  const rand = makeRand(0x9e3779b9 + index * 0x85ebca6b);
  return Array.from({ length: plane.count }, () => ({
    x: rand(),
    y: rand() * height,
    r: plane.minR + rand() * (plane.maxR - plane.minR),
    o: plane.minO + rand() * (plane.maxO - plane.minO),
    phase: rand(),
  }));
}

/**
 * One plane, drifting down forever.
 *
 * The stars are drawn twice, one screen-height apart, and the group travels
 * exactly one screen height per cycle. Because the content repeats at exactly
 * the distance travelled, the loop point is invisible — no fade, no pop, no
 * moment where the sky is empty. Doing this per-star instead would need one
 * animation per star; this is one animation per plane, which is why the field
 * can afford ~94 stars on a phone.
 */
function Plane({ index, height }: { index: number; height: number }) {
  const stars = useMemo(() => planeStars(index, height), [index, height]);
  const t = useSharedValue(0);

  useEffect(() => {
    t.value = withRepeat(
      withTiming(1, { duration: PLANES[index].seconds * 1000, easing: Easing.linear }),
      -1,
      false
    );
  }, [index, t]);

  const props = useAnimatedProps(() => ({ y: t.value * height }));

  return (
    <AnimatedG animatedProps={props}>
      {stars.map((s, i) => (
        <Circle
          key={i}
          cx={`${s.x * 100}%`}
          cy={s.y - height}
          r={s.r}
          fill={STAR}
          opacity={s.o}
        />
      ))}
      {stars.map((s, i) => (
        <Circle
          key={`b${i}`}
          cx={`${s.x * 100}%`}
          cy={s.y}
          r={s.r}
          fill={STAR}
          opacity={s.o}
        />
      ))}
    </AnimatedG>
  );
}

/**
 * A twinkling star, fixed in place.
 *
 * Real twinkle is atmospheric scintillation, which is fast and irregular;
 * copying that literally on a UI background is a distraction machine. This is
 * a slow sine, out of phase per star, so at any moment a few are brightening
 * and a few are dimming and none of it is fast enough to catch the eye
 * deliberately.
 */
function Twinkle({ star, clock }: { star: Star; clock: { value: number } }) {
  const props = useAnimatedProps(() => ({
    opacity: star.o * (0.45 + 0.55 * (0.5 + 0.5 * Math.sin((clock.value + star.phase) * Math.PI * 2))),
  }));
  return <AnimatedCircle cx={`${star.x * 100}%`} cy={star.y} r={star.r} fill={STAR} animatedProps={props} />;
}

/**
 * A starfield behind the whole app.
 *
 * Sits below every screen, so it only ever shows through the page ground —
 * cards and sheets are opaque and cover it. That is deliberate: this is
 * atmosphere for the space between content, not a layer over the content.
 *
 * The previous version was a handful of large rising motes, which read as
 * bubbles. Stars want the opposite of that: many, small, mostly dim, drifting
 * rather than travelling, with depth doing the work instead of size.
 */
export function Particles() {
  const { width, height } = useWindowDimensions();
  const reduceMotion = useReducedMotion();
  const clock = useSharedValue(0);

  const twinklers = useMemo(() => {
    const rand = makeRand(0xc2b2ae35);
    return Array.from({ length: TWINKLE_COUNT }, () => ({
      x: rand(),
      y: rand() * height,
      r: 1 + rand() * 1.1,
      o: 0.5 + rand() * 0.4,
      phase: rand(),
    }));
  }, [height]);

  useEffect(() => {
    clock.value = withRepeat(withTiming(1, { duration: 7000, easing: Easing.linear }), -1, false);
  }, [clock]);

  // Continuous ambient motion is exactly what reduce-motion exists to stop.
  if (reduceMotion) return null;

  return (
    <Svg
      style={StyleSheet.absoluteFill}
      // Explicit dimensions: the percentage cx values need a resolved
      // viewport, and an Svg sized only by absolute-fill styling doesn't
      // reliably give them one.
      width={width}
      height={height}
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants">
      {PLANES.map((_, i) => (
        <Plane key={i} index={i} height={height} />
      ))}
      {twinklers.map((star, i) => (
        <Twinkle key={i} star={star} clock={clock} />
      ))}
      {/* The sky belongs above the content, not behind the sentences.
          Sections in this app sit directly on the ground with no fill of their
          own, so a field drawn at even density puts stars in the middle of
          words — technically behind the glyphs, and still read as dirt on the
          screen. This washes the field out toward the bottom of the viewport,
          where the reading happens, so density is highest where there is
          nothing to read and effectively zero across body text. */}
      <Defs>
        <LinearGradient id="starFade" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={GROUND} stopOpacity="0" />
          <Stop offset="0.42" stopColor={GROUND} stopOpacity="0.5" />
          <Stop offset="1" stopColor={GROUND} stopOpacity="0.9" />
        </LinearGradient>
      </Defs>
      <Rect x="0" y="0" width="100%" height="100%" fill="url(#starFade)" />
    </Svg>
  );
}
