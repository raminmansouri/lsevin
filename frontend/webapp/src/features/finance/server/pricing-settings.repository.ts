import "server-only";

import sql from "@/config/database/db";

/**
 * Pricing settings live in a webapp-managed key-value table (finance.settings),
 * created idempotently at runtime — same pattern as loyalty.settings.
 *
 * International price coefficient (Prompt 2): international patients are charged a
 * configurable multiple of the converted domestic price. The multiplier is defined
 * PER PROVIDER (category.service_providers.international_price_multiplier); when a
 * provider's column is NULL, this global default applies. Nothing is hardcoded —
 * both the per-provider value and this default are editable in admin.
 */

export const INTERNATIONAL_MULTIPLIER_KEY = "international_price_multiplier";
export const DEFAULT_INTERNATIONAL_MULTIPLIER = 3;

export async function ensurePricingSettingsTable(): Promise<void> {
  await sql`create schema if not exists finance`;

  await sql`
    create table if not exists finance.settings (
      key text primary key,
      value jsonb default '{}'::jsonb not null,
      updated_at timestamp with time zone default now() not null
    )
  `;

  await sql`
    insert into finance.settings (key, value)
    values (
      ${INTERNATIONAL_MULTIPLIER_KEY},
      -- sql.json, not JSON.stringify(...) plus a jsonb cast: the latter double-encodes
      -- into a jsonb string scalar, so the value reads back null and the multiplier
      -- silently pins to the default. (Seed rows came from raw SQL, so they escaped it.)
      ${sql.json({ value: DEFAULT_INTERNATIONAL_MULTIPLIER })}
    )
    on conflict (key) do nothing
  `;
}

/**
 * Global default international multiplier. Falls back to
 * DEFAULT_INTERNATIONAL_MULTIPLIER when the stored value is missing, non-numeric,
 * or <= 0.
 */
export async function getDefaultInternationalMultiplier(): Promise<number> {
  await ensurePricingSettingsTable();

  const rows = await sql<{ value: string | null }[]>`
    select value ->> 'value' as value
    from finance.settings
    where key = ${INTERNATIONAL_MULTIPLIER_KEY}
    limit 1
  `;

  const value = Number(rows[0]?.value);
  if (!Number.isFinite(value) || value <= 0) return DEFAULT_INTERNATIONAL_MULTIPLIER;
  return value;
}

export async function updateDefaultInternationalMultiplier(value: number): Promise<void> {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error("International price multiplier must be a positive number.");
  }

  await ensurePricingSettingsTable();

  await sql`
    insert into finance.settings (key, value)
    values (
      ${INTERNATIONAL_MULTIPLIER_KEY},
      ${sql.json({ value })}
    )
    on conflict (key) do update set
      value = excluded.value,
      updated_at = now()
  `;
}
