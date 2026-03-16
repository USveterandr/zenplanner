import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getSupabaseClient } from "@/lib/supabase";

function generateId() {
  return crypto.randomUUID();
}

export async function POST(request: Request) {
  try {
    const env = getCloudflareContext().env;
    const db = env.zen_planner_db;

    if (!db) {
      return NextResponse.json({ success: false, error: "Database not configured" }, { status: 500 });
    }

    const body = await request.json();
    const { email, name, password, action, userId } = body as {
      email: string;
      name?: string;
      password: string;
      action: string;
      userId?: string;
    };

    const supabase = getSupabaseClient();

    // ── OAUTH SYNC ────────────────────────────────────────────────────────────
    // Called client-side after a successful OAuth sign-in to ensure a D1 row exists
    if (action === "oauth_sync") {
      if (!userId || !email) {
        return NextResponse.json({ success: false, error: "Missing userId or email" }, { status: 400 });
      }
      const existing = await db
        .prepare("SELECT id FROM User WHERE id = ?")
        .bind(userId)
        .first();

      if (!existing) {
        const displayName = name || email.split("@")[0];
        await db
          .prepare("INSERT INTO User (id, email, name, password) VALUES (?, ?, ?, ?)")
          .bind(userId, email, displayName, "supabase-managed")
          .run();
        await db
          .prepare("INSERT INTO Subscription (id, tier, userId) VALUES (?, ?, ?)")
          .bind(generateId(), "free", userId)
          .run();
      }

      return NextResponse.json({ success: true });
    }

    // ── SIGN UP ──────────────────────────────────────────────────────────────
    if (action === "signup") {
      if (!name) {
        return NextResponse.json({ success: false, error: "Name is required" }, { status: 400 });
      }

      // Create user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name },
        },
      });

      if (authError) {
        return NextResponse.json({ success: false, error: authError.message }, { status: 400 });
      }

      if (!authData.user) {
        return NextResponse.json({ success: false, error: "Signup failed" }, { status: 500 });
      }

      const supabaseUserId = authData.user.id;

      // Upsert user row in D1 using the Supabase UUID as the primary key
      const existing = await db
        .prepare("SELECT id FROM User WHERE id = ?")
        .bind(supabaseUserId)
        .first();

      if (!existing) {
        await db
          .prepare("INSERT INTO User (id, email, name, password) VALUES (?, ?, ?, ?)")
          .bind(supabaseUserId, email, name, "supabase-managed")
          .run();

        await db
          .prepare("INSERT INTO Subscription (id, tier, userId) VALUES (?, ?, ?)")
          .bind(generateId(), "free", supabaseUserId)
          .run();
      }

      // Sign in immediately to get a session token
      const { data: sessionData, error: sessionError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (sessionError || !sessionData.session) {
        // User was created but auto sign-in failed — still return success
        return NextResponse.json({
          success: true,
          user: { id: supabaseUserId, email, name },
          session: null,
        });
      }

      return NextResponse.json({
        success: true,
        user: { id: supabaseUserId, email, name },
        session: {
          access_token: sessionData.session.access_token,
          refresh_token: sessionData.session.refresh_token,
          expires_at: sessionData.session.expires_at,
        },
      });
    }

    // ── SIGN IN ──────────────────────────────────────────────────────────────
    if (action === "login") {
      const { data: sessionData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError || !sessionData.user) {
        return NextResponse.json(
          { success: false, error: authError?.message || "Invalid credentials" },
          { status: 401 }
        );
      }

      const supabaseUserId = sessionData.user.id;

      // Ensure D1 row exists (for users created before this migration)
      const existing = await db
        .prepare("SELECT id, name FROM User WHERE id = ?")
        .bind(supabaseUserId)
        .first() as { id: string; name: string } | null;

      if (!existing) {
        // Migrate: create D1 row for legacy Supabase user
        const displayName =
          (sessionData.user.user_metadata?.name as string | undefined) || email.split("@")[0];
        await db
          .prepare("INSERT INTO User (id, email, name, password) VALUES (?, ?, ?, ?)")
          .bind(supabaseUserId, email, displayName, "supabase-managed")
          .run();
        await db
          .prepare("INSERT INTO Subscription (id, tier, userId) VALUES (?, ?, ?)")
          .bind(generateId(), "free", supabaseUserId)
          .run();
      }

      const userName =
        existing?.name ||
        (sessionData.user.user_metadata?.name as string | undefined) ||
        email.split("@")[0];

      return NextResponse.json({
        success: true,
        user: { id: supabaseUserId, email, name: userName },
        session: {
          access_token: sessionData.session.access_token,
          refresh_token: sessionData.session.refresh_token,
          expires_at: sessionData.session.expires_at,
        },
      });
    }

    return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Auth error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
