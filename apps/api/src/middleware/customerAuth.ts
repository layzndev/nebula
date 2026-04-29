import type { NextFunction, Request, Response } from "express";

export function requireCustomer(req: Request, res: Response, next: NextFunction) {
  if (!req.session.customer) {
    res.status(401).json({ error: "Authentication required.", code: "AUTH_REQUIRED" });
    return;
  }
  next();
}
