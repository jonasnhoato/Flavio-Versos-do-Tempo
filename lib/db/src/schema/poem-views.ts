import { pgTable, uuid, integer, timestamp } from "drizzle-orm/pg-core";
import { poemsTable } from "./poems";

// A receipt makes retries of the same opening safe without storing visitor identities.
export const poemViewsTable = pgTable("poem_views", {
  requestId: uuid("request_id").primaryKey(),
  poemId: integer("poem_id").notNull().references(() => poemsTable.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});