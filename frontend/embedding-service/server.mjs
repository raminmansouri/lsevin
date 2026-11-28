#!/usr/bin/env node
/**
 * Self-hosted text embeddings for LSevin search and the assistant.
 *
 *   POST /embed   { "texts": ["..."], "kind": "query" | "passage" }
 *                 -> { "model", "dims", "vectors": [[...384 floats...]] }
 *   GET  /health  -> { "ok": true, "model", "dims", "ready": true }
 *
 * Model: multilingual-e5-small (int8, ~120 MB on disk, ~0.5 GB RAM). e5 models need a
 * "query: " / "passage: " prefix, which this service adds, so callers send plain text.
 *
 * Environment:
 *   PORT               listen port (default 8089)
 *   HOST               bind address (default 0.0.0.0)
 *   EMBEDDING_API_KEY  if set, requests must send "Authorization: Bearer <key>"
 *   EMBEDDING_MODEL    default Xenova/multilingual-e5-small
 *   MODEL_CACHE_DIR    where the model files are cached (default ./.model-cache)
 *   MAX_QUEUE          requests allowed to wait for the model (default 64), then 503
 */
import { createServer } from "node:http";
import { timingSafeEqual } from "node:crypto";

import { env, pipeline } from "@huggingface/transformers";

const PORT = Number(process.env.PORT ?? 8089);
const HOST = process.env.HOST ?? "0.0.0.0";
const API_KEY = process.env.EMBEDDING_API_KEY ?? "";
const MODEL = process.env.EMBEDDING_MODEL ?? "Xenova/multilingual-e5-small";
const MAX_QUEUE = Number(process.env.MAX_QUEUE ?? 64);
const MAX_TEXTS = 64;
const MAX_CHARS = 2000;
const MAX_BODY_BYTES = 1_000_000;
const DIMS = 384;

env.cacheDir = process.env.MODEL_CACHE_DIR ?? "./.model-cache";

let extractor = null;
let loadError = null;
const loading = pipeline("feature-extraction", MODEL, { dtype: "q8" })
  .then((p) => {
    extractor = p;
  })
  .catch((error) => {
    loadError = error;
    console.error("model load failed:", error);
  });

// One inference at a time (the model already uses every core; a queue keeps memory flat), but
// everything that is waiting when the model becomes free goes through it as ONE batch. Under
// load, eight waiting search queries cost one pass instead of eight (measured: the single-queue
// version made 35% of queries miss their 400 ms budget at 8 concurrent clients).
const MAX_BATCH = Number(process.env.MAX_BATCH ?? 32);
const pending = [];
let running = false;

function submit(texts, kind) {
  if (pending.length >= MAX_QUEUE)
    return Promise.reject(Object.assign(new Error("busy"), { status: 503 }));
  return new Promise((resolve, reject) => {
    pending.push({ texts, kind, resolve, reject });
    void pump();
  });
}

async function pump() {
  if (running) return;
  running = true;
  try {
    while (pending.length) {
      // The first waiting request decides the kind (query/passage prefixes differ); take every
      // waiting request of that kind that still fits in the batch.
      const kind = pending[0].kind;
      const batch = [];
      let count = 0;
      for (let i = 0; i < pending.length; ) {
        const item = pending[i];
        if (
          item.kind === kind &&
          (count === 0 || count + item.texts.length <= MAX_BATCH)
        ) {
          batch.push(item);
          count += item.texts.length;
          pending.splice(i, 1);
        } else {
          i += 1;
        }
      }
      try {
        const vectors = await embed(
          batch.flatMap((item) => item.texts),
          kind,
        );
        let offset = 0;
        for (const item of batch) {
          item.resolve(vectors.slice(offset, offset + item.texts.length));
          offset += item.texts.length;
        }
      } catch (error) {
        for (const item of batch) item.reject(error);
      }
    }
  } finally {
    running = false;
  }
}

async function embed(texts, kind) {
  const prefix = kind === "query" ? "query: " : "passage: ";
  const out = await extractor(
    texts.map((text) => prefix + text),
    { pooling: "mean", normalize: true },
  );
  const vectors = [];
  for (let i = 0; i < texts.length; i += 1) {
    vectors.push(
      Array.from(
        out.data.slice(i * DIMS, (i + 1) * DIMS),
        (v) => Math.round(v * 1e6) / 1e6,
      ),
    );
  }
  return vectors;
}

function authorized(request) {
  if (!API_KEY) return true;
  const given = Buffer.from(
    String(request.headers.authorization ?? "").replace(/^Bearer\s+/i, ""),
  );
  const wanted = Buffer.from(API_KEY);
  return given.length === wanted.length && timingSafeEqual(given, wanted);
}

function send(response, status, body) {
  const json = JSON.stringify(body);
  response.writeHead(status, {
    "content-type": "application/json",
    "content-length": Buffer.byteLength(json),
  });
  response.end(json);
}

function readBody(request) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    request.on("data", (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        reject(Object.assign(new Error("body too large"), { status: 413 }));
        request.destroy();
        return;
      }
      chunks.push(chunk);
    });
    request.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    request.on("error", reject);
  });
}

const server = createServer(async (request, response) => {
  try {
    if (request.method === "GET" && request.url === "/health") {
      if (loadError)
        return send(response, 503, {
          ok: false,
          error: "model failed to load",
        });
      return send(response, extractor ? 200 : 503, {
        ok: Boolean(extractor),
        ready: Boolean(extractor),
        model: MODEL,
        dims: DIMS,
      });
    }
    if (request.method === "POST" && request.url === "/embed") {
      if (!authorized(request))
        return send(response, 401, { error: "unauthorized" });
      if (!extractor) return send(response, 503, { error: "model not ready" });

      let payload;
      try {
        payload = JSON.parse(await readBody(request));
      } catch (error) {
        if (error?.status)
          return send(response, error.status, { error: error.message });
        return send(response, 400, { error: "invalid JSON" });
      }
      const { texts, kind } = payload ?? {};
      if (kind !== "query" && kind !== "passage")
        return send(response, 400, {
          error: 'kind must be "query" or "passage"',
        });
      if (
        !Array.isArray(texts) ||
        texts.length === 0 ||
        texts.length > MAX_TEXTS
      ) {
        return send(response, 400, {
          error: `texts must be a non-empty array of at most ${MAX_TEXTS}`,
        });
      }
      if (texts.some((text) => typeof text !== "string" || !text.trim())) {
        return send(response, 400, {
          error: "every text must be a non-empty string",
        });
      }
      const clipped = texts.map((text) => text.slice(0, MAX_CHARS));
      const vectors = await submit(clipped, kind);
      return send(response, 200, { model: MODEL, dims: DIMS, vectors });
    }
    return send(response, 404, { error: "not found" });
  } catch (error) {
    if (error?.status)
      return send(response, error.status, { error: error.message });
    // Never echo internals (or the texts) back to the caller.
    console.error("embed failed:", error?.message);
    return send(response, 500, { error: "embedding failed" });
  }
});

await loading;
server.listen(PORT, HOST, () =>
  console.log(
    `embedding service ready on ${HOST}:${PORT} (${MODEL}, ${DIMS} dims)`,
  ),
);

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => server.close(() => process.exit(0)));
}
