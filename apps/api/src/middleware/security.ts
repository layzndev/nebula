import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import session from "express-session";
import { env } from "../config/env.js";
import { PrismaCustomerSessionStore } from "../modules/auth/auth-session.store.js";

export const corsMiddleware = cors({
  origin(origin, callback) {
    if (!origin || env.corsOrigins.includes(origin)) {
      callback(null, true);
      return;
    }
    callback(new Error("CORS origin is not allowed."));
  },
  credentials: true
});

export const helmetMiddleware = helmet({
  contentSecurityPolicy: env.isProduction
    ? {
        useDefaults: true,
        directives: {
          "default-src": ["'self'"],
          "script-src": ["'self'"],
          "style-src": ["'self'", "'unsafe-inline'"],
          "img-src": ["'self'", "data:"],
          "connect-src": ["'self'", ...env.corsOrigins],
          "object-src": ["'none'"],
          "frame-ancestors": ["'none'"],
          "base-uri": ["'self'"],
          "form-action": ["'self'"]
        }
      }
    : false,
  crossOriginResourcePolicy: { policy: "same-site" },
  crossOriginOpenerPolicy: { policy: "same-origin" },
  referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  frameguard: { action: "deny" },
  noSniff: true,
  hidePoweredBy: true
});

export const authRateLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  // 10 attempts per IP per 10 min on /auth/login + /auth/register.
  limit: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false
});

export const customerSession = session({
  name: "nebula.sid",
  store: new PrismaCustomerSessionStore(),
  secret: env.sessionSecret,
  resave: false,
  saveUninitialized: false,
  rolling: true,
  cookie: {
    httpOnly: true,
    secure: env.isProduction,
    sameSite: env.cookieSameSite,
    maxAge: 1000 * 60 * 60 * 24 * 7
  }
});
