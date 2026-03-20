import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getTasks, getGoals } from "@/lib/db";
import { getSupabaseClient } from "@/lib/supabase";

function formatICSDate(dateStr: string, timeStr?: string): string {
    if (!dateStr) return "";

    // Expected format: YYYY-MM-DD for date, HH:mm for time
    const datePart = dateStr.replace(/-/g, "");

    if (timeStr) {
        const timePart = timeStr.replace(/:/g, "");
        return `${datePart}T${timePart}00`;
    }

    return `${datePart}`;
}

function escapeICSText(text: string | undefined): string {
    if (!text) return "";
    return text
        .replace(/\\/g, "\\\\")
        .replace(/;/g, "\\;")
        .replace(/,/g, "\\,")
        .replace(/\n/g, "\\n");
}

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
        const userId = await getUserIdFromRequest(request);
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const db = getDb();
        const tasks = await getTasks(userId);
        const goals = await getGoals(userId);

        // Build ICS content
        const lines: string[] = [
            "BEGIN:VCALENDAR",
            "VERSION:2.0",
            "PRODID:-//ZenPlanner//Calendar Export//EN",
            "CALSCALE:GREGORIAN",
            "METHOD:PUBLISH",
            "X-WR-CALNAME:ZenPlanner Tasks & Goals",
        ];

        const now = new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

        // Add tasks as todo items
        for (const task of tasks) {
            const uid = `zenplanner-task-${task.id}@zenplanner.app`;
            const summary = escapeICSText(task.title);
            const description = escapeICSText(task.description);
            const dtstamp = now;
            const dtstart = task.dueDate ? formatICSDate(task.dueDate, task.dueTime) : "";

            lines.push(
                "BEGIN:VTODO",
                `UID:${uid}`,
                `DTSTAMP:${dtstamp}`,
                `SUMMARY:${summary}`,
                description ? `DESCRIPTION:${description}` : "",
                `PRIORITY:${task.priority === "high" ? 1 : task.priority === "medium" ? 5 : 9}`,
                task.completed ? "STATUS:COMPLETED" : "STATUS:NEEDS-ACTION",
                dtstart ? `DUE;VALUE=DATE:${dtstart}` : "",
                "END:VTODO"
            );
        }

        // Add goals as events
        for (const goal of goals) {
            const uid = `zenplanner-goal-${goal.id}@zenplanner.app`;
            const summary = escapeICSText(goal.title);
            const description = escapeICSText(goal.description);
            const dtstamp = now;

            lines.push(
                "BEGIN:VEVENT",
                `UID:${uid}`,
                `DTSTAMP:${dtstamp}`,
                `SUMMARY:${summary}`,
                description ? `DESCRIPTION:${description}` : "",
                goal.targetDate ? `DTSTART;VALUE=DATE:${formatICSDate(goal.targetDate)}` : "",
                goal.targetDate ? `DTEND;VALUE=DATE:${formatICSDate(goal.targetDate)}` : "",
                "END:VEVENT"
            );
        }

        lines.push("END:VCALENDAR");

        // Filter empty lines
        const icsContent = lines.filter(line => line.trim()).join("\r\n");

        return new NextResponse(icsContent, {
            headers: {
                "Content-Type": "text/calendar; charset=utf-8",
                "Content-Disposition": "attachment; filename=zenplanner-calendar.ics",
            },
        });
    } catch (error) {
        console.error("iCal export error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
