import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

interface LemonSqueezyEvent {
  event_name: string;
  data: {
    attributes: {
      customer_id?: string;
      subscription_id?: string;
      status?: string;
      renews_at?: string;
      ends_at?: string;
      order_id?: number;
      order_item_id?: number;
      product_id?: number;
      variant_id?: number;
      product_name?: string;
      variant_name?: string;
      user_email?: string;
      custom_data?: {
        userId?: string;
      };
    };
    relationships?: {
      order?: {
        data?: {
          id?: string;
        };
      };
    };
  };
}

const LEMON_SQUEEZY_PLANS: Record<number, string> = {
  1: "starter",
  2: "pro",
  3: "business",
  4: "enterprise",
};

export async function POST(request: Request) {
  try {
    const db = getDb();

    if (!db) {
      return NextResponse.json({ success: false, error: "Database not configured" }, { status: 500 });
    }
    
    const bodyText = await request.text();
    
    // Note: In production, verify X-Signature header using HMAC-SHA256
    // For now, we trust requests from Lemon Squeezy
    
    const body = JSON.parse(bodyText) as LemonSqueezyEvent;
    const { event_name, data } = body;
    
    const attributes = data.attributes;
    const userId = attributes.custom_data?.userId;
    
    console.log("Lemon Squeezy webhook:", event_name);
    
    if (!userId) {
      console.error("No userId in webhook");
      return NextResponse.json({ success: false, error: "No userId" }, { status: 400 });
    }

    async function updateSub(fields: Record<string, string | undefined>) {
      const setClauses: string[] = [];
      const values: string[] = [];
      for (const [col, val] of Object.entries(fields)) {
        if (val !== undefined) {
          setClauses.push(`${col} = ?`);
          values.push(val);
        }
      }
      values.push(userId!);
      await db!.prepare(`UPDATE Subscription SET ${setClauses.join(", ")} WHERE userId = ?`).bind(...values).run();
    }
    
    switch (event_name) {
      case "subscription_created":
      case "subscription_updated": {
        const variantId = attributes.variant_id;
        const tier = variantId ? (LEMON_SQUEEZY_PLANS[variantId] || "free") : "free";
        
        await updateSub({
          tier,
          customerId: attributes.customer_id ? String(attributes.customer_id) : undefined,
          subscriptionId: attributes.subscription_id ? String(attributes.subscription_id) : undefined,
          status: attributes.status,
          renewsAt: attributes.renews_at,
          endsAt: attributes.ends_at,
        });
        
        console.log(`Subscription updated for user ${userId}: ${tier}`);
        break;
      }
      
      case "subscription_cancelled":
      case "subscription_expired": {
        await updateSub({ tier: "free", status: "cancelled", endsAt: attributes.ends_at });
        console.log(`Subscription cancelled for user ${userId}`);
        break;
      }
      
      case "subscription_resumed": {
        const variantId = attributes.variant_id;
        const tier = variantId ? (LEMON_SQUEEZY_PLANS[variantId] || "pro") : "pro";
        await updateSub({ tier, status: "active", renewsAt: attributes.renews_at });
        console.log(`Subscription resumed for user ${userId}`);
        break;
      }
      
      case "subscription_payment_failed": {
        console.log(`Payment failed for user ${userId}`);
        break;
      }
      
      default:
        console.log("Unhandled event:", event_name);
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ success: false, error: "Webhook processing failed" }, { status: 500 });
  }
}
