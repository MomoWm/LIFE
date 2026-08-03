import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SymbolView, type SymbolWeight } from 'expo-symbols';
import { Platform, type StyleProp, type ViewStyle } from 'react-native';

/**
 * SF Symbol name -> MaterialCommunityIcons equivalent. expo-symbols renders
 * nothing on web (its web impl returns only `fallback`), so every icon in the
 * app goes through this component: real SF Symbols on iOS, Material glyphs
 * everywhere else. Adding a new icon means adding it here first.
 */
const SF_TO_MATERIAL = {
  'arrow.counterclockwise': 'restore',
  'arrow.counterclockwise.circle.fill': 'restore',
  'arrow.down.right.circle.fill': 'arrow-bottom-right',
  'bed.double.fill': 'bed',
  'bell.badge.fill': 'bell-badge',
  'bolt.shield.fill': 'shield',
  'briefcase.fill': 'briefcase',
  'calendar.badge.plus': 'calendar-plus',
  'chart.bar.fill': 'chart-bar',
  'chart.xyaxis.line': 'chart-line',
  checklist: 'format-list-checks',
  checkmark: 'check',
  'checkmark.circle.fill': 'check-circle',
  'checkmark.rectangle.stack.fill': 'checkbox-multiple-marked',
  'checkmark.seal.fill': 'check-decagram',
  'chevron.down': 'chevron-down',
  'chevron.right': 'chevron-right',
  circle: 'checkbox-blank-circle-outline',
  clock: 'clock-outline',
  'clock.arrow.circlepath': 'history',
  'door.left.hand.open': 'door-open',
  'dumbbell.fill': 'dumbbell',
  'flag.checkered': 'flag-checkered',
  'flame.fill': 'fire',
  'gearshape.fill': 'cog',
  'heart.text.square': 'heart-pulse',
  'house.fill': 'home',
  'location.circle.fill': 'crosshairs-gps',
  'location.fill': 'map-marker',
  'megaphone.fill': 'bullhorn',
  'moon.stars.fill': 'weather-night',
  'moon.zzz.fill': 'sleep',
  'person.2.fill': 'account-multiple',
  plus: 'plus',
  'plus.circle.fill': 'plus-circle',
  'slider.horizontal.3': 'tune',
  star: 'star-outline',
  'star.fill': 'star',
  'sunrise.fill': 'weather-sunset-up',
  target: 'target',
  'trophy.fill': 'trophy',
  xmark: 'close',
} as const;

export type IconName = keyof typeof SF_TO_MATERIAL;

type IconProps = {
  name: IconName;
  size?: number;
  tintColor: string;
  weight?: SymbolWeight;
  style?: StyleProp<ViewStyle>;
};

export function Icon({ name, size = 24, tintColor, weight, style }: IconProps) {
  if (Platform.OS === 'ios') {
    return (
      <SymbolView
        name={name}
        size={size}
        tintColor={tintColor}
        weight={weight}
        resizeMode="scaleAspectFit"
        style={style}
      />
    );
  }
  return (
    <MaterialCommunityIcons
      name={SF_TO_MATERIAL[name]}
      size={size}
      color={tintColor}
      style={style as StyleProp<import('react-native').TextStyle>}
    />
  );
}
