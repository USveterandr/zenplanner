import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { createUser, getUserByEmail } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const cf = getCloudflareContext();
    const env = cf.env as any;
    
    const body = await request.json();
    const { email, name, password, action } = body as { email: string; name?: string; password: string; action: string };
    
    if (action === "signup") {
      if (!name) {
        return NextResponse.json({ success: false, error: "Name is required" }, { status: 400 });
      }
      const existing = await getUserByEmail(env, email);
      if (existing) {
        return NextResponse.json({ success: false, error: "Email already exists" }, { status: 400 });
      }
      
      const user = await createUser(env, email, name, password);
      return NextResponse.json({ success: true, user: { id: user.id, email: user.email, name: user.name } });
    }
    
    if (action === "login") {
      const user = await getUserByEmail(env, email);
      if (!user) {
        return NextResponse.json({ success: false, error: "User not found" }, { status: 401 });
      }
      
      if (user.password !== password) {
        return NextResponse.json({ success: false, error: "Invalid password" }, { status: 401 });
      }
      
      return NextResponse.json({ 
        success: true, 
        user: { id: user.id, email: user.email, name: user.name }
      });
    }
    
    return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Auth error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
