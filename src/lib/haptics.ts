import * as ExpoHaptics from 'expo-haptics';
import { Platform } from 'react-native';

/**
 * Haptics that also do something on the web build.
 *
 * expo-haptics has no web module, so the previous wrapper no-opped there
 * entirely — and since LIFE is installed as a PWA, that meant every tap in the
 * app the owner actually uses was silent. A no-op is the right fallback for an
 * absent native module; it is the wrong fallback for "the platform has its own
 * API".
 *
 * The web path uses the Vibration API. Two honest limitations:
 *
 * - iOS Safari does not implement `navigator.vibrate` at all, and there is no
 *   supported substitute. On an installed iOS PWA these calls still do
 *   nothing, and no amount of code changes that — real haptics there need a
 *   native build. Motion is what has to carry the feedback on that platform,
 *   which is why the check animation does the work it does.
 * - Vibration is coarse: a duration in milliseconds, with no equivalent of
 *   Core Haptics' sharpness or intensity. The values below are chosen so the
 *   *pattern* still distinguishes a tap from a success from an error.
 */

export const ImpactFeedbackStyle = ExpoHaptics.ImpactFeedbackStyle;
export const NotificationFeedbackType = ExpoHaptics.NotificationFeedbackType;

function vibrate(pattern: number | number[]) {
  if (typeof navigator === 'undefined') return;
  // Absent on iOS Safari, and a no-op in browsers that require engagement.
  navigator.vibrate?.(pattern);
}

const IMPACT_MS: Record<string, number> = {
  [ExpoHaptics.ImpactFeedbackStyle.Light]: 8,
  [ExpoHaptics.ImpactFeedbackStyle.Medium]: 14,
  [ExpoHaptics.ImpactFeedbackStyle.Heavy]: 22,
};

export async function impactAsync(style?: ExpoHaptics.ImpactFeedbackStyle): Promise<void> {
  if (Platform.OS === 'web') {
    vibrate(IMPACT_MS[style ?? ExpoHaptics.ImpactFeedbackStyle.Medium] ?? 14);
    return;
  }
  return ExpoHaptics.impactAsync(style);
}

export async function selectionAsync(): Promise<void> {
  if (Platform.OS === 'web') {
    vibrate(6);
    return;
  }
  return ExpoHaptics.selectionAsync();
}

export async function notificationAsync(
  type?: ExpoHaptics.NotificationFeedbackType
): Promise<void> {
  if (Platform.OS === 'web') {
    // Patterns rather than single buzzes, so the three outcomes stay
    // distinguishable without intensity control: success rises, warning
    // hesitates, error insists.
    vibrate(
      type === ExpoHaptics.NotificationFeedbackType.Success
        ? [10, 40, 20]
        : type === ExpoHaptics.NotificationFeedbackType.Warning
          ? [16, 70, 16]
          : [24, 50, 24, 50, 24]
    );
    return;
  }
  return ExpoHaptics.notificationAsync(type);
}
