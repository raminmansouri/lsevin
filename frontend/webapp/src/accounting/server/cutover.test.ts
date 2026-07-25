import fs from "node:fs";
import path from "node:path";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import {
  closeTestSql,
  ensureAccountingSchema,
  resetAccountingData,
  testSql,
} from "./__testing__/harness";

const APP_ROOT = path.resolve(__dirname, "../../..");
const TOMAN = 10; // IRR per Toman

const CUTOVER_MIGRATIONS = [
  "0010_accounting_legacy_reconciliation.sql",
  "0011_accounting_opening_balances.sql",
  "0012_accounting_cutover_checks.sql",
];

function loadMigration(file: string): string {
  return fs
    .readFileSync(path.join(APP_ROOT, "db", "migrations", file), "utf8")
    .replace(/^\s*(begin|commit)\s*;\s*$/gim, "");
}

async function applyCutover(): Promise<void> {
  for (const file of CUTOVER_MIGRATIONS) {
    await testSql.unsafe(loadMigration(file)).simple();
  }
}

/** Only the views — applied without running the import, so "before" can be inspected. */
async function applyViewsOnly(): Promise<void> {
  await testSql.unsafe(loadMigration("0010_accounting_legacy_reconciliation.sql")).simple();
}

const legacyUsers: string[] = [];

async function seedLegacyWallet(currencyRows: { currency: string; amount: string; status?: string }[]) {
  const userId = crypto.randomUUID();
  legacyUsers.push(userId);

  // customer.wallet_accounts has a foreign key to identity.asp_net_users, so the legacy
  // fixture needs a real user row.
  const handle = userId.slice(0, 8);
  await testSql`
    insert into identity.asp_net_users (
      id, first_name, last_name, phone_number_country_code, phone_number, phone_number_confirmed,
      user_name, normalized_user_name, email, normalized_email, email_confirmed,
      two_factor_enabled, lockout_enabled, access_failed_count
    ) values (
      ${userId}, 'Cutover', ${"Test-" + handle}, 'IR', ${"0900" + handle.slice(0, 7)}, false,
      ${"cutover-" + handle}, ${"CUTOVER-" + handle.toUpperCase()},
      ${"cutover-" + handle + "@test.local"}, ${"CUTOVER-" + handle.toUpperCase() + "@TEST.LOCAL"},
      false, false, true, 0
    )
  `;

  const [account] = await testSql<{ id: string }[]>`
    insert into customer.wallet_accounts (id, user_id, default_currency, is_active, create_date, last_modified_date)
    values (gen_random_uuid(), ${userId}, 'IRR', true, now(), now())
    returning id::text as id
  `;

  for (const row of currencyRows) {
    await testSql`
      insert into customer.wallet_transactions (
        id, wallet_account_id, user_id, transaction_type, direction, status,
        title, currency_code, amount, metadata, occurred_at, create_date, last_modified_date
      ) values (
        gen_random_uuid(), ${account.id}, ${userId}, 'topup',
        ${Number(row.amount) < 0 ? "debit" : "credit"}, ${row.status ?? "completed"},
        'cutover test', ${row.currency}, ${row.amount}::numeric, '{}'::jsonb, now(), now(), now()
      )
    `;
  }

  return { userId, accountId: account.id };
}

async function cleanupLegacy() {
  if (!legacyUsers.length) return;
  await testSql`delete from customer.wallet_transactions where user_id = any(${legacyUsers})`;
  await testSql`delete from customer.wallet_accounts where user_id = any(${legacyUsers})`;
  await testSql`delete from identity.asp_net_users where id = any(${legacyUsers})`;
  legacyUsers.length = 0;
}

beforeAll(async () => {
  await ensureAccountingSchema();
  await applyViewsOnly();
});

afterAll(async () => {
  await cleanupLegacy();
  await closeTestSql();
});

describe("cut-over", () => {
  it("imports each legacy balance exactly once and reconciles", async () => {
    try {
      const a = await seedLegacyWallet([{ currency: "IRR", amount: String(1_500_000 * TOMAN) }]);
      const b = await seedLegacyWallet([
        { currency: "IRR", amount: String(400_000 * TOMAN) },
        { currency: "USD", amount: "250.00" },
      ]);

      await applyCutover();

      const rows = await testSql<{ user_id: string; currency_code: string; matches: boolean }[]>`
        select user_id::text as user_id, currency_code, matches
        from accounting.v_cutover_reconciliation
        where user_id = any(${[a.userId, b.userId]})
      `;
      expect(rows.length).toBe(3);
      expect(rows.every((r) => r.matches)).toBe(true);

      // Re-running must not credit anybody a second time.
      await applyCutover();

      const after = await testSql<{ matches: boolean }[]>`
        select matches from accounting.v_cutover_reconciliation
        where user_id = any(${[a.userId, b.userId]})
      `;
      expect(after.every((r) => r.matches)).toBe(true);

      // Scoped to this test's users: the database may hold other legacy wallets, and
      // the cut-over imports every one of them.
      const [{ n }] = await testSql<{ n: number }[]>`
        select count(*)::int as n
        from accounting.journal_entries e
        join accounting.wallets w on w.id = e.source_id
        where e.source_type = 'opening_balance' and w.user_id = any(${[a.userId, b.userId]})
      `;
      expect(n).toBe(3);
    } finally {
      await resetAccountingData();
      await cleanupLegacy();
    }
  });

  it("counts only completed legacy transactions, ignoring pending ones", async () => {
    try {
      const user = await seedLegacyWallet([
        { currency: "IRR", amount: String(600_000 * TOMAN), status: "completed" },
        { currency: "IRR", amount: String(900_000 * TOMAN), status: "pending" },
      ]);

      await applyCutover();

      const [row] = await testSql<{ ledger_balance: string; matches: boolean }[]>`
        select ledger_balance::text as ledger_balance, matches
        from accounting.v_cutover_reconciliation where user_id = ${user.userId}
      `;
      // The pending 900,000 must not be imported — it is not the customer's money yet.
      expect(Number(row.ledger_balance)).toBe(600_000 * TOMAN);
      expect(row.matches).toBe(true);
    } finally {
      await resetAccountingData();
      await cleanupLegacy();
    }
  });

  it("refuses to import a negative legacy balance and reports it instead", async () => {
    try {
      // The legacy overdraft race already took more than this customer had.
      const user = await seedLegacyWallet([
        { currency: "IRR", amount: String(100_000 * TOMAN) },
        { currency: "IRR", amount: String(-300_000 * TOMAN) },
      ]);

      await applyCutover();

      const [wallet] = await testSql<{ n: number }[]>`
        select count(*)::int as n from accounting.wallets where user_id = ${user.userId}
      `;
      expect(wallet.n).toBe(0);

      const [exception] = await testSql<{ reason: string; legacy_balance: string }[]>`
        select reason, legacy_balance::text as legacy_balance
        from accounting.v_cutover_exceptions where user_id = ${user.userId}
      `;
      expect(exception.reason).toBe("negative_legacy_balance");
      expect(Number(exception.legacy_balance)).toBe(-200_000 * TOMAN);
    } finally {
      await resetAccountingData();
      await cleanupLegacy();
    }
  });

  it("leaves the imported total sitting in the opening-balance suspense account", async () => {
    try {
      await seedLegacyWallet([{ currency: "IRR", amount: String(750_000 * TOMAN) }]);
      await applyCutover();

      const [suspense] = await testSql<{ unexplained_remainder: string }[]>`
        select unexplained_remainder::text as unexplained_remainder
        from accounting.v_opening_balance_suspense where currency_code = 'IRR'
      `;
      // Nothing has been recorded on the asset side yet, so the whole import sits here.
      // Compared against the total actually imported rather than a literal, because the
      // database may hold other legacy wallets that were imported alongside the fixture.
      const [imported] = await testSql<{ total: string }[]>`
        select coalesce(sum(l.credit_amount), 0)::text as total
        from accounting.journal_lines l
        join accounting.journal_entries e on e.id = l.entry_id
        where e.source_type = 'opening_balance' and l.currency_code = 'IRR'
      `;
      expect(Number(suspense.unexplained_remainder)).toBe(Number(imported.total));
      expect(Number(imported.total)).toBeGreaterThanOrEqual(750_000 * TOMAN);

      const [tb] = await testSql<{ d: string; c: string }[]>`
        select coalesce(sum(total_debit), 0)::text as d, coalesce(sum(total_credit), 0)::text as c
        from accounting.v_trial_balance
      `;
      expect(tb.d).toBe(tb.c);

      const drift = await testSql`select * from accounting.v_wallet_balance_drift`;
      expect(drift.length).toBe(0);
    } finally {
      await resetAccountingData();
      await cleanupLegacy();
    }
  });
});
