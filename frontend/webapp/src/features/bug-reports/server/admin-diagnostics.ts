import "server-only";

import sql from "@/config/database/db";

type DatabaseSnapshotRow = {
  database_name: string;
  active_connections: number;
  waiting_connections: number;
  transaction_age_seconds: number | null;
  database_size_bytes: number;
};

export async function collectAdminDatabaseDiagnostics() {
  const startedAt = Date.now();
  try {
    const rows = await sql<DatabaseSnapshotRow[]>`
      select
        current_database() as database_name,
        count(*) filter (where state = 'active')::int as active_connections,
        count(*) filter (where wait_event is not null)::int as waiting_connections,
        max(extract(epoch from (clock_timestamp() - xact_start)))
          filter (where xact_start is not null)::float as transaction_age_seconds,
        pg_database_size(current_database())::bigint as database_size_bytes
      from pg_stat_activity
      where datname = current_database()
      group by current_database()
    `;
    const row = rows[0];
    return {
      application: {
        nodeEnvironment: process.env.NODE_ENV,
        release:
          process.env.NEXT_PUBLIC_APP_VERSION ??
          process.env.VERCEL_GIT_COMMIT_SHA ??
          null,
        uptimeSeconds: Math.round(process.uptime()),
        memoryRssBytes: process.memoryUsage().rss,
      },
      database: {
        capturedAt: new Date().toISOString(),
        reachable: true,
        latencyMs: Date.now() - startedAt,
        databaseName: row?.database_name ?? null,
        activeConnections: Number(row?.active_connections ?? 0),
        waitingConnections: Number(row?.waiting_connections ?? 0),
        longestTransactionSeconds:
          row?.transaction_age_seconds == null
            ? null
            : Math.round(Number(row.transaction_age_seconds)),
        databaseSizeBytes: Number(row?.database_size_bytes ?? 0),
      },
    };
  } catch (error) {
    console.error("collectAdminDatabaseDiagnostics failed", error);
    return {
      application: {
        nodeEnvironment: process.env.NODE_ENV,
        release:
          process.env.NEXT_PUBLIC_APP_VERSION ??
          process.env.VERCEL_GIT_COMMIT_SHA ??
          null,
        uptimeSeconds: Math.round(process.uptime()),
        memoryRssBytes: process.memoryUsage().rss,
      },
      database: {
        capturedAt: new Date().toISOString(),
        reachable: false,
        latencyMs: Date.now() - startedAt,
        errorCategory: "database_diagnostics_unavailable",
      },
    };
  }
}
