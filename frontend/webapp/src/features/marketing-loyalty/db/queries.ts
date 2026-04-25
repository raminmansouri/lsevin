import "server-only";

import sql from "@/config/database/db";

import { getEntityConfig } from "../constants";
import type {
  AdminDashboardStats,
  AdminFormData,
  AdminListParams,
  AdminListResult,
  MarketingLoyaltyEntityKey,
  SelectOption,
  SelectOptionKey,
} from "../types";

type DbRow = Record<string, unknown>;

type SqlListResult = { items: DbRow[]; totalCount: number };

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;
const DEFAULT_TRANSLATION_LOCALE = "en-US";

const TRANSLATION_LOCALE_ALIASES: Record<string, string> = {
  ar: "ar-SA",
  "ar-sa": "ar-SA",
  de: "de-DE",
  "de-de": "de-DE",
  en: "en-US",
  "en-us": "en-US",
  es: "es-ES",
  "es-es": "es-ES",
  fa: "fa-IR",
  "fa-ir": "fa-IR",
  fr: "fr-FR",
  "fr-fr": "fr-FR",
  ku: "ku-KU",
  "ku-ku": "ku-KU",
  tr: "tr-TR",
  "tr-tr": "tr-TR",
};

export function normalizeTranslationLocale(locale?: string | null): string {
  const raw = String(locale || "").trim();
  if (!raw) return DEFAULT_TRANSLATION_LOCALE;

  const normalized = raw.replace(/_/g, "-").toLowerCase();
  const exact = TRANSLATION_LOCALE_ALIASES[normalized];
  if (exact) return exact;

  const base = normalized.split("-")[0];
  return TRANSLATION_LOCALE_ALIASES[base] || raw;
}

function normalizePagination(params?: AdminListParams) {
  const page = Math.max(Number(params?.page || 1), 1);
  const requestedPageSize = Number(params?.pageSize || DEFAULT_PAGE_SIZE);
  const pageSize = Math.min(Math.max(requestedPageSize, 1), MAX_PAGE_SIZE);
  return {
    page,
    pageSize,
    offset: (page - 1) * pageSize,
    q: String(params?.q || "").trim(),
    locale: normalizeTranslationLocale(params?.locale),
  };
}

function toLike(q: string) {
  return `%${q}%`;
}

function rowsToOptions(rows: Array<{ value: string; label: string; helper?: string | null }>): SelectOption[] {
  return rows.map((row) => ({
    value: row.value,
    label: row.label,
    helper: row.helper || undefined,
  }));
}

export async function getMarketingLoyaltyDashboardStats(): Promise<AdminDashboardStats> {
  const [row] = await sql<AdminDashboardStats[]>`
    select
      (select count(*)::int from marketing.offers where coalesce(is_active, false) = true) as "activeOffers",
      (select count(*)::int from marketing.offers where coalesce(is_featured, false) = true) as "featuredOffers",
      (select count(*)::int from loyalty.coupons where is_active = true) as "activeCoupons",
      (select count(*)::int from loyalty.customer_coupons where status = 'Available') as "availableCustomerCoupons",
      (select count(*)::int from loyalty.accounts) as "totalAccounts",
      (select coalesce(sum(points_balance), 0)::int from loyalty.accounts) as "totalPoints",
      (select count(*)::int from loyalty.referrals where status = 'Pending') as "pendingReferrals",
      (select count(*)::int from loyalty.ledger) as "ledgerEntries"
  `;

  return row;
}

export async function getMarketingLoyaltyList(
  entityKey: MarketingLoyaltyEntityKey,
  params?: AdminListParams
): Promise<AdminListResult> {
  const normalized = normalizePagination(params);
  let result: SqlListResult;

  switch (entityKey) {
    case "marketing-offers":
      result = await listMarketingOffers(normalized);
      break;
    case "loyalty-tiers":
      result = await listLoyaltyTiers(normalized);
      break;
    case "loyalty-accounts":
      result = await listLoyaltyAccounts(normalized);
      break;
    case "loyalty-coupons":
      result = await listLoyaltyCoupons(normalized);
      break;
    case "loyalty-customer-coupons":
      result = await listCustomerCoupons(normalized);
      break;
    case "loyalty-ledger":
      result = await listLedger(normalized);
      break;
    case "loyalty-referrals":
      result = await listReferrals(normalized);
      break;
    default:
      throw new Error("Unsupported marketing/loyalty entity.");
  }

  return {
    items: result.items,
    totalCount: result.totalCount,
    page: normalized.page,
    pageSize: normalized.pageSize,
    pageCount: Math.max(Math.ceil(result.totalCount / normalized.pageSize), 1),
  };
}

async function listMarketingOffers({ q, locale, pageSize, offset }: ReturnType<typeof normalizePagination>): Promise<SqlListResult> {
  const like = toLike(q);
  const items = await sql<DbRow[]>`
    select
      o.id::text as id,
      o.id as "numericId",
      o.title,
      o.subtitle,
      o.discount_percent as "discountPercent",
      o.valid_until as "validUntil",
      o.code,
      coalesce(o.is_active, false) as "isActive",
      coalesce(o.is_featured, false) as "isFeatured",
      o.usage_limit as "usageLimit",
      coalesce(o.used_count, 0) as "usedCount",
      o.created_at as "createdAt",
      concat(
        case
          when jsonb_typeof(sp.name_translations) = 'object' then common.get_translation_t(sp.name_translations, ${locale}, 'en-US')
          when jsonb_typeof(sp.name_translations) in ('string', 'number', 'boolean') then coalesce(nullif(btrim(sp.name_translations #>> '{}'), ''), '')
          else ''
        end,
        ' / ',
        case
          when jsonb_typeof(ps.display_name_translations) = 'object' then common.get_translation_t(ps.display_name_translations, ${locale}, 'en-US')
          when jsonb_typeof(ps.display_name_translations) in ('string', 'number', 'boolean') then coalesce(nullif(btrim(ps.display_name_translations #>> '{}'), ''), '')
          else ''
        end
      ) as "providerServiceLabel"
    from marketing.offers o
    join category.provider_services ps on ps.id = o.provider_service_id
    join category.service_providers sp on sp.id = ps.service_provider_id
    where (${q} = '' or o.title ilike ${like} or coalesce(o.subtitle, '') ilike ${like} or coalesce(o.code, '') ilike ${like})
    order by coalesce(o.is_featured, false) desc, coalesce(o.is_active, false) desc, o.created_at desc nulls last, o.id desc
    limit ${pageSize} offset ${offset}
  `;

  const [countRow] = await sql<{ count: number }[]>`
    select count(*)::int as count
    from marketing.offers o
    where (${q} = '' or o.title ilike ${like} or coalesce(o.subtitle, '') ilike ${like} or coalesce(o.code, '') ilike ${like})
  `;

  return { items, totalCount: countRow.count };
}

async function listLoyaltyTiers({ q, pageSize, offset }: ReturnType<typeof normalizePagination>): Promise<SqlListResult> {
  const like = toLike(q);
  const items = await sql<DbRow[]>`
    select
      t.id::text as id,
      t.name,
      t.min_points as "minPoints",
      t.cashback_percent as "cashbackPercent",
      t.benefits,
      t.color_from as "colorFrom",
      t.color_to as "colorTo",
      t.icon,
      t.create_date as "createDate",
      t.last_modified_date as "lastModifiedDate",
      count(a.customer_id)::int as "accountCount"
    from loyalty.tiers t
    left join loyalty.accounts a on a.current_tier_id = t.id
    where (${q} = '' or t.name ilike ${like} or coalesce(t.icon, '') ilike ${like})
    group by t.id
    order by t.min_points asc, t.name asc
    limit ${pageSize} offset ${offset}
  `;

  const [countRow] = await sql<{ count: number }[]>`
    select count(*)::int as count
    from loyalty.tiers t
    where (${q} = '' or t.name ilike ${like} or coalesce(t.icon, '') ilike ${like})
  `;

  return { items, totalCount: countRow.count };
}

async function listLoyaltyAccounts({ q, pageSize, offset }: ReturnType<typeof normalizePagination>): Promise<SqlListResult> {
  const like = toLike(q);
  const items = await sql<DbRow[]>`
    select
      a.customer_id::text as id,
      a.customer_id as "customerId",
      concat(c.first_name, ' ', c.last_name, ' — ', c.email) as "customerLabel",
      a.points_balance as "pointsBalance",
      a.lifetime_points as "lifetimePoints",
      a.current_tier_id as "currentTierId",
      t.name as "tierName",
      a.referral_code as "referralCode",
      a.create_date as "createDate",
      a.last_modified_date as "lastModifiedDate"
    from loyalty.accounts a
    join customer.customers c on c.id = a.customer_id
    left join loyalty.tiers t on t.id = a.current_tier_id
    where (${q} = ''
      or a.referral_code ilike ${like}
      or c.email ilike ${like}
      or concat(c.first_name, ' ', c.last_name) ilike ${like}
    )
    order by a.points_balance desc, a.last_modified_date desc nulls last, a.create_date desc
    limit ${pageSize} offset ${offset}
  `;

  const [countRow] = await sql<{ count: number }[]>`
    select count(*)::int as count
    from loyalty.accounts a
    join customer.customers c on c.id = a.customer_id
    where (${q} = ''
      or a.referral_code ilike ${like}
      or c.email ilike ${like}
      or concat(c.first_name, ' ', c.last_name) ilike ${like}
    )
  `;

  return { items, totalCount: countRow.count };
}

async function listLoyaltyCoupons({ q, locale, pageSize, offset }: ReturnType<typeof normalizePagination>): Promise<SqlListResult> {
  const like = toLike(q);
  const items = await sql<DbRow[]>`
    select
      c.id::text as id,
      c.code,
      c.title,
      c.description,
      c.discount_type as "discountType",
      c.discount_value as "discountValue",
      c.min_purchase as "minPurchase",
      c.starts_at as "startsAt",
      c.expires_at as "expiresAt",
      c.usage_limit as "usageLimit",
      c.is_active as "isActive",
      c.provider_service_id as "providerServiceId",
      c.create_date as "createDate",
      c.last_modified_date as "lastModifiedDate",
      case when ps.id is null then 'Global coupon' else concat(
        case
          when jsonb_typeof(sp.name_translations) = 'object' then common.get_translation_t(sp.name_translations, ${locale}, 'en-US')
          when jsonb_typeof(sp.name_translations) in ('string', 'number', 'boolean') then coalesce(nullif(btrim(sp.name_translations #>> '{}'), ''), '')
          else ''
        end,
        ' / ',
        case
          when jsonb_typeof(ps.display_name_translations) = 'object' then common.get_translation_t(ps.display_name_translations, ${locale}, 'en-US')
          when jsonb_typeof(ps.display_name_translations) in ('string', 'number', 'boolean') then coalesce(nullif(btrim(ps.display_name_translations #>> '{}'), ''), '')
          else ''
        end
      ) end as "providerServiceLabel",
      count(cc.id)::int as "assignedCount"
    from loyalty.coupons c
    left join category.provider_services ps on ps.id = c.provider_service_id
    left join category.service_providers sp on sp.id = ps.service_provider_id
    left join loyalty.customer_coupons cc on cc.coupon_id = c.id
    where (${q} = '' or c.code ilike ${like} or c.title ilike ${like} or coalesce(c.description, '') ilike ${like} or c.discount_type ilike ${like})
    group by c.id, ps.id, sp.id
    order by c.is_active desc, c.create_date desc
    limit ${pageSize} offset ${offset}
  `;

  const [countRow] = await sql<{ count: number }[]>`
    select count(*)::int as count
    from loyalty.coupons c
    where (${q} = '' or c.code ilike ${like} or c.title ilike ${like} or coalesce(c.description, '') ilike ${like} or c.discount_type ilike ${like})
  `;

  return { items, totalCount: countRow.count };
}

async function listCustomerCoupons({ q, pageSize, offset }: ReturnType<typeof normalizePagination>): Promise<SqlListResult> {
  const like = toLike(q);
  const items = await sql<DbRow[]>`
    select
      cc.id::text as id,
      cc.customer_id as "customerId",
      concat(c.first_name, ' ', c.last_name, ' — ', c.email) as "customerLabel",
      cc.coupon_id as "couponId",
      concat(lc.code, ' — ', lc.title) as "couponLabel",
      cc.status,
      cc.assigned_at as "assignedAt",
      cc.redeemed_at as "redeemedAt",
      cc.booking_id as "bookingId",
      coalesce(b.confirmation_code, cc.booking_id::text) as "bookingLabel"
    from loyalty.customer_coupons cc
    join customer.customers c on c.id = cc.customer_id
    join loyalty.coupons lc on lc.id = cc.coupon_id
    left join booking.bookings b on b.id = cc.booking_id
    where (${q} = ''
      or cc.status ilike ${like}
      or lc.code ilike ${like}
      or lc.title ilike ${like}
      or c.email ilike ${like}
      or concat(c.first_name, ' ', c.last_name) ilike ${like}
    )
    order by cc.assigned_at desc
    limit ${pageSize} offset ${offset}
  `;

  const [countRow] = await sql<{ count: number }[]>`
    select count(*)::int as count
    from loyalty.customer_coupons cc
    join customer.customers c on c.id = cc.customer_id
    join loyalty.coupons lc on lc.id = cc.coupon_id
    where (${q} = ''
      or cc.status ilike ${like}
      or lc.code ilike ${like}
      or lc.title ilike ${like}
      or c.email ilike ${like}
      or concat(c.first_name, ' ', c.last_name) ilike ${like}
    )
  `;

  return { items, totalCount: countRow.count };
}

async function listLedger({ q, pageSize, offset }: ReturnType<typeof normalizePagination>): Promise<SqlListResult> {
  const like = toLike(q);
  const items = await sql<DbRow[]>`
    select
      l.id::text as id,
      l.customer_id as "customerId",
      concat(c.first_name, ' ', c.last_name, ' — ', c.email) as "customerLabel",
      l.booking_id as "bookingId",
      coalesce(b.confirmation_code, l.booking_id::text) as "bookingLabel",
      l.entry_type as "entryType",
      l.points_delta as "pointsDelta",
      l.money_delta as "moneyDelta",
      l.description,
      l.metadata,
      l.create_date as "createDate"
    from loyalty.ledger l
    join customer.customers c on c.id = l.customer_id
    left join booking.bookings b on b.id = l.booking_id
    where (${q} = ''
      or l.entry_type ilike ${like}
      or l.description ilike ${like}
      or c.email ilike ${like}
      or concat(c.first_name, ' ', c.last_name) ilike ${like}
    )
    order by l.create_date desc
    limit ${pageSize} offset ${offset}
  `;

  const [countRow] = await sql<{ count: number }[]>`
    select count(*)::int as count
    from loyalty.ledger l
    join customer.customers c on c.id = l.customer_id
    where (${q} = ''
      or l.entry_type ilike ${like}
      or l.description ilike ${like}
      or c.email ilike ${like}
      or concat(c.first_name, ' ', c.last_name) ilike ${like}
    )
  `;

  return { items, totalCount: countRow.count };
}

async function listReferrals({ q, pageSize, offset }: ReturnType<typeof normalizePagination>): Promise<SqlListResult> {
  const like = toLike(q);
  const items = await sql<DbRow[]>`
    select
      r.id::text as id,
      r.referrer_customer_id as "referrerCustomerId",
      concat(referrer.first_name, ' ', referrer.last_name, ' — ', referrer.email) as "referrerLabel",
      r.referred_customer_id as "referredCustomerId",
      case when referred.id is null then 'Not registered yet' else concat(referred.first_name, ' ', referred.last_name, ' — ', referred.email) end as "referredLabel",
      r.referral_code as "referralCode",
      r.status,
      r.reward_amount as "rewardAmount",
      r.reward_points as "rewardPoints",
      r.qualified_at as "qualifiedAt",
      r.create_date as "createDate"
    from loyalty.referrals r
    join customer.customers referrer on referrer.id = r.referrer_customer_id
    left join customer.customers referred on referred.id = r.referred_customer_id
    where (${q} = ''
      or r.referral_code ilike ${like}
      or r.status ilike ${like}
      or referrer.email ilike ${like}
      or concat(referrer.first_name, ' ', referrer.last_name) ilike ${like}
      or coalesce(referred.email, '') ilike ${like}
      or coalesce(concat(referred.first_name, ' ', referred.last_name), '') ilike ${like}
    )
    order by r.create_date desc
    limit ${pageSize} offset ${offset}
  `;

  const [countRow] = await sql<{ count: number }[]>`
    select count(*)::int as count
    from loyalty.referrals r
    join customer.customers referrer on referrer.id = r.referrer_customer_id
    left join customer.customers referred on referred.id = r.referred_customer_id
    where (${q} = ''
      or r.referral_code ilike ${like}
      or r.status ilike ${like}
      or referrer.email ilike ${like}
      or concat(referrer.first_name, ' ', referrer.last_name) ilike ${like}
      or coalesce(referred.email, '') ilike ${like}
      or coalesce(concat(referred.first_name, ' ', referred.last_name), '') ilike ${like}
    )
  `;

  return { items, totalCount: countRow.count };
}

export async function getMarketingLoyaltyFormData(
  entityKey: MarketingLoyaltyEntityKey,
  id?: string,
  locale = DEFAULT_TRANSLATION_LOCALE
): Promise<AdminFormData> {
  const normalizedLocale = normalizeTranslationLocale(locale);
  const config = getEntityConfig(entityKey);
  const record = id ? await getRecordForForm(entityKey, id) : undefined;
  const optionKeys = Array.from(new Set(config.fields.map((field) => field.optionsKey).filter(Boolean))) as SelectOptionKey[];
  const optionsEntries = await Promise.all(
    optionKeys.map(async (key) => [key, await getSelectOptions(key, normalizedLocale)] as const)
  );

  return {
    entityKey,
    id,
    record,
    options: Object.fromEntries(optionsEntries) as AdminFormData["options"],
  };
}

export async function getRecordForForm(entityKey: MarketingLoyaltyEntityKey, id: string): Promise<Record<string, unknown> | undefined> {
  const config = getEntityConfig(entityKey);
  const columns = config.fields.map((field) => field.column);
  const selectColumns = columns.map((column) => `"${column}"`).join(", ");
  const [row] = await sql.unsafe<DbRow[]>(
    `select ${selectColumns} from "${config.schemaName}"."${config.tableName}" where "${config.primaryKey}" = $1 limit 1`,
    [id]
  );

  if (!row) return undefined;

  const mapped: Record<string, unknown> = {};
  for (const field of config.fields) {
    const value = row[field.column];
    if (field.kind === "datetime" && value) {
      mapped[field.name] = formatDateTimeLocal(value);
    } else if (field.kind === "json") {
      mapped[field.name] = JSON.stringify(value ?? field.defaultValue ?? {}, null, 2);
    } else {
      mapped[field.name] = value ?? "";
    }
  }
  return mapped;
}

export async function getSelectOptions(key: SelectOptionKey, locale = DEFAULT_TRANSLATION_LOCALE): Promise<SelectOption[]> {
  const normalizedLocale = normalizeTranslationLocale(locale);

  switch (key) {
    case "customers": {
      const rows = await sql<Array<{ value: string; label: string; helper: string }>>`
        select
          id::text as value,
          concat(first_name, ' ', last_name, ' — ', email) as label,
          concat(phone_number_country_code, phone_number) as helper
        from customer.customers
        order by create_date desc
        limit 300
      `;
      return rowsToOptions(rows);
    }
    case "tiers": {
      const rows = await sql<Array<{ value: string; label: string; helper: string }>>`
        select id::text as value, name as label, concat(min_points::text, ' points') as helper
        from loyalty.tiers
        order by min_points asc, name asc
      `;
      return rowsToOptions(rows);
    }
    case "providerServices": {
      const rows = await sql<Array<{ value: string; label: string; helper: string }>>`
        select
          ps.id::text as value,
          concat(
            case
          when jsonb_typeof(sp.name_translations) = 'object' then common.get_translation_t(sp.name_translations, ${normalizedLocale}, 'en-US')
          when jsonb_typeof(sp.name_translations) in ('string', 'number', 'boolean') then coalesce(nullif(btrim(sp.name_translations #>> '{}'), ''), '')
          else ''
        end,
            ' / ',
            case
          when jsonb_typeof(ps.display_name_translations) = 'object' then common.get_translation_t(ps.display_name_translations, ${normalizedLocale}, 'en-US')
          when jsonb_typeof(ps.display_name_translations) in ('string', 'number', 'boolean') then coalesce(nullif(btrim(ps.display_name_translations #>> '{}'), ''), '')
          else ''
        end
          ) as label,
          concat(ps.currency, ' ', ps.value::text) as helper
        from category.provider_services ps
        join category.service_providers sp on sp.id = ps.service_provider_id
        where ps.is_active = true
        order by sp.create_date desc, ps.create_date desc
        limit 500
      `;
      return rowsToOptions(rows);
    }
    case "loyaltyCoupons": {
      const rows = await sql<Array<{ value: string; label: string; helper: string }>>`
        select id::text as value, concat(code, ' — ', title) as label, discount_type as helper
        from loyalty.coupons
        order by create_date desc
        limit 500
      `;
      return rowsToOptions(rows);
    }
    case "bookings": {
      const rows = await sql<Array<{ value: string; label: string; helper: string }>>`
        select
          id::text as value,
          concat(coalesce(confirmation_code, id::text), ' — ', selected_date::text) as label,
          booking_status as helper
        from booking.bookings
        order by create_date desc
        limit 300
      `;
      return rowsToOptions(rows);
    }
    default:
      return [];
  }
}

function formatDateTimeLocal(value: unknown) {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(String(value));
  if (Number.isNaN(date.getTime())) return String(value);
  const offsetMs = date.getTimezoneOffset() * 60_000;
  const localDate = new Date(date.getTime() - offsetMs);
  return localDate.toISOString().slice(0, 16);
}
