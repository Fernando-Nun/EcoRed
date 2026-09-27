import { asc } from "drizzle-orm";
import { Router, type IRouter } from "express";
import { ListOrganizationsResponse } from "@workspace/api-zod";
import { db, organizationsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

router.get("/organizations", async (_req, res): Promise<void> => {
  const rows = await db
    .select({
      id: organizationsTable.id,
      name: organizationsTable.name,
      municipality: organizationsTable.municipality,
      description: organizationsTable.description,
      acceptedCategories: organizationsTable.acceptedCategories,
      isVerified: organizationsTable.isVerified,
    })
    .from(organizationsTable)
    .where(eq(organizationsTable.isVerified, true))
    .orderBy(asc(organizationsTable.name));

  res.json(ListOrganizationsResponse.parse(rows));
});

export default router;