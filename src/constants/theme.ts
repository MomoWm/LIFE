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
    text: '#F2F3F2',
    textSecondary: '#96999B',
    textTertiary: '#616468',
    // Graphite, not void. A pure-black ground with a saturated accent on top
    // is the arcade/game look; lifting the base into charcoal is most of what
    // separates "instrument" from "HUD".
    background: '#101216',
    backgroundElement: '#191C21',
    backgroundSelected: '#23272E',
    groupedBackground: '#101216',
    separator: 'rgba(255, 255, 255, 0.08)',
    // Pale, heavily desaturated sage. The previous #3DBE8B was a vivid mint —
    // neon green on black is exactly the arcade signature. At this saturation
    // it reads first as "light", and only then as green.
    tint: '#A6C1B2',
    onTint: '#0E1512',
    success: '#A6C1B2',
    warning: '#C9A469',
    danger: '#D2807A',
    info: '#8FA9C4',
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
  card: ['#1D2026', '#15171C'] as const,
  /** Raised/interactive variant, one step brighter. */
  cardRaised: ['#262A32', '#1B1E24'] as const,
  /** Hairline highlight along the top edge, where light would hit. */
  edgeHighlight: 'rgba(255, 255, 255, 0.09)',
  /** Accent wash for hero surfaces — tint at very low alpha. */
  accentWash: ['rgba(166, 193, 178, 0.14)', 'rgba(166, 193, 178, 0.02)'] as const,
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
 * Domain hues. Each screen owns one, so a glance at a chart or ring says which
 * part of life it belongs to before any label is read.
 *
 * These are held at the same low saturation and lightness as the sage accent
 * on purpose — they are meant to differentiate meaning, not to decorate. They
 * tint strokes, rings and small marks; they never fill a large surface, and a
 * screen shows exactly one of them.
 */
export const Domain = {
  routine: '#A6C1B2', // sage — completion, the base accent
  prayer: '#A3ADC9', // muted periwinkle
  work: '#C6AC8B', // muted bronze
  training: '#B4A7C4', // muted heather
  sleep: '#93AFC0', // muted slate blue
} as const;

/** Breakpoint above which layouts may use two columns (iPad and wider). */
export const WideBreakpoint = 700;

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
  /** Compact metric for dense panels and inline stats. */
  metricSmall: { fontSize: 26, lineHeight: 30, fontWeight: '700', letterSpacing: -0.8 },
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
