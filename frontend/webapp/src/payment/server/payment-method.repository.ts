import "server-only";

import sql from "@/config/database/db";

export type BankAccountDetails = {
  id: string;
  bankName: string;
  accountHolder: string;
  accountNumber: string;
  iban: string;
  cardNumber: string;
  note: string;
};

export type PaymentMethodConfiguration = {
  bankAccounts?: BankAccountDetails[];
  [key: string]: unknown;
};

export type PaymentMethodConfig = {
  code: string;
  provider: string | null;
  displayName: string;
  description: string;
  isActive: boolean;
  sortOrder: number;
  supportsAuthorize: boolean;
  supportsCapture: boolean;
  supportsRefund: boolean;
  configuration: PaymentMethodConfiguration;
  createdAt: string | null;
};

export const MANUAL_PAYMENT_METHOD_CODES = ["pay_on_delivery", "bank_receipt"] as const;
export type ManualPaymentMethodCode = (typeof MANUAL_PAYMENT_METHOD_CODES)[number];

type PaymentMethodRow = {
  code: string;
  provider: string | null;
  nameTranslations: Record<string, string> | null;
  descriptionTranslations: Record<string, string> | null;
  isActive: boolean;
  sortOrder: number;
  supportsAuthorize: boolean;
  supportsCapture: boolean;
  supportsRefund: boolean;
  configuration: PaymentMethodConfiguration | null;
  createDate: string | null;
};

// Same footgun as booking.payment_gateways: postgres.js infers jsonb from the cast, so a
// pre-stringified value gets encoded twice and lands as a jsonb string scalar instead of
// an object. Never JSON.stringify(...) before handing a value to sql.json().
function jsonb(value: unknown) {
  return sql.json((value ?? {}) as never);
}

function pickTranslation(value: Record<string, string> | null | undefined, fallback: string): string {
  if (!value || typeof value !== "object") return fallback;
  return value["fa-IR"] ?? value["en-US"] ?? value.en ?? Object.values(value)[0] ?? fallback;
}

function normalizeConfiguration(value: unknown): PaymentMethodConfiguration {
  const raw = value && typeof value === "object" ? (value as PaymentMethodConfiguration) : {};
  const bankAccounts = Array.isArray(raw.bankAccounts)
    ? raw.bankAccounts
        .filter((account) => Boolean(account) && typeof account === "object")
        .map((account: Partial<BankAccountDetails>, index) => ({
          id: String(account.id || `account-${index + 1}`),
          bankName: String(account.bankName || "").trim(),
          accountHolder: String(account.accountHolder || "").trim(),
          accountNumber: String(account.accountNumber || "").trim(),
          iban: String(account.iban || "").trim(),
          cardNumber: String(account.cardNumber || "").trim(),
          note: String(account.note || "").trim(),
        }))
    : [];

  return { ...raw, bankAccounts };
}

function mapRow(row: PaymentMethodRow): PaymentMethodConfig {
  return {
    code: row.code,
    provider: row.provider,
    displayName: pickTranslation(row.nameTranslations, row.code),
    description: pickTranslation(row.descriptionTranslations, ""),
    isActive: row.isActive,
    sortOrder: row.sortOrder,
    supportsAuthorize: Boolean(row.supportsAuthorize),
    supportsCapture: Boolean(row.supportsCapture),
    supportsRefund: Boolean(row.supportsRefund),
    configuration: normalizeConfiguration(row.configuration),
    createdAt: row.createDate,
  };
}

/**
 * shop.payment_methods already exists in the live database (it's read from several
 * places: booking-pro checkout, the shop checkout prototype, booking-admin lookups) but
 * has no tracked migration anywhere in this repo. `create table if not exists` is a
 * pure no-op against the real table -- this only matters for a fresh environment that
 * doesn't have it yet -- so it's safe to run defensively the same way
 * booking.payment_gateways does.
 */
export async function ensurePaymentMethodsTable(): Promise<void> {
  await sql`
    create table if not exists shop.payment_methods (
      id uuid default public.uuid_generate_v4() not null primary key,
      code text not null unique,
      provider text,
      name_translations jsonb default '{}'::jsonb not null,
      description_translations jsonb default '{}'::jsonb not null,
      supports_authorize boolean default false not null,
      supports_capture boolean default true not null,
      supports_refund boolean default false not null,
      configuration jsonb default '{}'::jsonb not null,
      is_active boolean default false not null,
      sort_order integer default 100 not null,
      create_date timestamp with time zone default now() not null
    )
  `;

  await sql`
    insert into shop.payment_methods (
      code, provider, name_translations, description_translations,
      supports_authorize, supports_capture, supports_refund,
      configuration, is_active, sort_order
    ) values (
      'pay_on_delivery',
      'pay_on_delivery',
      ${jsonb({ "fa-IR": "پرداخت در محل", "en-US": "Pay on delivery" })},
      ${jsonb({
        "fa-IR": "هزینه را هنگام ارائه خدمت به‌صورت نقدی پرداخت کنید.",
        "en-US": "Pay in cash when the service is delivered.",
      })},
      false,
      true,
      false,
      ${jsonb({})},
      false,
      30
    )
    on conflict (code) do nothing
  `;

  await sql`
    insert into shop.payment_methods (
      code, provider, name_translations, description_translations,
      supports_authorize, supports_capture, supports_refund,
      configuration, is_active, sort_order
    ) values (
      'bank_receipt',
      'bank_receipt',
      ${jsonb({ "fa-IR": "پرداخت با فیش واریزی", "en-US": "Bank receipt upload" })},
      ${jsonb({
        "fa-IR": "مبلغ را به یکی از حساب‌های زیر واریز کرده و تصویر فیش را آپلود کنید.",
        "en-US": "Transfer the amount to one of the accounts below and upload the receipt.",
      })},
      false,
      true,
      false,
      ${jsonb({ bankAccounts: [] })},
      false,
      40
    )
    on conflict (code) do nothing
  `;
}

export async function listPaymentMethodConfigs(): Promise<PaymentMethodConfig[]> {
  await ensurePaymentMethodsTable();

  // shop.payment_methods is a pre-existing, shared table (also read by the shop
  // checkout prototype and booking-admin lookups) -- it can carry rows this admin
  // screen has no business managing. Without this filter, any legacy/unrelated code
  // already sitting in that table renders here too, and clicking its toggle button
  // sends a code MANUAL_PAYMENT_METHOD_CODES/the zod schema doesn't recognize, which
  // fails validation with a raw "invalid option" error instead of doing anything.
  const rows = await sql<PaymentMethodRow[]>`
    select code, provider,
           name_translations as "nameTranslations",
           description_translations as "descriptionTranslations",
           is_active as "isActive",
           sort_order as "sortOrder",
           supports_authorize as "supportsAuthorize",
           supports_capture as "supportsCapture",
           supports_refund as "supportsRefund",
           configuration,
           create_date::text as "createDate"
    from shop.payment_methods
    where code = any(${MANUAL_PAYMENT_METHOD_CODES as unknown as string[]})
    order by sort_order asc, code asc
  `;

  return rows.map(mapRow);
}

export async function getPaymentMethodConfig(code: string): Promise<PaymentMethodConfig | null> {
  await ensurePaymentMethodsTable();
  const normalizedCode = String(code || "").trim().toLowerCase();
  if (!normalizedCode) return null;

  const rows = await sql<PaymentMethodRow[]>`
    select code, provider,
           name_translations as "nameTranslations",
           description_translations as "descriptionTranslations",
           is_active as "isActive",
           sort_order as "sortOrder",
           supports_authorize as "supportsAuthorize",
           supports_capture as "supportsCapture",
           supports_refund as "supportsRefund",
           configuration,
           create_date::text as "createDate"
    from shop.payment_methods
    where code = ${normalizedCode}
    limit 1
  `;

  return rows[0] ? mapRow(rows[0]) : null;
}

export async function savePaymentMethodConfig(input: {
  code: string;
  displayName: string;
  description?: string | null;
  isActive: boolean;
  sortOrder?: number;
  bankAccounts?: BankAccountDetails[];
}): Promise<PaymentMethodConfig> {
  await ensurePaymentMethodsTable();
  const code = String(input.code || "").trim().toLowerCase();
  if (!MANUAL_PAYMENT_METHOD_CODES.includes(code as ManualPaymentMethodCode)) {
    throw new Error(`Unsupported payment method: ${input.code}`);
  }

  // Blank scratch rows (added via "Add bank account" and never filled in) are dropped;
  // anything the admin actually typed into is kept as-is, even if it's not yet complete
  // enough to identify a transfer target -- silently discarding a partially-filled row
  // would erase the bank name/holder they typed without any indication it happened.
  const bankAccounts = (normalizeConfiguration({ bankAccounts: input.bankAccounts }).bankAccounts ?? []).filter(
    (account) => account.bankName || account.accountHolder || account.accountNumber || account.iban || account.cardNumber || account.note
  );

  // Enabling bank_receipt with no account a customer could actually transfer to would
  // surface a payment option that can never be completed -- the same failure mode the
  // Zarinpal gateway guards against by showing "not configured" instead of letting an
  // empty merchant id go live.
  const hasIdentifiableAccount = bankAccounts.some((account) => account.cardNumber || account.iban || account.accountNumber);
  if (code === "bank_receipt" && input.isActive && !hasIdentifiableAccount) {
    throw new Error("Add at least one bank account with a card number, IBAN, or account number before enabling bank receipt payment.");
  }

  const displayName = String(input.displayName || "").trim() || code;
  const description = String(input.description || "").trim();
  const configuration = code === "bank_receipt" ? { bankAccounts } : {};

  const rows = await sql<PaymentMethodRow[]>`
    update shop.payment_methods
       set name_translations = ${jsonb({ "fa-IR": displayName, "en-US": displayName })},
           description_translations = ${jsonb({ "fa-IR": description, "en-US": description })},
           is_active = ${input.isActive},
           sort_order = ${Number.isFinite(input.sortOrder) ? Number(input.sortOrder) : 100},
           configuration = ${jsonb(configuration)}
     where code = ${code}
     returning
      code, provider,
      name_translations as "nameTranslations",
      description_translations as "descriptionTranslations",
      is_active as "isActive",
      sort_order as "sortOrder",
      supports_authorize as "supportsAuthorize",
      supports_capture as "supportsCapture",
      supports_refund as "supportsRefund",
      configuration,
      create_date::text as "createDate"
  `;

  const method = rows[0];
  if (!method) throw new Error(`Payment method ${code} was not found.`);
  return mapRow(method);
}

export async function togglePaymentMethodConfig(input: {
  code: string;
  isActive: boolean;
}): Promise<PaymentMethodConfig> {
  await ensurePaymentMethodsTable();
  const code = String(input.code || "").trim().toLowerCase();
  if (!MANUAL_PAYMENT_METHOD_CODES.includes(code as ManualPaymentMethodCode)) {
    throw new Error(`Unsupported payment method: ${input.code}`);
  }

  if (input.isActive && code === "bank_receipt") {
    const existing = await getPaymentMethodConfig(code);
    const hasIdentifiableAccount = (existing?.configuration.bankAccounts ?? []).some(
      (account) => account.cardNumber || account.iban || account.accountNumber
    );
    if (!hasIdentifiableAccount) {
      throw new Error("Add at least one bank account with a card number, IBAN, or account number before enabling bank receipt payment.");
    }
  }

  const rows = await sql<PaymentMethodRow[]>`
    update shop.payment_methods
       set is_active = ${input.isActive}
     where code = ${code}
     returning
      code, provider,
      name_translations as "nameTranslations",
      description_translations as "descriptionTranslations",
      is_active as "isActive",
      sort_order as "sortOrder",
      supports_authorize as "supportsAuthorize",
      supports_capture as "supportsCapture",
      supports_refund as "supportsRefund",
      configuration,
      create_date::text as "createDate"
  `;

  const method = rows[0];
  if (!method) throw new Error(`Payment method ${code} was not found.`);
  return mapRow(method);
}
