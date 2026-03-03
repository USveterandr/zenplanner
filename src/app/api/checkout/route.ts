import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";

const LEMON_SQUEEZY_API_KEY = process.env.LEMON_SQUEEZY_API_KEY;
const LEMON_SQUEEZY_STORE_ID = process.env.LEMON_SQUEEZY_STORE_ID;

// Map your plan IDs to Lemon Squeezy variant IDs
const PLAN_VARIANTS: Record<string, number> = {
  starter: 1,
  pro: 2,
  business: 3,
  enterprise: 4,
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, plan, email, name } = body as {
      userId: string;
      plan: string;
      email: string;
      name: string;
    };

    if (!userId || !plan || !email) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    const variantId = PLAN_VARIANTS[plan];
    if (!variantId) {
      return NextResponse.json(
        { success: false, error: "Invalid plan" },
        { status: 400 }
      );
    }

    // Create checkout URL using Lemon Squeezy API
    const checkoutData = {
      data: {
        type: "checkouts",
        attributes: {
          checkout_data: {
            email,
            name,
            custom: {
              userId,
            },
          },
        },
        relationships: {
          store: {
            data: {
              type: "stores",
              id: LEMON_SQUEEZY_STORE_ID || "your-store-id",
            },
          },
          variant: {
            data: {
              type: "variants",
              id: String(variantId),
            },
          },
        },
      },
    };

    const response = await fetch("https://api.lemonsqueezy.com/v1/checkouts", {
      method: "POST",
      headers: {
        Accept: "application/vnd.api+json",
        "Content-Type": "application/vnd.api+json",
        Authorization: `Bearer ${LEMON_SQUEEZY_API_KEY}`,
      },
      body: JSON.stringify(checkoutData),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("Lemon Squeezy API error:", error);
      return NextResponse.json(
        { success: false, error: "Failed to create checkout" },
        { status: 500 }
      );
    }

    const result = await response.json();
    const checkoutUrl = result.data?.attributes?.url;

    if (!checkoutUrl) {
      return NextResponse.json(
        { success: false, error: "No checkout URL returned" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, checkoutUrl });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create checkout" },
      { status: 500 }
    );
  }
}
