import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createManualDepositRequest } from "./deposit.service";
import { consumeRateLimit, pruneRateLimits, RateLimitError } from "./rate-limit";
import {
  closeTestSql,
  ensureAccountingSchema,
  resetAccountingData,
  testSql,
} from "./__testing__/harness";

const TOMAN = 10; // IRR per Toman

beforeAll(async () => {
  await ensureAccountingSchema();
});

afterAll(async () => {
  await testSql`delete from accounting.rate_limits`;
  await closeTestSql();
});

async function clearBuckets() {
  await testSql`delete from accounting.rate_limits`;
}

describe("rate limiting", () => {
  it("allows exactly the configured number of attempts", async () => {
    await clearBuckets();
    const identity = crypto.randomUUID();

    // withdrawal is seeded at 5 per hour.
    for (let i = 0; i < 5; i += 1) {
      await expect(
        consumeRateLimit({ action: "withdrawal", identity, settingKey: "rate_limit.withdrawal" })
      ).resolves.toBeUndefined();
    }

    await expect(
      consumeRateLimit({ action: "withdrawal", identity, settingKey: "rate_limit.withdrawal" })
    ).rejects.toThrow(RateLimitError);
  });

  it("counts each user separately", async () => {
    await clearBuckets();
    const a = crypto.randomUUID();
    const b = crypto.randomUUID();

    for (let i = 0; i < 5; i += 1) {
      await consumeRateLimit({ action: "withdrawal", identity: a, settingKey: "rate_limit.withdrawal" });
    }
    await expect(
      consumeRateLimit({ action: "withdrawal", identity: a, settingKey: "rate_limit.withdrawal" })
    ).rejects.toThrow(RateLimitError);

    // b is untouched by a hitting the wall.
    await expect(
      consumeRateLimit({ action: "withdrawal", identity: b, settingKey: "rate_limit.withdrawal" })
    ).resolves.toBeUndefined();
  });

  it("counts deposits and withdrawals against separate limits", async () => {
    await clearBuckets();
    const identity = crypto.randomUUID();

    for (let i = 0; i < 5; i += 1) {
      await consumeRateLimit({ action: "withdrawal", identity, settingKey: "rate_limit.withdrawal" });
    }
    await expect(
      consumeRateLimit({ action: "withdrawal", identity, settingKey: "rate_limit.withdrawal" })
    ).rejects.toThrow(RateLimitError);

    // Deposits have their own bucket and their own limit (10).
    await expect(
      consumeRateLimit({ action: "deposit", identity, settingKey: "rate_limit.deposit" })
    ).resolves.toBeUndefined();
  });

  it("does not let a burst of simultaneous requests exceed the limit", async () => {
    await clearBuckets();
    const identity = crypto.randomUUID();

    // Ten at once against a limit of five. The counter is a single atomic
    // INSERT ... ON CONFLICT DO UPDATE RETURNING, so exactly five can win.
    const results = await Promise.allSettled(
      Array.from({ length: 10 }, () =>
        consumeRateLimit({ action: "withdrawal", identity, settingKey: "rate_limit.withdrawal" })
      )
    );

    expect(results.filter((r) => r.status === "fulfilled").length).toBe(5);
    expect(results.filter((r) => r.status === "rejected").length).toBe(5);
  });

  it("still counts an attempt whose operation then fails", async () => {
    await clearBuckets();
    const userId = crypto.randomUUID();

    try {
      // Ten deposit attempts that all fail validation (below the minimum). If the limiter
      // ran inside the caller's transaction, every one of these would roll back and the
      // user could hammer the endpoint forever for free.
      for (let i = 0; i < 10; i += 1) {
        await expect(
          createManualDepositRequest({
            userId,
            currencyCode: "IRR",
            amount: "1",
            method: "bank_transfer",
            idempotencyKey: `rl-fail-${userId}-${i}`,
          })
        ).rejects.toThrow(/Minimum deposit/i);
      }

      // The eleventh is refused by the limiter, not by validation.
      await expect(
        createManualDepositRequest({
          userId,
          currencyCode: "IRR",
          amount: String(500_000 * TOMAN),
          method: "bank_transfer",
          idempotencyKey: `rl-fail-${userId}-final`,
        })
      ).rejects.toThrow(RateLimitError);
    } finally {
      await resetAccountingData();
      await clearBuckets();
    }
  });

  it("reads the limit from settings rather than a constant", async () => {
    await clearBuckets();
    const identity = crypto.randomUUID();

    await testSql`
      update accounting.settings
         set value = '{"limit": 2, "window_seconds": 3600}'::jsonb
       where key = 'rate_limit.withdrawal'
    `;

    try {
      await consumeRateLimit({ action: "withdrawal", identity, settingKey: "rate_limit.withdrawal" });
      await consumeRateLimit({ action: "withdrawal", identity, settingKey: "rate_limit.withdrawal" });
      await expect(
        consumeRateLimit({ action: "withdrawal", identity, settingKey: "rate_limit.withdrawal" })
      ).rejects.toThrow(RateLimitError);
    } finally {
      await testSql`
        update accounting.settings
           set value = '{"limit": 5, "window_seconds": 3600}'::jsonb
         where key = 'rate_limit.withdrawal'
      `;
    }
  });

  it("prunes windows that have long since closed", async () => {
    await clearBuckets();
    await testSql`
      insert into accounting.rate_limits (bucket_key, window_start, request_count)
      values ('stale:test', now() - interval '3 days', 99)
    `;

    await pruneRateLimits();

    const [{ n }] = await testSql<{ n: number }[]>`
      select count(*)::int as n from accounting.rate_limits where bucket_key = 'stale:test'
    `;
    expect(n).toBe(0);
  });
});
