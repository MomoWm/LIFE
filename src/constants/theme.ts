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
    // The unfilled part of any progress indicator. Translucent rather than a
    // solid tone because a fixed colour that reads correctly on the ground
    // disappears on a raised card — which is exactly where the rings sit.
    track: 'rgba(255, 255, 255, 0.09)',
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
/**
 * The app's voice.
 *
 * Archivo — a grotesque drawn for headlines and interfaces alike: high
 * x-height, tight apertures, near-vertical terminals. It carries weight at 64pt
 * without turning decorative and stays legible at 11pt, which matters here
 * because the same family has to hold a screen-filling score and an uppercase
 * eyebrow label. The system font could do neither with any character; a system
 * font is what an app looks like before anyone has decided how it should look.
 *
 * Shipped as four static weights rather than one variable file because Google
 * only serves statics in TTF, and native needs TTF. Weight comes from the
 * family name, never from `fontWeight`: the faces are already bold, so asking
 * the renderer for bold on top of them produces faux-bold smearing on web.
 */
export const Family = {
  regular: 'Archivo_400',
  medium: 'Archivo_600',
  bold: 'Archivo_700',
  heavy: 'Archivo_800',
} as const;

export const Type = {
  /** Screen-owning number: today's score, a streak count. */
  display: { fontSize: 64, lineHeight: 64, fontFamily: Family.heavy, letterSpacing: -2.5 },
  /** Secondary hero metric inside a card. */
  metric: { fontSize: 40, lineHeight: 42, fontFamily: Family.bold, letterSpacing: -1.4 },
  /** Compact metric for dense panels and inline stats. */
  metricSmall: { fontSize: 26, lineHeight: 30, fontFamily: Family.bold, letterSpacing: -0.8 },
  title: { fontSize: 30, lineHeight: 34, fontFamily: Family.bold, letterSpacing: -0.9 },
  subtitle: { fontSize: 21, lineHeight: 27, fontFamily: Family.medium, letterSpacing: -0.45 },
  body: { fontSize: 16, lineHeight: 23, fontFamily: Family.regular, letterSpacing: -0.1 },
  small: { fontSize: 14, lineHeight: 20, fontFamily: Family.regular, letterSpacing: -0.05 },
  smallBold: { fontSize: 14, lineHeight: 20, fontFamily: Family.medium, letterSpacing: -0.1 },
  /** Uppercase section/eyebrow label — the quiet structural voice. */
  label: { fontSize: 11, lineHeight: 14, fontFamily: Family.bold, letterSpacing: 1.3 },
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
/**
 * The widest the content column is ever allowed to get.
 *
 * 800 was set to stop an iPad stretching a phone layout across the full
 * screen, but it doesn't: at 800 the measures are still too long to scan, a
 * progress bar for a 0-100 value runs over 600pt, and the hero opens a void
 * between the score and the ring. This is a single-column reading width — the
 * page should look composed and deliberately narrow on a tablet, not filled.
 */
export const MaxContentWidth = 620;

/**
 * The cap when a wide screen goes two-column. Two columns of roughly the
 * single-column measure, plus the gutter between them — capping a two-column
 * layout at the one-column width would just squeeze both halves.
 */
export const WideColumnWidth = 1000;
