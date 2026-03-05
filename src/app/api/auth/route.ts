import { NextResponse } from "next/server";

const D1_API_URL = "https://api.cloudflare.com/client/v4/accounts/44488d79973a81689876492e372fe199/d1/database/efb0a777-d061-408b-baf5-f0ec60982757";
const D1_API_TOKEN = process.env.CLOUDFLARE_D1_API_TOKEN;

function generateId() {
  return crypto.randomUUID();
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, name, password, action } = body as { email: string; name?: string; password: string; action: string };
    
    if (!D1_API_TOKEN) {
      return NextResponse.json({ success: false, error: "Database not configured" }, { status: 500 });
    }

    if (action === "signup") {
      if (!name) {
        return NextResponse.json({ success: false, error: "Name is required" }, { status: 400 });
      }
      
      const checkResponse = await fetch(`${D1_API_URL}/query`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${D1_API_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sql: "SELECT * FROM User WHERE email = ?",
          params: [email]
        }),
      });
      
      const checkResult = await checkResponse.json();
      if (checkResult.result && checkResult.result.length > 0 && checkResult.result[0].results.length > 0) {
        return NextResponse.json({ success: false, error: "Email already exists" }, { status: 400 });
      }
      
      const id = generateId();
      const insertResponse = await fetch(`${D1_API_URL}/query`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${D1_API_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sql: "INSERT INTO User (id, email, name, password) VALUES (?, ?, ?, ?)",
          params: [id, email, name, password]
        }),
      });
      
      if (!insertResponse.ok) {
        console.error("Insert error:", await insertResponse.text());
        return NextResponse.json({ success: false, error: "Failed to create user" }, { status: 500 });
      }
      
      await fetch(`${D1_API_URL}/query`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${D1_API_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sql: "INSERT INTO Subscription (id, tier, userId) VALUES (?, ?, ?)",
          params: [generateId(), "free", id]
        }),
      });
      
      return NextResponse.json({ success: true, user: { id, email, name } });
    }
    
    if (action === "login") {
      const response = await fetch(`${D1_API_URL}/query`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${D1_API_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sql: "SELECT * FROM User WHERE email = ?",
          params: [email]
        }),
      });
      
      const result = await response.json();
      if (!result.result || result.result[0].results.length === 0) {
        return NextResponse.json({ success: false, error: "User not found" }, { status: 401 });
      }
      
      const user = result.result[0].results[0];
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
