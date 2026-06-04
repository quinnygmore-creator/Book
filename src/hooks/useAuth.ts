import { useCallback, useEffect, useState } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase, isCloudEnabled } from '../lib/supabase';

/**
 * Auth state via Supabase. In local-only mode (no Supabase configured)
 * `cloudEnabled` is false and the rest of the app skips the auth gate.
 *
 * Uses email one-time-code (OTP) sign-in — works with just a Supabase
 * project, no OAuth provider setup. Apple/Google can be added later.
 */
export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(isCloudEnabled());

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const sendCode = useCallback(async (email: string) => {
    if (!supabase) throw new Error('Cloud is not configured.');
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { shouldCreateUser: true },
    });
    if (error) throw new Error(error.message);
  }, []);

  const verifyCode = useCallback(async (email: string, token: string) => {
    if (!supabase) throw new Error('Cloud is not configured.');
    const { error } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: token.trim(),
      type: 'email',
    });
    if (error) throw new Error(error.message);
  }, []);

  const signOut = useCallback(async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
  }, []);

  return {
    cloudEnabled: isCloudEnabled(),
    session,
    loading,
    sendCode,
    verifyCode,
    signOut,
  };
}
