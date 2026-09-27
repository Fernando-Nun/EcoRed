import { eq } from "drizzle-orm";
import type { RequestHandler } from "express";
import { db, usersTable } from "@workspace/db";
import { verifyJwtToken } from "../lib/security";

export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
  role: "donor" | "organization" | "admin";
  organizationId: string | null;
  organizationName: string | null;
  createdAt: Date;
}

declare global {
  namespace Express {
    interface Request {
      authUser?: AuthenticatedUser;
    }
  }
}

export const authenticate: RequestHandler = async (req, res, next) => {
  const authorization = req.get("authorization");
  const token = authorization?.match(/^Bearer ([^\s]+)$/i)?.[1];
  if (!token) {
    res.status(401).json({ error: "Inicia sesión para continuar." });
    return;
  }

  const claims = verifyJwtToken(token);
  if (!claims) {
    res.status(401).json({ error: "La sesión no es válida o ya expiró." });
    return;
  }

  const [user] = await db
    .select({
      id: usersTable.id,
      name: usersTable.name,
      email: usersTable.email,
      role: usersTable.role,
      organizationId: usersTable.organizationId,
      organizationName: usersTable.organizationName,
      createdAt: usersTable.createdAt,
    })
    .from(usersTable)
    .where(eq(usersTable.id, claims.sub))
    .limit(1);

  if (!user) {
    res.status(401).json({ error: "La cuenta asociada ya no está disponible." });
    return;
  }

  req.authUser = user;
  next();
};

export function requireRoles(
  ...roles: AuthenticatedUser["role"][]
): RequestHandler {
  return (req, res, next) => {
    if (!req.authUser || !roles.includes(req.authUser.role)) {
      res.status(403).json({ error: "No tienes permisos para esta acción." });
      return;
    }
    next();
  };
}