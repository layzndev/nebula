import type { NextFunction, Request, Response } from "express";
import { AppError } from "../lib/appError.js";

export function notFoundHandler(_req: Request, res: Response) {
  res.status(404).json({ error: "Not found.", code: "NOT_FOUND" });
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  if (err instanceof AppError) {
    res
      .status(err.statusCode)
      .json({ error: err.message, code: err.code, details: err.details });
    return;
  }
  console.error("[error] unhandled", err);
  res.status(500).json({ error: "Internal server error.", code: "INTERNAL" });
}
