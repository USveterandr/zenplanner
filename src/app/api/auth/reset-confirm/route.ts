import { NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { token, newPassword } = body as { token: string; newPassword: string };

    if (!token || !newPassword) {
      return NextResponse.json(
        { success: false, error: "Token and new password are required" },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { success: false, error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();

    // Exchange the recovery token for a session
    const { error: sessionError } = await supabase.auth.exchangeCodeForSession(token);

    if (sessionError) {
      return NextResponse.json(
        { success: false, error: "Invalid or expired reset link" },
        { status: 400 }
      );
    }

    // Update the password
    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });

    if (updateError) {
      return NextResponse.json({ success: false, error: updateError.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Password reset confirm error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
