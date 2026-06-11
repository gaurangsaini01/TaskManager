import type { NextFunction, Request, Response } from "express";
import multer from "multer";
import { ZodError } from "zod";
import { Prisma } from "../generated/prisma/client.js";

export class ApiError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly code?: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    error: { message: `Route ${req.method} ${req.path} not found`, code: "NOT_FOUND" },
  });
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof ApiError) {
    res.status(err.statusCode).json({
      error: { message: err.message, code: err.code, details: err.details },
    });
    return;
  }

  if (err instanceof ZodError) {
    res.status(400).json({
      error: {
        message: "Validation failed",
        code: "VALIDATION_ERROR",
        details: err.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      },
    });
    return;
  }

  // Malformed JSON body from express.json()
  if (err instanceof SyntaxError && "status" in err && (err as { status?: number }).status === 400) {
    res.status(400).json({ error: { message: "Malformed JSON body", code: "BAD_JSON" } });
    return;
  }

  if (err instanceof multer.MulterError) {
    const message =
      err.code === "LIMIT_FILE_SIZE" ? "File is too large (max 5 MB)" : err.message;
    res.status(400).json({ error: { message, code: err.code } });
    return;
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2025") {
      res.status(404).json({ error: { message: "Resource not found", code: "NOT_FOUND" } });
      return;
    }
    if (err.code === "P2002") {
      res.status(409).json({ error: { message: "Resource already exists", code: "CONFLICT" } });
      return;
    }
  }

  console.error("Unhandled error:", err);
  res.status(500).json({ error: { message: "Internal server error", code: "INTERNAL" } });
}
