import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { eventsTable, participantsTable, usersTable } from "@/db/schema";
import { eq, desc, sql, like, and } from "drizzle-orm";

// Validation schema for creating an event
const createEventSchema = z
  .object({
    title: z.string().min(1).max(100),
    description: z.string().optional(),
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    handle: z.string().min(1).max(50), // Host handle
  })
  .refine((data) => data.endDate > data.startDate, {
    message: "End date must be after start date",
    path: ["endDate"],
  })
  .refine(
    (data) => {
      const diffTime = Math.abs(data.endDate.getTime() - data.startDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= 7;
    },
    {
      message: "Event duration must be within 7 days",
      path: ["endDate"],
    },
  );

type CreateEventRequest = z.infer<typeof createEventSchema>;

// GET /api/events
// List events with search capability
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search");

  try {
    // Construct the query
    let query = db
      .select({
        id: eventsTable.id,
        title: eventsTable.title,
        description: eventsTable.description,
        startDate: eventsTable.startDate,
        endDate: eventsTable.endDate,
        hostHandle: eventsTable.hostHandle,
        hostDisplayName: usersTable.displayName,
        participantsCount: sql<number>`count(${participantsTable.userHandle})`.mapWith(Number),
        createdAt: eventsTable.createdAt,
      })
      .from(eventsTable)
      .innerJoin(usersTable, eq(eventsTable.hostHandle, usersTable.handle))
      .leftJoin(participantsTable, eq(eventsTable.id, participantsTable.eventId));

    // Apply filters if search term exists
    if (search) {
      // @ts-ignore - Dynamic filtering
      query = query.where(like(eventsTable.title, `%${search}%`));
    }

    // specific filtering for "LIKE" logic is tricky with group by in one go if we had multiple WHERE clauses
    // but here Where is applied before formatting the group by results usually in SQL execution order

    const events = await query
      .groupBy(eventsTable.id, usersTable.id, usersTable.displayName)
      .orderBy(desc(eventsTable.createdAt))
      .execute();

    return NextResponse.json({ events }, { status: 200 });
  } catch (error) {
    console.error("Error fetching events:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

// POST /api/events
// Create a new event
export async function POST(request: NextRequest) {
  const data = await request.json();
  let parsedData: CreateEventRequest;

  try {
    parsedData = createEventSchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: "Invalid request data" }, { status: 400 });
  }

  const { title, description, startDate, endDate, handle } = parsedData;

  try {
    // Transaction to create event AND add host as participant
    await db.transaction(async (tx) => {
      // 1. Create the event
      const [newEvent] = await tx
        .insert(eventsTable)
        .values({
          title,
          description: description || "",
          startDate,
          endDate,
          hostHandle: handle,
        })
        .returning();

      // 2. Add host as participant
      await tx.insert(participantsTable).values({
        eventId: newEvent.id,
        userHandle: handle,
      });
    });

    return NextResponse.json({ message: "Event created successfully" }, { status: 201 });
  } catch (error) {
    console.error("Error creating event:", error);
    return NextResponse.json(
      { error: "Failed to create event" },
      { status: 500 },
    );
  }
}
