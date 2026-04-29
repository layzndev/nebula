import bcrypt from "bcryptjs";
import { AppError } from "../../lib/appError.js";
import {
  createCustomerRecord,
  findCustomerByEmail,
  findCustomerById,
  markCustomerLogin,
  recordFailedCustomerLogin
} from "../customers/customers.repository.js";
import { toSafeCustomer, type SafeCustomer } from "../customers/customers.service.js";
import type { LoginInput, RegisterInput } from "./auth.schema.js";

const BCRYPT_COST = 12;

export async function registerCustomer(input: RegisterInput): Promise<SafeCustomer> {
  const existing = await findCustomerByEmail(input.email);
  if (existing) {
    throw new AppError(409, "An account already exists for this email.", "EMAIL_TAKEN");
  }
  const passwordHash = await bcrypt.hash(input.password, BCRYPT_COST);
  const created = await createCustomerRecord({
    email: input.email,
    passwordHash,
    displayName: input.displayName
  });
  return toSafeCustomer(created);
}

export async function authenticateCustomer(input: LoginInput): Promise<SafeCustomer | null> {
  const customer = await findCustomerByEmail(input.email);
  if (!customer) return null;
  if (customer.status !== "active") return null;
  if (customer.lockedUntil && customer.lockedUntil > new Date()) return null;

  const valid = await bcrypt.compare(input.password, customer.passwordHash);
  if (!valid) {
    await recordFailedCustomerLogin(customer.id);
    return null;
  }
  await markCustomerLogin(customer.id);
  return toSafeCustomer(customer);
}

export async function getSafeCustomerById(id: string): Promise<SafeCustomer | null> {
  const customer = await findCustomerById(id);
  return customer ? toSafeCustomer(customer) : null;
}
