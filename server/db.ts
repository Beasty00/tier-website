import { PrismaClient } from "@prisma/client";

const hasDatabaseUrl = Boolean(process.env.DATABASE_URL);
const databaseDisabled = process.env.DISABLE_DATABASE === "true";

export const prisma = hasDatabaseUrl && !databaseDisabled ? new PrismaClient() : null;

export async function databaseStatus() {
  if (databaseDisabled) {
    return { enabled: false, connected: false, reason: "DISABLE_DATABASE=true" };
  }

  if (!prisma) {
    return { enabled: false, connected: false, reason: "DATABASE_URL is not configured" };
  }

  try {
    await prisma.$queryRaw`SELECT 1`;
    return { enabled: true, connected: true };
  } catch (error) {
    return {
      enabled: true,
      connected: false,
      reason: error instanceof Error ? error.message : "Unknown database error"
    };
  }
}
