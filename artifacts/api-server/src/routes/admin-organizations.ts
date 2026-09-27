import { eq } from "drizzle-orm";
import { Router, type IRouter } from "express";
import {
  ListOrganizationsForReviewResponse,
  UpdateOrganizationVerificationBody,
  UpdateOrganizationVerificationParams,
  UpdateOrganizationVerificationResponse,
} from "@workspace/api-zod";
import { db, organizationsTable } from "@workspace/db";
import { authenticate, requireRoles } from "../middlewares/auth";

const router: IRouter = Router();

router.get(
  "/admin/organizations",
  authenticate,
  requireRoles("admin"),
  async (_req, res): Promise<void> => {
    const organizations = await db
      .select({
        id: organizationsTable.id,
        name: organizationsTable.name,
        municipality: organizationsTable.municipality,
        description: organizationsTable.description,
        acceptedCategories: organizationsTable.acceptedCategories,
        isVerified: organizationsTable.isVerified,
      })
      .from(organizationsTable)
      .orderBy(organizationsTable.createdAt);
    res.json(ListOrganizationsForReviewResponse.parse(organizations));
  },
);

router.patch(
  "/admin/organizations/:id/verification",
  authenticate,
  requireRoles("admin"),
  async (req, res): Promise<void> => {
    const params = UpdateOrganizationVerificationParams.safeParse(req.params);
    const body = UpdateOrganizationVerificationBody.safeParse(req.body);
    if (!params.success || !body.success) {
      res.status(400).json({ error: "El identificador o el estado no son válidos." });
      return;
    }

    const [organization] = await db
      .update(organizationsTable)
      .set({ isVerified: body.data.isVerified })
      .where(eq(organizationsTable.id, params.data.id))
      .returning({
        id: organizationsTable.id,
        name: organizationsTable.name,
        municipality: organizationsTable.municipality,
        description: organizationsTable.description,
        acceptedCategories: organizationsTable.acceptedCategories,
        isVerified: organizationsTable.isVerified,
      });
    if (!organization) {
      res.status(404).json({ error: "No encontramos esa organización." });
      return;
    }

    res.json(UpdateOrganizationVerificationResponse.parse(organization));
  },
);

export default router;