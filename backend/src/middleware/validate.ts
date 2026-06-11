import type { NextFunction, Request, Response } from "express";
import type { ZodType } from "zod";

/**
 * Parses and replaces req.body with the schema output (transforms applied).
 * Throws ZodError -> central error handler -> 400 VALIDATION_ERROR.
 */
export function validateBody(schema: ZodType) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    req.body = schema.parse(req.body);
    next();
  };
}

/**
 * Express 5 makes req.query a read-only getter, so the parsed result is
 * stored on res.locals.query instead of being written back to the request.
 */
export function validateQuery(schema: ZodType) {
  return (req: Request, res: Response, next: NextFunction): void => {
    res.locals.query = schema.parse(req.query);
    next();
  };
}
