import { db } from "../../db/client.js";

export function findCustomerByEmail(email: string) {
  return db.customer.findUnique({ where: { email: email.toLowerCase() } });
}

export function findCustomerById(id: string) {
  return db.customer.findUnique({ where: { id } });
}

export function createCustomerRecord(input: {
  email: string;
  passwordHash: string;
  displayName?: string | null;
}) {
  return db.customer.create({
    data: {
      email: input.email.toLowerCase(),
      passwordHash: input.passwordHash,
      displayName: input.displayName ?? null
    }
  });
}

export function markCustomerLogin(id: string) {
  return db.customer.update({
    where: { id },
    data: { lastLoginAt: new Date(), failedLoginAttempts: 0, lockedUntil: null }
  });
}

export async function recordFailedCustomerLogin(id: string) {
  const customer = await db.customer.findUnique({
    where: { id },
    select: { failedLoginAttempts: true }
  });
  const failedLoginAttempts = (customer?.failedLoginAttempts ?? 0) + 1;
  const shouldLock = failedLoginAttempts >= 5;
  return db.customer.update({
    where: { id },
    data: {
      failedLoginAttempts,
      lockedUntil: shouldLock ? new Date(Date.now() + 15 * 60_000) : null
    }
  });
}

export function attachPhantomTenant(customerId: string, phantomTenantId: string) {
  return db.customer.update({
    where: { id: customerId },
    data: { phantomTenantId }
  });
}
