import { NextResponse, type NextRequest } from "next/server";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import { participantsTable } from "@/db/schema";

// We only need the userHandle from the request body
// The eventId comes from the URL parameter [event_id]
const joinEventSchema = z.object({
  userHandle: z.string().min(1),
});

// POST /api/events/[event_id]/join
// Join an event
export async function POST(
  request: NextRequest,
  { params }: { params: { event_id: string } },
) {
  const eventId = parseInt(params.event_id);
  
  // Validate request body
  let data;
  try {
    data = await request.json();
    joinEventSchema.parse(data);
  } catch (error) {
    return NextResponse.json({ error: "Invalid request format" }, { status: 400 });
  }

  const { userHandle } = data as z.infer<typeof joinEventSchema>;

  try {
    // Insert into participants table
    // IF user already joined (unique constraint on eventId + userHandle), do nothing
    await db
      .insert(participantsTable)
      .values({
        eventId,
        userHandle,
      })
      .onConflictDoNothing()
      .execute();

    return NextResponse.json({ joined: true }, { status: 200 });
  } catch (error) {
    console.error("Error joining event:", error);
    return NextResponse.json(
      { error: "Failed to join event" },
      { status: 500 },
    );
  }
}

// DELETE /api/events/[event_id]/join
// Leave an event
export async function DELETE(
  request: NextRequest,
  { params }: { params: { event_id: string } },
) {
  const eventId = parseInt(params.event_id);

  // Validate request body
  let data;
  try {
    data = await request.json();
    joinEventSchema.parse(data);
  } catch (error) {
    return NextResponse.json({ error: "Invalid request format" }, { status: 400 });
  }

  const { userHandle } = data as z.infer<typeof joinEventSchema>;

  try {
    // Delete from participants table
    // WHERE eventId matches AND userHandle matches
    await db
      .delete(participantsTable)
      .where(
        and(
          eq(participantsTable.eventId, eventId),
          eq(participantsTable.userHandle, userHandle),
        ),
      )
      .execute();

    return NextResponse.json({ left: true }, { status: 200 });
  } catch (error) {
    console.error("Error leaving event:", error);
    return NextResponse.json(
      { error: "Failed to leave event" },
      { status: 500 },
    );
  }
}
