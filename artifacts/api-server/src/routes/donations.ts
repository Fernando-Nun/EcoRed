import { and, eq } from "drizzle-orm";
import { Router, type IRouter } from "express";
import {
  CreateDonationBody,
  CreateDonationResponse,
  GetDashboardSummaryResponse,
  ListDonationsQueryParams,
  ListDonationsResponse,
  UpdateDonationStatusBody,
  UpdateDonationStatusParams,
  UpdateDonationStatusResponse,
} from "@workspace/api-zod";
import {
  db,
  donationEventsTable,
  donationsTable,
  organizationsTable,
} from "@workspace/db";
import { authenticate } from "../middlewares/auth";
import {
  canChangeDonationStatus,
  canReceiveDonation,
} from "../lib/donation-policy";
import {
  findDonationView,
  listDonationsForUser,
} from "../lib/donation-queries";
import type { DonationState } from "../lib/donation-policy";

const router: IRouter = Router();

router.get("/donations", authenticate, async (req, res): Promise<void> => {
  const parsedQuery = ListDonationsQueryParams.safeParse(req.query);
  if (!parsedQuery.success) {
    res.status(400).json({ error: "El filtro de estado no es válido." });
    return;
  }
  if (!req.authUser) {
    res.status(401).json({ error: "Inicia sesión para continuar." });
    return;
  }

  const rows = await listDonationsForUser(
    req.authUser,
    parsedQuery.data.status as DonationState | undefined,
  );
  res.json(ListDonationsResponse.parse(rows));
});

router.post("/donations", authenticate, async (req, res): Promise<void> => {
  const user = req.authUser;
  if (!user) {
    res.status(401).json({ error: "Inicia sesión para continuar." });
    return;
  }
  if (user.role !== "donor") {
    res.status(403).json({ error: "Solo las cuentas donantes pueden registrar materiales." });
    return;
  }

  const parsed = CreateDonationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Revisa los datos de la donación." });
    return;
  }

  const [recipient] = await db
    .select({
      id: organizationsTable.id,
      isVerified: organizationsTable.isVerified,
      acceptedCategories: organizationsTable.acceptedCategories,
    })
    .from(organizationsTable)
    .where(eq(organizationsTable.id, parsed.data.recipientId))
    .limit(1);
  if (!recipient) {
    res.status(400).json({ error: "La organización receptora no existe." });
    return;
  }
  if (
    !canReceiveDonation({
      isVerified: recipient.isVerified,
      acceptedCategories: recipient.acceptedCategories,
      category: parsed.data.category,
    })
  ) {
    res.status(400).json({
      error: !recipient.isVerified
        ? "La organización aún no está verificada para recibir donaciones."
        : "La organización no recibe esta categoría de material.",
    });
    return;
  }

  const donation = await db.transaction(async (tx) => {
    const [created] = await tx
      .insert(donationsTable)
      .values({
        donorId: user.id,
        recipientId: parsed.data.recipientId,
        category: parsed.data.category,
        title: parsed.data.title.trim(),
        description: parsed.data.description.trim(),
        quantity: parsed.data.quantity,
        unit: parsed.data.unit,
      })
      .returning();
    await tx.insert(donationEventsTable).values({
      donationId: created.id,
      actorId: user.id,
      fromStatus: null,
      toStatus: "pending",
      note: "Donación registrada.",
    });
    return created;
  });

  const view = await findDonationView(donation.id);
  if (!view) {
    res.status(500).json({ error: "No se pudo recuperar la donación creada." });
    return;
  }
  const response = CreateDonationResponse.parse(view);
  res.status(201).json(response);
});

router.patch(
  "/donations/:id/status",
  authenticate,
  async (req, res): Promise<void> => {
    const user = req.authUser;
    if (!user) {
      res.status(401).json({ error: "Inicia sesión para continuar." });
      return;
    }

    const params = UpdateDonationStatusParams.safeParse(req.params);
    const body = UpdateDonationStatusBody.safeParse(req.body);
    if (!params.success || !body.success) {
      res.status(400).json({ error: "El identificador o el estado no son válidos." });
      return;
    }

    const [existing] = await db
      .select()
      .from(donationsTable)
      .where(eq(donationsTable.id, params.data.id))
      .limit(1);
    if (!existing) {
      res.status(404).json({ error: "No encontramos esa donación." });
      return;
    }

    const permitted = canChangeDonationStatus({
      actorRole: user.role,
      actorOrganizationId: user.organizationId,
      recipientId: existing.recipientId,
      currentStatus: existing.status,
      nextStatus: body.data.status,
    });
    if (!permitted) {
      res.status(403).json({
        error: "No tienes permisos para realizar ese cambio de estado.",
      });
      return;
    }

    const updated = await db.transaction(async (tx) => {
      const [changed] = await tx
        .update(donationsTable)
        .set({ status: body.data.status })
        .where(
          and(
            eq(donationsTable.id, existing.id),
            eq(donationsTable.status, existing.status),
          ),
        )
        .returning();
      if (!changed) {
        return null;
      }
      await tx.insert(donationEventsTable).values({
        donationId: existing.id,
        actorId: user.id,
        fromStatus: existing.status,
        toStatus: body.data.status,
        note:
          body.data.status === "approved"
            ? user.role === "organization"
              ? "Donación aceptada por la organización receptora."
              : "Donación validada por administración."
            : body.data.status === "rejected"
              ? "Donación rechazada por administración."
              : "Entrega confirmada por la organización receptora.",
      });
      return changed;
    });
    if (!updated) {
      res.status(409).json({
        error: "La donación cambió mientras se procesaba. Actualiza la lista e inténtalo de nuevo.",
      });
      return;
    }

    const view = await findDonationView(updated.id);
    if (!view) {
      res.status(500).json({ error: "No se pudo recuperar la donación actualizada." });
      return;
    }
    const response = UpdateDonationStatusResponse.parse(view);
    res.json(response);
  },
);

router.get(
  "/dashboard/summary",
  authenticate,
  async (req, res): Promise<void> => {
    if (!req.authUser) {
      res.status(401).json({ error: "Inicia sesión para continuar." });
      return;
    }
    const donations = await listDonationsForUser(req.authUser);
    const response = GetDashboardSummaryResponse.parse({
      donationCount: donations.length,
      pendingCount: donations.filter((item) => item.status === "pending").length,
      approvedCount: donations.filter((item) => item.status === "approved").length,
      deliveredCount: donations.filter((item) => item.status === "delivered").length,
      rejectedCount: donations.filter((item) => item.status === "rejected").length,
      totalWeightKg: Number(
        donations
          .filter((item) => item.status === "delivered" && item.unit === "kg")
          .reduce((sum, item) => sum + item.quantity, 0)
          .toFixed(2),
      ),
      recentDonations: donations.slice(0, 5),
    });
    res.json(response);
  },
);

export default router;