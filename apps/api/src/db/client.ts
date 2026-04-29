import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { db?: PrismaClient };

export const db: PrismaClient =
  globalForPrisma.db ??
  new PrismaClient({
    log: ["warn", "error"]
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.db = db;
}

export async function disconnectDb() {
  await db.$disconnect();
}
