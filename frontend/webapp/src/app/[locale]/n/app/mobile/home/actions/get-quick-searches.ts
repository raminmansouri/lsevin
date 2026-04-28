import 'server-only';

import type { Sql } from 'postgres';

type QuickSearchRow = {
  term: string;
};

export async function getQuickSearches(db: Sql, limit = 8): Promise<string[]> {
  const rows = await db<QuickSearchRow[]>`
    with raw_candidates as (
      select
        btrim(term) as term,
        0 as source_rank,
        0::bigint as usage_count,
        coalesce(calculated_at, timestamp '1970-01-01') as last_seen
      from search.trending_searches
      where nullif(btrim(term), '') is not null

      union all

      select
        (array_agg(btrim(term) order by created_at desc))[1] as term,
        1 as source_rank,
        count(*)::bigint as usage_count,
        max(created_at) as last_seen
      from search.user_search_history
      where nullif(btrim(term), '') is not null
        and created_at >= now() - interval '120 days'
      group by lower(btrim(coalesce(nullif(normalized_term, ''), term)))
    ),
    deduped as (
      select distinct on (lower(term))
        term,
        source_rank,
        usage_count,
        last_seen
      from raw_candidates
      where nullif(btrim(term), '') is not null
      order by
        lower(term),
        source_rank asc,
        usage_count desc,
        last_seen desc
    )
    select term
    from deduped
    order by
      source_rank asc,
      usage_count desc,
      last_seen desc,
      term asc
    limit ${limit}
  `;

  return rows.map((row) => row.term).filter(Boolean);
}
