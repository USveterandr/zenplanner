import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";

/**
 * R2 file storage API
 *
 * PUT  /api/files?key=<key>&userId=<userId>  — upload a file (body = raw bytes)
 * GET  /api/files?key=<key>&userId=<userId>  — download a file
 * DELETE /api/files?key=<key>&userId=<userId> — delete a file
 *
 * Keys are namespaced automatically to `<userId>/<key>` so users can only
 * access their own files.
 */

function scopedKey(userId: string, key: string) {
  // Prevent path traversal
  const sanitized = key.replace(/\.\./g, "").replace(/^\/+/, "");
  return `${userId}/${sanitized}`;
}

export async function PUT(request: Request) {
  try {
    const env = getCloudflareContext().env;
    const bucket = env.zen_planner_storage;

    if (!bucket) {
      return NextResponse.json({ success: false, error: "Storage not configured" }, { status: 500 });
    }

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

    await bucket.put(scopedKey(userId, key), body, {
      httpMetadata: { contentType },
    });

    return NextResponse.json({ success: true, key: scopedKey(userId, key) });
  } catch (error) {
    console.error("Files PUT error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const env = getCloudflareContext().env;
    const bucket = env.zen_planner_storage;

    if (!bucket) {
      return NextResponse.json({ success: false, error: "Storage not configured" }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const key = searchParams.get("key");

    if (!userId) {
      return NextResponse.json({ success: false, error: "User not authenticated" }, { status: 401 });
    }
    if (!key) {
      return NextResponse.json({ success: false, error: "key is required" }, { status: 400 });
    }

    const object = await bucket.get(scopedKey(userId, key));

    if (!object) {
      return NextResponse.json({ success: false, error: "File not found" }, { status: 404 });
    }

    const contentType = object.httpMetadata?.contentType || "application/octet-stream";
    const arrayBuffer = await object.arrayBuffer();

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
    const env = getCloudflareContext().env;
    const bucket = env.zen_planner_storage;

    if (!bucket) {
      return NextResponse.json({ success: false, error: "Storage not configured" }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const key = searchParams.get("key");

    if (!userId) {
      return NextResponse.json({ success: false, error: "User not authenticated" }, { status: 401 });
    }
    if (!key) {
      return NextResponse.json({ success: false, error: "key is required" }, { status: 400 });
    }

    await bucket.delete(scopedKey(userId, key));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Files DELETE error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
