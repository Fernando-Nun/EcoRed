import {
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { z } from "zod/v4";
import { organizationsTable } from "./organizations";

export const userRoleEnum = pgEnum("user_role", [
  "donor",
  "organization",
  "admin",
]);

export const usersTable = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    passwordHash: text("password_hash").notNull(),
    role: userRoleEnum("role").notNull().default("donor"),
    organizationId: uuid("organization_id").references(
      () => organizationsTable.id,
      { onDelete: "set null" },
    ),
    organizationName: text("organization_name"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [uniqueIndex("users_email_unique").on(table.email)],
);

export const insertUserSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.email().max(255),
  passwordHash: z.string().min(1),
  role: z.enum(["donor", "organization", "admin"]),
  organizationId: z.uuid().nullable(),
  organizationName: z.string().nullable(),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;