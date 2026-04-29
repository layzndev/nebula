import { env } from "../../config/env.js";
import { AppError } from "../../lib/appError.js";

interface PhantomRequestInit extends Omit<RequestInit, "body"> {
  body?: unknown;
}

/**
 * Thin fetch wrapper around the Phantom /platform/* surface. Injects the
 * bearer token, sets a timeout, and normalizes errors into AppError so
 * the rest of the API can treat them like any other failure.
 */
export class PhantomClient {
  constructor(
    private readonly baseUrl: string = env.phantomApiBaseUrl,
    private readonly token: string = env.phantomPlatformToken,
    private readonly timeoutMs: number = env.phantomTimeoutMs
  ) {}

  async request<T>(path: string, init: PhantomRequestInit = {}): Promise<T> {
    if (!this.token) {
      throw new AppError(
        500,
        "PHANTOM_PLATFORM_TOKEN is not configured.",
        "PHANTOM_TOKEN_MISSING"
      );
    }
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const response = await fetch(`${this.baseUrl}${path}`, {
        ...init,
        signal: controller.signal,
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${this.token}`,
          ...(init.headers as Record<string, string> | undefined)
        },
        body: init.body !== undefined ? JSON.stringify(init.body) : undefined
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as
          | { error?: string; code?: string; details?: unknown }
          | null;
        throw new AppError(
          response.status,
          payload?.error ?? `Phantom returned ${response.status}.`,
          payload?.code ?? "PHANTOM_REQUEST_FAILED",
          payload?.details
        );
      }
      if (response.status === 204) return undefined as T;
      return (await response.json()) as T;
    } catch (error) {
      if (error instanceof AppError) throw error;
      if ((error as { name?: string }).name === "AbortError") {
        throw new AppError(504, "Phantom request timed out.", "PHANTOM_TIMEOUT");
      }
      throw new AppError(
        502,
        error instanceof Error ? error.message : "Phantom request failed.",
        "PHANTOM_UNREACHABLE"
      );
    } finally {
      clearTimeout(timer);
    }
  }

  // ----- Tenants -----

  listTenants() {
    return this.request<{ tenants: PhantomTenant[] }>("/platform/tenants");
  }

  getTenant(id: string) {
    return this.request<{ tenant: PhantomTenant }>(`/platform/tenants/${encodeURIComponent(id)}`);
  }

  createTenant(input: { name: string; slug: string; planTier?: "free" | "premium" }) {
    return this.request<{ tenant: PhantomTenant }>("/platform/tenants", {
      method: "POST",
      body: input
    });
  }
}

export interface PhantomTenant {
  id: string;
  name: string;
  slug: string;
  planTier: string;
  suspended: boolean;
  quota: {
    maxServers: number;
    maxRamMb: number;
    maxCpu: number;
    maxDiskGb: number;
  };
  usage?: {
    workloadCount: number;
    ramMb: number;
    cpu: number;
    diskGb: number;
  };
  createdAt: string;
  updatedAt: string;
}

export const phantom = new PhantomClient();
