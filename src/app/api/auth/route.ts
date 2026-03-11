import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";

function generateId() {
  return crypto.randomUUID();
}

export async function POST(request: Request) {
  try {
    const env = getCloudflareContext().env;
    const db = env.zen_planner_db;
    
    const body = await request.json();
    const { email, name, password, action } = body as { email: string; name?: string; password: string; action: string };
    
    if (!db) {
      return NextResponse.json({ success: false, error: "Database not configured" }, { status: 500 });
    }

    if (action === "signup") {
      if (!name) {
        return NextResponse.json({ success: false, error: "Name is required" }, { status: 400 });
      }
      
      const checkResult = await db.prepare("SELECT * FROM User WHERE email = ?").bind(email).first();
      if (checkResult) {
        return NextResponse.json({ success: false, error: "Email already exists" }, { status: 400 });
      }
      
      const id = generateId();
      await db.prepare("INSERT INTO User (id, email, name, password) VALUES (?, ?, ?, ?)").bind(id, email, name, password).run();
      
      await db.prepare("INSERT INTO Subscription (id, tier, userId) VALUES (?, ?, ?)").bind(generateId(), "free", id).run();
      
      return NextResponse.json({ success: true, user: { id, email, name } });
    }
    
    if (action === "login") {
      const result = await db.prepare("SELECT * FROM User WHERE email = ?").bind(email).first();
      
      if (!result) {
        return NextResponse.json({ success: false, error: "User not found" }, { status: 401 });
      }
      
      if (result.password !== password) {
        return NextResponse.json({ success: false, error: "Invalid password" }, { status: 401 });
      }
      
      return NextResponse.json({ 
        success: true, 
        user: { id: result.id, email: result.email, name: result.name }
      });
    }
    
    return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Auth error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
