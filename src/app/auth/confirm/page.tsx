'use client';

/**
 * Client-side OAuth confirmation page.
 *
 * Handles TWO auth flows:
 *
 * 1. **Implicit flow (primary)** — After Google OAuth, Supabase redirects here
 *    with tokens in the URL hash fragment (#access_token=...&refresh_token=...).
 *    The Supabase client automatically detects the hash, sets the session, and
 *    fires a SIGNED_IN event. No code verifier is needed, which avoids the
 *    "PKCE code verifier not found" error on iPhone where iOS opens OAuth in
 *    Safari (a separate context with isolated localStorage).
 *
 * 2. **PKCE fallback** — If a ?code= query param is present (from the old
 *    /auth/callback redirect), attempt exchangeCodeForSession as a fallback.
 *
 * iPhone PWA token bridge:
 *   After a successful sign-in, tokens are passed as query params in the
 *   redirect to the main page. The main page detects these and calls
 *   supabase.auth.setSession() to bridge tokens into the PWA's isolated
 *   localStorage.
 */

import { Suspense, useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { getSupabaseClient } from '@/lib/supabase';
import { useAppStore } from '@/lib/store';

function Spinner() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-violet-700 text-sm">Completing sign-in&hellip;</p>
      </div>
    </div>
  );
}

function AuthConfirmInner() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState('');
  const handledRef = useRef(false);

  useEffect(() => {
    if (handledRef.current) return;
    handledRef.current = true;

    const supabase = getSupabaseClient();
    if (!supabase) {
      setErrorMsg('Auth client unavailable');
      setStatus('error');
      return;
    }

    const completeSignIn = async (session: { user: any; access_token: string; refresh_token: string }, next: string) => {
      const { user } = session;
      const name =
        (user.user_metadata?.full_name as string | undefined) ||
        (user.user_metadata?.name as string | undefined) ||
        user.email?.split('@')[0] ||
        'User';

      // Ensure D1 user row exists and retrieve saved profile fields
      let profile: { name?: string; avatarUrl?: string; profession?: string; hobbies?: string } = {};
      let isEarlyAdopter = false;
      try {
        const res = await fetch('/api/auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'oauth_sync',
            userId: user.id,
            email: user.email,
            name,
          }),
        });
        const data = await res.json() as { success: boolean; profile?: typeof profile; isEarlyAdopter?: boolean };
        if (data.profile) profile = data.profile;
        isEarlyAdopter = Boolean(data.isEarlyAdopter);
      } catch {
        // non-fatal
      }

      // Write user + token into Zustand store for this context
      useAppStore.setState({
        user: { 
          id: user.id, 
          name: profile.name || name, 
          email: user.email ?? '',
          avatarUrl: profile.avatarUrl,
          profession: profile.profession,
          hobbies: profile.hobbies,
        },
        accessToken: session.access_token,
        subscriptionInfo: { tier: 'free', startDate: null, trialEndDate: null, isEarlyAdopter },
      });
      await useAppStore.getState().loadUserData();

      // Bridge tokens to the PWA context via query params
      const bridgeUrl = new URL(window.location.origin + next);
      bridgeUrl.searchParams.set('sb_access_token', session.access_token);
      bridgeUrl.searchParams.set('sb_refresh_token', session.refresh_token);
      window.location.href = bridgeUrl.toString();
    };

    const handleAuth = async () => {
      // ── PKCE fallback: ?code= query param from /auth/callback ──────────
      const code = searchParams.get('code');
      const next = searchParams.get('next') ?? '/';

      if (code) {
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);
        if (error || !data.session) {
          console.error('OAuth confirm (PKCE) error:', error);
          setErrorMsg(error?.message ?? 'OAuth sign-in failed');
          setStatus('error');
          return;
        }
        await completeSignIn(data.session as any, next);
        return;
      }

      // ── Implicit flow: tokens in URL hash fragment ─────────────────────
      // The Supabase client automatically processes #access_token=... from
      // the URL hash during initialization. We wait for the SIGNED_IN event.

      let resolved = false;

      const timeout = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          setErrorMsg('Sign-in timed out. Please try again.');
          setStatus('error');
        }
      }, 15000);

      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          if (resolved) return;
          if (event === 'SIGNED_IN' && session) {
            resolved = true;
            clearTimeout(timeout);
            subscription.unsubscribe();
            await completeSignIn(session as any, '/');
          }
        }
      );

      // In case the session was already set before our listener registered
      const { data: { session: existingSession } } = await supabase.auth.getSession();
      if (!resolved && existingSession) {
        resolved = true;
        clearTimeout(timeout);
        subscription.unsubscribe();
        await completeSignIn(existingSession as any, '/');
      }
    };

    handleAuth();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <p className="text-red-600 font-medium mb-2">Sign-in failed</p>
          <p className="text-sm text-muted-foreground mb-4">{errorMsg}</p>
          <a href="/" className="text-violet-600 underline text-sm">Return to app</a>
        </div>
      </div>
    );
  }

  return <Spinner />;
}

export default function AuthConfirmPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <AuthConfirmInner />
    </Suspense>
  );
}
