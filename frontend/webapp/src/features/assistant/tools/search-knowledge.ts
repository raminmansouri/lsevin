import "server-only";

import { z } from "zod";

import sql from "@/config/database/db";
import { embedQuery } from "@/features/search/server/embedding-client";

export const SEARCH_KNOWLEDGE_DESCRIPTION =
  "Search LSevin's own content: treatment descriptions, FAQs, treatment steps, what is included, and clinic policies " +
  "(cancellation, refund, admission). Use it for questions about a treatment in general (what it is, preparation, " +
  "recovery, aftercare) or about a clinic's rules. Pass the user's question in their own words. " +
  "Returns the most relevant passages; answer only from them.";

export const searchKnowledgeInputSchema = z.object({
  question: z.string().min(2).describe("The user's question, in any language."),
  limit: z.number().int().min(1).max(8).optional().describe("How many passages to return (default 5)."),
});

export type SearchKnowledgeInput = z.infer<typeof searchKnowledgeInputSchema>;

/**
 * Which model embeds the question and which stored vectors it is compared with:
 *   openai (default)  text-embedding-3-small against ai.knowledge_chunks.embedding
 *   local             the self-hosted multilingual-e5-small against embedding_local
 * Switch with ASSISTANT_EMBEDDINGS after `pnpm assistant:index:local` has filled embedding_local.
 * Only the chat model itself still needs an external API in local mode.
 */
const mode = () => (process.env.ASSISTANT_EMBEDDINGS === "local" ? "local" : "openai");

// OpenAI scores: passages less similar than this are not relevant enough to answer from.
const MIN_SCORE = 0.35;
// e5 cosine similarities are compressed into ~0.70-0.93. Measured 2026-11-28 on treatment/policy passages:
// questions that the passage answers scored >= 0.846, unrelated questions <= 0.798, so the floor sits
// between them. Recalibrate (ASSISTANT_LOCAL_MIN_SCORE) after indexing the full production content.
const LOCAL_MIN_SCORE = Number(process.env.ASSISTANT_LOCAL_MIN_SCORE ?? 0.82);
const LOCAL_BAND = 0.05;

type OpenAIEmbeddingsInstance = { embedQuery(text: string): Promise<number[]> };
let openai: OpenAIEmbeddingsInstance | null = null;

async function openaiEmbeddings(): Promise<OpenAIEmbeddingsInstance> {
  // Imported on first use: the package is not needed (or loaded) when the local model is in use.
  if (!openai) {
    const { OpenAIEmbeddings } = await import("@langchain/openai");
    openai = new OpenAIEmbeddings({ model: process.env.OPENAI_EMBEDDING_MODEL ?? "text-embedding-3-small" });
  }
  return openai;
}

type KnowledgeRow = { title: string; content: string; url: string | null; sourceType: string; score: number };

async function queryChunks(vector: string, column: "embedding" | "embedding_local", locales: string[], limit: number) {
  const cast = column === "embedding" ? sql`vector` : sql`halfvec`;
  const col = column === "embedding" ? sql`embedding` : sql`embedding_local`;
  return sql.begin(async (tx) => {
    // Keep scanning the HNSW index until enough rows pass the locale filter.
    await tx`set local hnsw.iterative_scan = relaxed_order`;
    return tx<KnowledgeRow[]>`
      select title, content, url, source_type as "sourceType",
        1 - (${col} <=> ${vector}::${cast}) as score
      from ai.knowledge_chunks
      where locale = any(${locales}) and ${col} is not null
      order by ${col} <=> ${vector}::${cast}
      limit ${limit * 3}
    `;
  });
}

export async function searchKnowledge(input: SearchKnowledgeInput, storedLocale: string) {
  const limit = input.limit ?? 5;
  // The user's language first, plus single-language content and English as a fallback.
  const locales = [...new Set([storedLocale, "any", "en-US", "fa-IR"])];

  let rows: KnowledgeRow[];
  let keep: (row: KnowledgeRow, best: number) => boolean;

  if (mode() === "local") {
    const vector = await embedQuery(input.question);
    if (!vector) {
      // The embedding service is down: say "nothing found" rather than guessing.
      console.warn("[assistant] knowledge search skipped: embedding service unavailable");
      return { count: 0, results: [] as { title: string; content: string; type: string; score: number }[] };
    }
    rows = await queryChunks(vector, "embedding_local", locales, limit);
    keep = (row, best) => Number(row.score) >= LOCAL_MIN_SCORE && Number(row.score) >= best - LOCAL_BAND;
  } else {
    const vector = `[${(await (await openaiEmbeddings()).embedQuery(input.question)).join(",")}]`;
    rows = await queryChunks(vector, "embedding", locales, limit);
    keep = (row) => Number(row.score) >= MIN_SCORE;
  }

  // Drop weak matches and repeated passages (the same text often exists for many clinics).
  const best = rows.length ? Number(rows[0].score) : 0;
  const seen = new Set<string>();
  const results = rows
    .filter((row) => keep(row, best))
    .filter((row) => {
      const key = row.content.slice(0, 200);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, limit)
    .map((row) => ({
      title: row.title,
      content: row.content,
      type: row.sourceType,
      score: Number(Number(row.score).toFixed(3)),
    }));

  return { count: results.length, results };
}
