import { NextResponse } from "next/server";

const PLAN_CHECKOUT_URLS: Record<string, string> = {
  starter: "https://zenplanner.lemonsqueezy.com/checkout/buy/88a0edbe-6e8e-45c0-9f9d-264dd48472cb",
  pro: "https://zenplanner.lemonsqueezy.com/checkout/buy/115ff75b-c1fb-4898-a238-16975794aa82",
  business: "https://zenplanner.lemonsqueezy.com/checkout/buy/bbe392f6-76ad-4215-8c8a-26113d7ed224",
  enterprise: "https://zenplanner.lemonsqueezy.com/checkout/buy/59ba6772-50e3-48fe-804e-ef26d44c99d0",
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

    const checkoutUrl = PLAN_CHECKOUT_URLS[plan];
    if (!checkoutUrl) {
      return NextResponse.json(
        { success: false, error: "Invalid plan" },
        { status: 400 }
      );
    }

    // Add userId as a query parameter for the webhook
    const finalUrl = `${checkoutUrl}?checkout[custom][user_id]=${encodeURIComponent(userId)}`;

    return NextResponse.json({ success: true, checkoutUrl: finalUrl });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create checkout" },
      { status: 500 }
    );
  }
}
