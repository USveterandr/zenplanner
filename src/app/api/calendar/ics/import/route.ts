import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSupabaseClient } from "@/lib/supabase";

interface ICSComponent {
    type: string;
    properties: Record<string, string[]>;
}

function parseICS(icsContent: string): ICSComponent[] {
    const components: ICSComponent[] = [];
    const lines = icsContent.split(/\r?\n/);

    let currentComponent: ICSComponent | null = null;
    let currentProperty: string | null = null;
    let currentValues: string[] = [];

    for (let i = 0; i < lines.length; i++) {
        let line = lines[i];

        // Handle line folding (lines that start with space or tab are continuations)
        while (i + 1 < lines.length && (lines[i + 1].startsWith(" ") || lines[i + 1].startsWith("\t"))) {
            i++;
            line += lines[i].substring(1);
        }

        // Parse the line
        if (line.startsWith("BEGIN:")) {
            currentComponent = {
                type: line.substring(6),
                properties: {},
            };
        } else if (line.startsWith("END:") && currentComponent) {
            components.push(currentComponent);
            currentComponent = null;
        } else if (currentComponent) {
            const colonIndex = line.indexOf(":");
            if (colonIndex > 0) {
                const property = line.substring(0, colonIndex);
                const value = line.substring(colonIndex + 1);

                // Handle properties with parameters (e.g., DTSTART;VALUE=DATE:20240320)
                const propertyName = property.split(";")[0];

                if (!currentComponent.properties[propertyName]) {
                    currentComponent.properties[propertyName] = [];
                }
                currentComponent.properties[propertyName].push(value);
            }
        }
    }

    return components;
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

export async function POST(request: Request) {
    try {
        const userId = await getUserIdFromRequest(request);
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const formData = await request.formData();
        const file = formData.get("file") as File | null;

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        if (!file.name.endsWith(".ics")) {
            return NextResponse.json({ error: "File must be a .ics file" }, { status: 400 });
        }

        const icsContent = await file.text();
        const components = parseICS(icsContent);

        const db = getDb();
        const importedTasks: string[] = [];
        const importedGoals: string[] = [];

        for (const component of components) {
            if (component.type === "VEVENT") {
                // Import as a task
                const summary = component.properties["SUMMARY"]?.[0] || "Imported Event";
                const description = component.properties["DESCRIPTION"]?.[0] || "";

                // Parse date
                const dtstart = component.properties["DTSTART"]?.[0] || "";
                let dueDate = "";
                let dueTime = "";

                if (dtstart.includes("T")) {
                    // DateTime format: 20240320T143000
                    const dateMatch = dtstart.match(/(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})/);
                    if (dateMatch) {
                        dueDate = `${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}`;
                        dueTime = `${dateMatch[4]}:${dateMatch[5]}`;
                    }
                } else if (dtstart) {
                    // Date-only format: 20240320
                    const dateMatch = dtstart.match(/(\d{4})(\d{2})(\d{2})/);
                    if (dateMatch) {
                        dueDate = `${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}`;
                    }
                }

                // Create the task
                const taskId = crypto.randomUUID();
                await db.from("Task").insert({
                    id: taskId,
                    title: summary,
                    description: description.substring(0, 1000), // Limit description length
                    completed: false,
                    priority: "medium",
                    dueDate: dueDate || null,
                    dueTime: dueTime || null,
                    category: "personal",
                    subtasks: [],
                    order: 0,
                    userId,
                });

                importedTasks.push(summary);
            }
        }

        return NextResponse.json({
            success: true,
            importedTasks: importedTasks.length,
            importedGoals: importedGoals.length,
        });
    } catch (error) {
        console.error("iCal import error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
