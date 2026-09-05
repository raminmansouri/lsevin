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

// `next build` prerenders every static / ISR page up front — hundreds of
// renders, each firing a dozen distinct catalogue queries. Through
// transaction-pooled PgBouncer that easily exceeds `max_prepared_statements`
// and the connection can't reuse a prepared name across backends. The simple
// query protocol has neither problem, and build-time query latency is
// irrelevant, so force `prepare: false` for the build phase (unless already
// opted out). Runtime keeps prepared statements.
const isNextBuildPhase = process.env.NEXT_PHASE === "phase-production-build";
const usePreparedStatements =
  process.env.POSTGRES_PREPARE === "false" ? false : !isNextBuildPhase;

// The CI image build has no route to the database host, so every static / ISR
// page falls back to its own `.catch` empty state — but only if the query
// *fails fast*. postgres.js otherwise escalates a process-wide reconnect
// backoff toward ~20s and holds a long connect timeout, so after the first
// pages a single render waits past Next's 60s per-page export budget and the
// whole build aborts. Clamp the reconnect/connect timings for the build phase
// only; runtime keeps the resilient defaults. (When the DB *is* reachable at
// build time these values are harmless — connections succeed immediately.)
const connectTimeoutSeconds = isNextBuildPhase
  ? Number(process.env.POSTGRES_CONNECT_TIMEOUT ?? 5)
  : Number(process.env.POSTGRES_CONNECT_TIMEOUT ?? 10);

const createSqlClient = () =>
  postgres(connectionString, {
    // Keep this low in Next.js, especially in dev/serverless.
    max: Number(process.env.POSTGRES_POOL_MAX ?? 5),

    // Close idle connections automatically. Short during the build so a pool of
    // connections stuck retrying an unreachable host is torn down quickly.
    idle_timeout: isNextBuildPhase
      ? 5
      : Number(process.env.POSTGRES_IDLE_TIMEOUT ?? 20),

    // Rotate long-lived connections.
    max_lifetime: isNextBuildPhase
      ? 30
      : Number(process.env.POSTGRES_MAX_LIFETIME ?? 60 * 30),

    // Fail faster if DB is unreachable.
    connect_timeout: connectTimeoutSeconds,

    // Flat 1s reconnect delay during the build instead of the escalating
    // default, so a page that can't reach the DB exhausts its queries in
    // seconds rather than minutes. Untouched at runtime.
    ...(isNextBuildPhase ? { backoff: 1 } : {}),

    // Off behind PgBouncer transaction pooling and during `next build` (see above).
    prepare: usePreparedStatements,

    // Deliberately NOT setting `connection: { options: "-c ..." }` here. It is
    // the obvious place to force `jit=off`, and it would break the moment the
    // app is pointed at PgBouncer: an `options` startup packet is rejected
    // unless PgBouncer is explicitly told to track it, and in transaction
    // pooling mode the setting would leak between clients sharing a backend.
    // JIT is turned off on the database instead — see the production
    // postgresql.conf template and db/migrations/0024_query_planner_hygiene.sql.

    // Printing every statement and its parameters is expensive (the catalogue
    // pages issue a dozen multi-kilobyte queries per render) and puts customer
    // data in stdout, so it is opt-in rather than "on in development". Set
    // POSTGRES_DEBUG=true for a session when you actually want the firehose.
    debug:
      process.env.POSTGRES_DEBUG === "true"
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