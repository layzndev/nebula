import type { NextFunction, Request, Response } from "express";
import type { ZodSchema } from "zod";
import { AppError } from "./appError.js";

export function validateBody<T>(schema: ZodSchema<T>) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      next(
        new AppError(400, "Invalid request payload.", "VALIDATION_ERROR", result.error.flatten())
      );
      return;
    }
    req.body = result.data;
    next();
  };
}

export function validateParams<T>(schema: ZodSchema<T>) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.params);
    if (!result.success) {
      next(
        new AppError(400, "Invalid path parameters.", "VALIDATION_ERROR", result.error.flatten())
      );
      return;
    }
    req.params = result.data as never;
    next();
  };
}
