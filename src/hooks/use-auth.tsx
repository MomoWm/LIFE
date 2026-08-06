import type { Session } from '@supabase/supabase-js';
import { createContext, useContext, useEffect, useState, type PropsWithChildren } from 'react';

import { supabase } from '@/lib/supabase/client';

type AuthContextValue = {
  session: Session | null;
  isLoading: boolean;
};

const AuthContext = createContext<AuthContextValue>({ session: null, isLoading: true });

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // No .catch was the bug: any failure here — a flaky connection, a
    // handoff between wifi and cellular, a momentary Supabase blip — left
    // this promise forever unsettled. isLoading never left true, _layout's
    // `if (!ready) return null` never let go, and the app stayed on a blank
    // charcoal screen permanently, with no error and no way back short of
    // force-quitting. onAuthStateChange still fires its own INITIAL_SESSION
    // event independently, so session ends up correct either way — this only
    // has to guarantee the loading gate actually opens.
    supabase.auth
      .getSession()
      .then(({ data }) => {
        setSession(data.session);
      })
      .catch(() => {
        // Swallow — onAuthStateChange is the real source of truth for
        // session state and will correct this shortly.
      })
      .finally(() => {
        setIsLoading(false);
      });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  return <AuthContext.Provider value={{ session, isLoading }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
