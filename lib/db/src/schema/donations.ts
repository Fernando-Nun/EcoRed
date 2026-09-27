import { z } from "zod/v4";
import {
  index,
  pgEnum,
  pgTable,
  real,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { organizationsTable } from "./organizations";
import { usersTable } from "./users";

export const donationCategoryEnum = pgEnum("donation_category", [
  "electronics",
  "plastics",
  "glass",
  "paper",
  "metal",
  "clothing",
  "food",
  "other",
]);

export const donationUnitEnum = pgEnum("donation_unit", [
  "kg",
  "pieces",
  "liters",
]);

export const donationStatusEnum = pgEnum("donation_status", [
  "pending",
  "approved",
  "delivered",
  "rejected",
]);

export const donationsTable = pgTable(
  "donations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    donorId: uuid("donor_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "restrict" }),
    recipientId: uuid("recipient_id")
      .notNull()
      .references(() => organizationsTable.id, { onDelete: "restrict" }),
    category: donationCategoryEnum("category").notNull(),
    title: text("title").notNull(),
    description: text("description").notNull(),
    quantity: real("quantity").notNull(),
    unit: donationUnitEnum("unit").notNull(),
    status: donationStatusEnum("status").notNull().default("pending"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("donations_donor_created_idx").on(table.donorId, table.createdAt),
    index("donations_recipient_created_idx").on(
      table.recipientId,
      table.createdAt,
    ),
  ],
);

export const donationEventsTable = pgTable(
  "donation_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    donationId: uuid("donation_id")
      .notNull()
      .references(() => donationsTable.id, { onDelete: "cascade" }),
    actorId: uuid("actor_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "restrict" }),
    fromStatus: donationStatusEnum("from_status"),
    toStatus: donationStatusEnum("to_status").notNull(),
    note: text("note"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("donation_events_donation_idx").on(table.donationId)],
);

export const insertDonationSchema = z.object({
  donorId: z.uuid(),
  recipientId: z.uuid(),
  category: z.enum([
    "electronics",
    "plastics",
    "glass",
    "paper",
    "metal",
    "clothing",
    "food",
    "other",
  ]),
  title: z.string().min(2).max(120),
  description: z.string().min(5).max(1000),
  quantity: z.number().positive().max(1_000_000),
  unit: z.enum(["kg", "pieces", "liters"]),
});

export type InsertDonation = z.infer<typeof insertDonationSchema>;
export type Donation = typeof donationsTable.$inferSelect;