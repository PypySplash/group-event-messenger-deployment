import { NextResponse, type NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import { eventsTable } from "@/db/schema";

const deleteEventSchema = z.object({
  userHandle: z.string().min(1),
});

// DELETE /api/events/[event_id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: { event_id: string } },
) {
  const eventId = parseInt(params.event_id);
  if (isNaN(eventId)) {
    return NextResponse.json({ error: "Invalid Event ID" }, { status: 400 });
  }

  // Validate request body
  let data;
  try {
    data = await request.json();
    deleteEventSchema.parse(data);
  } catch (error) {
    return NextResponse.json({ error: "Invalid request format" }, { status: 400 });
  }
  const { userHandle } = data as z.infer<typeof deleteEventSchema>;

  try {
    // Check if event exists and if user is host
    const [event] = await db
      .select({ hostHandle: eventsTable.hostHandle })
      .from(eventsTable)
      .where(eq(eventsTable.id, eventId))
      .execute();

    if (!event) {
        return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    if (event.hostHandle !== userHandle) {
        return NextResponse.json({ error: "Unauthorized: You are not the host" }, { status: 403 });
    }

    // Delete event
    await db
        .delete(eventsTable)
        .where(eq(eventsTable.id, eventId))
        .execute();

    return NextResponse.json({ deleted: true }, { status: 200 });

  } catch (error) {
    console.error("Error deleting event:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
