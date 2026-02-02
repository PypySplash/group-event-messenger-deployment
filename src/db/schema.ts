import { sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  unique,
  varchar,
} from "drizzle-orm/pg-core";

// schemas define the structure of the tables in the database
// watch this playlist to learn more about database schemas:
// although it uses MySQL, the concepts are the same
// https://planetscale.com/learn/courses/mysql-for-developers/schema/introduction-to-schema

export const usersTable = pgTable(
  "users",
  {
    // It is recommended to use something that means nothing outside of the database
    // as the primary key, so that you don't have to change it if the data it represents
    // changes. For example, if you use a user's email as the primary key, and then
    // the user changes their email, you have to update all the foreign keys that
    // reference that email. If you use a serial primary key, you don't have to worry
    // about that.
    id: serial("id").primaryKey(),
    // It is a good idea to set a maximum length for varchars, so that you don't
    // waste space in the database. It is also a good idea to move as much constraints
    // to the database as possible, so that you don't have to worry about them in
    // your application code.
    handle: varchar("handle", { length: 50 }).notNull().unique(),
    displayName: varchar("display_name", { length: 50 }).notNull(),
  },
  (table) => ({
    // indexes are used to speed up queries. Good indexes can make your queries
    // run orders of magnitude faster. learn more about indexes here:
    // https://planetscale.com/learn/courses/mysql-for-developers/indexes/introduction-to-indexes
    handleIndex: index("handle_index").on(table.handle),
  }),
);

// --- HW3: Events & Activities Tables ---

export const eventsTable = pgTable(
  "events",
  {
    id: serial("id").primaryKey(),
    title: varchar("title", { length: 100 }).notNull(),
    description: text("description"),
    startDate: timestamp("start_date").notNull(),
    endDate: timestamp("end_date").notNull(),
    hostHandle: varchar("host_handle", { length: 50 })
      .notNull()
      .references(() => usersTable.handle, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    hostIndex: index("host_index").on(table.hostHandle),
    startDateIndex: index("start_date_index").on(table.startDate),
  }),
);

// Stores who joined which event
export const participantsTable = pgTable(
  "participants",
  {
    id: serial("id").primaryKey(),
    eventId: integer("event_id")
      .notNull()
      .references(() => eventsTable.id, { onDelete: "cascade" }),
    userHandle: varchar("user_handle", { length: 50 })
      .notNull()
      .references(() => usersTable.handle, { onDelete: "cascade" }),
    joinedAt: timestamp("joined_at").defaultNow().notNull(),
  },
  (table) => ({
    eventIndex: index("event_participants_index").on(table.eventId),
    userIndex: index("user_participants_index").on(table.userHandle),
    uniqueJoin: unique().on(table.eventId, table.userHandle),
  }),
);

// Stores comments under an event
export const commentsTable = pgTable(
  "comments",
  {
    id: serial("id").primaryKey(),
    eventId: integer("event_id")
      .notNull()
      .references(() => eventsTable.id, { onDelete: "cascade" }),
    userHandle: varchar("user_handle", { length: 50 })
      .notNull()
      .references(() => usersTable.handle, { onDelete: "cascade" }),
    content: text("content").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    eventIndex: index("event_comments_index").on(table.eventId),
  }),
);

// --- HW4: Chat & Messaging Tables ---

// Represents a 1-on-1 chat room between two users
export const chatsTable = pgTable(
  "chats",
  {
    id: serial("id").primaryKey(),
    userA: varchar("user_a", { length: 50 })
      .notNull()
      .references(() => usersTable.handle, { onDelete: "cascade" }),
    userB: varchar("user_b", { length: 50 })
      .notNull()
      .references(() => usersTable.handle, { onDelete: "cascade" }),
    lastReadMessageIdA: integer("last_read_message_id_a"), // For read receipts (Advanced requirement)
    lastReadMessageIdB: integer("last_read_message_id_b"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    // Ensure we don't have multiple chat rooms for the same pair
    uniquePair: unique().on(table.userA, table.userB),
  }),
);

export const messagesTable = pgTable(
  "messages",
  {
    id: serial("id").primaryKey(),
    chatId: integer("chat_id")
      .notNull()
      .references(() => chatsTable.id, { onDelete: "cascade" }),
    senderHandle: varchar("sender_handle", { length: 50 })
      .notNull()
      .references(() => usersTable.handle, { onDelete: "cascade" }),
    content: text("content").notNull(),
    isAnnouncement: boolean("is_announcement").default(false), // For announcement feature
    sentAt: timestamp("sent_at").defaultNow().notNull(),
  },
  (table) => ({
    chatIndex: index("chat_messages_index").on(table.chatId),
    sentAtIndex: index("messages_sent_at_index").on(table.sentAt),
  }),
);

// --- Legacy Tables (Can be removed later) ---
export const tweetsTable = pgTable(
  "tweets",
  {
    id: serial("id").primaryKey(),
    content: varchar("content", { length: 280 }).notNull(),
    userHandle: varchar("user_handle", { length: 50 })
      .notNull()
      // this is a foreign key constraint. It ensures that the user_handle
      // column in this table references a valid user_handle in the users table.
      // We can also specify what happens when the referenced row is deleted
      // or updated. In this case, we want to delete the tweet if the user
      // is deleted, so we use onDelete: "cascade". It is similar for onUpdate.
      .references(() => usersTable.handle, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    replyToTweetId: integer("reply_to_tweet_id"),
    createdAt: timestamp("created_at").default(sql`now()`),
  },
  (table) => ({
    userHandleIndex: index("user_handle_index").on(table.userHandle),
    createdAtIndex: index("created_at_index").on(table.createdAt),
    // we can even set composite indexes, which are indexes on multiple columns
    // learn more about composite indexes here:
    // https://planetscale.com/learn/courses/mysql-for-developers/indexes/composite-indexes
    replyToAndTimeIndex: index("reply_to_time_index").on(
      table.replyToTweetId,
      table.createdAt,
    ),
  }),
);

export const likesTable = pgTable(
  "likes",
  {
    id: serial("id").primaryKey(),
    userHandle: varchar("user_handle", { length: 50 })
      .notNull()
      .references(() => usersTable.handle, { onDelete: "cascade" }),
    tweetId: integer("tweet_id")
      .notNull()
      .references(() => tweetsTable.id, { onDelete: "cascade" }),
  },
  (table) => ({
    tweetIdIndex: index("tweet_id_index").on(table.tweetId),
    userHandleIndex: index("user_handle_index").on(table.userHandle),
    // unique constraints ensure that there are no duplicate combinations of
    // values in the table. In this case, we want to ensure that a user can't
    // like the same tweet twice.
    uniqCombination: unique().on(table.userHandle, table.tweetId),
  }),
);
