import type { Customer } from "@prisma/client";

export interface SafeCustomer {
  id: string;
  email: string;
  displayName: string | null;
  phantomTenantId: string | null;
  createdAt: string;
}

export function toSafeCustomer(customer: Customer): SafeCustomer {
  return {
    id: customer.id,
    email: customer.email,
    displayName: customer.displayName,
    phantomTenantId: customer.phantomTenantId,
    createdAt: customer.createdAt.toISOString()
  };
}
