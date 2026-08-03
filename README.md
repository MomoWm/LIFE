# LIFE

A personal iPhone app built around the **545** system: 5 wake-up tasks, 4 three-month goals, and 5 non-negotiable end-of-day tasks, with separate templates for standard days (Mon/Wed/Thu), meeting days (Tue/Fri), Saturday, and Sunday. Built on top of that foundation: prayer tracking, semen-retention streaks, sleep tracking, an 8-day workout split, and a door-to-door sales/work tracker (timer + daily counters).

## Stack

- [Expo](https://expo.dev) (React Native + TypeScript) with Expo Router — SDK 57
- [Supabase](https://supabase.com) (Postgres + Auth + Row Level Security) for cloud-synced data
- [TanStack Query](https://tanstack.com/query) for data fetching/caching
- `@expo/ui` (native SwiftUI components) and `expo-glass-effect` (iOS Liquid Glass) for a native iOS feel

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env.local` and fill in your Supabase project URL and anon key.

3. Start the app

   ```bash
   npx expo start --tunnel
   ```

   Scan the QR code with [Expo Go](https://expo.dev/go) on your iPhone.

## Scripts

- `npm run typecheck` — TypeScript, no emit
- `npm run lint` — ESLint
- `npm test` — Jest (unit tests for pure logic: streaks, day-type resolution, workout cycle math, funnel conversion)
