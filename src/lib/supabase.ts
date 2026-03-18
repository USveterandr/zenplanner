import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Browser / client-side singleton
let _client: ReturnType<typeof createClient> | null = null;

export function getSupabaseClient() {
  if (typeof window === 'undefined') {
    // Server-side: always create a new instance (no singleton needed per-request)
    return createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }

  // Client-side: reuse singleton
  if (!_client) {
    _client = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        storageKey: 'zen-planner-auth',
        // Implicit flow returns tokens directly in the URL hash fragment after
        // OAuth — no PKCE code verifier needed. This avoids the "code verifier
        // not found in storage" error on iPhone where iOS opens OAuth in Safari
        // (a separate context with its own isolated localStorage).
        flowType: 'implicit',
      },
    });
  }
  return _client;
}

export const supabase = typeof window !== 'undefined' ? getSupabaseClient() : null;
