import "server-only";

import db from "@/config/database/db";

import type { MoneyString } from "../types";

type SqlClient = typeof db;

/**
 * Reads accounting.settings. Every configurable number — the platform fee, the
 * withdrawal limits, the confirmation counts — lives there and nowhere else, so an
 * accountant can change them without a deploy.
 *
 * These are read on every money operation, so they are cached per request via the
 * caller (server components already dedupe with React cache); no module-level cache
 * here, because a stale fee percentage is worse than an extra query.
 */
export async function getSetting<T = unknown>(key: string, sql: SqlClient = db): Promise<T | null> {
  const [row] = await sql<{ value: T }[]>`
    select value from accounting.settings where key = ${key}
  `;
  return row ? row.value : null;
}

export async function getSettings(keys: string[], sql: SqlClient = db): Promise<Record<string, unknown>> {
  const rows = await sql<{ key: string; value: unknown }[]>`
    select key, value from accounting.settings where key = any(${keys})
  `;
  return Object.fromEntries(rows.map((r) => [r.key, r.value]));
}

export async function getBaseCurrency(sql: SqlClient = db): Promise<string> {
  const value = await getSetting<string>("base_currency", sql);
  if (!value) {
    throw new Error(
      "accounting.settings is missing 'base_currency'. Run the accounting migrations before posting."
    );
  }
  return String(value).toUpperCase();
}

export async function getPlatformFeePercent(sql: SqlClient = db): Promise<string> {
  const value = await getSetting<number | string>("platform_fee_percent", sql);
  if (value === null || value === undefined) {
    throw new Error("accounting.settings is missing 'platform_fee_percent'.");
  }
  return String(value);
}

/**
 * Per-currency limits are stored as `{"IRR": 1000000}`. A currency with no entry has no
 * limit configured — the caller decides whether that means "no limit" or "refuse", and
 * for withdrawals it means refuse.
 */
export async function getCurrencyLimit(
  key: string,
  currencyCode: string,
  sql: SqlClient = db
): Promise<MoneyString | null> {
  const value = await getSetting<Record<string, number | string>>(key, sql);
  if (!value || typeof value !== "object") return null;
  const limit = value[currencyCode.toUpperCase()];
  return limit === undefined || limit === null ? null : String(limit);
}

export async function setSetting(
  key: string,
  value: unknown,
  actorUserId?: string | null,
  sql: SqlClient = db
): Promise<void> {
  await sql`
    insert into accounting.settings (key, value, updated_by, updated_at)
    values (${key}, ${sql.json(value as never)}, ${actorUserId ?? null}, now())
    on conflict (key) do update
      set value = excluded.value,
          updated_by = excluded.updated_by,
          updated_at = now()
  `;
}
