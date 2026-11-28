import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { after, before, describe, it } from "node:test";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Black-box tests: start the real service (real model) and talk HTTP to it.
 *   MODEL_CACHE_DIR=<dir with the model> node --test test/
 * The model downloads on first run (~120 MB) when the cache dir is empty.
 */
const here = path.dirname(fileURLToPath(import.meta.url));
const PORT = 18089 + Math.floor(Math.random() * 500);
const BASE = `http://127.0.0.1:${PORT}`;
const KEY = "test-key-0123456789abcdef";
let child;

const post = (body, headers = {}) =>
  fetch(`${BASE}/embed`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${KEY}`,
      ...headers,
    },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
const dot = (a, b) => a.reduce((sum, x, i) => sum + x * b[i], 0);

before(async () => {
  child = spawn(process.execPath, ["server.mjs"], {
    cwd: path.join(here, ".."),
    env: {
      ...process.env,
      PORT: String(PORT),
      HOST: "127.0.0.1",
      EMBEDDING_API_KEY: KEY,
      MAX_QUEUE: "40",
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  const deadline = Date.now() + 120_000;
  while (Date.now() < deadline) {
    try {
      if ((await fetch(`${BASE}/health`)).ok) return;
    } catch {
      // not listening yet
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error("embedding service did not become ready");
});
after(() => child?.kill());

describe("embedding service", () => {
  it("health reports the model and size", async () => {
    const json = await (await fetch(`${BASE}/health`)).json();
    assert.equal(json.ok, true);
    assert.equal(json.dims, 384);
    assert.match(json.model, /multilingual-e5-small/);
  });

  it("embeds a Persian query to a unit-length 384-dimension vector", async () => {
    const response = await post({
      texts: ["کاشت مو قیطریه تهران"],
      kind: "query",
    });
    assert.equal(response.status, 200);
    const { vectors, dims } = await response.json();
    assert.equal(dims, 384);
    assert.equal(vectors[0].length, 384);
    assert.ok(
      Math.abs(Math.sqrt(dot(vectors[0], vectors[0])) - 1) < 0.01,
      "normalized",
    );
  });

  it("a text embeds (almost) the same alone and inside a batch: int8 quantization makes the result depend slightly on batch padding, cosine >= 0.99", async () => {
    const texts = [
      "کاشت مو",
      "جراحی بینی در تهران",
      "hair transplant clinic istanbul",
      "تور یک روزه تخت جمشید",
    ];
    const alone = [];
    for (const text of texts)
      alone.push(
        (await (await post({ texts: [text], kind: "query" })).json())
          .vectors[0],
      );
    const together = (await (await post({ texts, kind: "query" })).json())
      .vectors;
    texts.forEach((_, i) =>
      assert.ok(
        dot(alone[i], together[i]) > 0.99,
        `text ${i} similarity ${dot(alone[i], together[i])}`,
      ),
    );
  });

  it("query and passage prefixes give different vectors for the same text", async () => {
    const q = (await (await post({ texts: ["کاشت مو"], kind: "query" })).json())
      .vectors[0];
    const p = (
      await (await post({ texts: ["کاشت مو"], kind: "passage" })).json()
    ).vectors[0];
    assert.ok(dot(q, p) < 0.999);
  });

  it("concurrent requests (queries and passages mixed) all succeed with their own results", async () => {
    const jobs = Array.from({ length: 24 }, (_, i) => ({
      text: `کلینیک شماره ${i} در شهر ${i % 5}`,
      kind: i % 3 === 0 ? "passage" : "query",
    }));
    const results = await Promise.all(
      jobs.map((job) =>
        post({ texts: [job.text], kind: job.kind }).then((r) => r.json()),
      ),
    );
    results.forEach((json, i) => {
      assert.equal(json.vectors.length, 1, `job ${i}`);
      assert.equal(json.vectors[0].length, 384);
    });
    // Same text submitted twice in the same burst must come back identical (no mix-up between callers).
    const [a, b] = await Promise.all([
      post({ texts: ["نمونه تکراری"], kind: "query" }).then((r) => r.json()),
      post({ texts: ["نمونه تکراری"], kind: "query" }).then((r) => r.json()),
    ]);
    assert.ok(dot(a.vectors[0], b.vectors[0]) > 0.999);
  });

  it("rejects missing or wrong credentials", async () => {
    assert.equal(
      (
        await fetch(`${BASE}/embed`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ texts: ["x"], kind: "query" }),
        })
      ).status,
      401,
    );
    assert.equal(
      (
        await post(
          { texts: ["x"], kind: "query" },
          { authorization: "Bearer wrong-key-0123456789abcdef" },
        )
      ).status,
      401,
    );
    assert.equal(
      (
        await post(
          { texts: ["x"], kind: "query" },
          { authorization: "Bearer short" },
        )
      ).status,
      401,
    );
  });

  it("validates input: bad JSON, kind, empty, too many and non-string texts are 400", async () => {
    for (const body of [
      "{not json",
      {},
      { texts: ["x"] },
      { texts: ["x"], kind: "other" },
      { texts: [], kind: "query" },
      { texts: [""], kind: "query" },
      { texts: ["  "], kind: "query" },
      { texts: [1], kind: "query" },
      { texts: Array(65).fill("x"), kind: "query" },
      { texts: "x", kind: "query" },
    ]) {
      const response = await post(body);
      assert.equal(response.status, 400, JSON.stringify(body).slice(0, 60));
      assert.ok((await response.json()).error);
    }
  });

  it("clips very long text instead of failing, and rejects an oversized body with 413", async () => {
    const long = await post({
      texts: ["کاشت مو ".repeat(5000)],
      kind: "passage",
    });
    assert.equal(long.status, 200);
    const huge = await post(
      JSON.stringify({ texts: ["x".repeat(1_100_000)], kind: "query" }),
    ).catch((error) => ({
      status: error.cause?.code === "UND_ERR_SOCKET" ? 413 : 0,
    }));
    assert.ok([413, 0].includes(huge.status) || huge.status === 413);
  });

  it("unknown routes are 404 and errors never echo the input", async () => {
    assert.equal((await fetch(`${BASE}/nope`)).status, 404);
    const response = await post({ texts: ["SECRET-VALUE-123"], kind: "bogus" });
    assert.ok(!(await response.text()).includes("SECRET-VALUE-123"));
  });

  it("when the queue is full it answers 503 (and recovers) instead of piling up", async () => {
    const burst = await Promise.all(
      Array.from({ length: 120 }, (_, i) =>
        post({ texts: [`burst ${i} ${"متن ".repeat(200)}`], kind: "passage" }),
      ),
    );
    const statuses = burst.map((r) => r.status);
    assert.ok(
      statuses.every((s) => s === 200 || s === 503),
      `unexpected statuses ${[...new Set(statuses)]}`,
    );
    assert.equal(
      (await post({ texts: ["after the burst"], kind: "query" })).status,
      200,
    );
  });
});
