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
        // PKCE flow ensures the OAuth code is exchanged CLIENT-SIDE so that the
        // resulting session tokens are written directly into this PWA's localStorage.
        // Without this, the server-side callback exchanges the code but the tokens
        // never reach the PWA's isolated localStorage (Safari ITP on "Add to Home Screen").
        flowType: 'pkce',
      },
    });
  }
  return _client;
}

export const supabase = typeof window !== 'undefined' ? getSupabaseClient() : null;
