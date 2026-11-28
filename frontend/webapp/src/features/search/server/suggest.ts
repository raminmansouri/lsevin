import "server-only";

import sql from "@/config/database/db";

import { fold } from "../lib/fold";

export type Suggestion = { text: string; type: string };

const MAX_LENGTH = 60;

/**
 * Autocomplete: prefix matches first, then typo-tolerant trigram matches. Served from the
 * small search.suggestions table with no embedding call, so it answers in a few ms.
 */
export async function suggest(input: string, limit = 8): Promise<Suggestion[]> {
  const term = fold(input.slice(0, MAX_LENGTH));
  if (term.length < 2) return [];
  const escaped = term.replace(/[\\%_]/g, (c) => `\\${c}`);
  const rows = await sql<{ display: string; doc_type: string }[]>`
    select display, doc_type from (
      select display, doc_type, weight + 1 as rank from search.suggestions where term like ${escaped + "%"}
      union all
      select display, doc_type, weight + similarity(term, ${term}) as rank from search.suggestions
       where term % ${term} and term not like ${escaped + "%"}
    ) s
    order by rank desc, length(display)
    limit ${limit}`;
  const seen = new Set<string>();
  return rows
    .filter((row) => (seen.has(row.display) ? false : (seen.add(row.display), true)))
    .map((row) => ({ text: row.display, type: row.doc_type }));
}
