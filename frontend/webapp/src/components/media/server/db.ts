import postgres from "postgres";

declare global {
  // eslint-disable-next-line no-var
  var __mediaManagerSql: ReturnType<typeof postgres> | undefined;
}

const connectionString =
  process.env.POSTGRES_URL ||
  process.env.DATABASE_URL ||
  process.env.POSTGRES_CONNECTION_STRING;

if (!connectionString) {
  throw new Error(
    "Media manager database connection is not configured. Set POSTGRES_URL or DATABASE_URL."
  );
}

export const mediaSql =
  global.__mediaManagerSql ??
  postgres(connectionString, {
    max: 10,
    idle_timeout: 20,
    connect_timeout: 15,
    prepare: false,
  });

if (process.env.NODE_ENV !== "production") {
  global.__mediaManagerSql = mediaSql;
}

export type MediaSqlClient = typeof mediaSql;
