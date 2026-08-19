import "server-only";
import postgres from "postgres";

declare global {
  // eslint-disable-next-line no-var
  var __lsevin_provider_portal_sql: ReturnType<typeof postgres> | undefined;
}

type DatabaseConnectionMode = "auto" | "split" | "url";

function databaseConnectionMode(): DatabaseConnectionMode {
  const value = process.env.PROVIDER_PORTAL_DB_MODE?.trim().toLowerCase();
  if (value === "split" || value === "url") return value;
  return "auto";
}

function splitDatabaseOptions() {
  const host = process.env.PGHOST?.trim();
  const database = process.env.PGDATABASE?.trim();
  const username = process.env.PGUSER?.trim();
  const password = process.env.PGPASSWORD;
  const port = Number(process.env.PGPORT || 5432);
  if (!host || !database || !username || !password || !Number.isFinite(port) || port <= 0) return null;
  return { host, port, database, username, password } as const;
}

function databaseOptions() {
  const mode = databaseConnectionMode();
  const connectionString = process.env.DATABASE_URL?.trim();
  const splitOptions = splitDatabaseOptions();

  // Local Docker explicitly uses split mode. This is intentionally stronger
  // than Next.js dotenv precedence: a stale host .env/.env.local DATABASE_URL
  // (for example one pointing at a removed pgbouncer service) cannot override
  // the container's PGHOST=postgres runtime contract.
  if (mode === "split") {
    if (!splitOptions) {
      throw new Error("Database configuration is missing for PROVIDER_PORTAL_DB_MODE=split. Set PGHOST/PGPORT/PGDATABASE/PGUSER/PGPASSWORD.");
    }
    return { connectionString: undefined, options: splitOptions } as const;
  }

  if (mode === "url") {
    if (!connectionString) {
      throw new Error("Database configuration is missing for PROVIDER_PORTAL_DB_MODE=url. Set DATABASE_URL.");
    }
    return { connectionString, options: {} } as const;
  }

  if (connectionString) return { connectionString, options: {} } as const;
  if (splitOptions) return { connectionString: undefined, options: splitOptions } as const;

  throw new Error("Database configuration is missing. Set DATABASE_URL or PGHOST/PGPORT/PGDATABASE/PGUSER/PGPASSWORD.");
}

function createClient() {
  const config = databaseOptions();
  const debug: false | ((connection: unknown, query: string, params: unknown[]) => void) =
    process.env.NODE_ENV === "development" && process.env.SQL_DEBUG === "true"
      ? (_connection: unknown, query: string, params: unknown[]) => {
          console.log("SQL", query, params);
        }
      : false;
  const sharedOptions = {
    max: Number(process.env.POSTGRES_POOL_MAX ?? 5),
    idle_timeout: Number(process.env.POSTGRES_IDLE_TIMEOUT ?? 20),
    max_lifetime: Number(process.env.POSTGRES_MAX_LIFETIME ?? 60 * 30),
    connect_timeout: Number(process.env.POSTGRES_CONNECT_TIMEOUT ?? 10),
    prepare: process.env.POSTGRES_PREPARE === "false" ? false : true,
    debug,
  };

  return config.connectionString
    ? postgres(config.connectionString, sharedOptions)
    : postgres({ ...config.options, ...sharedOptions });
}

type RawSql = ReturnType<typeof createClient>;

function getRawSql(): RawSql {
  if (process.env.NODE_ENV === "production") {
    // Production server modules can be imported by `next build`. Create the
    // pool only when a query/helper is actually used so build workers never
    // need a live database and never remain open waiting on a pool timer.
    return globalThis.__lsevin_provider_portal_sql ??= createClient();
  }

  return globalThis.__lsevin_provider_portal_sql ??= createClient();
}

/**
 * postgres.js intentionally ships very strict interpolation types. The portal
 * stores many validated JSON payloads and uses query fragments across modular
 * repositories, so the default `Sql<{}>` declaration narrows object parameters
 * to `never` even though postgres.js serializes them correctly at runtime.
 *
 * Keep typed result rows for tagged queries while widening only interpolation
 * and helper inputs at this shared boundary. Runtime parameterization remains
 * fully handled by postgres.js; this does not concatenate SQL strings.
 */
type PortalSql = RawSql & {
  <T extends readonly (object | undefined)[] = postgres.Row[]>(
    template: TemplateStringsArray,
    ...parameters: readonly unknown[]
  ): postgres.PendingQuery<T>;
  (first: unknown, ...rest: readonly unknown[]): unknown;
  json(value: unknown): postgres.Parameter<unknown>;
};

const lazySqlTarget = function (...args: readonly unknown[]) {
  const client = getRawSql();
  return Reflect.apply(client as unknown as (...values: readonly unknown[]) => unknown, client, args);
};

/**
 * Lazily proxy the callable postgres.js client and its helpers (`begin`, `json`,
 * `unsafe`, and others). Importing a route during `next build` therefore does
 * not create a connection pool; the first real runtime query still fails fast
 * with an actionable database-configuration message when configuration is absent.
 */
export const sql = new Proxy(lazySqlTarget, {
  apply(_target, _thisArg, args) {
    const client = getRawSql();
    return Reflect.apply(client as unknown as (...values: readonly unknown[]) => unknown, client, args);
  },
  get(_target, property) {
    const client = getRawSql();
    const value = Reflect.get(client, property, client) as unknown;
    return typeof value === "function" ? value.bind(client) : value;
  },
}) as unknown as PortalSql;

export type Sql = typeof sql;
