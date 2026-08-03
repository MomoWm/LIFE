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
    text: '#FBFBFC',
    textSecondary: '#9A9DA8',
    textTertiary: '#63666F',
    background: '#08090C',
    backgroundElement: '#141620',
    backgroundSelected: '#1D202B',
    groupedBackground: '#08090C',
    separator: 'rgba(255, 255, 255, 0.07)',
    tint: '#3DBE8B',
    onTint: '#04140D',
    success: '#3DBE8B',
    warning: '#D9A03F',
    danger: '#E1584F',
    info: '#6C9FD4',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

/**
 * Surface materiality. Flat fills read as cardboard; real surfaces catch light
 * from above. Every card is a top-lit vertical gradient plus a hairline
 * specular edge — the difference between matte board and polished stone.
 */
export const Surface = {
  /** Card gradient, top (lit) -> bottom (shadowed). */
  card: ['#191C27', '#111219'] as const,
  /** Raised/interactive variant, one step brighter. */
  cardRaised: ['#222634', '#171A24'] as const,
  /** Hairline highlight along the top edge, where light would hit. */
  edgeHighlight: 'rgba(255, 255, 255, 0.10)',
  /** Accent wash for hero surfaces — tint at very low alpha. */
  accentWash: ['rgba(61, 190, 139, 0.16)', 'rgba(61, 190, 139, 0.02)'] as const,
} as const;

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
  large: 18,
  xlarge: 24,
} as const;

/**
 * Type scale. The single biggest lever on whether the app reads as a premium
 * instrument or a spreadsheet: hero numbers are enormous and tightly tracked,
 * labels are small caps with open tracking, and body sits quietly between
 * them. Display sizes get negative tracking (large type looks loose by
 * default); small caps get positive tracking (small type looks cramped).
 */
export const Type = {
  /** Screen-owning number: today's score, a streak count. */
  display: { fontSize: 64, lineHeight: 64, fontWeight: '800', letterSpacing: -2.5 },
  /** Secondary hero metric inside a card. */
  metric: { fontSize: 40, lineHeight: 42, fontWeight: '700', letterSpacing: -1.4 },
  title: { fontSize: 30, lineHeight: 34, fontWeight: '700', letterSpacing: -0.9 },
  subtitle: { fontSize: 21, lineHeight: 27, fontWeight: '600', letterSpacing: -0.45 },
  body: { fontSize: 16, lineHeight: 23, fontWeight: '400', letterSpacing: -0.1 },
  small: { fontSize: 14, lineHeight: 20, fontWeight: '400', letterSpacing: -0.05 },
  smallBold: { fontSize: 14, lineHeight: 20, fontWeight: '600', letterSpacing: -0.1 },
  /** Uppercase section/eyebrow label — the quiet structural voice. */
  label: { fontSize: 11, lineHeight: 14, fontWeight: '700', letterSpacing: 1.3 },
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
