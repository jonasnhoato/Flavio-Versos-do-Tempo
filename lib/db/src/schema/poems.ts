import { pgTable, serial, text, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const poemsTable = pgTable("poems", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  position: integer("position").notNull().default(0),
  isExample: boolean("is_example").notNull().default(false),
  viewCount: integer("view_count").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
export const insertPoemSchema = createInsertSchema(poemsTable).omit({ id: true, createdAt: true });
export type InsertPoem = z.infer<typeof insertPoemSchema>;
export type PoemRecord = typeof poemsTable.$inferSelect;