import "dotenv/config";

const isProduction = process.env.NODE_ENV === "production";
const corsOrigins = (process.env.CORS_ORIGINS ?? process.env.WEB_ORIGIN ?? "http://localhost:3001")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const cookieSameSite = process.env.COOKIE_SAMESITE ?? (isProduction ? "none" : "lax");
if (!["lax", "strict", "none"].includes(cookieSameSite)) {
  throw new Error("COOKIE_SAMESITE must be one of: lax, strict, none.");
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  isProduction,
  host: process.env.HOST ?? "127.0.0.1",
  port: Number(process.env.PORT ?? 4300),
  webOrigin: process.env.WEB_ORIGIN ?? "http://localhost:3001",
  corsOrigins,
  trustProxy: process.env.TRUST_PROXY ?? (isProduction ? "loopback" : "1"),
  cookieSameSite: cookieSameSite as "lax" | "strict" | "none",
  databaseUrl: process.env.DATABASE_URL ?? "",
  sessionSecret:
    process.env.SESSION_SECRET ?? (isProduction ? "" : "dev-nebula-session-secret-change-me"),
  // Phantom platform API — Nebula talks to Phantom over /platform/* using a
  // single bearer token minted in the Phantom admin panel.
  phantomApiBaseUrl: process.env.PHANTOM_API_BASE_URL ?? "http://localhost:4200",
  phantomPlatformToken: process.env.PHANTOM_PLATFORM_TOKEN ?? "",
  phantomTimeoutMs: Number(process.env.PHANTOM_TIMEOUT_MS ?? 10_000)
};

export function assertRuntimeConfig() {
  if (!env.databaseUrl) {
    throw new Error("DATABASE_URL is required.");
  }
  if (env.isProduction && !env.sessionSecret) {
    throw new Error("SESSION_SECRET is required in production.");
  }
  if (env.isProduction && !env.phantomPlatformToken) {
    throw new Error("PHANTOM_PLATFORM_TOKEN is required in production.");
  }
  if (!Number.isFinite(env.port) || env.port <= 0) {
    throw new Error("PORT must be a positive integer.");
  }
}
