import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getCalendarConnections, deleteCalendarConnectionByProvider, type CalendarProvider } from "@/lib/db";
import { getSupabaseClient } from "@/lib/supabase";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_REDIRECT_URI = process.env.NEXT_PUBLIC_APP_URL + "/api/calendar/oauth/google";

const MICROSOFT_CLIENT_ID = process.env.MICROSOFT_CLIENT_ID;
const MICROSOFT_CLIENT_SECRET = process.env.MICROSOFT_CLIENT_SECRET;
const MICROSOFT_REDIRECT_URI = process.env.NEXT_PUBLIC_APP_URL + "/api/calendar/oauth/microsoft";

async function getUserIdFromRequest(request: Request): Promise<string | null> {
    const auth = request.headers.get("Authorization");
    if (!auth?.startsWith("Bearer ")) {
        return null;
    }

    const token = auth.slice(7).trim();
    const supabase = getSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser(token);
    return user?.id || null;
}

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const action = searchParams.get("action");

        const userId = await getUserIdFromRequest(request);
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        if (action === "list") {
            const connections = await getCalendarConnections(userId);
            // Don't return tokens, just connection info
            const safeConnections = connections.map(c => ({
                id: c.id,
                provider: c.provider,
                calendarName: c.calendarName,
                isPrimary: c.isPrimary,
                lastSyncedAt: c.lastSyncedAt,
            }));
            return NextResponse.json({ success: true, connections: safeConnections });
        }

        if (action === "auth_url") {
            const provider = searchParams.get("provider") as CalendarProvider;

            if (provider === "google") {
                const scopes = [
                    "https://www.googleapis.com/auth/calendar",
                    "https://www.googleapis.com/auth/calendar.events",
                ].join(" ");

                const authUrl = "https://accounts.google.com/o/oauth2/v2/auth?" + new URLSearchParams({
                    client_id: GOOGLE_CLIENT_ID || "",
                    redirect_uri: GOOGLE_REDIRECT_URI,
                    response_type: "code",
                    scope: scopes,
                    access_type: "offline",
                    prompt: "consent",
                    state: userId,
                });

                return NextResponse.json({ success: true, authUrl });
            }

            if (provider === "microsoft") {
                const scopes = [
                    "https://graph.microsoft.com/Calendars.ReadWrite",
                    "offline_access",
                ].join(" ");

                const authUrl = "https://login.microsoftonline.com/common/oauth2/v2.0/authorize?" + new URLSearchParams({
                    client_id: MICROSOFT_CLIENT_ID || "",
                    redirect_uri: MICROSOFT_REDIRECT_URI,
                    response_type: "code",
                    scope: scopes,
                    state: userId,
                });

                return NextResponse.json({ success: true, authUrl });
            }

            if (provider === "apple") {
                // Apple Calendar uses iCal export/import - no OAuth needed
                return NextResponse.json({
                    success: true,
                    authUrl: null,
                    message: "Apple Calendar uses iCal export/import. Use the export endpoint to generate an .ics file."
                });
            }

            return NextResponse.json({ error: "Invalid provider" }, { status: 400 });
        }

        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    } catch (error) {
        console.error("Calendar API error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const provider = searchParams.get("provider") as CalendarProvider;

        const userId = await getUserIdFromRequest(request);
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        if (!provider || !["google", "microsoft", "apple"].includes(provider)) {
            return NextResponse.json({ error: "Invalid provider" }, { status: 400 });
        }

        await deleteCalendarConnectionByProvider(userId, provider);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Calendar disconnect error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
