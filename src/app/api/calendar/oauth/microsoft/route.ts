import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { createCalendarConnection, getCalendarConnection, updateCalendarConnection } from "@/lib/db";

const MICROSOFT_CLIENT_ID = process.env.MICROSOFT_CLIENT_ID;
const MICROSOFT_CLIENT_SECRET = process.env.MICROSOFT_CLIENT_SECRET;
const MICROSOFT_REDIRECT_URI = process.env.NEXT_PUBLIC_APP_URL + "/api/calendar/oauth/microsoft";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const code = searchParams.get("code");
        const state = searchParams.get("state"); // This is the userId
        const error = searchParams.get("error");

        if (error) {
            return NextResponse.redirect(new URL("/?calendar_error=microsoft_auth_failed", request.url));
        }

        if (!code || !state) {
            return NextResponse.redirect(new URL("/?calendar_error=missing_params", request.url));
        }

        // Exchange code for tokens
        const tokenResponse = await fetch("https://login.microsoftonline.com/common/oauth2/v2.0/token", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
                client_id: MICROSOFT_CLIENT_ID || "",
                client_secret: MICROSOFT_CLIENT_SECRET || "",
                code,
                grant_type: "authorization_code",
                redirect_uri: MICROSOFT_REDIRECT_URI,
                scope: "https://graph.microsoft.com/Calendars.ReadWrite offline_access",
            }),
        });

        const tokens = await tokenResponse.json();

        if (!tokens.access_token) {
            return NextResponse.redirect(new URL("/?calendar_error=token_exchange_failed", request.url));
        }

        // Get primary calendar info from Microsoft Graph
        const calendarResponse = await fetch(
            "https://graph.microsoft.com/v1.0/me/calendars",
            {
                headers: { Authorization: `Bearer ${tokens.access_token}` },
            }
        );

        const calendarData = await calendarResponse.json();
        const primaryCalendar = calendarData.value?.find((c: any) => c.isDefaultCalendar) || calendarData.value?.[0];

        const userId = state;
        const db = getDb();

        // Check if connection already exists
        const existing = await getCalendarConnection(userId, "microsoft");

        if (existing) {
            // Update existing connection
            await updateCalendarConnection(existing.id, {
                accessToken: tokens.access_token,
                refreshToken: tokens.refresh_token,
                expiresAt: tokens.expires_in ? new Date(Date.now() + tokens.expires_in * 1000).toISOString() : undefined,
                calendarId: primaryCalendar?.id,
                calendarName: primaryCalendar?.name || "Primary Calendar",
            });
        } else {
            // Create new connection
            await createCalendarConnection(userId, {
                provider: "microsoft",
                accessToken: tokens.access_token,
                refreshToken: tokens.refresh_token,
                expiresAt: tokens.expires_in ? new Date(Date.now() + tokens.expires_in * 1000).toISOString() : undefined,
                calendarId: primaryCalendar?.id,
                calendarName: primaryCalendar?.name || "Primary Calendar",
                isPrimary: true,
            });
        }

        return NextResponse.redirect(new URL("/?calendar_connected=microsoft", request.url));
    } catch (error) {
        console.error("Microsoft OAuth callback error:", error);
        return NextResponse.redirect(new URL("/?calendar_error=unknown", request.url));
    }
}
