import cookieParser from "cookie-parser";
import express from "express";
import morgan from "morgan";
import { env } from "./config/env.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import {
  corsMiddleware,
  customerSession,
  helmetMiddleware
} from "./middleware/security.js";
import { authController } from "./modules/auth/auth.controller.js";
import { meController } from "./modules/customers/customers.controller.js";
import { phantomController } from "./modules/phantom/phantom.controller.js";
import { serversController } from "./modules/servers/servers.controller.js";

export function createApp() {
  const app = express();

  app.set("trust proxy", env.trustProxy);
  app.use(helmetMiddleware);
  app.use(corsMiddleware);
  app.options("*", corsMiddleware);
  app.use(express.json({ limit: "1mb" }));
  app.use(cookieParser());
  app.use(customerSession);
  app.use(morgan(":method :url :status :response-time ms"));

  app.get("/health", (_req, res) => {
    res.json({ ok: true, service: "nebula-api" });
  });

  app.use("/auth", authController);
  app.use("/me", meController);
  app.use("/me", phantomController);
  app.use("/servers", serversController);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
