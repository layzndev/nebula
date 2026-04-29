export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4300";

async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    cache: "no-store",
    credentials: "include",
    headers: {
      "content-type": "application/json",
      ...init?.headers
    }
  });

  if (!response.ok) {
    const payload = await response
      .json()
      .catch(() => ({ error: "Request failed." }));
    throw new Error(payload.error ?? "Request failed.");
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

export interface NebulaCustomer {
  id: string;
  email: string;
  displayName: string | null;
  phantomTenantId: string | null;
  createdAt: string;
}

export interface PhantomPing {
  ok: true;
  tenantCount: number;
  checkedAt: string;
}

export const customerApi = {
  register: (email: string, password: string, displayName?: string) =>
    apiRequest<{ customer: NebulaCustomer }>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password, displayName })
    }),
  login: (email: string, password: string) =>
    apiRequest<{ customer: NebulaCustomer }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password })
    }),
  logout: () => apiRequest<void>("/auth/logout", { method: "POST" }),
  me: () => apiRequest<{ customer: NebulaCustomer }>("/me"),
  phantomPing: () => apiRequest<PhantomPing>("/me/phantom-ping")
};
