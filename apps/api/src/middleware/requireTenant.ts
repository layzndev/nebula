import type { NextFunction, Request, Response } from "express";
import { AppError } from "../lib/appError.js";
import {
  attachPhantomTenant,
  findCustomerById
} from "../modules/customers/customers.repository.js";
import { phantom } from "../modules/phantom/phantom.client.js";

declare module "express-serve-static-core" {
  interface Request {
    tenantId?: string;
  }
}

/**
 * Resolve (and lazily materialize) the Phantom tenant that backs the
 * authenticated customer. Stores the resulting Phantom tenant id on
 * the customer record after the first creation. All routes that act on
 * customer-owned servers should sit behind this middleware.
 */
export async function requireTenant(req: Request, res: Response, next: NextFunction) {
  try {
    const session = req.session.customer;
    if (!session) {
      res.status(401).json({ error: "Authentication required.", code: "AUTH_REQUIRED" });
      return;
    }
    const customer = await findCustomerById(session.id);
    if (!customer) {
      res.status(401).json({ error: "Session is no longer valid.", code: "INVALID_SESSION" });
      return;
    }

    if (customer.phantomTenantId) {
      req.tenantId = customer.phantomTenantId;
      next();
      return;
    }

    // Lazily materialize the tenant on first use. The slug is derived
    // from the customer's UUID so it's stable, lowercase, and never
    // collides — but truncated to fit Phantom's 32-char slug rule.
    const slug = `nb-${customer.id.replace(/-/g, "").slice(0, 28)}`;
    const created = await phantom.createTenant({
      name: customer.email,
      slug,
      planTier: "free"
    });
    await attachPhantomTenant(customer.id, created.tenant.id);
    req.tenantId = created.tenant.id;
    next();
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
      return;
    }
    console.error("[requireTenant] failed", error);
    next(new AppError(500, "Failed to resolve tenant.", "TENANT_RESOLVE_FAILED"));
  }
}
