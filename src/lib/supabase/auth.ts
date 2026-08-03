import { supabase } from '@/lib/supabase/client';

export async function continueAnonymously() {
  const { error } = await supabase.auth.signInAnonymously();
  if (error) throw error;
}

/**
 * Second-device sign-in: emails a 6-digit code for an account that was already
 * secured with this address. `shouldCreateUser: false` so a typo can't mint an
 * empty duplicate account.
 */
export async function sendSignInCode(email: string) {
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: false },
  });
  if (error) throw error;
}

export async function verifySignInCode(email: string, token: string) {
  const { error } = await supabase.auth.verifyOtp({ email, token, type: 'email' });
  if (error) throw error;
}

/**
 * Secure the current anonymous account by attaching an email. Supabase sends a
 * confirmation code to the address; the account stays the same user (all data
 * intact) and becomes recoverable + signable-in from other devices.
 *
 * Codes (not magic links) on purpose: an installed iOS PWA has its own browser
 * context, so a link tapped in Mail opens Safari and strands the session
 * outside the app. A code typed into the app has no such failure mode.
 */
export async function requestAccountLink(email: string) {
  const { error } = await supabase.auth.updateUser({ email });
  if (error) throw error;
}

export async function verifyAccountLink(email: string, token: string) {
  const { error } = await supabase.auth.verifyOtp({ email, token, type: 'email_change' });
  if (error) throw error;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}
