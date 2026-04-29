import { Router } from "express";
import { asyncHandler } from "../../lib/asyncHandler.js";
import { requireCustomer } from "../../middleware/customerAuth.js";
import { phantom } from "./phantom.client.js";

export const phantomController = Router();

/**
 * Smoke-test endpoint: confirms that the Hosting backend (Nebula) can
 * reach Phantom on /platform/* with its configured token. Intentionally
 * scoped under /me so it only runs for an authenticated customer.
 */
phantomController.get(
  "/phantom-ping",
  requireCustomer,
  asyncHandler(async (_req, res) => {
    const result = await phantom.listTenants();
    res.json({
      ok: true,
      tenantCount: result.tenants.length,
      checkedAt: new Date().toISOString()
    });
  })
);
