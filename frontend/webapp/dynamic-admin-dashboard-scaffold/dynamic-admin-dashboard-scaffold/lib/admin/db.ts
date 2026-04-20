import postgres from "postgres";

declare global {
  var __adminSql: ReturnType<typeof postgres> | undefined;
}

export function getAdminSql() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required.");
  }

  if (!global.__adminSql) {
    global.__adminSql = postgres(process.env.DATABASE_URL, {
      max: 10,
      prepare: true,
      idle_timeout: 20,
      connect_timeout: 10,
      transform: {
        undefined: null,
      },
    });
  }

  return global.__adminSql;
}
