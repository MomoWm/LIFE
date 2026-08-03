import * as ExpoHaptics from 'expo-haptics';
import { Platform } from 'react-native';

// Drop-in replacement for expo-haptics that no-ops on web, where the native
// module is absent and every call would surface an unhandled rejection.

export const ImpactFeedbackStyle = ExpoHaptics.ImpactFeedbackStyle;
export const NotificationFeedbackType = ExpoHaptics.NotificationFeedbackType;

export async function impactAsync(style?: ExpoHaptics.ImpactFeedbackStyle): Promise<void> {
  if (Platform.OS === 'web') return;
  return ExpoHaptics.impactAsync(style);
}

export async function selectionAsync(): Promise<void> {
  if (Platform.OS === 'web') return;
  return ExpoHaptics.selectionAsync();
}

export async function notificationAsync(
  type?: ExpoHaptics.NotificationFeedbackType
): Promise<void> {
  if (Platform.OS === 'web') return;
  return ExpoHaptics.notificationAsync(type);
}
