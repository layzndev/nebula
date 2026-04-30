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

export interface ServerSummary {
  id: string;
  name: string;
  slug: string;
  hostname: string | null;
  planTier: string;
  runtimeState: string;
  currentPlayerCount: number;
  createdAt: string;
}

export interface ServerDetail {
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

export interface CreateServerInput {
  name: string;
  templateId?: string;
  version?: string;
  motd?: string;
  difficulty?: "peaceful" | "easy" | "normal" | "hard";
  gameMode?: "survival" | "creative" | "adventure" | "spectator";
  maxPlayers?: number;
  hostnameSlug?: string;
}

export interface UpdateServerSettingsInput {
  motd?: string;
  difficulty?: "peaceful" | "easy" | "normal" | "hard";
  gameMode?: "survival" | "creative" | "adventure" | "spectator";
  maxPlayers?: number;
  whitelistEnabled?: boolean;
}

export interface ConsoleTicket {
  ticket: string;
  url: string;
  expiresAt: string;
  ttlSeconds: number;
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
  phantomPing: () => apiRequest<PhantomPing>("/me/phantom-ping"),

  listServers: () => apiRequest<{ servers: ServerSummary[] }>("/servers"),
  getServer: (id: string) =>
    apiRequest<{ server: ServerDetail }>(`/servers/${encodeURIComponent(id)}`),
  createServer: (input: CreateServerInput) =>
    apiRequest<{ server: ServerDetail }>("/servers", {
      method: "POST",
      body: JSON.stringify(input)
    }),
  startServer: (id: string) =>
    apiRequest<unknown>(`/servers/${encodeURIComponent(id)}/start`, { method: "POST" }),
  stopServer: (id: string) =>
    apiRequest<unknown>(`/servers/${encodeURIComponent(id)}/stop`, { method: "POST" }),
  restartServer: (id: string) =>
    apiRequest<unknown>(`/servers/${encodeURIComponent(id)}/restart`, { method: "POST" }),
  deleteServer: (id: string, hardDeleteData = false) =>
    apiRequest<{ finalized: boolean }>(
      `/servers/${encodeURIComponent(id)}?hardDeleteData=${hardDeleteData}`,
      { method: "DELETE" }
    ),
  updateServerSettings: (id: string, input: UpdateServerSettingsInput) =>
    apiRequest<{ server: ServerDetail }>(`/servers/${encodeURIComponent(id)}/settings`, {
      method: "PATCH",
      body: JSON.stringify(input)
    }),
  issueConsoleTicket: (id: string) =>
    apiRequest<ConsoleTicket>(`/servers/${encodeURIComponent(id)}/console-url`, {
      method: "POST"
    })
};
