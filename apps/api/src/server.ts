import { createServer } from "node:http";
import { assertRuntimeConfig, env } from "./config/env.js";
import { createApp } from "./app.js";
import { disconnectDb } from "./db/client.js";

assertRuntimeConfig();

const app = createApp();
const server = createServer(app);

server.listen(env.port, env.host, () => {
  console.log(`Nebula API listening on http://${env.host}:${env.port}`);
  if (!env.phantomPlatformToken) {
    console.warn(
      "[startup] PHANTOM_PLATFORM_TOKEN is not set — /me/phantom-ping will fail until you mint one in the Phantom panel."
    );
  }
});

let shuttingDown = false;
async function shutdown(signal: string, exitCode = 0) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`[server] ${signal} received, draining`);
  server.close((err) => {
    if (err) console.error("[server] error closing http server", err);
  });
  try {
    await disconnectDb();
  } catch (err) {
    console.error("[server] error disconnecting db", err);
  }
  process.exit(exitCode);
}

process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("unhandledRejection", (reason) => {
  console.error("[server] unhandled rejection", reason);
});
process.on("uncaughtException", (err) => {
  console.error("[server] uncaught exception", err);
  void shutdown("uncaughtException", 1);
});
