import assert from "node:assert/strict";
import { test } from "node:test";

import { percentile, run, summarize } from "../scripts/benchmark-public.mjs";

test("p95 uses nearest rank without hiding the slow tail", () => {
  assert.equal(percentile([...Array(18).fill(5), 100, 200], 0.95), 100);
  assert.throws(() => percentile([], 0.95));
});
test("a fast redirect/error/timeout cannot pass the budget", () => {
  for (const status of [0, 302, 404, 500])
    assert.equal(summarize([{ status, ttfbMs: 1 }], 30).pass, false);
  assert.equal(summarize([{ status: 200, ttfbMs: 30 }], 30).pass, false);
  assert.equal(summarize([{ status: 200, ttfbMs: 29 }], 30).pass, true);
});
test("invalid configuration fails before network requests", () => {
  for (const args of [
    ["--samples=NaN"],
    ["--budget-ms=0"],
    ["--samples=101"],
    ["--origin=https://example.com/path"],
    ["--origin=https://user:pass@example.com"],
  ])
    assert.throws(() => run(args));
});
