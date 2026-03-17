import { NextResponse } from "next/server";

/**
 * OAuth callback — server-side entry point.
 *
 * With PKCE flow the code exchange MUST happen client-side so that Supabase can
 * store the resulting session tokens in the browser's (PWA's) localStorage.
 * If we exchange the code here (server-side, persistSession:false) the tokens
 * are never written to the client and iPhone PWA users end up permanently
 * signed-out after every Google OAuth login.
 *
 * Strategy: forward all query params to the client-side /auth/confirm page
 * which calls supabase.auth.exchangeCodeForSession() in the browser.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (!code) {
    return NextResponse.redirect(`${origin}/`);
  }

  // Redirect to the client-side confirmation page with the code intact.
  const confirmUrl = new URL(`${origin}/auth/confirm`);
  confirmUrl.searchParams.set("code", code);
  confirmUrl.searchParams.set("next", next);
  return NextResponse.redirect(confirmUrl.toString());
}
