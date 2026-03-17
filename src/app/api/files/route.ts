import { NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/supabase";

/**
 * Supabase file storage API
 *
 * PUT  /api/files?key=<key>&userId=<userId>  — upload a file (body = raw bytes)
 * GET  /api/files?key=<key>&userId=<userId>  — download a file
 * DELETE /api/files?key=<key>&userId=<userId> — delete a file
 *
 * Keys are namespaced automatically to `<userId>/<key>` so users can only
 * access their own files.
 */

const BUCKET_NAME = "zen-planner-storage";

function scopedKey(userId: string, key: string) {
  // Prevent path traversal
  const sanitized = key.replace(/\.\./g, "").replace(/^\/+/, "");
  return `${userId}/${sanitized}`;
}

export async function PUT(request: Request) {
  try {
    const supabase = getSupabaseClient();

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const key = searchParams.get("key");

    if (!userId) {
      return NextResponse.json({ success: false, error: "User not authenticated" }, { status: 401 });
    }
    if (!key) {
      return NextResponse.json({ success: false, error: "key is required" }, { status: 400 });
    }

    const contentType = request.headers.get("content-type") || "application/octet-stream";
    const body = await request.arrayBuffer();

    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(scopedKey(userId, key), body, {
        contentType,
        upsert: true
      });

    if (error) {
      console.error("Supabase Storage PUT error:", error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, key: data.path });
  } catch (error) {
    console.error("Files PUT error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const supabase = getSupabaseClient();

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const key = searchParams.get("key");

    if (!userId) {
      return NextResponse.json({ success: false, error: "User not authenticated" }, { status: 401 });
    }
    if (!key) {
      return NextResponse.json({ success: false, error: "key is required" }, { status: 400 });
    }

    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .download(scopedKey(userId, key));

    if (error || !data) {
      return NextResponse.json({ success: false, error: "File not found" }, { status: 404 });
    }

    const contentType = data.type || "application/octet-stream";
    const arrayBuffer = await data.arrayBuffer();

    return new Response(arrayBuffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (error) {
    console.error("Files GET error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = getSupabaseClient();

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const key = searchParams.get("key");

    if (!userId) {
      return NextResponse.json({ success: false, error: "User not authenticated" }, { status: 401 });
    }
    if (!key) {
      return NextResponse.json({ success: false, error: "key is required" }, { status: 400 });
    }

    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([scopedKey(userId, key)]);

    if (error) {
      console.error("Supabase Storage DELETE error:", error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Files DELETE error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
