# Nebula — Architecture

## Trust boundaries

```
  Customer (browser)
        │   HTTPS  +  nebula.sid cookie  ( SameSite, HttpOnly, Secure )
        ▼
  apps/web (Next 15)  ──fetch credentials:include──▶  apps/api (Express)
                                                         │
                                                         │  Authorization: Bearer phs_live_…
                                                         ▼
                                                  Phantom /platform/*
                                                         │
                                                         ▼
                                                Phantom Postgres + nodes
```

Two distinct planes, never mixed:

- **Customer plane** — `apps/web` and `apps/api`. Customers authenticate
  with email + password. Sessions live in Nebula's own Postgres
  (`customer_sessions`).
- **Phantom plane** — `apps/api` ⇄ Phantom. Nebula holds **one** bearer
  token in `PHANTOM_PLATFORM_TOKEN`. Customers never see it. Per-tenant
  scoping happens server-side: every Phantom call goes through
  `apps/api/src/modules/phantom/phantom.client.ts`.

## Folder map

```
nebula/
├── apps/
│   ├── api/
│   │   ├── prisma/schema.prisma            # Customer + CustomerSession
│   │   └── src/
│   │       ├── server.ts                   # boot
│   │       ├── app.ts                      # express + middleware wiring
│   │       ├── config/env.ts
│   │       ├── db/client.ts                # prisma singleton
│   │       ├── lib/                        # appError, asyncHandler, validate
│   │       ├── middleware/
│   │       │   ├── security.ts             # helmet, cors, session, rate limit
│   │       │   ├── customerAuth.ts         # requireCustomer
│   │       │   └── errorHandler.ts
│   │       └── modules/
│   │           ├── auth/                   # /auth/register, /login, /logout
│   │           ├── customers/              # Customer model + GET /me
│   │           └── phantom/                # PhantomClient + GET /me/phantom-ping
│   └── web/
│       └── src/
│           ├── app/
│           │   ├── page.tsx                # landing
│           │   ├── login/page.tsx
│           │   ├── register/page.tsx
│           │   └── dashboard/page.tsx      # me + Phantom ping smoke test
│           ├── components/AuthShell.tsx
│           └── lib/api/customer-api.ts     # fetch wrapper
├── docker-compose.yml                       # Postgres on :5433
├── .env.example
└── README.md
```

## Auth model

- **Email + password** (bcrypt cost 12). 5 failed logins → 15 min account
  lock (`customers.lockedUntil`), same shape as Phantom admin.
- **Sessions**: `express-session` + Postgres-backed store. Rolling, 7-day
  TTL, HttpOnly + Secure (in prod), SameSite configurable.
- **Per-IP rate limit**: 10 attempts per 10 min on `/auth/*` (Phantom uses
  the same numbers).
- 2FA, magic link, and password reset are deferred to PR 2+.

## Phantom client (`phantom.client.ts`)

- `Authorization: Bearer ${PHANTOM_PLATFORM_TOKEN}` injected on every call.
- 10 s default timeout (`AbortController`).
- Errors normalize to `AppError` so the rest of the API can rethrow them
  unchanged. A 4xx from Phantom propagates as the same status to the
  Nebula caller (so `409 QUOTA_EXCEEDED` hits the customer as a 409 too).

The `/me/phantom-ping` route exists purely as a smoke test — it calls
`GET /platform/tenants` on Phantom and reports the tenant count back to
the dashboard. If this works, the M2M handshake is wired correctly.

## What's NOT in this PR

- No tenant materialization on signup (we don't call Phantom
  `POST /platform/tenants` yet — that lands with provisioning in PR 1).
- No Stripe / billing.
- No "My servers" page beyond the placeholder.
- No public signup flow (closed beta — manual customer creation via the
  registration form is fine for dev, gated UX in PR 4).
- No outbound webhooks from Phantom (Phantom would need to expose them
  first).

## Running locally

See [`README.md`](../README.md). TL;DR:

1. `npm install`
2. `npm run db:up` — Postgres on `localhost:5433`
3. `cp .env.example .env`, set `SESSION_SECRET` and `PHANTOM_PLATFORM_TOKEN`
4. `npm run db:migrate`
5. `npm run dev:api` and `npm run dev:web` in two terminals
