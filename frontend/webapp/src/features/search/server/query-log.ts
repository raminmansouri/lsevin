import "server-only";

import sql from "@/config/database/db";

export type QueryLogEntry = {
  query: string;
  normalized: string;
  locale: string;
  results: number;
  tookMs: number;
  usedVector: boolean;
  sessionHash: string | null;
};

/**
 * Records what visitors look for (and what finds nothing). Never throws and is not awaited
 * by callers: a logging failure must not fail a search. No user id is stored.
 */
export async function logQuery(entry: QueryLogEntry): Promise<void> {
  if (!entry.normalized) return;
  try {
    await sql`
      insert into unified_search.query_log (query, normalized, locale, results, took_ms, used_vector, session_hash)
      values (${entry.query.slice(0, 160)}, ${entry.normalized.slice(0, 160)}, ${entry.locale}, ${entry.results},
              ${entry.tookMs}, ${entry.usedVector}, ${entry.sessionHash})`;
  } catch (error) {
    console.warn(`[search] query log failed: ${(error as Error).message}`);
  }
}
