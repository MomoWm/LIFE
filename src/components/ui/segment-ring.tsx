import { useEffect } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedProps,
  useSharedValue,
  withDelay,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

import { useTheme } from '@/hooks/use-theme';

const AnimatedPath = Animated.createAnimatedComponent(Path);

export type RingSegment = {
  key: string;
  /** Share of the ring this segment occupies — the category's scoring weight. */
  weight: number;
  /** 0-1 fill within this segment's own arc. */
  score: number;
  color: string;
  /** False when the category doesn't count today (rest day, unconfigured). */
  applicable: boolean;
};

function polar(cx: number, cy: number, r: number, deg: number) {
  const rad = ((deg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function arcPath(cx: number, cy: number, r: number, startDeg: number, endDeg: number) {
  // A full circle can't be expressed as one arc — the start and end points
  // would coincide and the renderer draws nothing.
  const sweep = Math.min(endDeg - startDeg, 359.99);
  const start = polar(cx, cy, r, startDeg);
  const end = polar(cx, cy, r, startDeg + sweep);
  const largeArc = sweep > 180 ? 1 : 0;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`;
}

/**
 * One ring divided into weighted arcs — a segment per life category, sized by
 * how much that category counts toward the day and filled by how much of it
 * is done.
 *
 * A single arc can only say "you are at 62%". This says *which parts* got you
 * there in the same glance, so the ring answers "how am I doing" and "what's
 * missing" at once, and replaces the stack of per-category bars that used to
 * sit under it.
 */
export function SegmentRing({
  segments,
  size = 148,
  strokeWidth = 10,
  gapDegrees = 5,
  children,
  style,
}: {
  segments: RingSegment[];
  size?: number;
  strokeWidth?: number;
  gapDegrees?: number;
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const theme = useTheme();
  const r = (size - strokeWidth) / 2;
  const c = size / 2;

  const active = segments.filter((s) => s.applicable);
  // Inapplicable categories still hold their place in the ring as empty track,
  // so the shape of the day stays recognisable instead of the whole ring
  // re-proportioning itself on a rest day.
  const totalWeight = segments.reduce((sum, s) => sum + s.weight, 0) || 1;

  const progress = useSharedValue(0);
  useEffect(() => {
    progress.value = withDelay(
      120,
      withTiming(1, { duration: 1100, easing: Easing.out(Easing.cubic) })
    );
  }, [progress]);

  let cursor = 0;
  const arcs = segments.map((seg) => {
    const share = (seg.weight / totalWeight) * 360;
    const start = cursor;
    cursor += share;
    return { seg, start: start + gapDegrees / 2, sweep: Math.max(0, share - gapDegrees) };
  });

  return (
    <View
      style={[{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }, style]}
      accessible
      accessibilityLabel={active
        .map((s) => `${s.key} ${Math.round(s.score * 100)} percent`)
        .join(', ')}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        {arcs.map(({ seg, start, sweep }) => (
          <Path
            key={`track-${seg.key}`}
            d={arcPath(c, c, r, start, start + sweep)}
            stroke={theme.track}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            fill="none"
          />
        ))}
        {arcs.map(({ seg, start, sweep }) =>
          seg.applicable && seg.score > 0 ? (
            <FillArc
              key={`fill-${seg.key}`}
              cx={c}
              r={r}
              start={start}
              sweep={sweep}
              score={seg.score}
              color={seg.color}
              strokeWidth={strokeWidth}
              progress={progress}
            />
          ) : null
        )}
      </Svg>
      {children}
    </View>
  );
}

function FillArc({
  cx,
  r,
  start,
  sweep,
  score,
  color,
  strokeWidth,
  progress,
}: {
  cx: number;
  r: number;
  start: number;
  sweep: number;
  score: number;
  color: string;
  strokeWidth: number;
  progress: SharedValue<number>;
}) {
  const full = arcPath(cx, cx, r, start, start + sweep * Math.min(1, score));
  const len = 2 * Math.PI * r * ((sweep * Math.min(1, score)) / 360);

  // Draw the arc by revealing its own dash — the geometry stays fixed so the
  // path never has to be recomputed on the JS thread mid-animation.
  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: len * (1 - progress.value),
  }));

  return (
    <AnimatedPath
      d={full}
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeDasharray={len}
      animatedProps={animatedProps}
      fill="none"
    />
  );
}
