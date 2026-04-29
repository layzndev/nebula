import { Store, type SessionData } from "express-session";
import { db } from "../../db/client.js";

const DEFAULT_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

/**
 * Postgres-backed session store using the Prisma `customer_sessions`
 * table. Mirrors Phantom's admin session store, scoped to customers.
 */
export class PrismaCustomerSessionStore extends Store {
  override get(sid: string, callback: (err: unknown, session?: SessionData | null) => void) {
    db.customerSession
      .findUnique({ where: { id: sid } })
      .then((row) => {
        if (!row || row.expiresAt < new Date()) {
          callback(null, null);
          return;
        }
        callback(null, row.data as unknown as SessionData);
      })
      .catch((error) => callback(error));
  }

  override set(sid: string, session: SessionData, callback?: (err?: unknown) => void) {
    const expiresAt =
      session.cookie?.expires instanceof Date
        ? session.cookie.expires
        : new Date(Date.now() + DEFAULT_TTL_MS);
    const customerId =
      (session as SessionData & { customer?: { id?: string } }).customer?.id ?? null;
    const security =
      (session as SessionData & { security?: { ipAddress?: string; userAgent?: string } })
        .security ?? null;

    db.customerSession
      .upsert({
        where: { id: sid },
        create: {
          id: sid,
          customerId,
          data: session as never,
          expiresAt,
          ipAddress: security?.ipAddress ?? null,
          userAgent: security?.userAgent ?? null
        },
        update: {
          customerId,
          data: session as never,
          expiresAt,
          ipAddress: security?.ipAddress ?? null,
          userAgent: security?.userAgent ?? null
        }
      })
      .then(() => callback?.())
      .catch((error) => callback?.(error));
  }

  override destroy(sid: string, callback?: (err?: unknown) => void) {
    db.customerSession
      .delete({ where: { id: sid } })
      .then(() => callback?.())
      .catch((error) => {
        // Already gone is fine.
        if ((error as { code?: string }).code === "P2025") {
          callback?.();
          return;
        }
        callback?.(error);
      });
  }

  override touch(sid: string, session: SessionData, callback?: () => void) {
    const expiresAt =
      session.cookie?.expires instanceof Date
        ? session.cookie.expires
        : new Date(Date.now() + DEFAULT_TTL_MS);
    db.customerSession
      .update({ where: { id: sid }, data: { expiresAt } })
      .then(() => callback?.())
      .catch(() => callback?.());
  }
}
