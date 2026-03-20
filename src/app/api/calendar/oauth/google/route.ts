import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { createCalendarConnection, getCalendarConnection, updateCalendarConnection } from "@/lib/db";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_REDIRECT_URI = process.env.NEXT_PUBLIC_APP_URL + "/api/calendar/oauth/google";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const code = searchParams.get("code");
        const state = searchParams.get("state"); // This is the userId
        const error = searchParams.get("error");

        if (error) {
            return NextResponse.redirect(new URL("/?calendar_error=google_auth_failed", request.url));
        }

        if (!code || !state) {
            return NextResponse.redirect(new URL("/?calendar_error=missing_params", request.url));
        }

        // Exchange code for tokens
        const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
                client_id: GOOGLE_CLIENT_ID || "",
                client_secret: GOOGLE_CLIENT_SECRET || "",
                code,
                grant_type: "authorization_code",
                redirect_uri: GOOGLE_REDIRECT_URI,
            }),
        });

        const tokens = await tokenResponse.json();

        if (!tokens.access_token) {
            return NextResponse.redirect(new URL("/?calendar_error=token_exchange_failed", request.url));
        }

        // Get primary calendar info
        const calendarResponse = await fetch(
            "https://www.googleapis.com/calendar/v3/users/me/calendarList?minAccessRole=owner",
            {
                headers: { Authorization: `Bearer ${tokens.access_token}` },
            }
        );

        const calendarData = await calendarResponse.json();
        const primaryCalendar = calendarData.items?.find((c: any) => c.primary) || calendarData.items?.[0];

        const userId = state;
        const db = getDb();

        // Check if connection already exists
        const existing = await getCalendarConnection(userId, "google");

        if (existing) {
            // Update existing connection
            await updateCalendarConnection(existing.id, {
                accessToken: tokens.access_token,
                refreshToken: tokens.refresh_token,
                expiresAt: tokens.expires_in ? new Date(Date.now() + tokens.expires_in * 1000).toISOString() : undefined,
                calendarId: primaryCalendar?.id,
                calendarName: primaryCalendar?.summary || "Primary Calendar",
            });
        } else {
            // Create new connection
            await createCalendarConnection(userId, {
                userId,
                provider: "google",
                accessToken: tokens.access_token,
                refreshToken: tokens.refresh_token,
                expiresAt: tokens.expires_in ? new Date(Date.now() + tokens.expires_in * 1000).toISOString() : undefined,
                calendarId: primaryCalendar?.id,
                calendarName: primaryCalendar?.summary || "Primary Calendar",
                isPrimary: true,
            });
        }

        return NextResponse.redirect(new URL("/?calendar_connected=google", request.url));
    } catch (error) {
        console.error("Google OAuth callback error:", error);
        return NextResponse.redirect(new URL("/?calendar_error=unknown", request.url));
    }
}
