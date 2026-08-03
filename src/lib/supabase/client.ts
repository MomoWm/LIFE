import { createClient } from '@supabase/supabase-js';
import { AppState, Platform } from 'react-native';

import { safeStorage } from '@/lib/storage';

import type { Database } from './types';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

/** False until the user supplies their own Supabase project via `.env.local`. */
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = createClient<Database>(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key',
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
