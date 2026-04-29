import { Router } from "express";
import { AppError } from "../../lib/appError.js";
import { asyncHandler } from "../../lib/asyncHandler.js";
import { requireCustomer } from "../../middleware/customerAuth.js";
import { getSafeCustomerById } from "../auth/auth.service.js";

export const meController = Router();

meController.get(
  "/",
  requireCustomer,
  asyncHandler(async (req, res) => {
    const customer = await getSafeCustomerById(req.session.customer!.id);
    if (!customer) {
      throw new AppError(401, "Session is no longer valid.", "INVALID_SESSION");
    }
    res.json({ customer });
  })
);
