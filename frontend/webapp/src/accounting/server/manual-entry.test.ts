import { afterAll, beforeAll, describe, expect, it } from "vitest";

import {
  closeTestSql,
  ensureAccountingSchema,
  withSavepoint,
  withTestTransaction,
  type TestContext,
} from "./__testing__/harness";

beforeAll(async () => {
  await ensureAccountingSchema();
});

afterAll(async () => {
  await closeTestSql();
});

/**
 * 0014 relaxed two triggers the whole ledger rests on: balance and has-lines are
 * no longer enforced while a document is editable. That is the change that makes
 * a manual entry form possible, and it is also the change that could quietly
 * let an unbalanced document into the books. These tests exist to prove the
 * relaxation stops exactly where it should.
 */

/** Inserts a bare entry in the given status and returns its id. */
async function makeEntry(
  { tx, periodId }: TestContext,
  status: string,
  overrides: Record<string, unknown> = {}
): Promise<string> {
  const [row] = await tx<{ id: string }[]>`
    insert into accounting.journal_entries ${tx({
      fiscal_period_id: periodId,
      entry_date: new Date(),
      description: "سند آزمایشی",
      status,
      // Required by the 0004 schema: every entry declares where it came from and
      // carries an idempotency key. A manual document's source is the operator.
      source_type: "manual",
      idempotency_key: `manual-test-${Math.random().toString(36).slice(2, 12)}`,
      base_currency_code: "IRR",
      is_manual: true,
      ...overrides,
    })}
    returning id::text as id
  `;
  return row.id;
}

async function addLine(
  { tx }: TestContext,
  entryId: string,
  accountId: string,
  lineNo: number,
  debit: string,
  credit: string,
  extra: Record<string, unknown> = {}
) {
  await tx`
    insert into accounting.journal_lines ${tx({
      entry_id: entryId,
      line_no: lineNo,
      account_id: accountId,
      currency_code: "IRR",
      debit_amount: debit,
      credit_amount: credit,
      base_currency_code: "IRR",
      base_debit_amount: debit,
      base_credit_amount: credit,
      exchange_rate: "1",
      ...extra,
    })}
  `;
}

/**
 * Forces every deferred constraint trigger to run now.
 *
 * The balance, has-lines and dimension checks are all `deferrable initially
 * deferred`, so they fire at COMMIT. The test harness deliberately never commits,
 * which means without this they would silently never run and every one of these
 * tests would pass for the wrong reason.
 */
async function runDeferredChecks({ tx }: TestContext) {
  await tx`set constraints all immediate`;
}

describe("document lifecycle — editable states", () => {
  it("saves an unbalanced draft", async () => {
    await withTestTransaction(async (ctx) => {
      const entryId = await makeEntry(ctx, "draft");
      // Only one side typed so far — exactly the state an accountant is in
      // halfway through entering a document.
      await addLine(ctx, entryId, ctx.accounts.clearing_zarinpal, 1, "5000", "0");

      const [row] = await ctx.tx<{ status: string }[]>`
        select status from accounting.journal_entries where id = ${entryId}
      `;
      expect(row.status).toBe("draft");
    });
  });

  it("saves a draft with no lines at all", async () => {
    await withTestTransaction(async (ctx) => {
      const entryId = await makeEntry(ctx, "draft");
      const [row] = await ctx.tx<{ id: string }[]>`
        select id::text as id from accounting.journal_entries where id = ${entryId}
      `;
      expect(row.id).toBe(entryId);
    });
  });

  it("allows a temporary document to stay unbalanced too", async () => {
    await withTestTransaction(async (ctx) => {
      const entryId = await makeEntry(ctx, "temporary");
      await addLine(ctx, entryId, ctx.accounts.clearing_zarinpal, 1, "5000", "0");
      const [row] = await ctx.tx<{ status: string }[]>`
        select status from accounting.journal_entries where id = ${entryId}
      `;
      expect(row.status).toBe("temporary");
    });
  });
});

describe("document lifecycle — committing", () => {
  it("refuses to post an unbalanced document", async () => {
    await withTestTransaction(async (ctx) => {
      await expect(
        withSavepoint(ctx.tx, async () => {
          const entryId = await makeEntry(ctx, "draft");
          await addLine(ctx, entryId, ctx.accounts.clearing_zarinpal, 1, "5000", "0");
          await ctx.tx`
            update accounting.journal_entries set status = 'posted' where id = ${entryId}
          `;
          await runDeferredChecks(ctx);
        })
      ).rejects.toThrow(/unbalanced/i);
    });
  });

  it("refuses to approve an unbalanced document", async () => {
    await withTestTransaction(async (ctx) => {
      await expect(
        withSavepoint(ctx.tx, async () => {
          const entryId = await makeEntry(ctx, "temporary");
          await addLine(ctx, entryId, ctx.accounts.clearing_zarinpal, 1, "7000", "0");
          await ctx.tx`
            update accounting.journal_entries set status = 'approved' where id = ${entryId}
          `;
          await runDeferredChecks(ctx);
        })
      ).rejects.toThrow(/unbalanced/i);
    });
  });

  it("refuses to post a document with no lines", async () => {
    await withTestTransaction(async (ctx) => {
      await expect(
        withSavepoint(ctx.tx, async () => {
          const entryId = await makeEntry(ctx, "draft");
          await ctx.tx`
            update accounting.journal_entries set status = 'posted' where id = ${entryId}
          `;
          await runDeferredChecks(ctx);
        })
      ).rejects.toThrow(/no lines/i);
    });
  });

  it("posts a balanced document", async () => {
    await withTestTransaction(async (ctx) => {
      const entryId = await makeEntry(ctx, "draft");
      await addLine(ctx, entryId, ctx.accounts.clearing_zarinpal, 1, "5000", "0");
      await addLine(ctx, entryId, ctx.accounts.user_wallet_liability, 2, "0", "5000", {
        party_type: "user",
        party_id: ctx.userId,
      });
      await ctx.tx`
        update accounting.journal_entries set status = 'posted', posted_at = now() where id = ${entryId}
      `;
      await runDeferredChecks(ctx);
      const [row] = await ctx.tx<{ status: string }[]>`
        select status from accounting.journal_entries where id = ${entryId}
      `;
      expect(row.status).toBe("posted");
    });
  });

  it("keeps a posted document immutable", async () => {
    await withTestTransaction(async (ctx) => {
      const entryId = await makeEntry(ctx, "draft");
      await addLine(ctx, entryId, ctx.accounts.clearing_zarinpal, 1, "5000", "0");
      await addLine(ctx, entryId, ctx.accounts.user_wallet_liability, 2, "0", "5000");
      await ctx.tx`update accounting.journal_entries set status = 'posted' where id = ${entryId}`;

      await expect(
        withSavepoint(ctx.tx, async () => {
          await ctx.tx`
            update accounting.journal_entries set description = 'تغییر غیرمجاز' where id = ${entryId}
          `;
        })
      ).rejects.toThrow(/append-only/i);
    });
  });
});

describe("analytic dimensions", () => {
  it("refuses a project id filed as a cost centre", async () => {
    await withTestTransaction(async (ctx) => {
      const [project] = await ctx.tx<{ id: string }[]>`
        insert into accounting.dimensions (kind, code, name_translations)
        values ('project', ${"P-" + Math.random().toString(36).slice(2, 8)}, '{"fa":"پروژه"}'::jsonb)
        returning id::text as id
      `;
      const entryId = await makeEntry(ctx, "draft");
      await expect(
        withSavepoint(ctx.tx, async () => {
          await addLine(ctx, entryId, ctx.accounts.clearing_zarinpal, 1, "1000", "0", {
            cost_center_id: project.id,
          });
        })
      ).rejects.toThrow();
    });
  });

  it("enforces a required cost centre only once the document commits", async () => {
    await withTestTransaction(async (ctx) => {
      await ctx.tx`
        update accounting.accounts set requires_cost_center = true
        where id = ${ctx.accounts.clearing_zarinpal}
      `;

      const entryId = await makeEntry(ctx, "draft");
      // Allowed while editable — the accountant has not got there yet.
      await addLine(ctx, entryId, ctx.accounts.clearing_zarinpal, 1, "5000", "0");
      await addLine(ctx, entryId, ctx.accounts.user_wallet_liability, 2, "0", "5000");

      await expect(
        withSavepoint(ctx.tx, async () => {
          await ctx.tx`
            update accounting.journal_entries set status = 'posted' where id = ${entryId}
          `;
          await runDeferredChecks(ctx);
        })
      ).rejects.toThrow(/requires a cost centre/i);
    });
  });
});

describe("period locking", () => {
  it("refuses to write into a hard-locked period", async () => {
    await withTestTransaction(async (ctx) => {
      await ctx.tx`
        update accounting.fiscal_periods set lock_level = 'hard' where id = ${ctx.periodId}
      `;
      await expect(
        withSavepoint(ctx.tx, async () => {
          await makeEntry(ctx, "draft");
        })
      ).rejects.toThrow(/hard-locked/i);
    });
  });

  it("still allows writes into a soft-locked period", async () => {
    await withTestTransaction(async (ctx) => {
      await ctx.tx`
        update accounting.fiscal_periods set lock_level = 'soft' where id = ${ctx.periodId}
      `;
      const entryId = await makeEntry(ctx, "draft");
      expect(entryId).toBeTruthy();
    });
  });
});

describe("reference number", () => {
  it("refuses the same reference twice in one period", async () => {
    await withTestTransaction(async (ctx) => {
      const ref = "BANK-" + Math.random().toString(36).slice(2, 8);
      await makeEntry(ctx, "draft", { reference_number: ref });
      await expect(
        withSavepoint(ctx.tx, async () => {
          await makeEntry(ctx, "draft", { reference_number: ref });
        })
      ).rejects.toThrow();
    });
  });
});
