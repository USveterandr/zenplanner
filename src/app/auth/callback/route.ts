import { NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/supabase";
import { getCloudflareContext } from "@opennextjs/cloudflare";

function generateId() {
  return crypto.randomUUID();
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (!code) {
    return NextResponse.redirect(`${origin}/`);
  }

  const supabase = getSupabaseClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user) {
    console.error("OAuth callback error:", error);
    return NextResponse.redirect(`${origin}/?auth_error=oauth_failed`);
  }

  // Ensure D1 user row exists for OAuth users
  try {
    const env = getCloudflareContext().env;
    const db = env.zen_planner_db;

    if (db) {
      const existing = await db
        .prepare("SELECT id FROM User WHERE id = ?")
        .bind(data.user.id)
        .first();

      if (!existing) {
        const name =
          (data.user.user_metadata?.full_name as string | undefined) ||
          (data.user.user_metadata?.name as string | undefined) ||
          data.user.email?.split("@")[0] ||
          "User";

        await db
          .prepare("INSERT INTO User (id, email, name, password) VALUES (?, ?, ?, ?)")
          .bind(data.user.id, data.user.email ?? "", name, "supabase-managed")
          .run();

        await db
          .prepare("INSERT INTO Subscription (id, tier, userId) VALUES (?, ?, ?)")
          .bind(generateId(), "free", data.user.id)
          .run();
      }
    }
  } catch (dbError) {
    console.error("D1 upsert error during OAuth callback:", dbError);
  }

  return NextResponse.redirect(`${origin}${next}`);
}
