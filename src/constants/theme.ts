/**
 * LIFE design tokens.
 *
 * The visual identity is a restrained dark "command center": near-black
 * charcoal grounds, tonal layering instead of shadows, one muted premium
 * green accent, and semantic colors used only when state demands them.
 * Extend here rather than inlining hex values in components.
 *
 * v1 ships dark-only (see use-theme.ts); the light palette is kept in sync
 * so a future light mode is a one-line change, not a redesign.
 */

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#1A1A18',
    textSecondary: '#61615F',
    textTertiary: '#8F8F8C',
    background: '#FAFAF9',
    backgroundElement: '#F1F1EF',
    backgroundSelected: '#E8E8E5',
    groupedBackground: '#F5F5F4',
    separator: '#E3E3E0',
    tint: '#0E8F60',
    onTint: '#FFFFFF',
    success: '#0E8F60',
    warning: '#9A6B0B',
    danger: '#BC3F37',
    info: '#2F6CA8',
  },
  dark: {
    text: '#F4F4F2',
    textSecondary: '#A0A0A8',
    textTertiary: '#6E6E76',
    background: '#0B0B0D',
    backgroundElement: '#151518',
    backgroundSelected: '#1E1E22',
    groupedBackground: '#0B0B0D',
    separator: 'rgba(255, 255, 255, 0.08)',
    tint: '#3DBE8B',
    onTint: '#07130D',
    success: '#3DBE8B',
    warning: '#D9A03F',
    danger: '#E1584F',
    info: '#6C9FD4',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: 'ui-serif, Georgia, serif',
    rounded: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    mono: "ui-monospace, 'SF Mono', SFMono-Regular, Menlo, monospace",
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const CornerRadius = {
  small: 8,
  medium: 12,
  large: 16,
  xlarge: 20,
} as const;

/**
 * Motion durations (ms). Fast and meaningful — press feedback is near-instant,
 * transitions never make the user wait. Pair with Easing.out(Easing.quad) for
 * entries and Easing.inOut(Easing.quad) for state changes.
 */
export const Motion = {
  press: 140,
  transition: 200,
  entry: 260,
  /** Scale applied to pressables while pressed. */
  pressScale: 0.97,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
