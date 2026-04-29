import { Router } from "express";
import { AppError } from "../../lib/appError.js";
import { asyncHandler } from "../../lib/asyncHandler.js";
import { validateBody } from "../../lib/validate.js";
import { requireCustomer } from "../../middleware/customerAuth.js";
import { authRateLimiter } from "../../middleware/security.js";
import { authenticateCustomer, getSafeCustomerById, registerCustomer } from "./auth.service.js";
import { loginSchema, registerSchema } from "./auth.schema.js";

export const authController = Router();

authController.post(
  "/register",
  authRateLimiter,
  validateBody(registerSchema),
  asyncHandler(async (req, res) => {
    const customer = await registerCustomer(req.body);
    await new Promise<void>((resolve, reject) => {
      req.session.regenerate((error) => (error ? reject(error) : resolve()));
    });
    req.session.customer = { id: customer.id, email: customer.email };
    req.session.security = { ipAddress: req.ip, userAgent: req.get("user-agent") };
    res.status(201).json({ customer });
  })
);

authController.post(
  "/login",
  authRateLimiter,
  validateBody(loginSchema),
  asyncHandler(async (req, res) => {
    const customer = await authenticateCustomer(req.body);
    if (!customer) {
      throw new AppError(401, "Invalid credentials.", "INVALID_CREDENTIALS");
    }
    await new Promise<void>((resolve, reject) => {
      req.session.regenerate((error) => (error ? reject(error) : resolve()));
    });
    req.session.customer = { id: customer.id, email: customer.email };
    req.session.security = { ipAddress: req.ip, userAgent: req.get("user-agent") };
    res.json({ customer });
  })
);

authController.post(
  "/logout",
  requireCustomer,
  asyncHandler(async (req, res) => {
    await new Promise<void>((resolve, reject) => {
      req.session.destroy((error) => (error ? reject(error) : resolve()));
    });
    res.clearCookie("nebula.sid");
    res.status(204).send();
  })
);
