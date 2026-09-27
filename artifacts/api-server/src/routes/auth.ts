import { and, eq } from "drizzle-orm";
import { Router, type IRouter } from "express";
import {
  LoginUserBody,
  LoginUserResponse,
  RegisterUserBody,
  RegisterUserResponse,
  GetCurrentUserResponse,
} from "@workspace/api-zod";
import { db, organizationsTable, usersTable } from "@workspace/db";
import { authenticate } from "../middlewares/auth";
import { hashPassword, signJwtToken, verifyPassword } from "../lib/security";
import { hasCompleteOrganizationProfile } from "../lib/registration-policy";

const router: IRouter = Router();

function publicUser(user: {
  id: string;
  name: string;
  email: string;
  role: "donor" | "organization" | "admin";
  organizationName: string | null;
  createdAt: Date;
}) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    organizationName: user.organizationName,
    createdAt: user.createdAt.toISOString(),
  };
}

router.post("/auth/register", async (req, res): Promise<void> => {
  const parsed = RegisterUserBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Revisa los datos del registro." });
    return;
  }

  const input = parsed.data;
  const email = input.email.toLowerCase().trim();
  if (input.role === "organization" && !input.organizationName?.trim()) {
    res.status(400).json({
      error: "El nombre de la organización es obligatorio para este tipo de cuenta.",
    });
    return;
  }
  if (input.role === "organization" && !hasCompleteOrganizationProfile(input)) {
    res.status(400).json({
      error:
        "Completa el municipio, la descripción y los materiales que recibe tu organización.",
    });
    return;
  }

  const [existingUser] = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(eq(usersTable.email, email))
    .limit(1);
  if (existingUser) {
    res.status(409).json({ error: "Ya existe una cuenta con ese correo." });
    return;
  }

  const passwordHash = await hashPassword(input.password);
  const organizationName =
    input.role === "organization" ? input.organizationName!.trim() : null;

  try {
    const user = await db.transaction(async (tx) => {
      let organizationId: string | null = null;
      if (organizationName) {
        const [organization] = await tx
          .insert(organizationsTable)
          .values({
            name: organizationName,
            municipality: input.municipality!.trim(),
            description: input.description!.trim(),
            acceptedCategories: input.acceptedCategories!,
            isVerified: false,
          })
          .returning({ id: organizationsTable.id });
        organizationId = organization.id;
      }

      const [created] = await tx
        .insert(usersTable)
        .values({
          name: input.name.trim(),
          email,
          passwordHash,
          role: input.role,
          organizationId,
          organizationName,
        })
        .returning();
      return created;
    });

    const response = RegisterUserResponse.parse({
      token: signJwtToken(user.id, user.role),
      user: publicUser(user),
    });
    res.status(201).json(response);
  } catch (error) {
    const databaseCode =
      typeof error === "object" && error !== null && "code" in error
        ? (error as { code?: unknown }).code
        : undefined;
    if (databaseCode === "23505") {
      res.status(409).json({ error: "Ya existe una cuenta con ese correo." });
      return;
    }
    throw error;
  }
});

router.post("/auth/login", async (req, res): Promise<void> => {
  const parsed = LoginUserBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Correo o contraseña inválidos." });
    return;
  }

  const email = parsed.data.email.toLowerCase().trim();
  const [user] = await db
    .select()
    .from(usersTable)
    .where(and(eq(usersTable.email, email)))
    .limit(1);
  if (!user || !(await verifyPassword(parsed.data.password, user.passwordHash))) {
    res.status(401).json({ error: "Correo o contraseña incorrectos." });
    return;
  }

  const response = LoginUserResponse.parse({
    token: signJwtToken(user.id, user.role),
    user: publicUser(user),
  });
  res.json(response);
});

router.get("/auth/me", authenticate, (req, res): void => {
  if (!req.authUser) {
    res.status(401).json({ error: "Inicia sesión para continuar." });
    return;
  }
  const response = GetCurrentUserResponse.parse(publicUser(req.authUser));
  res.json(response);
});

export default router;