import type { NextFunction, Request, Response } from "express";
import type { Role } from "../generated/prisma/client.js";
import { verifyToken } from "../utils/jwt.js";
import { ApiError } from "./errorHandler.js";

export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    throw new ApiError(401, "Authentication required", "UNAUTHORIZED");
  }

  try {
    const payload = verifyToken(header.slice("Bearer ".length));
    req.user = { id: payload.sub, role: payload.role };
  } catch {
    throw new ApiError(401, "Invalid or expired token", "UNAUTHORIZED");
  }

  next();
}

export function requireAdmin(req: Request, _res: Response, next: NextFunction): void {
  if (!req.user) {
    throw new ApiError(401, "Authentication required", "UNAUTHORIZED");
  }
  if (req.user.role !== "ADMIN") {
    throw new ApiError(403, "Admin access required", "FORBIDDEN");
  }
  next();
}

/** Type-safe accessor for req.user on routes behind requireAuth. */
export function authUser(req: Request): { id: string; role: Role } {
  if (!req.user) {
    throw new ApiError(401, "Authentication required", "UNAUTHORIZED");
  }
  return req.user;
}
