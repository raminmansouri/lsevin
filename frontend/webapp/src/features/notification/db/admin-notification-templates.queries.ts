import "server-only";

import sql from "@/config/database/db";
import {
  DEFAULT_PAGE_NUMBER,
  DEFAULT_PAGE_SIZE,
} from "@/types/filter";
import { ApiReturnType } from "@/types/network";

import {
  NOTIFICATION_CHANNELS,
  type AdminNotificationTemplate,
  type AdminNotificationTemplateFilterParams,
  type AdminNotificationTemplateListItem,
  type AdminNotificationTemplateStats,
  type AdminNotificationTemplatesPageData,
  type NotificationChannel,
  type PaginatedResult,
  type SaveAdminNotificationTemplateInput,
  type TranslationRecord,
} from "../types/notification-template-types";

export type {
  AdminNotificationTemplate,
  AdminNotificationTemplateFilterParams,
  AdminNotificationTemplateListItem,
  AdminNotificationTemplateStats,
  AdminNotificationTemplatesPageData,
  NotificationChannel,
  PaginatedResult,
  SaveAdminNotificationTemplateInput,
  TranslationRecord,
};

type CountRow = { total_count?: number | string };

function ok<T>(data: T): ApiReturnType<T> {
  return { data, error: undefined } as ApiReturnType<T>;
}

function fail<T>(title: string, status = 500, detail?: string): ApiReturnType<T> {
  return {
    data: undefined,
    error: { title, status, detail },
  } as ApiReturnType<T>;
}

function asNumber(value: unknown): number {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeLocaleHeader(locale: string) {
  const normalized = (locale || "en-US").trim().replace("_", "-").toLowerCase();
  if (normalized === "fa" || normalized.startsWith("fa-")) return "fa-IR";
  if (normalized === "ar" || normalized.startsWith("ar-")) return "ar-SA";
  if (normalized === "tr" || normalized.startsWith("tr-")) return "tr-TR";
  if (normalized === "ku" || normalized.startsWith("ku-")) return "ku-KU";
  if (normalized === "de" || normalized.startsWith("de-")) return "de-DE";
  if (normalized === "fr" || normalized.startsWith("fr-")) return "fr-FR";
  if (normalized === "es" || normalized.startsWith("es-")) return "es-ES";
  return "en-US";
}

function translated(column: any, locale: string) {
  const localeHeader = normalizeLocaleHeader(locale);
  const baseLocale = localeHeader.split("-")[0];

  return sql`coalesce(
    nullif(${column}->>${localeHeader}, ''),
    nullif(${column}->>${baseLocale}, ''),
    nullif(${column}->>'en-US', ''),
    nullif(${column}->>'en', ''),
    (
      select e.value
      from jsonb_each_text(${column}) as e(key, value)
      where btrim(e.value) <> ''
      limit 1
    ),
    ''
  )`;
}

function toTranslationRecord(value: unknown): TranslationRecord {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const output: TranslationRecord = {};
  for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
    if (typeof val === "string") output[key] = val;
  }
  return output;
}

function toStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    : [];
}

function toChannels(value: unknown): NotificationChannel[] {
  return toStringArray(value).filter((item): item is NotificationChannel =>
    NOTIFICATION_CHANNELS.includes(item as NotificationChannel),
  );
}

function normalizeFilters(
  params?: AdminNotificationTemplateFilterParams,
): Required<AdminNotificationTemplateFilterParams> {
  const type = params?.notificationType;
  const active = params?.isActive;
  const channel = params?.channel;

  return {
    pageNumber: Math.max(1, Number(params?.pageNumber || DEFAULT_PAGE_NUMBER)),
    pageSize: Math.min(100, Math.max(1, Number(params?.pageSize || DEFAULT_PAGE_SIZE))),
    filters: typeof params?.filters === "string" ? params.filters.trim() : "",
    notificationType: type === "booking" || type === "offer" || type === "system" ? type : "all",
    isActive: active === "active" || active === "inactive" ? active : "all",
    channel: NOTIFICATION_CHANNELS.includes(channel as NotificationChannel)
      ? (channel as NotificationChannel)
      : "all",
  };
}

function buildWhere(filters: Required<AdminNotificationTemplateFilterParams>) {
  const parts: any[] = [];

  if (filters.filters) {
    const like = `%${filters.filters}%`;
    parts.push(sql`(
      nt.template_key ilike ${like}
      or nt.name ilike ${like}
      or coalesce(nt.description, '') ilike ${like}
      or ${translated(sql`nt.title_translations`, "en-US")} ilike ${like}
      or ${translated(sql`nt.body_translations`, "en-US")} ilike ${like}
      or exists (
        select 1
        from unnest(coalesce(nt.variables, array[]::text[])) v
        where v ilike ${like}
      )
    )`);
  }

  if (filters.notificationType !== "all") {
    parts.push(sql`nt.notification_type = ${filters.notificationType}`);
  }

  if (filters.isActive === "active") {
    parts.push(sql`nt.is_active = true`);
  } else if (filters.isActive === "inactive") {
    parts.push(sql`nt.is_active = false`);
  }

  if (filters.channel !== "all") {
    parts.push(sql`${filters.channel} = any(nt.default_channels)`);
  }

  if (!parts.length) return sql``;
  const combined = parts.reduce((acc, part, index) =>
    index === 0 ? part : sql`${acc} and ${part}`,
  );

  return sql`where ${combined}`;
}

async function notificationTemplatesTableExists() {
  const [row] = await sql<{ exists: boolean }[]>`
    select to_regclass('notify.notification_templates') is not null as exists
  `;
  return Boolean(row?.exists);
}

export async function getAdminNotificationTemplatesPageData(
  locale: string,
  params?: AdminNotificationTemplateFilterParams,
): Promise<ApiReturnType<AdminNotificationTemplatesPageData>> {
  try {
    const filters = normalizeFilters(params);
    const tableMissing = !(await notificationTemplatesTableExists());

    if (tableMissing) {
      const emptyPagination: PaginatedResult<AdminNotificationTemplateListItem> = {
        items: [],
        totalCount: 0,
        pageNumber: filters.pageNumber,
        pageSize: filters.pageSize,
        totalPages: 0,
        hasPrevious: false,
        hasNext: false,
        currentStartIndex: 0,
        currentEndIndex: 0,
      };

      return ok({
        items: [],
        stats: {
          totalCount: 0,
          activeCount: 0,
          inactiveCount: 0,
          bookingCount: 0,
          offerCount: 0,
          systemCount: 0,
        },
        pagination: emptyPagination,
        filters,
        tableMissing,
      });
    }

    const offset = (filters.pageNumber - 1) * filters.pageSize;
    const whereSql = buildWhere(filters);

    const rows = await sql<(AdminNotificationTemplateListItem & CountRow)[]>`
      select
        nt.id::text as id,
        nt.template_key as "templateKey",
        nt.name,
        nt.description,
        nt.notification_type as "notificationType",
        nt.default_channels as "defaultChannels",
        nt.title_translations as "titleTranslations",
        nt.body_translations as "bodyTranslations",
        nt.email_subject_translations as "emailSubjectTranslations",
        nt.email_body_translations as "emailBodyTranslations",
        nt.sms_body_translations as "smsBodyTranslations",
        nt.push_title_translations as "pushTitleTranslations",
        nt.push_body_translations as "pushBodyTranslations",
        nt.variables,
        nt.is_active as "isActive",
        nt.metadata,
        ${translated(sql`nt.title_translations`, locale)} as "previewTitle",
        ${translated(sql`nt.body_translations`, locale)} as "previewBody",
        nt.created_at::text as "createdAt",
        nt.updated_at::text as "updatedAt",
        count(*) over() as total_count
      from notify.notification_templates nt
      ${whereSql}
      order by nt.updated_at desc, nt.created_at desc
      limit ${filters.pageSize} offset ${offset}
    `;

    const [statsRow] = await sql<{
      total_count: number | string;
      active_count: number | string;
      inactive_count: number | string;
      booking_count: number | string;
      offer_count: number | string;
      system_count: number | string;
    }[]>`
      select
        count(*)::int as total_count,
        count(*) filter (where is_active = true)::int as active_count,
        count(*) filter (where is_active = false)::int as inactive_count,
        count(*) filter (where notification_type = 'booking')::int as booking_count,
        count(*) filter (where notification_type = 'offer')::int as offer_count,
        count(*) filter (where notification_type = 'system')::int as system_count
      from notify.notification_templates
    `;

    const totalCount = rows[0] ? asNumber(rows[0].total_count) : 0;
    const items = rows.map(({ total_count: _totalCount, ...row }) => ({
      ...row,
      defaultChannels: toChannels(row.defaultChannels),
      variables: toStringArray(row.variables),
      titleTranslations: toTranslationRecord(row.titleTranslations),
      bodyTranslations: toTranslationRecord(row.bodyTranslations),
      emailSubjectTranslations: toTranslationRecord(row.emailSubjectTranslations),
      emailBodyTranslations: toTranslationRecord(row.emailBodyTranslations),
      smsBodyTranslations: toTranslationRecord(row.smsBodyTranslations),
      pushTitleTranslations: toTranslationRecord(row.pushTitleTranslations),
      pushBodyTranslations: toTranslationRecord(row.pushBodyTranslations),
      metadata: row.metadata && typeof row.metadata === "object" ? row.metadata : {},
    }));

    const totalPages = Math.ceil(totalCount / filters.pageSize);
    const currentStartIndex = totalCount === 0 ? 0 : offset + 1;
    const currentEndIndex = totalCount === 0 ? 0 : Math.min(offset + filters.pageSize, totalCount);

    const pagination: PaginatedResult<AdminNotificationTemplateListItem> = {
      items,
      totalCount,
      pageNumber: filters.pageNumber,
      pageSize: filters.pageSize,
      totalPages,
      hasPrevious: filters.pageNumber > 1,
      hasNext: filters.pageNumber * filters.pageSize < totalCount,
      currentStartIndex,
      currentEndIndex,
    };

    return ok({
      items,
      stats: {
        totalCount: asNumber(statsRow?.total_count),
        activeCount: asNumber(statsRow?.active_count),
        inactiveCount: asNumber(statsRow?.inactive_count),
        bookingCount: asNumber(statsRow?.booking_count),
        offerCount: asNumber(statsRow?.offer_count),
        systemCount: asNumber(statsRow?.system_count),
      },
      pagination,
      filters,
      tableMissing,
    });
  } catch (error: any) {
    console.error("getAdminNotificationTemplatesPageData failed", error);
    return fail("Could not load notification templates.", 500, error?.message);
  }
}

export async function getAdminNotificationTemplateById(
  id: string,
): Promise<ApiReturnType<AdminNotificationTemplate | null>> {
  try {
    if (!(await notificationTemplatesTableExists())) return ok(null);

    const [row] = await sql<AdminNotificationTemplate[]>`
      select
        nt.id::text as id,
        nt.template_key as "templateKey",
        nt.name,
        nt.description,
        nt.notification_type as "notificationType",
        nt.default_channels as "defaultChannels",
        nt.title_translations as "titleTranslations",
        nt.body_translations as "bodyTranslations",
        nt.email_subject_translations as "emailSubjectTranslations",
        nt.email_body_translations as "emailBodyTranslations",
        nt.sms_body_translations as "smsBodyTranslations",
        nt.push_title_translations as "pushTitleTranslations",
        nt.push_body_translations as "pushBodyTranslations",
        nt.variables,
        nt.is_active as "isActive",
        nt.metadata,
        ${translated(sql`nt.title_translations`, "en-US")} as "previewTitle",
        ${translated(sql`nt.body_translations`, "en-US")} as "previewBody",
        nt.created_at::text as "createdAt",
        nt.updated_at::text as "updatedAt"
      from notify.notification_templates nt
      where nt.id = ${id}::uuid
      limit 1
    `;

    if (!row) return ok(null);

    return ok({
      ...row,
      defaultChannels: toChannels(row.defaultChannels),
      variables: toStringArray(row.variables),
      titleTranslations: toTranslationRecord(row.titleTranslations),
      bodyTranslations: toTranslationRecord(row.bodyTranslations),
      emailSubjectTranslations: toTranslationRecord(row.emailSubjectTranslations),
      emailBodyTranslations: toTranslationRecord(row.emailBodyTranslations),
      smsBodyTranslations: toTranslationRecord(row.smsBodyTranslations),
      pushTitleTranslations: toTranslationRecord(row.pushTitleTranslations),
      pushBodyTranslations: toTranslationRecord(row.pushBodyTranslations),
      metadata: row.metadata && typeof row.metadata === "object" ? row.metadata : {},
    });
  } catch (error: any) {
    console.error("getAdminNotificationTemplateById failed", error);
    return fail("Could not load notification template.", 500, error?.message);
  }
}

export type SaveAdminNotificationTemplateInput = {
  id?: string | null;
  templateKey: string;
  name: string;
  description?: string | null;
  notificationType: NotificationType;
  defaultChannels: NotificationChannel[];
  titleTranslations: TranslationRecord;
  bodyTranslations: TranslationRecord;
  emailSubjectTranslations: TranslationRecord;
  emailBodyTranslations: TranslationRecord;
  smsBodyTranslations: TranslationRecord;
  pushTitleTranslations: TranslationRecord;
  pushBodyTranslations: TranslationRecord;
  variables: string[];
  isActive: boolean;
  metadata?: Record<string, unknown>;
};

export async function saveAdminNotificationTemplate(
  input: SaveAdminNotificationTemplateInput,
): Promise<string> {
  const normalizedKey = input.templateKey.trim().toLowerCase();
  const normalizedVariables = Array.from(
    new Set(input.variables.map((item) => item.trim()).filter(Boolean)),
  );
  const normalizedChannels = input.defaultChannels.length
    ? input.defaultChannels
    : (["in_app"] as NotificationChannel[]);

  if (input.id) {
    const [row] = await sql<{ id: string }[]>`
      update notify.notification_templates
      set
        template_key = ${normalizedKey},
        name = ${input.name.trim()},
        description = ${input.description?.trim() || null},
        notification_type = ${input.notificationType},
        default_channels = ${normalizedChannels},
        title_translations = ${sql.json(input.titleTranslations || {})},
        body_translations = ${sql.json(input.bodyTranslations || {})},
        email_subject_translations = ${sql.json(input.emailSubjectTranslations || {})},
        email_body_translations = ${sql.json(input.emailBodyTranslations || {})},
        sms_body_translations = ${sql.json(input.smsBodyTranslations || {})},
        push_title_translations = ${sql.json(input.pushTitleTranslations || {})},
        push_body_translations = ${sql.json(input.pushBodyTranslations || {})},
        variables = ${normalizedVariables},
        is_active = ${input.isActive},
        metadata = ${sql.json(input.metadata || {})},
        updated_at = now()
      where id = ${input.id}::uuid
      returning id::text as id
    `;

    if (!row?.id) throw new Error("Notification template was not found.");
    return row.id;
  }

  const [row] = await sql<{ id: string }[]>`
    insert into notify.notification_templates (
      template_key,
      name,
      description,
      notification_type,
      default_channels,
      title_translations,
      body_translations,
      email_subject_translations,
      email_body_translations,
      sms_body_translations,
      push_title_translations,
      push_body_translations,
      variables,
      is_active,
      metadata,
      updated_at
    )
    values (
      ${normalizedKey},
      ${input.name.trim()},
      ${input.description?.trim() || null},
      ${input.notificationType},
      ${normalizedChannels},
      ${sql.json(input.titleTranslations || {})},
      ${sql.json(input.bodyTranslations || {})},
      ${sql.json(input.emailSubjectTranslations || {})},
      ${sql.json(input.emailBodyTranslations || {})},
      ${sql.json(input.smsBodyTranslations || {})},
      ${sql.json(input.pushTitleTranslations || {})},
      ${sql.json(input.pushBodyTranslations || {})},
      ${normalizedVariables},
      ${input.isActive},
      ${sql.json(input.metadata || {})},
      now()
    )
    on conflict (template_key) do update set
      name = excluded.name,
      description = excluded.description,
      notification_type = excluded.notification_type,
      default_channels = excluded.default_channels,
      title_translations = excluded.title_translations,
      body_translations = excluded.body_translations,
      email_subject_translations = excluded.email_subject_translations,
      email_body_translations = excluded.email_body_translations,
      sms_body_translations = excluded.sms_body_translations,
      push_title_translations = excluded.push_title_translations,
      push_body_translations = excluded.push_body_translations,
      variables = excluded.variables,
      is_active = excluded.is_active,
      metadata = excluded.metadata,
      updated_at = now()
    returning id::text as id
  `;

  return row.id;
}

export async function deleteAdminNotificationTemplate(id: string): Promise<void> {
  await sql`delete from notify.notification_templates where id = ${id}::uuid`;
}
