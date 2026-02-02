import { eq, desc, like, sql, and } from "drizzle-orm";
import { redirect } from "next/navigation";

import { db } from "@/db";
import { eventsTable, participantsTable, usersTable } from "@/db/schema";
import NameDialog from "@/components/NameDialog";
import EventCard from "@/components/EventCard";
import AddEventDialog from "@/components/AddEventDialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";

type HomePageProps = {
  searchParams: {
    username?: string;
    handle?: string;
    search?: string; // 新增搜尋參數
  };
};

export default async function Home({
  searchParams: { username, handle, search },
}: HomePageProps) {
  // 1. 處理使用者登入/註冊邏輯
  if (username && handle) {
    await db
      .insert(usersTable)
      .values({
        displayName: username,
        handle,
      })
      .onConflictDoUpdate({
        target: usersTable.handle,
        set: {
          displayName: username,
        },
      })
      .execute();
  }

  // 2. 準備撈取活動的 SQL 查詢
  // 我們需要知道：活動資訊、主辦人名字、參加人數、自己是否已參加
  const query = db
    .select({
      id: eventsTable.id,
      title: eventsTable.title,
      startDate: eventsTable.startDate,
      endDate: eventsTable.endDate,
      hostName: usersTable.displayName,
      // 算出參加人數
      participantsCount: sql<number>`count(${participantsTable.id})`.mapWith(Number),
      // 算出自己有沒有參加 (如果 handle 存在)
      // 這是一個子查詢技巧：如果在這個活動的參加者裡找到目前使用者，就回傳 1
      isJoined: handle
        ? sql<boolean>`EXISTS (
            SELECT 1 FROM ${participantsTable} p 
            WHERE p.event_id = ${eventsTable.id} 
            AND p.user_handle = ${handle}
          )`.mapWith(Boolean)
        : sql<boolean>`false`.mapWith(Boolean),
    })
    .from(eventsTable)
    .innerJoin(usersTable, eq(eventsTable.hostHandle, usersTable.handle))
    .leftJoin(participantsTable, eq(eventsTable.id, participantsTable.eventId));

  // 3. 搜尋過濾
  if (search) {
    // 這裡我們不能直接用 where(like(...)) 因為 query builder 結構有點複雜
    // 為了簡單起見，我們在下面執行時加條件，或是用簡單的 client side filter
    // 但為了效能，還是後端濾比較好。這裡示範基本的 where 寫法：
    // 注意：Drizzle 的 query builder 在這裡加 where 需要一點技巧，
    // 因為上面用了 group by。我們簡單一點，先不要在 SQL 這裡加 search
    // 讓我們用 client search (或是簡易的 SQL where)
  }

  // 4. 執行查詢
  // 因為我們要算 count，所以必須 group by event id
  const events = await query
    .where(search ? like(eventsTable.title, `%${search}%`) : undefined)
    .groupBy(eventsTable.id, usersTable.id, usersTable.displayName)
    .orderBy(desc(eventsTable.createdAt))
    .execute();

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-6 lg:p-24">
      <div className="flex w-full max-w-2xl flex-col gap-6">
        
        {/* 標題與使用者區塊 */}
        <div className="flex items-center justify-between">
          <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl">
            Let's Group!
          </h1>
          <div className="flex items-center gap-2">
            <NameDialog />
          </div>
        </div>

        {/* 搜尋欄位 (這裡用 Form 讓他按 Enter 就能送出搜尋) */}
        <form action="/" method="GET" className="flex gap-2">
          {/* 保持 username 和 handle 參數 */}
          {username && <input type="hidden" name="username" value={username} />}
          {handle && <input type="hidden" name="handle" value={handle} />}
          
          <div className="relative w-full">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              name="search"
              placeholder="Search "
              defaultValue={search}
              className="pl-8"
            />
          </div>
          <Button type="submit" variant="secondary"> Search </Button>
        </form>

        {/* 分隔線 */}
        <div className="h-px bg-gray-200" />

        {/* 新增活動區塊 (只有登入後才顯示) */}
        {handle && (
          <div className="flex justify-end">
            <AddEventDialog userHandle={handle} />
          </div>
        )}

        {/* 活動列表區塊 */}
        <div className="flex flex-col gap-4">
          {events.length === 0 ? (
            <div className="text-center py-10 text-gray-500">
              {search ? "No relevant event 🥲" : "No events yet, be the first to create one!"}
            </div>
          ) : (
            events.map((event) => (
              <EventCard
                key={event.id}
                id={event.id}
                title={event.title}
                startDate={event.startDate.toISOString()}
                endDate={event.endDate.toISOString()}
                hostName={event.hostName}
                participantsCount={event.participantsCount}
                isJoined={event.isJoined}
                currentUserHandle={handle || ""}
                currentUserDisplayName={username}
              />
            ))
          )}
        </div>
      </div>
    </main>
  );
}
