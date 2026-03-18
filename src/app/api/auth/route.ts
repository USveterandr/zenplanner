import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSupabaseClient } from "@/lib/supabase";

function generateId() {
  return crypto.randomUUID();
}

export async function POST(request: Request) {
  try {
    const db = getDb(); // null on Vercel — D1 upserts are Cloudflare-only best-effort

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
      if (!db) {
        // On Vercel there is no D1 — succeed silently; row will be created on Cloudflare
        return NextResponse.json({ success: true });
      }
      const existing = await db
        .prepare("SELECT id, name, avatarUrl, profession, hobbies FROM User WHERE id = ?")
        .bind(userId)
        .first() as { id: string; name?: string; avatarUrl?: string; profession?: string; hobbies?: string } | null;

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
        return NextResponse.json({ success: true, profile: { name: displayName } });
      }

      return NextResponse.json({ 
        success: true, 
        profile: {
          name: existing.name,
          avatarUrl: existing.avatarUrl,
          profession: existing.profession,
          hobbies: existing.hobbies,
        }
      });
    }

    // ── REVIEWER BYPASS (Google Play review account) ─────────────────────────
    // This hardcoded bypass allows the Google Play reviewer to sign in without
    // needing an account in Supabase. The credentials are listed in the Play
    // Console demo credentials section.
    const REVIEWER_ID = "00000000-0000-0000-0000-000000000001";
    if (action === "login" &&
        email === "reviewer@zenplanner.app" &&
        password === "Password123") {
      // Ensure a D1 row exists for the reviewer on Cloudflare
      if (db) {
        const existing = await db.prepare("SELECT id FROM User WHERE id = ?").bind(REVIEWER_ID).first();
        if (!existing) {
          await db.prepare("INSERT INTO User (id, email, name, password) VALUES (?, ?, ?, ?)")
            .bind(REVIEWER_ID, "reviewer@zenplanner.app", "Google Reviewer", "bypass")
            .run();
          await db.prepare("INSERT INTO Subscription (id, tier, userId) VALUES (?, ?, ?)")
            .bind(generateId(), "free", REVIEWER_ID)
            .run();
        }
      }
      return NextResponse.json({
        success: true,
        user: { id: REVIEWER_ID, email: "reviewer@zenplanner.app", name: "Google Reviewer" },
        session: {
          access_token: "reviewer-bypass-token",
          refresh_token: "reviewer-bypass-refresh",
          expires_at: Math.floor(Date.now() / 1000) + 86400,
        },
      });
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

      // Upsert user row in D1 (Cloudflare only — skip gracefully on Vercel)
      if (db) {
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
      let userName = (sessionData.user.user_metadata?.name as string | undefined) || email.split("@")[0];

      // Ensure D1 row exists (Cloudflare only — skip gracefully on Vercel)
      if (db) {
        const existing = await db
          .prepare("SELECT id, name, avatarUrl, profession, hobbies FROM User WHERE id = ?")
          .bind(supabaseUserId)
          .first() as { id: string; name: string; avatarUrl?: string; profession?: string; hobbies?: string } | null;

        if (!existing) {
          // Migrate: create D1 row for legacy Supabase user
          await db
            .prepare("INSERT INTO User (id, email, name, password) VALUES (?, ?, ?, ?)")
            .bind(supabaseUserId, email, userName, "supabase-managed")
            .run();
          await db
            .prepare("INSERT INTO Subscription (id, tier, userId) VALUES (?, ?, ?)")
            .bind(generateId(), "free", supabaseUserId)
            .run();
        } else {
          userName = existing.name || userName;
        }

        return NextResponse.json({
          success: true,
          user: { 
            id: supabaseUserId, 
            email, 
            name: userName,
            avatarUrl: existing?.avatarUrl,
            profession: existing?.profession,
            hobbies: existing?.hobbies
          },
          session: {
            access_token: sessionData.session.access_token,
            refresh_token: sessionData.session.refresh_token,
            expires_at: sessionData.session.expires_at,
          },
        });
      }

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

    // ── UPDATE PROFILE ───────────────────────────────────────────────────────
    if (action === "update_profile") {
      const authHeader = request.headers.get("Authorization");
      if (!authHeader?.startsWith("Bearer ")) {
        return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
      }

      const { data: { user }, error } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
      if (error || !user) {
        // Fallback for reviewer bypass
        const isReviewer = authHeader.includes("reviewer-bypass-token");
        if (!isReviewer) {
          return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }
      }

      const verifiedUserId = user?.id || "00000000-0000-0000-0000-000000000001";
      const { name, profession, hobbies, avatarUrl } = body as any;

      if (db) {
        // Build dynamic SET clause
        const updates: string[] = [];
        const bindings: any[] = [];
        
        if (name !== undefined) { updates.push("name = ?"); bindings.push(name); }
        if (profession !== undefined) { updates.push("profession = ?"); bindings.push(profession); }
        if (hobbies !== undefined) { updates.push("hobbies = ?"); bindings.push(hobbies); }
        if (avatarUrl !== undefined) { updates.push("avatarUrl = ?"); bindings.push(avatarUrl); }
        
        if (updates.length > 0) {
          updates.push("updatedAt = datetime('now')");
          bindings.push(verifiedUserId);
          
          await db
            .prepare(`UPDATE User SET ${updates.join(", ")} WHERE id = ?`)
            .bind(...bindings)
            .run();
        }
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Auth error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
