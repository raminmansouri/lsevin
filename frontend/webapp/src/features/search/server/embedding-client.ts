import "server-only";

import { createHash } from "node:crypto";

import sql from "@/config/database/db";

const SERVICE_URL = (process.env.EMBEDDING_URL ?? "http://127.0.0.1:8089").replace(/\/$/, "");
const API_KEY = process.env.EMBEDDING_API_KEY ?? "";
export const EMBEDDING_MODEL = process.env.EMBEDDING_MODEL ?? "Xenova/multilingual-e5-small";
/** A new query waits this long for its embedding, then search carries on without the vector part. */
const TIMEOUT_MS = Number(process.env.SEARCH_EMBED_TIMEOUT_MS ?? 400);
const MEMORY_ENTRIES = 1000;
const MEMORY_TTL_MS = 60 * 60_000;
/** After a failure, skip the service for a moment instead of making every search wait for the timeout. */
const COOL_DOWN_MS = 10_000;

const memory = new Map<string, { vector: string; at: number }>();
let coolDownUntil = 0;
let lastWarning = 0;

const keyOf = (text: string) => createHash("sha256").update(`query:${text}`).digest("hex");
const literal = (vector: number[]) => `[${vector.join(",")}]`;

function remember(key: string, vector: string) {
  if (memory.size >= MEMORY_ENTRIES) memory.delete(memory.keys().next().value as string);
  memory.set(key, { vector, at: Date.now() });
}

function warn(message: string) {
  // One line a minute at most: an outage must not flood the logs.
  if (Date.now() - lastWarning > 60_000) {
    lastWarning = Date.now();
    console.warn(`[search] ${message}`);
  }
}

/**
 * The embedding of a search query as a pgvector literal, or null when it could not be had
 * within the time budget (search then uses keywords and place only).
 * Order: process memory -> unified_search.embedding_cache -> the embedding service.
 */
export async function embedQuery(text: string): Promise<string | null> {
  const key = keyOf(text);
  const hot = memory.get(key);
  if (hot && Date.now() - hot.at < MEMORY_TTL_MS) return hot.vector;

  try {
    const rows = await sql<{ embedding: string }[]>`
      update unified_search.embedding_cache set last_used_at = now()
       where model = ${EMBEDDING_MODEL} and content_hash = ${key}
   returning embedding::text as embedding`;
    if (rows[0]) {
      remember(key, rows[0].embedding);
      return rows[0].embedding;
    }
  } catch (error) {
    warn(`embedding cache unavailable: ${(error as Error).message}`);
  }

  if (Date.now() < coolDownUntil) return null;
  try {
    const response = await fetch(`${SERVICE_URL}/embed`, {
      method: "POST",
      headers: { "content-type": "application/json", ...(API_KEY ? { authorization: `Bearer ${API_KEY}` } : {}) },
      body: JSON.stringify({ texts: [text], kind: "query" }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
      cache: "no-store",
    });
    if (!response.ok) throw new Error(`service answered ${response.status}`);
    const json = (await response.json()) as { model: string; vectors: number[][] };
    if (json.model !== EMBEDDING_MODEL) throw new Error(`service runs ${json.model}, expected ${EMBEDDING_MODEL}`);
    const vector = literal(json.vectors[0]);
    remember(key, vector);
    // Fire and forget: the next visitor with this query skips the model entirely.
    void sql`
      insert into unified_search.embedding_cache (model, content_hash, embedding)
      values (${EMBEDDING_MODEL}, ${key}, ${vector}::halfvec)
      on conflict (model, content_hash) do nothing`.catch(() => undefined);
    return vector;
  } catch (error) {
    coolDownUntil = Date.now() + COOL_DOWN_MS;
    warn(`embedding service unavailable, searching without the vector part: ${(error as Error).message}`);
    return null;
  }
}

/** For tests. */
export function resetEmbeddingClient() {
  memory.clear();
  coolDownUntil = 0;
}
