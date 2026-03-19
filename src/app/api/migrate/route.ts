import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

/**
 * Migration endpoint — replaced D1 migration with Supabase Postgres.
 * Tables are managed via Supabase SQL Editor / migrations.
 * This endpoint now serves as a health check for the database.
 */
export async function POST(request: Request) {
  try {
    const auth = request.headers.get("Authorization");
    if (auth !== "Bearer reviewer-bypass-token") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = getDb();

    // Quick health check — count users
    const { count, error } = await db.from("User").select("*", { count: "exact", head: true });
    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Database connected (Supabase Postgres)",
      userCount: count ?? 0,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "Unknown error" }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: "Migration endpoint — use POST with Authorization: Bearer reviewer-bypass-token to check DB health",
  });
}
