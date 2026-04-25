import sql from "@/config/database/db";
import postgres from "postgres";

declare global {
  var __adminSql: ReturnType<typeof postgres> | undefined;
}

export function getAdminSql() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required.");
  }

  if (!global.__adminSql) {
    global.__adminSql = sql;
  }

  return global.__adminSql;
}
