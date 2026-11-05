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

/** Rare by design — see the Comet component for why. */
const COMET_COUNT = 2;

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

/** A comet's timing only — see Comet for why its path isn't part of this. */
type CometTiming = {
  /** Seconds to wait before this comet's first run, so two comets don't launch together. */
  startDelay: number;
  /** Seconds between the end of one run and the start of the next. */
  interval: number;
};

/**
 * A comet: a bright head with a short fading tail, crossing part of the sky
 * and gone in under a second, then not seen again for a long, randomised
 * while.
 *
 * This is the one deliberately eye-catching thing in the field — everything
 * else here (the drifting planes, the slow twinkle) is tuned to sit below
 * notice. A comet earns the attention precisely by being rare: default to
 * roughly one every half-minute per slot, long enough that catching one
 * reads as a small reward for looking up, not as a loop a user starts
 * tracking.
 *
 * The path is re-rolled on every single run rather than fixed once. The
 * first version picked one path per comet for the session, the same
 * reasoning as the star planes' fixed layout — but that reasoning doesn't
 * transfer: the planes are a static backdrop that would look glitchy if it
 * rearranged itself, while a comet is a one-off event, and a real one never
 * retraces its last streak. Fixing the path also meant fixing which screen
 * content it would be stuck behind — particles sit below every card, and a
 * comet whose one permanent path happened to pass under Home's hero card
 * would never be seen at all. A fresh path each time means a bad draw is
 * one run, not forever.
 *
 * The tail is faked rather than filtered, same reasoning as everywhere else
 * in this file — react-native-svg's filter support doesn't reliably reach
 * native, so a pair of trailing circles at shrinking radius and opacity
 * stand in for a blurred streak.
 */
function Comet({ timing, width, height }: { timing: CometTiming; width: number; height: number }) {
  const t = useSharedValue(0);
  const x1 = useSharedValue(0);
  const y1 = useSharedValue(0);
  const x2 = useSharedValue(0);
  const y2 = useSharedValue(0);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;
    // Re-armed with a fresh randomised gap after every run, rather than a
    // fixed repeating interval — an evenly-spaced "rare" event is what makes
    // it start to feel like a metronome instead of a chance sighting.
    const scheduleNext = (waitSeconds: number) => {
      timer = setTimeout(() => {
        if (cancelled) return;
        // Left-to-right diagonal, biased to the middle band of the screen —
        // clear of the status bar / top tab bar above and the home
        // indicator / bottom inset below, but otherwise free to land
        // anywhere, including squarely behind a card. That's fine here: this
        // run was the one chance this draw got, the next one gets another.
        const newY1 = height * (0.12 + Math.random() * 0.62);
        x1.value = width * Math.random() * 0.3;
        y1.value = newY1;
        x2.value = width * (0.55 + Math.random() * 0.45);
        y2.value = newY1 + height * (0.04 + Math.random() * 0.08);
        t.value = 0;
        t.value = withTiming(1, { duration: 850, easing: Easing.in(Easing.quad) });
        scheduleNext(timing.interval * (0.7 + Math.random() * 0.6));
      }, waitSeconds * 1000);
    };
    scheduleNext(timing.startDelay);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [timing, width, height, t, x1, y1, x2, y2]);

  const headProps = useAnimatedProps(() => {
    const p = t.value;
    // Fast across the middle, soft at both ends — a comet that moved at a
    // constant rate would read as mechanical rather than as a streak of light.
    const eased = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
    return {
      cx: x1.value + (x2.value - x1.value) * eased,
      cy: y1.value + (y2.value - y1.value) * eased,
      // Fades in over the first tenth, holds, fades out over the last quarter —
      // never a hard pop in or out.
      opacity: p < 0.1 ? p / 0.1 : p > 0.75 ? Math.max(0, (1 - p) / 0.25) : 1,
    };
  });

  const tailProps = useAnimatedProps(() => {
    // A fixed step behind the head along the same eased curve — not a
    // constant pixel offset, which would stretch the tail out unrealistically
    // during the fast middle section and bunch it up at the slow ends.
    const p = Math.max(0, t.value - 0.08);
    const eased = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
    return {
      cx: x1.value + (x2.value - x1.value) * eased,
      cy: y1.value + (y2.value - y1.value) * eased,
      opacity: t.value < 0.1 ? t.value / 0.1 : t.value > 0.75 ? Math.max(0, (1 - t.value) / 0.25) : 0.5,
    };
  });

  return (
    <>
      <AnimatedCircle r={0.9} fill={STAR} animatedProps={tailProps} />
      <AnimatedCircle r={1.6} fill={STAR} animatedProps={headProps} />
    </>
  );
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

  // Only the timing is fixed per comet slot; the path is re-rolled on every
  // run (see Comet). Staggered start delays keep the two slots from ever
  // launching together, which would read as a single event splitting in two
  // rather than as two separate sightings.
  const cometTimings = useMemo<CometTiming[]>(
    () => Array.from({ length: COMET_COUNT }, (_, i) => ({ startDelay: 8 + i * 15, interval: 30 + i * 8 })),
    []
  );

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
      {cometTimings.map((timing, i) => (
        <Comet key={i} timing={timing} width={width} height={height} />
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
