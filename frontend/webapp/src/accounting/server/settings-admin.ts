import "server-only";

import db from "@/config/database/db";

/**
 * Admin read/write for accounting.settings.
 *
 * Every value is validated here rather than trusted from the form, because these numbers
 * decide how much of a customer's money moves: a platform fee typed as `500` instead of
 * `5`, or a withdrawal minimum saved as an empty string, is not a cosmetic mistake.
 */

export class SettingsValidationError extends Error {
  constructor(
    message: string,
    readonly key: string
  ) {
    super(message);
    this.name = "SettingsValidationError";
  }
}

export type SettingKind = "percent" | "per_currency_amount" | "rate_limit" | "confirmations" | "readonly";

export type SettingDefinition = {
  key: string;
  kind: SettingKind;
  /** Grouping for the UI. */
  group: "fees" | "withdrawal" | "deposit" | "crypto" | "limits" | "core";
};

/**
 * The settings the admin panel exposes, and how each is edited. Anything not listed is
 * still readable in the database but is not offered as a form field — a generic
 * "edit any jsonb" box on financial configuration is how a typo becomes an incident.
 */
export const SETTING_DEFINITIONS: SettingDefinition[] = [
  { key: "base_currency", kind: "readonly", group: "core" },
  { key: "platform_fee_percent", kind: "percent", group: "fees" },
  { key: "withdrawal.fee_percent", kind: "percent", group: "fees" },
  { key: "withdrawal.min_amount", kind: "per_currency_amount", group: "withdrawal" },
  { key: "withdrawal.max_amount", kind: "per_currency_amount", group: "withdrawal" },
  { key: "withdrawal.daily_cap", kind: "per_currency_amount", group: "withdrawal" },
  { key: "withdrawal.fee_fixed", kind: "per_currency_amount", group: "withdrawal" },
  { key: "withdrawal.auto_approve_below", kind: "per_currency_amount", group: "withdrawal" },
  { key: "deposit.min_amount", kind: "per_currency_amount", group: "deposit" },
  { key: "deposit.max_amount", kind: "per_currency_amount", group: "deposit" },
  { key: "crypto.required_confirmations", kind: "confirmations", group: "crypto" },
  { key: "rate_limit.deposit", kind: "rate_limit", group: "limits" },
  { key: "rate_limit.withdrawal", kind: "rate_limit", group: "limits" },
];

export type SettingRow = {
  key: string;
  value: unknown;
  description: string | null;
  updatedAt: string;
  updatedBy: string | null;
  kind: SettingKind;
  group: SettingDefinition["group"];
};

export async function listSettings(): Promise<SettingRow[]> {
  const rows = await db<
    { key: string; value: unknown; description: string | null; updated_at: string; updated_by: string | null }[]
  >`
    select key, value, description, updated_at::text as updated_at, updated_by::text as updated_by
    from accounting.settings
  `;

  const byKey = new Map(rows.map((r) => [r.key, r]));

  return SETTING_DEFINITIONS.flatMap((def) => {
    const row = byKey.get(def.key);
    if (!row) return [];
    return [
      {
        key: row.key,
        value: row.value,
        description: row.description,
        updatedAt: row.updated_at,
        updatedBy: row.updated_by,
        kind: def.kind,
        group: def.group,
      },
    ];
  });
}

export async function listActiveCurrencies(): Promise<{ code: string; decimalDigits: number }[]> {
  return db<{ code: string; decimalDigits: number }[]>`
    select code, decimal_digits as "decimalDigits"
    from finance.currencies
    where is_active = true
    order by sort_order, code
  `;
}

const DECIMAL = /^\d+(\.\d+)?$/;

function assertDecimal(key: string, raw: string, label: string): string {
  const value = raw.trim();
  if (!DECIMAL.test(value)) {
    throw new SettingsValidationError(`${label} must be a positive number.`, key);
  }
  return value;
}

/**
 * Writes one setting.
 *
 * Values are stored as strings inside the jsonb for amounts, matching how the services
 * read them (`value ->> 'IRR'` then cast to numeric in Postgres). Converting through a
 * JavaScript number on the way in would round an 18-decimal figure before it was ever
 * saved.
 */
export async function updateSetting(input: {
  key: string;
  kind: SettingKind;
  /** Scalar value, for `percent`. */
  value?: string;
  /** Per-currency map, for `per_currency_amount` and `confirmations`. */
  entries?: Record<string, string>;
  /** For `rate_limit`. */
  limit?: string;
  windowSeconds?: string;
  actorUserId: string;
}): Promise<void> {
  if (input.kind === "readonly") {
    throw new SettingsValidationError(
      "This setting cannot be changed from the panel. The base currency is baked into every posted entry's snapshot; changing it would silently reinterpret history.",
      input.key
    );
  }

  let next: unknown;

  if (input.kind === "percent") {
    const value = assertDecimal(input.key, String(input.value ?? ""), "Percentage");
    if (Number(value) > 100) {
      throw new SettingsValidationError("A percentage cannot be greater than 100.", input.key);
    }
    next = Number(value);
  } else if (input.kind === "per_currency_amount") {
    const entries: Record<string, string> = {};
    for (const [currency, raw] of Object.entries(input.entries ?? {})) {
      const value = String(raw ?? "").trim();
      if (!value) continue; // an empty field removes the limit for that currency
      entries[currency.toUpperCase()] = assertDecimal(input.key, value, `Amount for ${currency}`);
    }
    next = entries;
  } else if (input.kind === "confirmations") {
    const entries: Record<string, number> = {};
    for (const [currency, raw] of Object.entries(input.entries ?? {})) {
      const value = String(raw ?? "").trim();
      if (!value) continue;
      if (!/^\d+$/.test(value)) {
        throw new SettingsValidationError(
          `Confirmations for ${currency} must be a whole number.`,
          input.key
        );
      }
      entries[currency.toUpperCase()] = Number(value);
    }
    next = entries;
  } else {
    const limit = String(input.limit ?? "").trim();
    const windowSeconds = String(input.windowSeconds ?? "").trim();
    if (!/^\d+$/.test(limit) || !/^\d+$/.test(windowSeconds) || Number(windowSeconds) <= 0) {
      throw new SettingsValidationError(
        "A rate limit needs a whole-number limit and a positive window in seconds.",
        input.key
      );
    }
    next = { limit: Number(limit), window_seconds: Number(windowSeconds) };
  }

  await db.begin(async (tx) => {
    const [before] = await tx<{ value: unknown }[]>`
      select value from accounting.settings where key = ${input.key} for no key update
    `;
    if (!before) {
      throw new SettingsValidationError(`Unknown setting '${input.key}'.`, input.key);
    }

    await tx`
      update accounting.settings
         set value = ${tx.json(next as never)}, updated_by = ${input.actorUserId}, updated_at = now()
       where key = ${input.key}
    `;

    // Changing what money is worth is exactly the sort of action the audit log exists for.
    await tx`
      insert into accounting.audit_log (actor_user_id, action, entity_type, entity_key, before_state, after_state)
      values (${input.actorUserId}, 'settings.update', 'accounting_setting', ${input.key},
              ${tx.json({ value: before.value } as never)}, ${tx.json({ value: next } as never)})
    `;
  });
}
