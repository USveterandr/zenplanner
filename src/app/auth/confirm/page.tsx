'use client';

/**
 * Client-side OAuth confirmation page.
 *
 * WHY THIS EXISTS:
 *   With PKCE flow, the OAuth code exchange happens HERE (in the browser) so
 *   that Supabase writes the session tokens into the client's localStorage.
 *
 * iPhone PWA isolation problem & fix:
 *   - Safari gives each PWA its own isolated localStorage separate from the
 *     Safari browser's localStorage.
 *   - When the user taps "Continue with Google" from the PWA, iOS opens the
 *     OAuth flow in Safari (not inside the PWA). After Google redirects back
 *     to /auth/callback → /auth/confirm, this page runs IN SAFARI.
 *   - The exchange succeeds and tokens land in Safari's localStorage.
 *   - But the PWA (separate context) never sees those tokens.
 *
 *   Fix: after a successful exchange, embed the access_token and refresh_token
 *   in the redirect URL as query params (short-lived, for the one-time redirect
 *   only). The main page (/auth/token-bridge) reads these params, calls
 *   supabase.auth.setSession(), and removes them from the URL.
 *   This bridges the token across the Safari → PWA context boundary.
 */

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getSupabaseClient } from '@/lib/supabase';
import { useAppStore } from '@/lib/store';

function Spinner() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-violet-700 text-sm">Completing sign-in…</p>
      </div>
    </div>
  );
}

function AuthConfirmInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const code = searchParams.get('code');
    const next = searchParams.get('next') ?? '/';

    if (!code) {
      router.replace('/');
      return;
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      setErrorMsg('Auth client unavailable');
      setStatus('error');
      return;
    }

    supabase.auth.exchangeCodeForSession(code).then(async ({ data, error }) => {
      if (error || !data.session) {
        console.error('OAuth confirm error:', error);
        setErrorMsg(error?.message ?? 'OAuth sign-in failed');
        setStatus('error');
        return;
      }

      const { user, session } = data;

      const name =
        (user.user_metadata?.full_name as string | undefined) ||
        (user.user_metadata?.name as string | undefined) ||
        user.email?.split('@')[0] ||
        'User';

      // Best-effort: ensure D1 user row exists
      try {
        await fetch('/api/auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'oauth_sync',
            userId: user.id,
            email: user.email,
            name,
          }),
        });
      } catch {
        // non-fatal
      }

      // Write user + token into the Zustand store for this context (Safari browser).
      // This handles the case where the user is using the app directly in Safari.
      useAppStore.setState({
        user: { id: user.id, name, email: user.email ?? '' },
        accessToken: session.access_token,
      });
      await useAppStore.getState().loadUserData();

      // Bridge tokens to the PWA context by passing them as query params.
      // The main page detects these and calls supabase.auth.setSession() so the
      // PWA's isolated localStorage receives the tokens too.
      // We use window.location.href (hard navigation) so the URL bar updates and
      // the user is taken to the app root — whether in Safari or the PWA.
      const bridgeUrl = new URL(window.location.origin + next);
      bridgeUrl.searchParams.set('sb_access_token', session.access_token);
      bridgeUrl.searchParams.set('sb_refresh_token', session.refresh_token);
      window.location.href = bridgeUrl.toString();
    });
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
