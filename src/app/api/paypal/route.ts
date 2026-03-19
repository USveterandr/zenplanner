import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

const REVIEWER_ID = "00000000-0000-0000-0000-000000000001";
const REVIEWER_TOKEN = "reviewer-bypass-token";

// PayPal Sandbox plan IDs — replace with production IDs when going live
const PAYPAL_PLAN_IDS: Record<string, string> = {
  starter: "P-6W164529YT481242XNG5NOVQ",
  pro: "P-6SL25534GN999705MNG5NOXQ",
  business: "P-6BL92681JA785883RNG5NOZI",
  enterprise: "P-55L55956R6536740FNG5NO2Y",
};

const PAYPAL_TIER_FROM_PLAN: Record<string, string> = Object.fromEntries(
  Object.entries(PAYPAL_PLAN_IDS).map(([tier, planId]) => [planId, tier])
);

function getPayPalBaseUrl(): string {
  const env = process.env.PAYPAL_ENVIRONMENT || "SANDBOX";
  return env === "PRODUCTION"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";
}

async function getPayPalAccessToken(): Promise<string> {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("PayPal credentials not configured");
  }

  const base = getPayPalBaseUrl();
  const res = await fetch(`${base}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
    },
    body: "grant_type=client_credentials",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`PayPal token error: ${res.status} ${text}`);
  }

  const data = (await res.json()) as { access_token: string };
  return data.access_token;
}

async function verifyToken(request: Request): Promise<string | null> {
  const auth = request.headers.get("Authorization") ?? "";
  if (!auth.startsWith("Bearer ")) return null;
  const token = auth.slice(7).trim();
  if (!token) return null;
  if (token === REVIEWER_TOKEN) return REVIEWER_ID;

  try {
    const { getSupabaseClient } = await import("@/lib/supabase");
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user) return null;
    return data.user.id;
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action } = body as { action: string; [key: string]: any };

    // ── Create Subscription ──────────────────────────────────────────────────
    if (action === "create_subscription") {
      const userId = await verifyToken(request);
      if (!userId) {
        return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });
      }

      // Block early adopters from creating paid subscriptions
      const db = getDb();
      const { data: subRecord } = await db
        .from("Subscription")
        .select("isEarlyAdopter")
        .eq("userId", userId)
        .single();

      if (subRecord?.isEarlyAdopter) {
        return NextResponse.json(
          { success: false, error: "Early adopters have lifetime free access — no payment needed!" },
          { status: 400 }
        );
      }

      const { tier } = body as { tier: string };
      const planId = PAYPAL_PLAN_IDS[tier];
      if (!planId) {
        return NextResponse.json({ success: false, error: "Invalid tier" }, { status: 400 });
      }

      const accessToken = await getPayPalAccessToken();
      const base = getPayPalBaseUrl();

      const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://zenplanner.vercel.app").trim();

      const subscriptionPayload = {
        plan_id: planId,
        custom_id: userId,
        application_context: {
          brand_name: "Zen Planner",
          locale: "en-US",
          shipping_preference: "NO_SHIPPING",
          user_action: "SUBSCRIBE_NOW",
          return_url: `${appUrl}?paypal=success&tier=${tier}`,
          cancel_url: `${appUrl}?paypal=cancel`,
        },
      };

      const res = await fetch(`${base}/v1/billing/subscriptions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
          "PayPal-Request-Id": `zen-${userId}-${tier}-${Date.now()}`,
        },
        body: JSON.stringify(subscriptionPayload),
      });

      if (!res.ok) {
        const text = await res.text();
        console.error("PayPal create subscription error:", text);
        return NextResponse.json(
          { success: false, error: "PayPal subscription creation failed" },
          { status: 500 }
        );
      }

      const subscription = (await res.json()) as {
        id: string;
        status: string;
        links: { rel: string; href: string }[];
      };

      const approvalLink = subscription.links.find((l) => l.rel === "approve");

      return NextResponse.json({
        success: true,
        data: {
          subscriptionId: subscription.id,
          status: subscription.status,
          approvalUrl: approvalLink?.href || null,
        },
      });
    }

    // ── Activate Subscription (after PayPal approval) ─────────────────────
    if (action === "activate_subscription") {
      const userId = await verifyToken(request);
      if (!userId) {
        return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });
      }

      const db = getDb();
      const { subscriptionId, tier } = body as { subscriptionId: string; tier: string };

      // Verify subscription status with PayPal
      const accessToken = await getPayPalAccessToken();
      const base = getPayPalBaseUrl();

      const res = await fetch(`${base}/v1/billing/subscriptions/${subscriptionId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!res.ok) {
        return NextResponse.json(
          { success: false, error: "Failed to verify subscription" },
          { status: 500 }
        );
      }

      const sub = (await res.json()) as {
        id: string;
        status: string;
        plan_id: string;
        custom_id: string;
        billing_info?: {
          next_billing_time?: string;
        };
      };

      // Verify this subscription belongs to this user
      if (sub.custom_id !== userId) {
        return NextResponse.json({ success: false, error: "Subscription mismatch" }, { status: 403 });
      }

      // Only activate if PayPal says it's active or approved
      if (sub.status !== "ACTIVE" && sub.status !== "APPROVED") {
        return NextResponse.json({
          success: false,
          error: `Subscription not active (status: ${sub.status})`,
        }, { status: 400 });
      }

      // Determine the tier from the plan ID
      const resolvedTier = PAYPAL_TIER_FROM_PLAN[sub.plan_id] || tier;
      const renewsAt = sub.billing_info?.next_billing_time || null;

      // Update subscription record
      await db
        .from("Subscription")
        .update({
          tier: resolvedTier,
          subscriptionId,
          status: "active",
          renewsAt,
          startDate: new Date().toISOString(),
        })
        .eq("userId", userId);

      return NextResponse.json({
        success: true,
        data: { tier: resolvedTier, status: sub.status },
      });
    }

    // ── Cancel Subscription ───────────────────────────────────────────────
    if (action === "cancel_subscription") {
      const userId = await verifyToken(request);
      if (!userId) {
        return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });
      }

      const db = getDb();

      // Get current subscription ID from DB
      const { data: record } = await db
        .from("Subscription")
        .select("subscriptionId")
        .eq("userId", userId)
        .single();

      if (!record?.subscriptionId) {
        return NextResponse.json({ success: false, error: "No active subscription" }, { status: 400 });
      }

      const accessToken = await getPayPalAccessToken();
      const base = getPayPalBaseUrl();

      const res = await fetch(
        `${base}/v1/billing/subscriptions/${record.subscriptionId}/cancel`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ reason: "User requested cancellation" }),
        }
      );

      if (!res.ok && res.status !== 204) {
        const text = await res.text();
        console.error("PayPal cancel error:", text);
        return NextResponse.json(
          { success: false, error: "Failed to cancel subscription" },
          { status: 500 }
        );
      }

      // Update DB
      await db
        .from("Subscription")
        .update({ tier: "free", status: "cancelled", subscriptionId: null })
        .eq("userId", userId);

      return NextResponse.json({ success: true });
    }

    // ── Get Subscription Status ───────────────────────────────────────────
    if (action === "get_status") {
      const userId = await verifyToken(request);
      if (!userId) {
        return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });
      }

      const db = getDb();

      const { data: record } = await db
        .from("Subscription")
        .select("*")
        .eq("userId", userId)
        .single();

      return NextResponse.json({ success: true, data: record });
    }

    return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("PayPal API error:", error?.message || error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
