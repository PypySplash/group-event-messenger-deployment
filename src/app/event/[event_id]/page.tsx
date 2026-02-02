import { redirect } from "next/navigation";
import Link from "next/link";
import { db } from "@/db";
import { eventsTable, usersTable, participantsTable } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { ArrowLeft, Calendar, Users, MessageCircle } from "lucide-react";

import EventChatRoom from "@/components/EventChatRoom";
import DeleteEventButton from "@/components/DeleteEventButton";

type Props = {
  params: { event_id: string };
  searchParams: {
    username?: string;
    handle?: string;
  };
};

export default async function EventPage({ params, searchParams }: Props) {
  const eventId = parseInt(params.event_id);
  const { handle, username } = searchParams;

  if (isNaN(eventId)) {
    return <div className="p-4 text-center">Invalid Event ID</div>;
  }

  // 1. Fetch Event Details
  const [event] = await db
    .select({
      id: eventsTable.id,
      title: eventsTable.title,
      description: eventsTable.description,
      startDate: eventsTable.startDate,
      endDate: eventsTable.endDate,
      hostHandle: eventsTable.hostHandle,
      hostName: usersTable.displayName,
    })
    .from(eventsTable)
    .innerJoin(usersTable, eq(eventsTable.hostHandle, usersTable.handle))
    .where(eq(eventsTable.id, eventId))
    .execute();

  if (!event) {
    return <div className="p-4 text-center">Event not found</div>;
  }

  // 2. Fetch Participants Count & List (Optional, maybe top 5)
  const participants = await db
    .select({
      displayName: usersTable.displayName,
      handle: usersTable.handle,
    })
    .from(participantsTable)
    .innerJoin(usersTable, eq(participantsTable.userHandle, usersTable.handle))
    .where(eq(participantsTable.eventId, eventId))
    .execute();

  const isJoined = handle ? participants.some((p) => p.handle === handle) : false;
  const isHost = handle === event.hostHandle;

  const formatDate = (date: Date) => {
    const timeString = date.toLocaleString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    return `${timeString} ${date.getHours() >= 12 ? "PM" : "AM"}`;
  };

  return (
    <div className="flex w-full flex-col lg:flex-row h-screen overflow-hidden">
      {/* Left Panel: Event Details */}
      <div className="flex-1 flex flex-col border-r bg-white p-6 overflow-y-auto">
        <div className="mb-6">
          <Link
            href={`/?username=${username || ""}&handle=${handle || ""}`}
            className="flex items-center text-slate-500 hover:text-slate-800 transition-colors mb-4"
          >
            <ArrowLeft size={18} className="mr-1" /> Back to Dashboard
          </Link>

          <div className="flex items-start justify-between">
            <h1 className="text-3xl font-extrabold text-slate-900 mb-2">
              {event.title}
            </h1>
            {isHost && (
              <DeleteEventButton eventId={eventId} userHandle={handle} />
            )}
          </div>
          <div className="flex items-center gap-2 text-slate-600 mb-6">
            <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-sm font-bold">
              HOST
            </span>
            <span className="font-medium">@{event.hostName}</span>
          </div>

          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-xl">
              <Calendar className="text-slate-500 mt-1" />
              <div>
                <p className="text-sm text-slate-500 font-semibold uppercase tracking-wide">
                  Time
                </p>
                <p className="text-slate-900 font-medium">
                  {formatDate(event.startDate)} <span className="mx-2"> to </span>{" "}
                  {formatDate(event.endDate)}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-xl">
              {/* Using MapPin as icon for description for now */}
              <Users className="text-slate-500 mt-1" />
              <div>
                <p className="text-sm text-slate-500 font-semibold uppercase tracking-wide">
                  Participants ({participants.length})
                </p>
                <div className="flex flex-wrap gap-2 mt-1">
                  {participants.map((p) => (
                    <span
                      key={p.handle}
                      className="text-sm bg-white border border-slate-200 px-2 py-1 rounded-full text-slate-600"
                    >
                      {p.displayName}
                    </span>
                  ))}
                  {participants.length === 0 && (
                     <span className="text-sm text-slate-400 italic"> No one joined yet </span>
                  )}
                </div>
              </div>
            </div>
            
            <div className="p-4">
              <h3 className="text-lg font-bold text-slate-900 mb-2"> Description </h3>
              <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">
                {event.description || "No description provided."}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel: Chat Room */}
      <div className="flex-1 flex flex-col bg-slate-50 border-1 border-slate-200">
         <EventChatRoom 
            eventId={eventId}
            currentUserHandle={handle}
            currentUserName={username}
            isJoined={isJoined}
         />
      </div>
    </div>
  );
}
