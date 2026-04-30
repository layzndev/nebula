import { Router } from "express";
import { asyncHandler } from "../../lib/asyncHandler.js";
import { validateBody, validateParams } from "../../lib/validate.js";
import { requireCustomer } from "../../middleware/customerAuth.js";
import { requireTenant } from "../../middleware/requireTenant.js";
import { phantom } from "../phantom/phantom.client.js";
import {
  createServerSchema,
  serverParamsSchema,
  updateServerSettingsSchema
} from "./servers.schema.js";

export const serversController = Router();

serversController.use(requireCustomer);
serversController.use(requireTenant);

// ---------- List + create ----------

serversController.get(
  "/",
  asyncHandler(async (req, res) => {
    const result = await phantom.listTenantServers(req.tenantId!);
    res.json({ servers: result.servers });
  })
);

serversController.post(
  "/",
  validateBody(createServerSchema),
  asyncHandler(async (req, res) => {
    const result = await phantom.provisionTenantServer(req.tenantId!, req.body);
    res.status(201).json({ server: result.server });
  })
);

// ---------- Detail ----------

serversController.get(
  "/:id",
  validateParams(serverParamsSchema),
  asyncHandler(async (req, res) => {
    const result = await phantom.getTenantServer(req.tenantId!, req.params.id!);
    res.json({ server: result.server });
  })
);

// ---------- Lifecycle ----------

serversController.post(
  "/:id/start",
  validateParams(serverParamsSchema),
  asyncHandler(async (req, res) => {
    const result = await phantom.startTenantServer(req.tenantId!, req.params.id!);
    res.json(result);
  })
);

serversController.post(
  "/:id/stop",
  validateParams(serverParamsSchema),
  asyncHandler(async (req, res) => {
    const result = await phantom.stopTenantServer(req.tenantId!, req.params.id!);
    res.json(result);
  })
);

serversController.post(
  "/:id/restart",
  validateParams(serverParamsSchema),
  asyncHandler(async (req, res) => {
    const result = await phantom.restartTenantServer(req.tenantId!, req.params.id!);
    res.json(result);
  })
);

serversController.delete(
  "/:id",
  validateParams(serverParamsSchema),
  asyncHandler(async (req, res) => {
    const hardDeleteData = req.query.hardDeleteData === "true";
    const result = await phantom.deleteTenantServer(req.tenantId!, req.params.id!, hardDeleteData);
    res.json(result);
  })
);

// ---------- Settings ----------

serversController.patch(
  "/:id/settings",
  validateParams(serverParamsSchema),
  validateBody(updateServerSettingsSchema),
  asyncHandler(async (req, res) => {
    const result = await phantom.updateTenantServerSettings(
      req.tenantId!,
      req.params.id!,
      req.body
    );
    res.json({ server: result.server });
  })
);

// ---------- Console ticket (PR 3) ----------

serversController.post(
  "/:id/console-url",
  validateParams(serverParamsSchema),
  asyncHandler(async (req, res) => {
    const result = await phantom.issueServerConsoleUrl(req.tenantId!, req.params.id!);
    res.status(201).json(result);
  })
);
