import "server-only";

import sql from "@/config/database/db";

/**
 * Loyalty settings live in a webapp-managed key-value table (loyalty.settings),
 * created idempotently at runtime — same pattern as booking.payment_gateways in
 * src/payment/server/payment-gateway.repository.ts.
 *
 * Earn-rate formula (applied at read time in profile/rewards/rewards.data.ts):
 *   points = floor(spend_in_rial / divisor)
 * Default divisor 1,000,000 => an 80,000,000 Rial spend earns 80 points.
 *
 * Existing-points policy: the rewards-page balance is DERIVED from booking spend
 * on every read (nothing is persisted per booking), so changing the divisor
 * rescales the displayed balance for all history at the new rate with no data
 * corruption. Admin-entered loyalty.ledger rows and loyalty.accounts.points_balance
 * (used by the profile stats tile) are separate and untouched.
 */

export const POINTS_EARN_RATE_KEY = "points_earn_rate";
export const DEFAULT_EARN_RATE_DIVISOR = 1_000_000;

export async function ensureLoyaltySettingsTable(): Promise<void> {
  await sql`create schema if not exists loyalty`;

  await sql`
    create table if not exists loyalty.settings (
      key text primary key,
      value jsonb default '{}'::jsonb not null,
      updated_at timestamp with time zone default now() not null
    )
  `;

  await sql`
    insert into loyalty.settings (key, value)
    values (
      ${POINTS_EARN_RATE_KEY},
      ${JSON.stringify({ divisor: DEFAULT_EARN_RATE_DIVISOR })}::jsonb
    )
    on conflict (key) do nothing
  `;
}

/**
 * Returns the configured earn-rate divisor. Falls back to
 * DEFAULT_EARN_RATE_DIVISOR when the stored value is missing, non-numeric,
 * or <= 0 (guards against division by zero).
 */
export async function getPointsEarnDivisor(): Promise<number> {
  await ensureLoyaltySettingsTable();

  const rows = await sql<{ divisor: string | null }[]>`
    select value ->> 'divisor' as divisor
    from loyalty.settings
    where key = ${POINTS_EARN_RATE_KEY}
    limit 1
  `;

  const divisor = Number(rows[0]?.divisor);
  if (!Number.isFinite(divisor) || divisor <= 0) return DEFAULT_EARN_RATE_DIVISOR;
  return divisor;
}

export async function updatePointsEarnDivisor(divisor: number): Promise<void> {
  if (!Number.isFinite(divisor) || divisor <= 0) {
    throw new Error("Earn-rate divisor must be a positive number.");
  }

  await ensureLoyaltySettingsTable();

  await sql`
    insert into loyalty.settings (key, value)
    values (
      ${POINTS_EARN_RATE_KEY},
      ${JSON.stringify({ divisor })}::jsonb
    )
    on conflict (key) do update set
      value = excluded.value,
      updated_at = now()
  `;
}

/** points = floor(spend_in_rial / divisor); never negative. */
export function computeEarnedPoints(totalSpent: number, divisor: number): number {
  if (!Number.isFinite(divisor) || divisor <= 0) divisor = DEFAULT_EARN_RATE_DIVISOR;
  if (!Number.isFinite(totalSpent)) return 0;
  return Math.max(0, Math.floor(totalSpent / divisor));
}
