import { boolean, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { z } from "zod/v4";

export const organizationsTable = pgTable("organizations", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  municipality: text("municipality").notNull().default("Por definir"),
  description: text("description").notNull().default(""),
  acceptedCategories: text("accepted_categories")
    .array()
    .notNull()
    .default([
      "electronics",
      "plastics",
      "glass",
      "paper",
      "metal",
      "clothing",
      "food",
      "other",
    ]),
  isVerified: boolean("is_verified").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const insertOrganizationSchema = z.object({
  name: z.string().min(2).max(140),
  municipality: z.string().min(2).max(100).default("Por definir"),
  description: z.string().max(500).default(""),
  acceptedCategories: z.array(z.string()).default([]),
});

export type InsertOrganization = z.infer<typeof insertOrganizationSchema>;
export type Organization = typeof organizationsTable.$inferSelect;