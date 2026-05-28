import "server-only";


import postgres from 'postgres'




declare global {
  // eslint-disable-next-line no-var
  var __lsevin_sql: ReturnType<typeof postgres> | undefined;
}

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set.");
}

const createSqlClient = () =>
  postgres(connectionString, {
    // Keep this low in Next.js, especially in dev/serverless.
    max: Number(process.env.POSTGRES_POOL_MAX ?? 5),

    // Close idle connections automatically.
    idle_timeout: Number(process.env.POSTGRES_IDLE_TIMEOUT ?? 20),

    // Rotate long-lived connections.
    max_lifetime: Number(process.env.POSTGRES_MAX_LIFETIME ?? 60 * 30),

    // Fail faster if DB is unreachable.
    connect_timeout: Number(process.env.POSTGRES_CONNECT_TIMEOUT ?? 10),

    // Use this if you are behind PgBouncer transaction pooling.
    prepare: process.env.POSTGRES_PREPARE === "false" ? false : true,

    debug:
      process.env.NODE_ENV === "development"
        ? (connection, query, params) => {
            console.log("SQL:", query);
            console.log("Params:", params);
          }
        : false,
  });

const sql =
  process.env.NODE_ENV === "production"
    ? createSqlClient()
    : globalThis.__lsevin_sql ?? createSqlClient();

if (process.env.NODE_ENV !== "production") {
  globalThis.__lsevin_sql = sql;
}

export default sql;