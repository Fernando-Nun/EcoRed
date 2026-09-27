import { and, desc, eq, type SQL } from "drizzle-orm";
import { db, donationsTable, organizationsTable, usersTable } from "@workspace/db";
import type { AuthenticatedUser } from "../middlewares/auth";
import type { DonationState } from "./donation-policy";

export interface DonationView {
  id: string;
  donorId: string;
  donorName: string;
  recipientId: string;
  recipientName: string;
  category:
    | "electronics"
    | "plastics"
    | "glass"
    | "paper"
    | "metal"
    | "clothing"
    | "food"
    | "other";
  title: string;
  description: string;
  quantity: number;
  unit: "kg" | "pieces" | "liters";
  status: DonationState;
  createdAt: string;
  updatedAt: string;
}

const donationSelection = {
  id: donationsTable.id,
  donorId: donationsTable.donorId,
  donorName: usersTable.name,
  recipientId: organizationsTable.id,
  recipientName: organizationsTable.name,
  category: donationsTable.category,
  title: donationsTable.title,
  description: donationsTable.description,
  quantity: donationsTable.quantity,
  unit: donationsTable.unit,
  status: donationsTable.status,
  createdAt: donationsTable.createdAt,
  updatedAt: donationsTable.updatedAt,
};

function toDonationView(
  row: typeof donationSelection extends object
    ? {
        id: string;
        donorId: string;
        donorName: string;
        recipientId: string;
        recipientName: string;
        category: DonationView["category"];
        title: string;
        description: string;
        quantity: number;
        unit: DonationView["unit"];
        status: DonationState;
        createdAt: Date;
        updatedAt: Date;
      }
    : never,
): DonationView {
  return {
    ...row,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function listDonationsForUser(
  user: AuthenticatedUser,
  status?: DonationState,
): Promise<DonationView[]> {
  const conditions: SQL[] = [];
  if (user.role === "donor") {
    conditions.push(eq(donationsTable.donorId, user.id));
  } else if (user.role === "organization") {
    if (!user.organizationId) {
      return [];
    }
    conditions.push(eq(donationsTable.recipientId, user.organizationId));
  }
  if (status) {
    conditions.push(eq(donationsTable.status, status));
  }

  const rows = await db
    .select(donationSelection)
    .from(donationsTable)
    .innerJoin(usersTable, eq(donationsTable.donorId, usersTable.id))
    .innerJoin(
      organizationsTable,
      eq(donationsTable.recipientId, organizationsTable.id),
    )
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(donationsTable.createdAt));

  return rows.map((row) => toDonationView(row));
}

export async function findDonationView(
  donationId: string,
): Promise<DonationView | null> {
  const [row] = await db
    .select(donationSelection)
    .from(donationsTable)
    .innerJoin(usersTable, eq(donationsTable.donorId, usersTable.id))
    .innerJoin(
      organizationsTable,
      eq(donationsTable.recipientId, organizationsTable.id),
    )
    .where(eq(donationsTable.id, donationId))
    .limit(1);

  return row ? toDonationView(row) : null;
}