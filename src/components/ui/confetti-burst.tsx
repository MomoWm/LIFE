import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { Domain } from '@/constants/theme';

const COLORS = [Domain.routine, Domain.prayer, Domain.work, Domain.training, Domain.sleep];
const PIECE_COUNT = 14;

/**
 * A short burst of candy-colored confetti pieces exploding outward and
 * falling away — the "reward" moment for finishing a task or hitting a
 * streak, replacing the old ambient starfield (which was atmosphere for a
 * dark instrument, not a response to anything the person did). Fires once
 * each time `trigger` changes; a fresh `Math.random()` trajectory is rolled
 * per piece at that moment rather than baked into a fixed pattern, so a
 * second burst never looks identical to the first.
 */
export function ConfettiBurst({ trigger }: { trigger: number | string }) {
  return (
    <View style={styles.root} pointerEvents="none">
      <Pieces key={trigger} />
    </View>
  );
}

function Pieces() {
  const reduceMotion = useReducedMotion();
  if (reduceMotion) return null;
  return (
    <>
      {Array.from({ length: PIECE_COUNT }, (_, i) => (
        <Piece key={i} color={COLORS[i % COLORS.length]} />
      ))}
    </>
  );
}

function Piece({ color }: { color: string }) {
  const angle = Math.random() * Math.PI * 2;
  const distance = 36 + Math.random() * 54;
  const dx = Math.cos(angle) * distance;
  const dy = Math.sin(angle) * distance - 10;
  const spin = (Math.random() - 0.5) * 420;
  const size = 5 + Math.random() * 4;
  const duration = 520 + Math.random() * 260;

  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(1, { duration, easing: Easing.out(Easing.cubic) });
  }, [progress, duration]);

  const style = useAnimatedStyle(() => ({
    opacity: 1 - progress.value,
    transform: [
      { translateX: dx * progress.value },
      { translateY: dy * progress.value + 70 * progress.value * progress.value },
      { rotate: `${spin * progress.value}deg` },
      { scale: 1 - progress.value * 0.3 },
    ],
  }));

  return (
    <Animated.View
      style={[
        styles.piece,
        { width: size, height: size, borderRadius: size * 0.3, backgroundColor: color },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  root: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 0,
    height: 0,
  },
  piece: {
    position: 'absolute',
  },
});
