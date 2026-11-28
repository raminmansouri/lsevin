import { sha256 } from "./lib.mjs";

const URL_BASE = (process.env.EMBEDDING_URL ?? "http://127.0.0.1:8089").replace(/\/$/, "");
const API_KEY = process.env.EMBEDDING_API_KEY ?? "";
export const MODEL = process.env.EMBEDDING_MODEL ?? "Xenova/multilingual-e5-small";
const BATCH = 16;

async function callService(texts, kind) {
  let lastError;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    try {
      const response = await fetch(`${URL_BASE}/embed`, {
        method: "POST",
        headers: { "content-type": "application/json", ...(API_KEY ? { authorization: `Bearer ${API_KEY}` } : {}) },
        body: JSON.stringify({ texts, kind }),
        signal: AbortSignal.timeout(60_000),
      });
      if (!response.ok) throw new Error(`embedding service ${response.status}`);
      const json = await response.json();
      if (json.model !== MODEL) throw new Error(`embedding service runs ${json.model}, expected ${MODEL}`);
      return json.vectors;
    } catch (error) {
      lastError = error;
      await new Promise((resolve) => setTimeout(resolve, 500 * 2 ** attempt));
    }
  }
  throw lastError;
}

const literal = (vector) => `[${vector.join(",")}]`;

/**
 * Embeds passages, reusing unified_search.embedding_cache. Returns Map<text, "[..]" literal>.
 * Only texts missing from the cache reach the model.
 */
export async function embedPassages(sql, texts) {
  const unique = [...new Set(texts)];
  const keyOf = (text) => sha256(`passage:${text}`);
  const keys = unique.map(keyOf);
  const cached = await sql`
    update unified_search.embedding_cache set last_used_at = now()
     where model = ${MODEL} and content_hash = any(${keys})
 returning content_hash, embedding::text as embedding`;
  const byKey = new Map(cached.map((row) => [row.content_hash, row.embedding]));

  const missing = unique.filter((text) => !byKey.has(keyOf(text)));
  for (let i = 0; i < missing.length; i += BATCH) {
    const part = missing.slice(i, i + BATCH);
    const vectors = await callService(part, "passage");
    for (const [index, text] of part.entries()) {
      const key = keyOf(text);
      const vector = literal(vectors[index]);
      await sql`
        insert into unified_search.embedding_cache (model, content_hash, embedding)
        values (${MODEL}, ${key}, ${vector}::halfvec)
        on conflict (model, content_hash) do nothing`;
      byKey.set(key, vector);
    }
  }
  return new Map(unique.map((text) => [text, byKey.get(keyOf(text))]));
}
