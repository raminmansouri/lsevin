/**
 * Test harness for the accounting module.
 *
 * Gives each test a fresh transaction that is rolled back at the end, plus a seeded
 * fiscal period and a wallet, so tests assert on behaviour rather than on setup.
 *
 * This deliberately does NOT import @/config/database/db: that module is `server-only`
 * and reads DATABASE_URL at import time, which is wrong for tests pointed at a local
 * database on a different port.
 */
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

import type { TransactionSql } from "postgres";

const require = createRequire(import.meta.url);
const postgres = require("postgres");

export type TestTx = TransactionSql<Record<string, never>>;

const APP_ROOT = path.resolve(__dirname, "../../../..");

function resolveTestDatabaseUrl(): string {
  if (process.env.ACCOUNTING_TEST_DATABASE_URL) return process.env.ACCOUNTING_TEST_DATABASE_URL;

  const envFile = path.join(APP_ROOT, ".env.local");
  if (!fs.existsSync(envFile)) {
    throw new Error(
      "Set ACCOUNTING_TEST_DATABASE_URL, or provide .env.local with DATABASE_URL, to run the accounting tests."
    );
  }
  const match = fs.readFileSync(envFile, "utf8").match(/^\s*DATABASE_URL\s*=\s*(.+)\s*$/m);
  if (!match) throw new Error("DATABASE_URL was not found in .env.local.");

  const url = new URL(match[1].trim().replace(/^["']|["']$/g, ""));
  // The local lsevin-pg container is republished here; 5432 belongs to another project.
  url.port = process.env.ACCOUNTING_TEST_DB_PORT ?? "5442";
  return url.toString();
}

export const testSql = postgres(resolveTestDatabaseUrl(), {
  max: 4,
  prepare: false,
  onnotice: () => {},
});

const MIGRATIONS = [
  "0003_accounting_core.sql",
  "0004_accounting_ledger.sql",
  "0005_accounting_wallets.sql",
  "0006_accounting_flows.sql",
  "0007_accounting_audit.sql",
  "0008_accounting_seed.sql",
  "0009_accounting_reports.sql",
  "0010_accounting_legacy_reconciliation.sql",
  "0012_accounting_cutover_checks.sql",
  // 0011 (the opening-balance import) is deliberately NOT here: it reads live legacy
  // wallet data and posts entries, which is the cut-over itself. cutover.test.ts applies
  // it explicitly against its own fixture.
];

/**
 * Rebuilds the accounting schema from the migration files.
 *
 * This is DDL and therefore commits — it is the one thing here that outlives the test
 * run. It drops and recreates rather than skipping when the schema already exists,
 * because a previous run leaves behind whatever the migrations looked like *then*: an
 * edited migration would silently be tested against the old shape, and the tests would
 * pass while describing a schema nobody has.
 *
 * Only the `accounting` schema is touched — it is owned entirely by these migrations.
 * The changes 0003 makes to finance.currencies are idempotent and are left in place.
 * setup-env.ts refuses to run against anything but a local host.
 */
export async function ensureAccountingSchema(): Promise<void> {
  await testSql.unsafe("drop schema if exists accounting cascade").simple();

  for (const file of MIGRATIONS) {
    const sqlText = fs
      .readFileSync(path.join(APP_ROOT, "db", "migrations", file), "utf8")
      .replace(/^\s*(begin|commit)\s*;\s*$/gim, "");
    await testSql.unsafe(sqlText).simple();
  }

  // A committed fiscal period covering today. Tests that exercise a service which opens
  // its own transaction (the deposit and withdrawal services do) cannot rely on the
  // period the rollback harness creates — that one disappears with the rollback, and
  // postJournalEntry would refuse with "no fiscal period covers ...".
  await testSql`
    insert into accounting.fiscal_years (code, starts_on, ends_on)
    values (
      to_char(now(), 'YYYY'),
      date_trunc('year', now())::date,
      (date_trunc('year', now()) + interval '1 year - 1 day')::date
    )
    on conflict (code) do nothing
  `;
  await testSql`
    insert into accounting.fiscal_periods (fiscal_year_id, code, starts_on, ends_on)
    select fy.id, to_char(now(), 'YYYY-MM'),
           date_trunc('month', now())::date,
           (date_trunc('month', now()) + interval '1 month - 1 day')::date
    from accounting.fiscal_years fy
    where fy.code = to_char(now(), 'YYYY')
    on conflict (code) do nothing
  `;
}

const ROLLBACK = Symbol("rollback");

export type TestContext = {
  tx: TestTx;
  periodId: string;
  walletId: string;
  userId: string;
  accounts: Record<string, string>;
};

/**
 * Runs `fn` inside a transaction that is always rolled back.
 *
 * A unique suffix is woven into the fiscal-period code so concurrent runs never collide
 * on the unique constraint, and the period covers today so postJournalEntry resolves it.
 */
export async function withTestTransaction<T>(
  fn: (ctx: TestContext) => Promise<T>,
  options: { currency?: string; seedWallet?: boolean } = {}
): Promise<T> {
  const currency = options.currency ?? "IRR";
  let captured: T;

  try {
    await testSql.begin(async (tx) => {
      const suffix = Math.random().toString(36).slice(2, 10);

      // Reuse the period ensureAccountingSchema committed. Creating another one covering
      // the same month would trip ex_accounting_periods_no_overlap — which is the
      // constraint doing its job, since an entry must resolve to exactly one period.
      const [period] = await tx<{ id: string }[]>`
        select id::text as id
        from accounting.fiscal_periods
        where current_date between starts_on and ends_on
        limit 1
      `;
      if (!period) {
        throw new Error("No fiscal period covers today — ensureAccountingSchema did not seed one.");
      }

      const accountRows = await tx<{ system_key: string; id: string }[]>`
        select system_key, id::text as id from accounting.accounts where system_key is not null
      `;
      const accounts = Object.fromEntries(accountRows.map((r) => [r.system_key, r.id]));

      const userId = crypto.randomUUID();
      let walletId = "";
      if (options.seedWallet !== false) {
        const [wallet] = await tx<{ id: string }[]>`
          insert into accounting.wallets (user_id, currency_code, account_id)
          values (${userId}, ${currency}, ${accounts.user_wallet_liability})
          returning id::text as id
        `;
        walletId = wallet.id;
      }

      captured = await fn({
        tx: tx as TestTx,
        periodId: period.id,
        walletId,
        userId,
        accounts,
      });

      throw ROLLBACK;
    });
  } catch (error) {
    if (error !== ROLLBACK) throw error;
  }

  return captured!;
}

/**
 * Runs `fn` inside a savepoint that is always released or rolled back.
 *
 * Needed whenever a test asserts more than one expected failure: the first failed
 * statement aborts the whole transaction, and every statement after it comes back with
 * "current transaction is aborted" instead of the error being asserted on.
 */
export async function withSavepoint<T>(tx: TestTx, fn: () => Promise<T>): Promise<T> {
  const name = `sp_${Math.random().toString(36).slice(2, 10)}`;
  await tx.unsafe(`savepoint ${name}`);
  try {
    const result = await fn();
    await tx.unsafe(`release savepoint ${name}`);
    return result;
  } catch (error) {
    await tx.unsafe(`rollback to savepoint ${name}`);
    throw error;
  }
}

/**
 * Wipes all movement data, keeping the chart of accounts, settings and fiscal periods.
 *
 * TRUNCATE rather than DELETE on purpose: the ledger's append-only trigger correctly
 * refuses a DELETE, and that guarantee must not be weakened for the convenience of a
 * test. TRUNCATE does not fire row-level triggers, so this resets the fixture without
 * giving anything a way to delete a single posted line.
 */
export async function resetAccountingData(): Promise<void> {
  await testSql.unsafe(`
    truncate
      accounting.wallet_ledger,
      accounting.journal_lines,
      accounting.journal_entries,
      accounting.deposit_requests,
      accounting.withdrawal_requests,
      accounting.gateway_transactions,
      accounting.crypto_transactions,
      accounting.audit_log,
      accounting.wallets
    restart identity cascade
  `);
}

export async function closeTestSql(): Promise<void> {
  await testSql.end({ timeout: 5 });
}
