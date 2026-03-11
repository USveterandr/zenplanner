import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";

// Token expires in 1 hour
const TOKEN_TTL_MS = 60 * 60 * 1000;

export async function POST(request: Request) {
  try {
    const env = getCloudflareContext().env;
    const db = env.zen_planner_db;

    if (!db) {
      return NextResponse.json({ success: false, error: "Database not configured" }, { status: 500 });
    }

    const body = await request.json();
    const { email } = body as { email: string };

    if (!email) {
      return NextResponse.json({ success: false, error: "Email is required" }, { status: 400 });
    }

    const user = await db
      .prepare("SELECT id FROM User WHERE email = ?")
      .bind(email.trim().toLowerCase())
      .first();

    if (!user) {
      // Return success without a link to prevent user enumeration
      return NextResponse.json({ success: true, resetUrl: null });
    }

    // Delete any existing unused tokens for this user
    await db
      .prepare("DELETE FROM PasswordResetToken WHERE userId = ?")
      .bind(user.id)
      .run();

    // Generate a secure random token
    const tokenBytes = new Uint8Array(32);
    crypto.getRandomValues(tokenBytes);
    const token = Array.from(tokenBytes)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    const id = crypto.randomUUID();
    const expiresAt = Date.now() + TOKEN_TTL_MS;

    await db
      .prepare(
        "INSERT INTO PasswordResetToken (id, userId, token, expiresAt, used, createdAt) VALUES (?, ?, ?, ?, 0, ?)"
      )
      .bind(id, user.id, token, expiresAt, Date.now())
      .run();

    const origin = new URL(request.url).origin;
    const resetUrl = `${origin}/reset-password?token=${token}`;

    return NextResponse.json({ success: true, resetUrl });
  } catch (error) {
    console.error("Password reset request error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
