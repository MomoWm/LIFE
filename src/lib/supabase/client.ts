import { createClient } from '@supabase/supabase-js';
import { AppState, Platform } from 'react-native';

import { safeStorage } from '@/lib/storage';

import type { Database } from './types';

// Fallback to the actual LIFE project's publishable values — this is a
// single-owner personal app, not distributed OSS boilerplate, and these are
// already committed in plaintext in .github/workflows/deploy-web.yml (RLS
// protects the data, not secrecy of the anon key). Env vars still win when
// set, so a genuinely different Supabase project (local dev against a
// scratch database, a fork) via `.env.local` overrides them as before.
const DEFAULT_SUPABASE_URL = 'https://txoeibwdqrfuoyonponb.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'sb_publishable_fUsvuR1tGG3Xe69d86nLoQ_86LXSN_j';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || DEFAULT_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = createClient<Database>(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      storage: safeStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);

// Supabase's token auto-refresh timer only runs while this is called; pause it
// in the background so we're not refreshing tokens for a backgrounded app.
// Guarded so the Node-side static web prerender never touches AppState.
if (Platform.OS !== 'web' || typeof window !== 'undefined') {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') {
      supabase.auth.startAutoRefresh();
    } else {
      supabase.auth.stopAutoRefresh();
    }
  });
}
