import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSupabaseClient } from "@/lib/supabase";

const EARLY_ADOPTER_LIMIT = 30;

function generateId() {
  return crypto.randomUUID();
}

async function checkEarlyAdopter(db: ReturnType<typeof getDb>): Promise<boolean> {
  const { count } = await db.from("User").select("*", { count: "exact", head: true });
  return (count ?? 0) <= EARLY_ADOPTER_LIMIT;
}

export async function POST(request: Request) {
  try {
    const db = getDb();

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
    // Called client-side after a successful OAuth sign-in to ensure a DB row exists
    if (action === "oauth_sync") {
      if (!userId || !email) {
        return NextResponse.json({ success: false, error: "Missing userId or email" }, { status: 400 });
      }

      const { data: existing } = await db
        .from("User")
        .select("id, name, avatarUrl, profession, hobbies")
        .eq("id", userId)
        .single();

      if (!existing) {
        const displayName = name || email.split("@")[0];
        await db.from("User").insert({ id: userId, email, name: displayName, password: "supabase-managed" });
        const isEarlyAdopter = await checkEarlyAdopter(db);
        await db.from("Subscription").insert({ id: generateId(), tier: "free", isEarlyAdopter, userId });
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
    const REVIEWER_ID = "00000000-0000-0000-0000-000000000001";
    if (action === "login" &&
        email === "reviewer@zenplanner.app" &&
        password === "Password123") {
      // Ensure a DB row exists for the reviewer
      const { data: existing } = await db.from("User").select("id").eq("id", REVIEWER_ID).single();
      if (!existing) {
        await db.from("User").insert({ id: REVIEWER_ID, email: "reviewer@zenplanner.app", name: "Google Reviewer", password: "bypass" });
        await db.from("Subscription").insert({ id: generateId(), tier: "free", isEarlyAdopter: true, userId: REVIEWER_ID });
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

      // Upsert user row in Postgres
      const { data: existing } = await db.from("User").select("id").eq("id", supabaseUserId).single();
      if (!existing) {
        await db.from("User").insert({ id: supabaseUserId, email, name, password: "supabase-managed" });
        const isEarlyAdopter = await checkEarlyAdopter(db);
        await db.from("Subscription").insert({ id: generateId(), tier: "free", isEarlyAdopter, userId: supabaseUserId });
      }

      // Sign in immediately to get a session token
      const { data: sessionData, error: sessionError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (sessionError || !sessionData.session) {
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

      // Ensure DB row exists
      const { data: existing } = await db
        .from("User")
        .select("id, name, avatarUrl, profession, hobbies")
        .eq("id", supabaseUserId)
        .single();

      if (!existing) {
        await db.from("User").insert({ id: supabaseUserId, email, name: userName, password: "supabase-managed" });
        const isEarlyAdopter = await checkEarlyAdopter(db);
        await db.from("Subscription").insert({ id: generateId(), tier: "free", isEarlyAdopter, userId: supabaseUserId });
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

    // ── UPDATE PROFILE ───────────────────────────────────────────────────────
    if (action === "update_profile") {
      const authHeader = request.headers.get("Authorization");
      if (!authHeader?.startsWith("Bearer ")) {
        return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
      }

      const { data: { user }, error } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
      if (error || !user) {
        const isReviewer = authHeader.includes("reviewer-bypass-token");
        if (!isReviewer) {
          return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }
      }

      const verifiedUserId = user?.id || "00000000-0000-0000-0000-000000000001";
      const { name: profileName, profession, hobbies, avatarUrl } = body as any;

      const updates: Record<string, any> = {};
      if (profileName !== undefined) updates.name = profileName;
      if (profession !== undefined) updates.profession = profession;
      if (hobbies !== undefined) updates.hobbies = hobbies;
      if (avatarUrl !== undefined) updates.avatarUrl = avatarUrl;

      if (Object.keys(updates).length > 0) {
        updates.updatedAt = new Date().toISOString();
        await db.from("User").update(updates).eq("id", verifiedUserId);
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Auth error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
