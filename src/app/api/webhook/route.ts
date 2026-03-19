import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

// PayPal plan ID → app tier mapping
const PAYPAL_PLAN_IDS: Record<string, string> = {
  "P-6W164529YT481242XNG5NOVQ": "starter",
  "P-6SL25534GN999705MNG5NOXQ": "pro",
  "P-6BL92681JA785883RNG5NOZI": "business",
  "P-55L55956R6536740FNG5NO2Y": "enterprise",
};

/**
 * PayPal Webhook handler
 *
 * PayPal sends events here for subscription lifecycle changes.
 * In production, you should verify the webhook signature using
 * PayPal's /v1/notifications/verify-webhook-signature endpoint.
 */
export async function POST(request: Request) {
  try {
    const db = getDb();

    const body = (await request.json()) as { event_type: string; resource: Record<string, any> };
    const eventType = body.event_type;
    const resource = body.resource;

    console.log("PayPal webhook event:", eventType);

    if (!resource) {
      return NextResponse.json({ success: false, error: "No resource in event" }, { status: 400 });
    }

    // custom_id is our userId, set when creating the subscription
    const userId = resource.custom_id as string | undefined;
    const subscriptionId = resource.id as string | undefined;
    const planId = resource.plan_id as string | undefined;

    async function updateSub(fields: Record<string, string | boolean | null | undefined>) {
      const updates: Record<string, any> = {};
      for (const [col, val] of Object.entries(fields)) {
        if (val !== undefined) {
          updates[col] = val;
        }
      }
      if (Object.keys(updates).length === 0) return;

      // Try by userId first, fall back to subscriptionId
      if (userId) {
        await db.from("Subscription").update(updates).eq("userId", userId);
      } else if (subscriptionId) {
        await db.from("Subscription").update(updates).eq("subscriptionId", subscriptionId);
      }
    }

    switch (eventType) {
      // ── Subscription activated ──────────────────────────────────────
      case "BILLING.SUBSCRIPTION.ACTIVATED": {
        const tier = planId ? (PAYPAL_PLAN_IDS[planId] || "pro") : "pro";
        const renewsAt = resource.billing_info?.next_billing_time || null;

        await updateSub({
          tier,
          subscriptionId: subscriptionId || null,
          status: "active",
          renewsAt,
          startDate: new Date().toISOString(),
        });
        console.log(`Subscription activated for user ${userId}: ${tier}`);
        break;
      }

      // ── Subscription updated (plan change, etc) ─────────────────────
      case "BILLING.SUBSCRIPTION.UPDATED": {
        const tier = planId ? (PAYPAL_PLAN_IDS[planId] || "pro") : "pro";
        const renewsAt = resource.billing_info?.next_billing_time || null;
        const status = resource.status?.toLowerCase() || "active";

        await updateSub({
          tier,
          status,
          renewsAt,
        });
        console.log(`Subscription updated for user ${userId}: ${tier} (${status})`);
        break;
      }

      // ── Subscription cancelled ──────────────────────────────────────
      case "BILLING.SUBSCRIPTION.CANCELLED": {
        await updateSub({
          status: "cancelled",
        });
        console.log(`Subscription cancelled for user ${userId}`);
        break;
      }

      // ── Subscription suspended (payment failure) ────────────────────
      case "BILLING.SUBSCRIPTION.SUSPENDED": {
        await updateSub({
          status: "suspended",
        });
        console.log(`Subscription suspended for user ${userId}`);
        break;
      }

      // ── Subscription expired ────────────────────────────────────────
      case "BILLING.SUBSCRIPTION.EXPIRED": {
        await updateSub({
          tier: "free",
          status: "expired",
          subscriptionId: null,
          renewsAt: null,
        });
        console.log(`Subscription expired for user ${userId}`);
        break;
      }

      // ── Payment completed (recurring) ───────────────────────────────
      case "PAYMENT.SALE.COMPLETED": {
        const billingAgreementId = resource.billing_agreement_id;
        if (billingAgreementId) {
          await db
            .from("Subscription")
            .update({ status: "active" })
            .eq("subscriptionId", billingAgreementId);
        }
        console.log(`Payment completed for subscription ${billingAgreementId}`);
        break;
      }

      // ── Payment failed ──────────────────────────────────────────────
      case "PAYMENT.SALE.DENIED":
      case "PAYMENT.SALE.REFUNDED": {
        console.log(`Payment issue for user ${userId}: ${eventType}`);
        break;
      }

      default:
        console.log("Unhandled PayPal event:", eventType);
    }

    // PayPal expects a 200 response to acknowledge the webhook
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("PayPal webhook error:", error?.message || error);
    // Return 200 even on error to prevent PayPal from retrying endlessly
    return NextResponse.json({ success: true });
  }
}
