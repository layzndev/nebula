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

  // ----- Servers (scoped per tenant) -----

  listTenantServers(tenantId: string) {
    return this.request<{ servers: PhantomServerSummary[] }>(
      `/platform/tenants/${encodeURIComponent(tenantId)}/servers`
    );
  }

  getTenantServer(tenantId: string, serverId: string) {
    return this.request<{ server: PhantomServerDetail }>(
      `/platform/tenants/${encodeURIComponent(tenantId)}/servers/${encodeURIComponent(serverId)}`
    );
  }

  provisionTenantServer(
    tenantId: string,
    input: {
      name: string;
      templateId?: string;
      version?: string;
      motd?: string;
      difficulty?: "peaceful" | "easy" | "normal" | "hard";
      gameMode?: "survival" | "creative" | "adventure" | "spectator";
      maxPlayers?: number;
      hostnameSlug?: string;
      cpu?: number;
      ramMb?: number;
      diskGb?: number;
    }
  ) {
    return this.request<{ server: PhantomServerDetail }>(
      `/platform/tenants/${encodeURIComponent(tenantId)}/servers`,
      { method: "POST", body: input }
    );
  }

  startTenantServer(tenantId: string, serverId: string) {
    return this.request<unknown>(
      `/platform/tenants/${encodeURIComponent(tenantId)}/servers/${encodeURIComponent(serverId)}/start`,
      { method: "POST" }
    );
  }

  stopTenantServer(tenantId: string, serverId: string) {
    return this.request<unknown>(
      `/platform/tenants/${encodeURIComponent(tenantId)}/servers/${encodeURIComponent(serverId)}/stop`,
      { method: "POST" }
    );
  }

  restartTenantServer(tenantId: string, serverId: string) {
    return this.request<unknown>(
      `/platform/tenants/${encodeURIComponent(tenantId)}/servers/${encodeURIComponent(serverId)}/restart`,
      { method: "POST" }
    );
  }

  deleteTenantServer(tenantId: string, serverId: string, hardDeleteData = false) {
    return this.request<{ finalized: boolean }>(
      `/platform/tenants/${encodeURIComponent(tenantId)}/servers/${encodeURIComponent(
        serverId
      )}?hardDeleteData=${hardDeleteData}`,
      { method: "DELETE" }
    );
  }

  updateTenantServerSettings(
    tenantId: string,
    serverId: string,
    input: {
      motd?: string;
      difficulty?: "peaceful" | "easy" | "normal" | "hard";
      gameMode?: "survival" | "creative" | "adventure" | "spectator";
      maxPlayers?: number;
      whitelistEnabled?: boolean;
    }
  ) {
    return this.request<{ server: PhantomServerDetail }>(
      `/platform/tenants/${encodeURIComponent(tenantId)}/servers/${encodeURIComponent(
        serverId
      )}/settings`,
      { method: "PATCH", body: input }
    );
  }

  issueServerConsoleUrl(tenantId: string, serverId: string) {
    return this.request<{
      ticket: string;
      url: string;
      expiresAt: string;
      ttlSeconds: number;
    }>(
      `/platform/tenants/${encodeURIComponent(tenantId)}/servers/${encodeURIComponent(
        serverId
      )}/console-url`,
      { method: "POST" }
    );
  }
}

export interface PhantomServerSummary {
  id: string;
  name: string;
  slug: string;
  hostname: string | null;
  planTier: string;
  runtimeState: string;
  currentPlayerCount: number;
  createdAt: string;
}

export interface PhantomServerDetail {
  server: {
    id: string;
    name: string;
    slug: string;
    hostname: string;
    hostnameSlug: string;
    templateId: string;
    minecraftVersion: string;
    motd: string | null;
    difficulty: string;
    gameMode: string;
    maxPlayers: number;
    onlineMode: boolean;
    whitelistEnabled: boolean;
    runtimeState: string;
    currentPlayerCount: number;
    readyAt: string | null;
    sleepingAt: string | null;
    autoSleepEnabled: boolean;
    autoSleepIdleMinutes: number;
    createdAt: string;
  };
  workload: {
    id: string;
    status: string;
    requestedCpu: number;
    requestedRamMb: number;
    requestedDiskGb: number;
    runtimeStartedAt: string | null;
    runtimeFinishedAt: string | null;
    ports: Array<{ internalPort: number; externalPort: number; protocol: string }>;
  };
  node?: { id: string; name: string; publicHost: string } | null;
  hostname?: string | null;
  connectAddress: string | null;
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
