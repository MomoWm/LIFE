import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import type { StyleProp, TextStyle } from 'react-native';

/**
 * One icon family everywhere, not a per-platform SF-Symbol/Material split.
 * Ionicons' rounded, friendly glyph style is also just a better fit for a
 * playful app than mixing two unrelated icon languages ever was.
 */
export type IconName = ComponentProps<typeof Ionicons>['name'];

type IconProps = {
  name: IconName;
  size?: number;
  tintColor: string;
  style?: StyleProp<TextStyle>;
};

export function Icon({ name, size = 24, tintColor, style }: IconProps) {
  return <Ionicons name={name} size={size} color={tintColor} style={style} />;
}
