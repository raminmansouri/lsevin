import "server-only";

import sql from "@/config/database/db";
import type { PaymentGatewayCode } from "../types";

export type PaymentGatewayAdminSettings = {
  merchantId?: string | null;
  sandbox?: boolean;
  currency?: "IRR" | "IRT";
  minimumAmount?: number | null;
  requestEndpoint?: string | null;
  verificationEndpoint?: string | null;
  descriptionTemplate?: string | null;
  /**
   * UI contexts where this gateway can be shown. Gateways stay hidden until the
   * user chooses an online-card style payment method.
   */
  enabledContexts?: Array<"booking_online_card" | "wallet_topup">;
  metadata?: Record<string, unknown>;
};

export type PaymentGatewayConfig = {
  id: string;
  code: PaymentGatewayCode;
  provider: string;
  displayName: string;
  description: string | null;
  isEnabled: boolean;
  supportsRefund: boolean;
  sortOrder: number;
  settings: PaymentGatewayAdminSettings;
  createdAt: string;
  updatedAt: string;
  updatedBy: string | null;
};

export type PaymentGatewayRuntimeConfig = Pick<
  PaymentGatewayConfig,
  "code" | "provider" | "displayName" | "isEnabled" | "settings"
>;

export type PublicPaymentGatewayOption = {
  code: PaymentGatewayCode;
  displayName: string;
  provider: string;
  currency: "IRR" | "IRT";
  sortOrder: number;
};

type PaymentGatewayRow = {
  id: string;
  code: string;
  provider: string;
  displayName: string;
  description: string | null;
  isEnabled: boolean;
  supportsRefund: boolean;
  sortOrder: number;
  settings: PaymentGatewayAdminSettings | null;
  createdAt: string;
  updatedAt: string;
  updatedBy: string | null;
};

const SUPPORTED_GATEWAYS = ["zarinpal"] as const;

/**
 * Hand the value to postgres.js as jsonb.
 *
 * NOT `JSON.stringify(...)::jsonb`: postgres.js infers the parameter type from the
 * cast and then serialises the value itself, so a pre-stringified string is encoded
 * a second time and lands as a jsonb *string* scalar rather than an object. Every
 * read then hits `typeof settings !== "object"` in normalizeSettings() and silently
 * falls back to defaults — merchantId null ("not configured") and sandbox true.
 */
function jsonb(value: unknown) {
  return sql.json((value ?? {}) as never);
}

function toBoolean(value: unknown, fallback = false): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["1", "true", "yes", "on", "enabled"].includes(normalized)) return true;
    if (["0", "false", "no", "off", "disabled"].includes(normalized)) return false;
  }
  return fallback;
}

function toNumber(value: unknown, fallback = 0): number {
  if (value === null || value === undefined || value === "") return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeGatewayCode(value: string): PaymentGatewayCode {
  const code = String(value || "").trim().toLowerCase();
  if (!SUPPORTED_GATEWAYS.includes(code as PaymentGatewayCode)) {
    throw new Error(`Unsupported payment gateway: ${value}`);
  }
  return code as PaymentGatewayCode;
}

/**
 * Rows written before the jsonb() fix hold a double-encoded JSON *string* instead of an
 * object. Reading one used to fall through to defaults, which quietly meant "no merchant
 * id" and "sandbox on" — i.e. a configured gateway reporting itself unconfigured, and
 * live payments routed to the sandbox. Unwrap instead of silently defaulting.
 */
function coerceSettings(value: unknown): PaymentGatewayAdminSettings {
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return parsed && typeof parsed === "object" ? (parsed as PaymentGatewayAdminSettings) : {};
    } catch {
      return {};
    }
  }
  return value && typeof value === "object" ? (value as PaymentGatewayAdminSettings) : {};
}

function normalizeSettings(value: PaymentGatewayAdminSettings | null | undefined): PaymentGatewayAdminSettings {
  const settings = coerceSettings(value);
  const currency = String(settings.currency || "IRR").trim().toUpperCase();

  return {
    merchantId: typeof settings.merchantId === "string" ? settings.merchantId.trim() : null,
    sandbox: toBoolean(settings.sandbox, true),
    currency: currency === "IRT" ? "IRT" : "IRR",
    minimumAmount: toNumber(settings.minimumAmount, currency === "IRT" ? 1000 : 10000),
    requestEndpoint: typeof settings.requestEndpoint === "string" ? settings.requestEndpoint.trim() : null,
    verificationEndpoint: typeof settings.verificationEndpoint === "string" ? settings.verificationEndpoint.trim() : null,
    descriptionTemplate:
      typeof settings.descriptionTemplate === "string" && settings.descriptionTemplate.trim()
        ? settings.descriptionTemplate.trim()
        : "LSevin booking {{bookingId}}",
    enabledContexts: Array.isArray(settings.enabledContexts) && settings.enabledContexts.length
      ? settings.enabledContexts.filter((item): item is "booking_online_card" | "wallet_topup" =>
          item === "booking_online_card" || item === "wallet_topup"
        )
      : ["booking_online_card", "wallet_topup"],
    metadata: settings.metadata && typeof settings.metadata === "object" ? settings.metadata : {},
  };
}

function mapRow(row: PaymentGatewayRow): PaymentGatewayConfig {
  return {
    id: row.id,
    code: normalizeGatewayCode(row.code),
    provider: row.provider,
    displayName: row.displayName,
    description: row.description,
    isEnabled: row.isEnabled,
    supportsRefund: row.supportsRefund,
    sortOrder: row.sortOrder,
    settings: normalizeSettings(row.settings),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    updatedBy: row.updatedBy,
  };
}

function maskSecret(value?: string | null) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (raw.length <= 8) return "••••";
  return `${raw.slice(0, 4)}••••${raw.slice(-4)}`;
}

export function maskGatewaySecrets<T extends PaymentGatewayConfig>(gateway: T): T {
  return {
    ...gateway,
    settings: {
      ...gateway.settings,
      merchantId: maskSecret(gateway.settings.merchantId),
    },
  };
}

export async function ensurePaymentGatewayTable(): Promise<void> {
  await sql`
    create table if not exists booking.payment_gateways (
      id uuid default public.uuid_generate_v4() not null primary key,
      code text not null unique,
      provider text not null,
      display_name text not null,
      description text,
      is_enabled boolean default false not null,
      supports_refund boolean default false not null,
      sort_order integer default 100 not null,
      settings jsonb default '{}'::jsonb not null,
      created_at timestamp with time zone default now() not null,
      updated_at timestamp with time zone default now() not null,
      updated_by uuid
    )
  `;

  await sql`
    insert into booking.payment_gateways (
      code,
      provider,
      display_name,
      description,
      is_enabled,
      supports_refund,
      sort_order,
      settings
    ) values (
      'zarinpal',
      'zarinpal',
      'Zarinpal',
      'Iranian online payment gateway for booking checkout.',
      false,
      false,
      10,
      ${jsonb({
        merchantId: "",
        sandbox: true,
        currency: "IRR",
        minimumAmount: 10000,
        descriptionTemplate: "LSevin booking {{bookingId}}",
        enabledContexts: ["booking_online_card", "wallet_topup"],
      })}
    )
    on conflict (code) do nothing
  `;
}

export async function listPaymentGatewayConfigs(input?: {
  includeSecrets?: boolean;
}): Promise<PaymentGatewayConfig[]> {
  await ensurePaymentGatewayTable();

  const rows = await sql<PaymentGatewayRow[]>`
    select
      id::text,
      code,
      provider,
      display_name as "displayName",
      description,
      is_enabled as "isEnabled",
      supports_refund as "supportsRefund",
      sort_order as "sortOrder",
      settings,
      created_at::text as "createdAt",
      updated_at::text as "updatedAt",
      updated_by::text as "updatedBy"
    from booking.payment_gateways
    order by sort_order asc, display_name asc
  `;

  const items = rows.map(mapRow);
  return input?.includeSecrets ? items : items.map(maskGatewaySecrets);
}


export async function listEnabledPaymentGatewayOptions(input?: {
  context?: "booking_online_card" | "wallet_topup";
}): Promise<PublicPaymentGatewayOption[]> {
  await ensurePaymentGatewayTable();
  const context = input?.context ?? "booking_online_card";

  const rows = await sql<PaymentGatewayRow[]>`
    select
      id::text,
      code,
      provider,
      display_name as "displayName",
      description,
      is_enabled as "isEnabled",
      supports_refund as "supportsRefund",
      sort_order as "sortOrder",
      settings,
      created_at::text as "createdAt",
      updated_at::text as "updatedAt",
      updated_by::text as "updatedBy"
    from booking.payment_gateways
    where is_enabled = true
      and (
        not (settings ? 'enabledContexts')
        or settings -> 'enabledContexts' ? ${context}
      )
    order by sort_order asc, display_name asc
  `;

  return rows.map(mapRow).map((gateway) => ({
    code: gateway.code,
    displayName: gateway.displayName,
    provider: gateway.provider,
    currency: gateway.settings.currency || "IRR",
    sortOrder: gateway.sortOrder,
  }));
}

export async function getPaymentGatewayConfig(input: {
  code: PaymentGatewayCode | string;
  includeSecrets?: boolean;
}): Promise<PaymentGatewayConfig | null> {
  await ensurePaymentGatewayTable();
  const code = normalizeGatewayCode(String(input.code));

  const rows = await sql<PaymentGatewayRow[]>`
    select
      id::text,
      code,
      provider,
      display_name as "displayName",
      description,
      is_enabled as "isEnabled",
      supports_refund as "supportsRefund",
      sort_order as "sortOrder",
      settings,
      created_at::text as "createdAt",
      updated_at::text as "updatedAt",
      updated_by::text as "updatedBy"
    from booking.payment_gateways
    where code = ${code}
    limit 1
  `;

  const gateway = rows[0] ? mapRow(rows[0]) : null;
  if (!gateway) return null;
  return input.includeSecrets ? gateway : maskGatewaySecrets(gateway);
}

export async function getEnabledPaymentGatewayConfig(input: {
  code: PaymentGatewayCode | string;
}): Promise<PaymentGatewayRuntimeConfig> {
  const gateway = await getPaymentGatewayConfig({ code: input.code, includeSecrets: true });
  if (!gateway) throw new Error(`Payment gateway ${input.code} is not configured.`);
  if (!gateway.isEnabled) throw new Error(`${gateway.displayName} payment gateway is disabled.`);

  return {
    code: gateway.code,
    provider: gateway.provider,
    displayName: gateway.displayName,
    isEnabled: gateway.isEnabled,
    settings: gateway.settings,
  };
}

export async function savePaymentGatewayConfig(input: {
  code: PaymentGatewayCode | string;
  displayName: string;
  description?: string | null;
  isEnabled: boolean;
  supportsRefund?: boolean;
  sortOrder?: number;
  settings: PaymentGatewayAdminSettings;
  updatedBy?: string | null;
}): Promise<PaymentGatewayConfig> {
  await ensurePaymentGatewayTable();

  const code = normalizeGatewayCode(String(input.code));
  const existing = await getPaymentGatewayConfig({ code, includeSecrets: true });
  const existingSettings = existing?.settings ?? {};
  const incomingSettings = normalizeSettings(input.settings);
  const merchantId = String(incomingSettings.merchantId || "").trim() || existingSettings.merchantId || "";
  const settings = normalizeSettings({ ...existingSettings, ...incomingSettings, merchantId });

  const rows = await sql<PaymentGatewayRow[]>`
    insert into booking.payment_gateways (
      code,
      provider,
      display_name,
      description,
      is_enabled,
      supports_refund,
      sort_order,
      settings,
      updated_by
    ) values (
      ${code},
      ${code},
      ${String(input.displayName || "").trim() || code},
      ${input.description || null},
      ${input.isEnabled},
      ${Boolean(input.supportsRefund)},
      ${Number.isFinite(input.sortOrder) ? Number(input.sortOrder) : existing?.sortOrder ?? 100},
      ${jsonb(settings)},
      ${input.updatedBy || null}::uuid
    )
    on conflict (code) do update set
      display_name = excluded.display_name,
      description = excluded.description,
      is_enabled = excluded.is_enabled,
      supports_refund = excluded.supports_refund,
      sort_order = excluded.sort_order,
      settings = excluded.settings,
      updated_by = excluded.updated_by,
      updated_at = now()
    returning
      id::text,
      code,
      provider,
      display_name as "displayName",
      description,
      is_enabled as "isEnabled",
      supports_refund as "supportsRefund",
      sort_order as "sortOrder",
      settings,
      created_at::text as "createdAt",
      updated_at::text as "updatedAt",
      updated_by::text as "updatedBy"
  `;

  const gateway = rows[0];
  if (!gateway) throw new Error("Payment gateway settings could not be saved.");
  return maskGatewaySecrets(mapRow(gateway));
}

export async function togglePaymentGatewayConfig(input: {
  code: PaymentGatewayCode | string;
  isEnabled: boolean;
  updatedBy?: string | null;
}): Promise<PaymentGatewayConfig> {
  await ensurePaymentGatewayTable();
  const code = normalizeGatewayCode(String(input.code));

  const rows = await sql<PaymentGatewayRow[]>`
    update booking.payment_gateways
       set is_enabled = ${input.isEnabled},
           updated_by = ${input.updatedBy || null}::uuid,
           updated_at = now()
     where code = ${code}
     returning
      id::text,
      code,
      provider,
      display_name as "displayName",
      description,
      is_enabled as "isEnabled",
      supports_refund as "supportsRefund",
      sort_order as "sortOrder",
      settings,
      created_at::text as "createdAt",
      updated_at::text as "updatedAt",
      updated_by::text as "updatedBy"
  `;

  const gateway = rows[0];
  if (!gateway) throw new Error(`Payment gateway ${code} was not found.`);
  return maskGatewaySecrets(mapRow(gateway));
}
