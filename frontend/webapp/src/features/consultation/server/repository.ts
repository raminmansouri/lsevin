import "server-only";

import db from "@/config/database/db";

import type {
  ConsultationAdminPageData,
  ConsultationListFilters,
  ConsultationListResult,
  ConsultationNotification,
  ConsultationRecipient,
  ConsultationRequestDetail,
  ConsultationRequestListItem,
  ConsultationSmsSettings,
  ConsultationStats,
} from "../types";

/**
 * Postgres access for the free-consultation feature.
 *
 * Style follows the rest of the webapp: postgres.js tagged templates, no ORM, and
 * explicit `as "camelCase"` aliases because the client is configured without a
 * column-name transform (see src/config/database/db.ts). uuid and timestamptz are
 * cast to text at the edge so nothing downstream has to care that pg returns
 * Date objects for one and not the other.
 */

const REQUEST_COLUMNS = db`
  r.id::text                        as "id",
  r.user_id::text                   as "userId",
  r.booking_draft_id::text          as "bookingDraftId",
  r.first_name                      as "firstName",
  r.last_name                       as "lastName",
  btrim(concat_ws(' ', r.first_name, r.last_name)) as "fullName",
  r.phone                           as "phone",
  r.phone_country_code              as "phoneCountryCode",
  r.email                           as "email",
  r.category_id::text               as "categoryId",
  r.category_name                   as "categoryName",
  r.description                     as "description",
  r.preferred_contact_time          as "preferredContactTime",
  r.urgency                         as "urgency",
  r.locale                          as "locale",
  r.source                          as "source",
  r.status                          as "status",
  r.admin_note                      as "adminNote",
  r.assigned_to_user_id::text       as "assignedToUserId",
  r.created_at::text                as "createdAt",
  r.updated_at::text                as "updatedAt"
`;

/**
 * The migration runner is manual on this deployment, so the app can legitimately
 * be newer than the database. Every read path checks first and degrades to an
 * explanatory panel instead of a 500 on `relation does not exist`.
 */
export async function consultationSchemaExists(): Promise<boolean> {
  const rows = await db<{ exists: boolean }[]>`
    select to_regclass('consultation.consultation_requests') is not null as "exists"
  `;
  return Boolean(rows[0]?.exists);
}

type CreateConsultationRequestArgs = {
  userId: string | null;
  bookingDraftId: string | null;
  firstName: string;
  lastName: string;
  phone: string;
  phoneCountryCode: string | null;
  email: string | null;
  categoryId: string | null;
  categoryName: string | null;
  description: string | null;
  preferredContactTime: string;
  urgency: string;
  locale: string | null;
  source: string;
};

export async function createConsultationRequest(
  args: CreateConsultationRequestArgs
): Promise<{ id: string; createdAt: string }> {
  const rows = await db<{ id: string; createdAt: string }[]>`
    insert into consultation.consultation_requests (
      user_id, booking_draft_id, first_name, last_name, phone, phone_country_code,
      email, category_id, category_name, description, preferred_contact_time,
      urgency, locale, source
    ) values (
      ${args.userId}::uuid, ${args.bookingDraftId}::uuid, ${args.firstName},
      ${args.lastName}, ${args.phone}, ${args.phoneCountryCode}, ${args.email},
      ${args.categoryId}::uuid, ${args.categoryName}, ${args.description},
      ${args.preferredContactTime}, ${args.urgency}, ${args.locale}, ${args.source}
    )
    returning id::text as "id", created_at::text as "createdAt"
  `;

  return rows[0];
}

export async function listConsultationRequests(
  filters: ConsultationListFilters
): Promise<ConsultationListResult> {
  const pageSize = Math.min(Math.max(filters.pageSize || 20, 1), 100);
  const pageNumber = Math.max(filters.pageNumber || 1, 1);
  const offset = (pageNumber - 1) * pageSize;

  const search = filters.search?.trim() ?? "";
  // Wrapped here rather than interpolated into the SQL so the value stays a bound
  // parameter and the % characters cannot alter the pattern's meaning.
  const searchPattern = search ? `%${search.replace(/[%_\\]/g, "\\$&")}%` : null;

  const statusFilter = filters.status && filters.status !== "all" ? filters.status : null;
  const urgencyFilter = filters.urgency && filters.urgency !== "all" ? filters.urgency : null;

  const where = db`
    where (${statusFilter}::text is null or r.status = ${statusFilter}::text)
      and (${urgencyFilter}::text is null or r.urgency = ${urgencyFilter}::text)
      and (
        ${searchPattern}::text is null
        or r.phone ilike ${searchPattern}::text escape '\\'
        or btrim(concat_ws(' ', r.first_name, r.last_name)) ilike ${searchPattern}::text escape '\\'
        or coalesce(r.email, '') ilike ${searchPattern}::text escape '\\'
      )
  `;

  const [items, countRows] = await Promise.all([
    db<ConsultationRequestListItem[]>`
      select
        ${REQUEST_COLUMNS},
        coalesce(n.sent, 0)::int    as "notificationsSent",
        coalesce(n.failed, 0)::int  as "notificationsFailed",
        coalesce(n.skipped, 0)::int as "notificationsSkipped"
      from consultation.consultation_requests r
      left join lateral (
        select
          count(*) filter (where status = 'sent')    as sent,
          count(*) filter (where status = 'failed')  as failed,
          count(*) filter (where status = 'skipped') as skipped
        from consultation.request_notifications
        where request_id = r.id
      ) n on true
      ${where}
      order by r.created_at desc
      limit ${pageSize} offset ${offset}
    `,
    db<{ count: string }[]>`
      select count(*)::text as "count"
      from consultation.consultation_requests r
      ${where}
    `,
  ]);

  const totalCount = Number(countRows[0]?.count ?? 0);
  const totalPages = Math.max(Math.ceil(totalCount / pageSize), 1);

  return {
    items,
    totalCount,
    pageNumber,
    pageSize,
    totalPages,
    hasPrevious: pageNumber > 1,
    hasNext: pageNumber < totalPages,
  };
}

export async function getConsultationRequestDetail(
  id: string
): Promise<ConsultationRequestDetail | null> {
  const rows = await db<ConsultationRequestDetail[]>`
    select ${REQUEST_COLUMNS}
    from consultation.consultation_requests r
    where r.id = ${id}::uuid
    limit 1
  `;

  const request = rows[0];
  if (!request) return null;

  const notifications = await db<ConsultationNotification[]>`
    select
      id::text                  as "id",
      recipient_type            as "recipientType",
      phone                     as "phone",
      channel                   as "channel",
      body_id::text             as "bodyId",
      variables                 as "variables",
      status                    as "status",
      provider_message_id       as "providerMessageId",
      error_message             as "errorMessage",
      skip_reason               as "skipReason",
      attempted_at::text        as "attemptedAt",
      created_at::text          as "createdAt"
    from consultation.request_notifications
    where request_id = ${id}::uuid
    order by created_at asc
  `;

  return { ...request, notifications };
}

export async function updateConsultationRequest(args: {
  id: string;
  status: string;
  adminNote: string | null;
  actorUserId: string | null;
}): Promise<boolean> {
  const rows = await db<{ id: string }[]>`
    update consultation.consultation_requests
    set status = ${args.status},
        admin_note = ${args.adminNote},
        -- Claimed by whoever moved it off "new", so the panel shows who is on it.
        assigned_to_user_id = case
          when ${args.status} = 'new' then null
          else coalesce(assigned_to_user_id, ${args.actorUserId}::uuid)
        end
    where id = ${args.id}::uuid
    returning id::text as "id"
  `;

  return rows.length > 0;
}

export async function getConsultationStats(): Promise<ConsultationStats> {
  const rows = await db<
    {
      total: string;
      newCount: string;
      inProgressCount: string;
      contactedCount: string;
      doneCount: string;
      rejectedCount: string;
    }[]
  >`
    select
      count(*)::text                                              as "total",
      count(*) filter (where status = 'new')::text                as "newCount",
      count(*) filter (where status = 'in_progress')::text        as "inProgressCount",
      count(*) filter (where status = 'contacted')::text          as "contactedCount",
      count(*) filter (where status = 'done')::text               as "doneCount",
      count(*) filter (where status = 'rejected')::text           as "rejectedCount"
    from consultation.consultation_requests
  `;

  const failedRows = await db<{ count: string }[]>`
    select count(*)::text as "count"
    from consultation.request_notifications
    where status = 'failed'
  `;

  const row = rows[0];

  return {
    total: Number(row?.total ?? 0),
    newCount: Number(row?.newCount ?? 0),
    inProgressCount: Number(row?.inProgressCount ?? 0),
    contactedCount: Number(row?.contactedCount ?? 0),
    doneCount: Number(row?.doneCount ?? 0),
    rejectedCount: Number(row?.rejectedCount ?? 0),
    failedNotifications: Number(failedRows[0]?.count ?? 0),
  };
}

// ---------------------------------------------------------------------------
// Recipients — the admin phone numbers an incoming request is announced to.
// ---------------------------------------------------------------------------

export async function listConsultationRecipients(): Promise<ConsultationRecipient[]> {
  return db<ConsultationRecipient[]>`
    select
      id::text          as "id",
      label             as "label",
      phone             as "phone",
      is_active         as "isActive",
      created_at::text  as "createdAt",
      updated_at::text  as "updatedAt"
    from consultation.notification_recipients
    order by is_active desc, label asc, created_at asc
  `;
}

export async function listActiveRecipientPhones(): Promise<
  Array<{ id: string; phone: string; label: string }>
> {
  return db<Array<{ id: string; phone: string; label: string }>>`
    select id::text as "id", phone as "phone", label as "label"
    from consultation.notification_recipients
    where is_active
    order by created_at asc
  `;
}

/** Postgres unique_violation — the phone is already on another recipient row. */
export const DUPLICATE_PHONE = "duplicate_phone";
/** The row the caller wanted to edit is gone. */
export const RECIPIENT_NOT_FOUND = "recipient_not_found";

export type UpsertRecipientOutcome = {
  recipient?: ConsultationRecipient;
  error?: typeof DUPLICATE_PHONE | typeof RECIPIENT_NOT_FOUND;
};

export async function upsertConsultationRecipient(args: {
  id?: string;
  label: string;
  phone: string;
  isActive: boolean;
}): Promise<UpsertRecipientOutcome> {
  if (args.id) {
    // No ON CONFLICT here: UPDATE cannot take one, and ux_consultation_recipients_phone
    // means editing a row onto a number another row already holds raises 23505. Left
    // unhandled that surfaces as an unhandled rejection in the admin's browser with no
    // toast at all, so it is turned into a result the form can render.
    try {
      const rows = await db<ConsultationRecipient[]>`
        update consultation.notification_recipients
        set label = ${args.label}, phone = ${args.phone}, is_active = ${args.isActive}
        where id = ${args.id}::uuid
        returning id::text as "id", label as "label", phone as "phone",
                  is_active as "isActive", created_at::text as "createdAt",
                  updated_at::text as "updatedAt"
      `;

      // Zero rows means someone else deleted it while this form was open. Reporting
      // success there would show a saved toast for a write that never happened.
      if (rows.length === 0) return { error: RECIPIENT_NOT_FOUND };

      return { recipient: rows[0] };
    } catch (error) {
      if ((error as { code?: string })?.code === "23505") {
        return { error: DUPLICATE_PHONE };
      }
      throw error;
    }
  }

  // Re-adding a number that already exists edits it instead of creating a second
  // row — otherwise that admin gets two texts for every request.
  const rows = await db<ConsultationRecipient[]>`
    insert into consultation.notification_recipients (label, phone, is_active)
    values (${args.label}, ${args.phone}, ${args.isActive})
    on conflict (phone) do update
      set label = excluded.label, is_active = excluded.is_active
    returning id::text as "id", label as "label", phone as "phone",
              is_active as "isActive", created_at::text as "createdAt",
              updated_at::text as "updatedAt"
  `;
  return { recipient: rows[0] };
}

export async function deleteConsultationRecipient(id: string): Promise<boolean> {
  const rows = await db<{ id: string }[]>`
    delete from consultation.notification_recipients
    where id = ${id}::uuid
    returning id::text as "id"
  `;
  return rows.length > 0;
}

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------

const SETTING_KEYS = {
  enabled: "sms.enabled",
  customerBodyId: "sms.customer_body_id",
  adminBodyId: "sms.admin_body_id",
  rateLimitPerHour: "sms.rate_limit_per_hour",
} as const;

export async function getConsultationSmsSettings(): Promise<ConsultationSmsSettings> {
  const rows = await db<{ key: string; value: unknown }[]>`
    select key as "key", value as "value"
    from consultation.settings
    where key in (
      ${SETTING_KEYS.enabled}, ${SETTING_KEYS.customerBodyId},
      ${SETTING_KEYS.adminBodyId}, ${SETTING_KEYS.rateLimitPerHour}
    )
  `;

  const map = new Map(rows.map((row) => [row.key, row.value]));

  const readBodyId = (key: string): string | null => {
    const value = map.get(key);
    if (value === null || value === undefined) return null;
    const text = String(value).trim();
    return /^\d+$/.test(text) ? text : null;
  };

  const rawLimit = Number(map.get(SETTING_KEYS.rateLimitPerHour) ?? 5);

  return {
    // Absent means on: the seed inserts true, and a deployment that dropped the
    // row should not silently disable notification.
    enabled: map.get(SETTING_KEYS.enabled) !== false,
    customerBodyId: readBodyId(SETTING_KEYS.customerBodyId),
    adminBodyId: readBodyId(SETTING_KEYS.adminBodyId),
    rateLimitPerHour: Number.isFinite(rawLimit) ? rawLimit : 5,
  };
}

export async function saveConsultationSmsSettings(args: {
  enabled: boolean;
  customerBodyId: string | null;
  adminBodyId: string | null;
  rateLimitPerHour: number;
  actorUserId: string | null;
}): Promise<void> {
  const entries: Array<[string, unknown]> = [
    [SETTING_KEYS.enabled, args.enabled],
    [SETTING_KEYS.customerBodyId, args.customerBodyId],
    [SETTING_KEYS.adminBodyId, args.adminBodyId],
    [SETTING_KEYS.rateLimitPerHour, args.rateLimitPerHour],
  ];

  await db.begin(async (tx) => {
    for (const [key, value] of entries) {
      await tx`
        insert into consultation.settings (key, value, updated_by)
        values (${key}, ${db.json(value as never)}, ${args.actorUserId}::uuid)
        on conflict (key) do update
          set value = excluded.value, updated_by = excluded.updated_by
      `;
    }
  });
}

// ---------------------------------------------------------------------------
// Delivery log
// ---------------------------------------------------------------------------

export async function recordNotificationAttempt(args: {
  requestId: string;
  recipientType: "customer" | "admin";
  phone: string;
  bodyId: string | null;
  variables: string | null;
  status: "pending" | "sent" | "failed" | "skipped";
  providerMessageId?: string | null;
  errorMessage?: string | null;
  skipReason?: string | null;
}): Promise<void> {
  await db`
    insert into consultation.request_notifications (
      request_id, recipient_type, phone, body_id, variables, status,
      provider_message_id, error_message, skip_reason, attempted_at
    ) values (
      ${args.requestId}::uuid, ${args.recipientType}, ${args.phone},
      ${args.bodyId}::bigint, ${args.variables}, ${args.status},
      ${args.providerMessageId ?? null}, ${args.errorMessage ?? null},
      ${args.skipReason ?? null},
      ${args.status === "skipped" ? null : new Date()}
    )
  `;
}

/**
 * Returns true when the caller is allowed to proceed.
 *
 * Counted in the database because the webapp runs more than one process — an
 * in-memory counter would hand each of them the full allowance.
 */
export async function consumeConsultationRateLimit(
  bucketKey: string,
  limit: number
): Promise<boolean> {
  const rows = await db<{ allowed: boolean }[]>`
    select consultation.fn_consume_rate_limit(${bucketKey}, ${limit}) as "allowed"
  `;
  return Boolean(rows[0]?.allowed);
}

// ---------------------------------------------------------------------------
// Admin page composition
// ---------------------------------------------------------------------------

export async function getConsultationAdminPageData(
  filters: ConsultationListFilters
): Promise<ConsultationAdminPageData> {
  if (!(await consultationSchemaExists())) {
    return {
      list: {
        items: [],
        totalCount: 0,
        pageNumber: 1,
        pageSize: filters.pageSize,
        totalPages: 1,
        hasPrevious: false,
        hasNext: false,
      },
      stats: {
        total: 0,
        newCount: 0,
        inProgressCount: 0,
        contactedCount: 0,
        doneCount: 0,
        rejectedCount: 0,
        failedNotifications: 0,
      },
      recipients: [],
      smsSettings: {
        enabled: false,
        customerBodyId: null,
        adminBodyId: null,
        rateLimitPerHour: 5,
      },
      filters,
      schemaMissing: true,
    };
  }

  const [list, stats, recipients, smsSettings] = await Promise.all([
    listConsultationRequests(filters),
    getConsultationStats(),
    listConsultationRecipients(),
    getConsultationSmsSettings(),
  ]);

  return { list, stats, recipients, smsSettings, filters, schemaMissing: false };
}
