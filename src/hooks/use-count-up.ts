import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

/**
 * Counts a number up to its target instead of snapping to it.
 *
 * A hero metric that simply appears reads as a static readout; one that climbs
 * reads as a measurement being taken. Driven on the JS thread with rAF because
 * the value has to become React state to render as text — this is one number
 * per screen, not a per-frame layout animation.
 *
 * Honours reduce-motion by jumping straight to the target.
 */
export function useCountUp(target: number, duration = 900) {
  const [value, setValue] = useState(target);
  const fromRef = useRef(target);
  const frameRef = useRef<number | null>(null);
  const reduceMotionRef = useRef(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      reduceMotionRef.current = enabled;
    });
  }, []);

  useEffect(() => {
    const from = fromRef.current;
    if (from === target || reduceMotionRef.current) {
      fromRef.current = target;
      setValue(target);
      return;
    }

    const start = Date.now();
    const tick = () => {
      const t = Math.min(1, (Date.now() - start) / duration);
      // Ease-out cubic: fast off the mark, settling into the final value.
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(from + (target - from) * eased);
      if (t < 1) {
        frameRef.current = requestAnimationFrame(tick);
      } else {
        fromRef.current = target;
      }
    };
    frameRef.current = requestAnimationFrame(tick);

    return () => {
      if (frameRef.current != null) cancelAnimationFrame(frameRef.current);
      fromRef.current = target;
    };
  }, [target, duration]);

  return value;
}
