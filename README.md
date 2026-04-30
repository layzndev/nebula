# Nebula

Hosting product for the [Phantom](https://github.com/layzndev/phantom) control plane.

> **Phantom** = control plane (no end-user UI).
> **Nebula** = customer-facing product. Customers sign up here, choose a plan, and Nebula provisions Minecraft servers via Phantom's `/platform/*` API on their behalf.

## Architecture

```
Customer (browser) ──HTTPS──▶  apps/web  ──fetch──▶  apps/api  ──Bearer phs_live_…──▶  Phantom /platform/*
                                                       │
                                                       ▼
                                                 Postgres (nebula)
                                                 Stripe (later)
```

Two strict trust boundaries:

- **Customer plane** (`apps/web` + `apps/api`): customers authenticate with email + password, sessions are cookies stored in Postgres.
- **Phantom plane** (`apps/api` → Phantom): Nebula holds a single bearer `phs_live_…` token, calls `/platform/*` on behalf of its customers. Customers never see this token.

## Stack

- **apps/web** — Next.js 15 (App Router) + Tailwind + Lucide.
- **apps/api** — Express + Prisma + Postgres dedicated to Nebula.
- Sessions: cookie + Postgres-backed store (`express-session` + Prisma).
- Auth: email + password (bcrypt).
- Validation: zod.
- Billing: Stripe (later, scaffolded as env stubs).

## Getting started (local)

Prerequisites: Node 20+, Docker.

```bash
# 1. install
npm install

# 2. boot the dedicated Postgres
npm run db:up

# 3. configure env
cp .env.example .env
#    → set SESSION_SECRET to 32+ random bytes
#    → set PHANTOM_PLATFORM_TOKEN to a value minted in the Phantom panel
#       (Settings → Platform tokens, see Phantom docs/PLATFORM_API.md)

# 4. apply migrations + generate Prisma client
npm run db:migrate
npm run db:generate

# 5. run both apps in two terminals
npm run dev:api
npm run dev:web
```

API runs on `http://localhost:4300`, web on `http://localhost:3001`.

## Smoke test the Phantom handshake

Once registered + logged in:

```
GET  http://localhost:4300/me               # your customer profile
GET  http://localhost:4300/me/phantom-ping  # calls Phantom /platform/tenants
                                            # → { ok: true, tenantCount: N }
```

If the ping succeeds, the M2M handshake works end-to-end.

## Project layout

```
nebula/
├── apps/
│   ├── api/                    # Express + Prisma + Phantom client
│   │   ├── prisma/schema.prisma
│   │   └── src/
│   │       ├── server.ts
│   │       ├── modules/
│   │       │   ├── auth/       # register / login / logout / me
│   │       │   ├── customers/  # Customer model
│   │       │   └── phantom/    # client + /me/phantom-ping
│   │       └── middleware/
│   └── web/                    # Next 15 — landing, login, dashboard
├── docs/
│   └── ARCHITECTURE.md
├── docker-compose.yml          # Postgres on :5433
├── .env.example
└── package.json                # workspaces
```

## Roadmap

| PR | Scope |
| -- | --- |
| 0 | **Scaffold** — auth, Phantom ping |
| 1 | **Provisioning** — auto-create tenant on first call, `/servers` list, `/servers/new` form |
| 2 | **Lifecycle + settings** — Start/Stop/Restart/Delete, MOTD/difficulty/gameMode/maxPlayers/whitelist |
| 3 | **Console embed** — signed-URL ticket from Phantom, in-browser WebSocket console with command input |
| 4 | Stripe billing — plans, subscriptions, invoices |
| 5 | Outbound webhooks from Phantom (server.ready, server.crashed, tenant.over_quota) |
| 6 | Public signup (invite codes / waitlist + email verification) |
| 7 | Account management (password change, account delete cascade) |
