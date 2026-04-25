import { Sql } from "postgres";

type QuickSearchRow = {
  term: string;
};

type MobileSearchEntryProps = {
  limit?: number;
  basePath?: string;
  placeholder?: string;
  className?: string;
};


export async function getQuickSearches(
  db: Sql,
  limit = 8
): Promise<string[]> {
  const rows = await db<QuickSearchRow[]>`
    WITH raw_candidates AS (
      SELECT
        btrim(term) AS term,
        0 AS source_rank,
        0::bigint AS usage_count,
        COALESCE(calculated_at, TIMESTAMP '1970-01-01') AS last_seen
      FROM search.trending_searches
      WHERE NULLIF(btrim(term), '') IS NOT NULL

      UNION ALL

      SELECT
        (array_agg(btrim(term) ORDER BY created_at DESC))[1] AS term,
        1 AS source_rank,
        COUNT(*)::bigint AS usage_count,
        MAX(created_at) AS last_seen
      FROM search.user_search_history
      WHERE NULLIF(btrim(term), '') IS NOT NULL
        AND created_at >= now() - INTERVAL '120 days'
      GROUP BY lower(btrim(COALESCE(NULLIF(normalized_term, ''), term)))
    ),

    deduped AS (
      SELECT DISTINCT ON (lower(term))
        term,
        source_rank,
        usage_count,
        last_seen
      FROM raw_candidates
      WHERE NULLIF(btrim(term), '') IS NOT NULL
      ORDER BY
        lower(term),
        source_rank ASC,
        usage_count DESC,
        last_seen DESC
    )

    SELECT term
    FROM deduped
    ORDER BY
      source_rank ASC,
      usage_count DESC,
      last_seen DESC,
      term ASC
    LIMIT ${limit};
  `;

  return rows.map((row) => row.term).filter(Boolean);
}