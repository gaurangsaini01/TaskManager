import jwt, { type SignOptions } from "jsonwebtoken";
import { config } from "../config.js";
import type { Role } from "../generated/prisma/client.js";

export interface AuthTokenPayload {
  sub: string;
  role: Role;
}

export function signToken(payload: AuthTokenPayload): string {
  return jwt.sign(payload, config.JWT_SECRET, {
    expiresIn: config.JWT_EXPIRES_IN as SignOptions["expiresIn"],
  });
}

/** Throws (JsonWebTokenError / TokenExpiredError) when invalid. */
export function verifyToken(token: string): AuthTokenPayload {
  return jwt.verify(token, config.JWT_SECRET) as AuthTokenPayload;
}
