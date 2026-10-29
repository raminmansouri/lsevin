import "server-only";

import { OpenAIEmbeddings } from "@langchain/openai";
import { z } from "zod";

import sql from "@/config/database/db";

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

// Passages less similar than this are not relevant enough to answer from.
const MIN_SCORE = 0.35;

const embeddings = new OpenAIEmbeddings({
  model: process.env.OPENAI_EMBEDDING_MODEL ?? "text-embedding-3-small",
});

type KnowledgeRow = { title: string; content: string; url: string | null; sourceType: string; score: number };

export async function searchKnowledge(input: SearchKnowledgeInput, storedLocale: string) {
  const limit = input.limit ?? 5;
  const vector = `[${(await embeddings.embedQuery(input.question)).join(",")}]`;
  // The user's language first, plus single-language content and English as a fallback.
  const locales = [...new Set([storedLocale, "any", "en-US", "fa-IR"])];

  const rows = await sql.begin(async (tx) => {
    // Keep scanning the HNSW index until enough rows pass the locale filter.
    await tx`set local hnsw.iterative_scan = relaxed_order`;
    return tx<KnowledgeRow[]>`
      select title, content, url, source_type as "sourceType",
        1 - (embedding <=> ${vector}::vector) as score
      from ai.knowledge_chunks
      where locale = any(${locales})
      order by embedding <=> ${vector}::vector
      limit ${limit * 3}
    `;
  });

  // Drop weak matches and repeated passages (the same text often exists for many clinics).
  const seen = new Set<string>();
  const results = rows
    .filter((row) => Number(row.score) >= MIN_SCORE)
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