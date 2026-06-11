import type { Role } from "../generated/prisma/client.js";

declare global {
  namespace Express {
    interface Request {
      /** Set by requireAuth after JWT verification. */
      user?: { id: string; role: Role };
    }
  }
}

export {};
