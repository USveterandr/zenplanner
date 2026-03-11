import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";

export async function POST(request: Request) {
  try {
    const env = getCloudflareContext().env;
    const db = env.zen_planner_db;

    if (!db) {
      return NextResponse.json({ success: false, error: "Database not configured" }, { status: 500 });
    }

    const body = await request.json();
    const { token, newPassword } = body as { token: string; newPassword: string };

    if (!token || !newPassword) {
      return NextResponse.json({ success: false, error: "Token and new password are required" }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ success: false, error: "Password must be at least 6 characters" }, { status: 400 });
    }

    const record = await db
      .prepare("SELECT * FROM PasswordResetToken WHERE token = ?")
      .bind(token)
      .first();

    if (!record) {
      return NextResponse.json({ success: false, error: "Invalid or expired reset link" }, { status: 400 });
    }

    if (record.used) {
      return NextResponse.json({ success: false, error: "This reset link has already been used" }, { status: 400 });
    }

    if (Date.now() > record.expiresAt) {
      await db.prepare("DELETE FROM PasswordResetToken WHERE id = ?").bind(record.id).run();
      return NextResponse.json({ success: false, error: "Reset link has expired. Please request a new one." }, { status: 400 });
    }

    // Mark token as used and update password atomically
    await db.prepare("UPDATE PasswordResetToken SET used = 1 WHERE id = ?").bind(record.id).run();
    await db.prepare("UPDATE User SET password = ? WHERE id = ?").bind(newPassword, record.userId).run();

    // Clean up used token
    await db.prepare("DELETE FROM PasswordResetToken WHERE id = ?").bind(record.id).run();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Password reset confirm error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
