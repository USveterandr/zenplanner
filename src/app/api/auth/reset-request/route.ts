import { NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email } = body as { email: string };

    if (!email) {
      return NextResponse.json({ success: false, error: "Email is required" }, { status: 400 });
    }

    const supabase = getSupabaseClient();
    const origin = new URL(request.url).origin;

    // Supabase sends the reset email automatically and handles the token lifecycle
    const { error } = await supabase.auth.resetPasswordForEmail(
      email.trim().toLowerCase(),
      {
        redirectTo: `${origin}/auth/callback?next=/reset-password`,
      }
    );

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    // Always return success (no resetUrl) — Supabase emails the link
    return NextResponse.json({ success: true, resetUrl: null });
  } catch (error) {
    console.error("Password reset request error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
