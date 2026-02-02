import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { commentsTable, usersTable } from "@/db/schema";
import { eq, desc, asc } from "drizzle-orm";

const postCommentSchema = z.object({
  content: z.string().min(1).max(500),
  userHandle: z.string().min(1),
});

// GET /api/events/[event_id]/comments
// Get all messages for an event
export async function GET(
  request: NextRequest,
  { params }: { params: { event_id: string } },
) {
  const eventId = parseInt(params.event_id);
  if (isNaN(eventId)) {
    return NextResponse.json({ error: "Invalid Event ID" }, { status: 400 });
  }

  try {
    const comments = await db
      .select({
        id: commentsTable.id,
        content: commentsTable.content,
        createdAt: commentsTable.createdAt,
        userHandle: commentsTable.userHandle,
        displayName: usersTable.displayName,
      })
      .from(commentsTable)
      .innerJoin(usersTable, eq(commentsTable.userHandle, usersTable.handle))
      .where(eq(commentsTable.eventId, eventId))
      .orderBy(asc(commentsTable.createdAt)) // Chat usually shows oldest at top? Or newest at bottom. Standard is oldest first (top) -> newest last (bottom)
      .execute();

    return NextResponse.json({ comments }, { status: 200 });
  } catch (error) {
    console.error("Error fetching comments:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

// POST /api/events/[event_id]/comments
// Post a message
export async function POST(
  request: NextRequest,
  { params }: { params: { event_id: string } },
) {
  const eventId = parseInt(params.event_id);
  if (isNaN(eventId)) {
    return NextResponse.json({ error: "Invalid Event ID" }, { status: 400 });
  }

  const data = await request.json();

  try {
    const { content, userHandle } = postCommentSchema.parse(data);

    // TODO: Verify if user is actually joined in the event? 
    // For now, let's just allow it if they pass the handle.

    const [newComment] = await db
      .insert(commentsTable)
      .values({
        eventId,
        userHandle,
        content,
      })
      .returning();

    return NextResponse.json({ comment: newComment }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
        return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error("Error posting comment:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
