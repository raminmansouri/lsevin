import sql from "@/config/database/db";
import { getUserId } from "@/lib/auth/session";
import { resolveCurrentNotificationCustomerId } from "@/features/notification/server/current-notification-customer";
import { unstable_noStore as noStore } from "next/cache";

import { markBugReportNotificationsRead } from "./server/notifications";
import { adminBugReportFiltersSchema } from "./schemas";
import {
  AdminBugReportFilters,
  BugReportAssignableAgent,
  BugReportAttachment,
  BugReportBoardColumn,
  BugReportCard,
  BugReportDetails,
  BugReportMessage,
  BugReportPerson,
  BugReportRecentChange,
  BugReportUpdate,
  CustomerBugReportListItem,
} from "./types";

function toSingleString(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

export function parseAdminBugReportFilters(
  params: Record<string, string | string[] | undefined>,
): AdminBugReportFilters {
  return adminBugReportFiltersSchema.parse({
    q: toSingleString(params.q || params.search || params.filters),
    status: toSingleString(params.status) || "all",
    severity: toSingleString(params.severity) || "all",
    priority: toSingleString(params.priority) || "all",
    area: toSingleString(params.area || params.sourceArea) || "all",
    page: toSingleString(params.page) || undefined,
    pageSize: toSingleString(params.pageSize) || undefined,
    view: toSingleString(params.view) || "board",
    ownership: toSingleString(params.ownership) || "all",
  });
}

async function resolveCurrentUserId(): Promise<string | null> {
  try {
    return await getUserId();
  } catch {
    return null;
  }
}

async function resolveCurrentCustomerId(): Promise<string | null> {
  try {
    return await resolveCurrentNotificationCustomerId();
  } catch {
    return null;
  }
}

const DEFAULT_BOARD_COLUMNS: BugReportBoardColumn[] = [
  { key: "open", statuses: ["open"], title: "open", labelTranslations: { en: "Open", fa: "باز", ar: "مفتوح" }, displayOrder: 10, isEnabled: true },
  { key: "triaged", statuses: ["triaged"], title: "triaged", labelTranslations: { en: "Triaged", fa: "بررسی اولیه", ar: "تم الفرز" }, displayOrder: 20, isEnabled: true },
  { key: "in_progress", statuses: ["in_progress"], title: "in_progress", labelTranslations: { en: "In progress", fa: "در حال انجام", ar: "قيد التنفيذ" }, displayOrder: 30, isEnabled: true },
  { key: "need_info", statuses: ["need_info"], title: "need_info", labelTranslations: { en: "Need info", fa: "نیازمند اطلاعات", ar: "بحاجة إلى معلومات" }, displayOrder: 40, isEnabled: true },
  { key: "done", statuses: ["resolved", "closed", "duplicate", "wont_fix"], title: "resolved", labelTranslations: { en: "Done", fa: "انجام‌شده", ar: "منجز" }, displayOrder: 50, isEnabled: true },
];

function normalizeColumnStatuses(value: unknown, fallback: string[]): BugReportBoardColumn["statuses"] {
  const rawValues = Array.isArray(value) ? value : fallback;
  const valid = new Set(["open", "triaged", "in_progress", "need_info", "resolved", "closed", "duplicate", "wont_fix"]);
  const statuses = rawValues.filter((item): item is BugReportBoardColumn["statuses"][number] => typeof item === "string" && valid.has(item));
  return statuses.length > 0 ? statuses : (fallback as BugReportBoardColumn["statuses"]);
}

function normalizeTranslations(value: unknown, fallback: Record<string, string>) {
  return value && typeof value === "object" && !Array.isArray(value) ? { ...fallback, ...(value as Record<string, string>) } : fallback;
}


function buildCustomerBugReportOwnershipWhere(input: { userId: string | null; customerId: string | null }) {
  if (input.userId && input.customerId) {
    return sql`(br.customer_user_id = ${input.userId}::uuid or br.customer_id = ${input.customerId}::uuid)`;
  }

  if (input.userId) {
    return sql`br.customer_user_id = ${input.userId}::uuid`;
  }

  if (input.customerId) {
    return sql`br.customer_id = ${input.customerId}::uuid`;
  }

  return sql`false`;
}

function safeJsonArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.map((item) => String(item)).filter(Boolean);
  return [];
}

function safeAttachments(value: unknown): BugReportAttachment[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item) => item && typeof item === "object")
    .map((item) => item as Record<string, unknown>)
    .map((item) => ({
      id: typeof item.id === "string" ? item.id : undefined,
      mediaId: typeof item.mediaId === "string" ? item.mediaId : typeof item.media_id === "string" ? item.media_id : null,
      fileUrl:
        typeof item.fileUrl === "string"
          ? item.fileUrl
          : typeof item.file_url === "string"
            ? item.file_url
            : typeof item.url === "string"
              ? item.url
              : "",
      fileName:
        typeof item.fileName === "string"
          ? item.fileName
          : typeof item.file_name === "string"
            ? item.file_name
            : "attachment",
      mimeType:
        typeof item.mimeType === "string"
          ? item.mimeType
          : typeof item.mime_type === "string"
            ? item.mime_type
            : null,
      mediaType: (
        item.mediaType === "video" || item.media_type === "video"
          ? "video"
          : item.mediaType === "file" || item.media_type === "file"
            ? "file"
            : "image"
      ) as BugReportAttachment["mediaType"],
      fileSize:
        typeof item.fileSize === "number"
          ? item.fileSize
          : typeof item.file_size === "number"
            ? item.file_size
            : null,
      width: typeof item.width === "number" ? item.width : null,
      height: typeof item.height === "number" ? item.height : null,
    }))
    .filter((item) => item.fileUrl);
}

function isoDate(value: unknown): string {
  return value instanceof Date ? value.toISOString() : String(value);
}

function nullableIsoDate(value: unknown): string | null {
  if (!value) return null;
  return value instanceof Date ? value.toISOString() : String(value);
}

function normalizePerson(input: {
  userId?: string | null;
  displayName?: string | null;
  email?: string | null;
  avatarUrl?: string | null;
  role?: BugReportPerson["role"] | null;
  fallbackName: string;
}): BugReportPerson {
  return {
    userId: input.userId ?? null,
    displayName: input.displayName?.trim() || input.email?.trim() || input.fallbackName,
    email: input.email ?? null,
    avatarUrl: input.avatarUrl ?? null,
    role: input.role ?? "system",
  };
}

function mapBugReportCard(row: any): BugReportCard {
  return {
    id: row.id,
    reportNumber: row.report_number,
    title: row.title,
    description: row.description,
    sourceArea: row.source_area,
    sourceUrl: row.source_url,
    status: row.status,
    priority: row.priority,
    severity: row.severity,
    assignedToUserId: row.assigned_to_user_id,
    assignedToDisplayName: row.assigned_to_display_name ?? null,
    customerUserId: row.customer_user_id,
    customerDisplayName: row.customer_display_name ?? row.guest_name ?? row.guest_email ?? null,
    customerEmail: row.customer_email ?? row.guest_email ?? null,
    guestName: row.guest_name,
    guestEmail: row.guest_email,
    createDate: isoDate(row.create_date),
    lastModifiedDate: isoDate(row.last_modified_date),
    resolvedAt: nullableIsoDate(row.resolved_at),
    conversationNumber: row.conversation_number,
    unreadForAdminCount: Number(row.unread_for_admin_count || 0),
    lastMessagePreview: row.last_message_preview,
    lastMessageAt: nullableIsoDate(row.last_message_at),
    lastMessageAuthorName: row.last_message_author_name ?? null,
    lastMessageAuthorRole: row.last_message_author_role ?? null,
    updatedByOtherAt: nullableIsoDate(row.updated_by_other_at),
    updatedByOtherBy: row.updated_by_other_by ?? null,
    updatedByOtherEventType: row.updated_by_other_event_type ?? null,
    mediaCount: Number(row.media_count || 0),
    messageCount: Number(row.message_count || 0),
  };
}


function mapRecentChange(row: any): BugReportRecentChange {
  return {
    id: row.id,
    bugReportId: row.bug_report_id,
    reportNumber: row.report_number,
    title: row.title,
    eventType: row.event_type,
    actorName: row.actor_display_name || "System",
    fromValue: row.from_value ?? null,
    toValue: row.to_value ?? null,
    createDate: isoDate(row.create_date),
  };
}

function mapMessage(row: any): BugReportMessage {
  const senderRole = row.sender_type === "agent" ? "agent" : row.sender_type === "customer" ? (row.sender_user_id ? "customer" : "guest") : "system";
  return {
    id: row.id,
    senderType: row.sender_type,
    senderUserId: row.sender_user_id,
    sender: normalizePerson({
      userId: row.sender_user_id,
      displayName: row.sender_display_name,
      email: row.sender_email,
      avatarUrl: row.sender_avatar_url,
      role: senderRole,
      fallbackName: row.sender_type === "agent" ? "LSevin support" : row.sender_type === "customer" ? "Customer" : "System",
    }),
    body: row.body,
    messageType: row.message_type,
    isInternalNote: Boolean(row.is_internal_note),
    attachments: safeAttachments(row.attachments),
    createDate: isoDate(row.create_date),
  };
}

function describeEvent(row: any) {
  const toValue = row.to_value ? String(row.to_value).replace(/_/g, " ") : null;
  const fromValue = row.from_value ? String(row.from_value).replace(/_/g, " ") : null;

  switch (row.event_type) {
    case "bug_created":
      return { title: "Bug report created", body: row.to_value ? `Report ${row.to_value} was created.` : null };
    case "agent_replied":
      return { title: "Support replied", body: "A public reply was sent to the customer." };
    case "customer_replied":
      return { title: "Customer replied", body: "The customer added more information." };
    case "internal_note_added":
      return { title: "Internal note added", body: "An internal note was added for the team." };
    case "status_changed":
      return { title: "Status changed", body: fromValue ? `Changed from ${fromValue} to ${toValue}.` : `Changed to ${toValue}.` };
    case "assignee_changed":
      return { title: "Assignment changed", body: toValue ? "Assigned to an agent." : "Unassigned." };
    case "priority_changed":
      return { title: "Priority changed", body: fromValue ? `Changed from ${fromValue} to ${toValue}.` : `Changed to ${toValue}.` };
    case "bug_archived":
      return { title: "Bug archived", body: "This bug report was archived." };
    default:
      return { title: String(row.event_type).replace(/_/g, " "), body: row.to_value ?? null };
  }
}

function mapUpdate(row: any): BugReportUpdate {
  const described = describeEvent(row);
  const isInternal = row.event_type === "internal_note_added" || row.event_type === "assignee_changed" || row.event_type === "bug_archived" || row.is_public === false;
  return {
    id: row.id,
    eventType: row.event_type,
    actor: normalizePerson({
      userId: row.actor_user_id,
      displayName: row.actor_display_name,
      email: row.actor_email,
      avatarUrl: row.actor_avatar_url,
      role: row.actor_role,
      fallbackName: row.event_type === "bug_created" ? "Customer" : "System",
    }),
    fromValue: row.from_value,
    toValue: row.to_value,
    title: described.title,
    body: described.body,
    isInternal,
    createDate: isoDate(row.create_date),
  };
}

function mediaFromRow(item: any): BugReportAttachment {
  return {
    id: item.id,
    mediaId: item.media_id,
    fileUrl: item.file_url,
    fileName: item.file_name,
    mimeType: item.mime_type,
    mediaType: item.media_type,
    fileSize: Number(item.file_size || 0),
    width: item.width,
    height: item.height,
  };
}

async function getConversationMessages(input: { conversationId: string; publicOnly: boolean }) {
  return sql<any[]>`
    select
      msg.id,
      msg.sender_type,
      msg.sender_user_id,
      msg.body,
      msg.message_type,
      msg.is_internal_note,
      msg.attachments,
      msg.create_date,
      coalesce(
        nullif(ast.display_name, ''),
        nullif(trim(concat_ws(' ', u.first_name, u.last_name)), ''),
        nullif(u.email, ''),
        case when msg.sender_type = 'agent' then 'LSevin support' when msg.sender_type = 'customer' then 'Customer' else 'System' end
      ) as sender_display_name,
      u.email as sender_email,
      coalesce(ast.avatar_url, u.profile_image_url) as sender_avatar_url
    from support.messages msg
    left join identity.asp_net_users u on u.id = msg.sender_user_id
    left join support.agent_statuses ast on ast.user_id = msg.sender_user_id
    where msg.conversation_id = ${input.conversationId}::uuid
      and msg.deleted_at is null
      and (${input.publicOnly} = false or msg.is_internal_note = false)
    order by msg.create_date asc
  `;
}

async function getConversationUpdates(input: { conversationId: string; publicOnly: boolean }) {
  return sql<any[]>`
    select
      e.id,
      e.event_type,
      e.actor_user_id,
      e.from_value,
      e.to_value,
      e.metadata,
      e.create_date,
      coalesce((e.metadata ->> 'public') <> 'false', true) as is_public,
      coalesce(
        nullif(ast.display_name, ''),
        nullif(trim(concat_ws(' ', u.first_name, u.last_name)), ''),
        nullif(u.email, ''),
        case when e.actor_user_id is null then 'System' else 'Team member' end
      ) as actor_display_name,
      u.email as actor_email,
      coalesce(ast.avatar_url, u.profile_image_url) as actor_avatar_url,
      case
        when e.actor_user_id is null then 'system'
        when exists (select 1 from support.messages m where m.conversation_id = e.conversation_id and m.sender_user_id = e.actor_user_id and m.sender_type = 'customer') then 'customer'
        else 'agent'
      end as actor_role
    from support.conversation_events e
    left join identity.asp_net_users u on u.id = e.actor_user_id
    left join support.agent_statuses ast on ast.user_id = e.actor_user_id
    where e.conversation_id = ${input.conversationId}::uuid
      and (${input.publicOnly} = false or coalesce((e.metadata ->> 'public') <> 'false', true) = true)
    order by e.create_date asc
  `;
}

export async function getCustomerBugReportPageData() {
  noStore();
  const userId = await resolveCurrentUserId();
  const customerId = await resolveCurrentCustomerId();

  if (!userId && !customerId) {
    return { userId: null, reports: [] as CustomerBugReportListItem[] };
  }

  const ownershipWhere = buildCustomerBugReportOwnershipWhere({ userId, customerId });

  const rows = await sql<any[]>`
    select
      br.id,
      br.report_number,
      br.title,
      br.status,
      br.priority,
      br.severity,
      br.source_area,
      br.create_date,
      c.last_message_preview,
      c.last_message_at,
      c.unread_for_admin_count,
      c.unread_for_customer_count
    from support.bug_reports br
    join support.conversations c on c.id = br.conversation_id
    where ${ownershipWhere}
      and br.deleted_at is null
    order by coalesce(c.last_message_at, br.create_date) desc
    limit 20
  `;

  return {
    userId,
    reports: rows.map((row) => ({
      id: row.id,
      reportNumber: row.report_number,
      title: row.title,
      status: row.status,
      priority: row.priority,
      severity: row.severity,
      sourceArea: row.source_area,
      createDate: isoDate(row.create_date),
      lastMessagePreview: row.last_message_preview,
      lastMessageAt: nullableIsoDate(row.last_message_at),
      unreadForAdminCount: Number(row.unread_for_admin_count || 0),
      unreadForCustomerCount: Number(row.unread_for_customer_count || 0),
    })) as CustomerBugReportListItem[],
  };
}

export async function getBugReportBoardColumnSettings(): Promise<BugReportBoardColumn[]> {
  noStore();

  try {
    const existsRows = await sql<{ exists: boolean }[]>`
      select to_regclass('support.bug_report_board_column_settings') is not null as exists
    `;
    if (!existsRows[0]?.exists) return DEFAULT_BOARD_COLUMNS;

    const rows = await sql<any[]>`
      select column_key, status_values, label_translations, display_order, is_enabled
      from support.bug_report_board_column_settings
      where is_enabled = true
      order by display_order asc, column_key asc
    `;

    if (rows.length === 0) return DEFAULT_BOARD_COLUMNS;
    const fallbackByKey = new Map(DEFAULT_BOARD_COLUMNS.map((column) => [column.key, column]));

    return rows.map((row) => {
      const fallback = fallbackByKey.get(row.column_key) ?? {
        key: row.column_key,
        statuses: [] as BugReportBoardColumn["statuses"],
        title: row.column_key,
        labelTranslations: { en: String(row.column_key).replace(/_/g, " ") },
        displayOrder: Number(row.display_order || 100),
        isEnabled: true,
      };

      return {
        key: row.column_key,
        statuses: normalizeColumnStatuses(row.status_values, fallback.statuses),
        title: fallback.title,
        labelTranslations: normalizeTranslations(row.label_translations, fallback.labelTranslations),
        displayOrder: Number(row.display_order ?? fallback.displayOrder),
        isEnabled: Boolean(row.is_enabled),
      };
    });
  } catch (error) {
    console.error("getBugReportBoardColumnSettings failed", error);
    return DEFAULT_BOARD_COLUMNS;
  }
}

export async function getAdminBugReports(filters: AdminBugReportFilters) {
  noStore();

  const currentUserId = await resolveCurrentUserId();
  const page = Math.max(1, filters.page || 1);
  const pageSize = Math.min(100, Math.max(10, filters.pageSize || 40));
  const offset = (page - 1) * pageSize;

  const whereParts = [sql`true`];
  if (filters.ownership === "assigned_to_me") {
    whereParts.push(currentUserId ? sql`br.assigned_to_user_id = ${currentUserId}::uuid` : sql`false`);
  } else if (filters.ownership === "unassigned") {
    whereParts.push(sql`br.assigned_to_user_id is null`);
  }
  if (filters.status !== "all") whereParts.push(sql`br.status = ${filters.status}::text`);
  if (filters.severity !== "all") whereParts.push(sql`br.severity = ${filters.severity}::text`);
  if (filters.priority !== "all") whereParts.push(sql`br.priority = ${filters.priority}::text`);
  if (filters.area !== "all") whereParts.push(sql`br.source_area = ${filters.area}::text`);
  if (filters.q) {
    const q = `%${filters.q}%`;
    whereParts.push(sql`(
      br.report_number ilike ${q}
      or br.title ilike ${q}
      or br.description ilike ${q}
      or br.guest_email ilike ${q}
      or br.guest_name ilike ${q}
      or exists (
        select 1 from support.messages m
        where m.conversation_id = br.conversation_id
          and coalesce(m.body, '') ilike ${q}
      )
    )`);
  }

  const whereSql = whereParts.reduce((acc, part) => sql`${acc} and ${part}`);
  const latestUpdateByOtherCondition = currentUserId
    ? sql`latest_update.actor_user_id is distinct from ${currentUserId}::uuid`
    : sql`false`;
  const recentChangeByOtherWhere = currentUserId
    ? sql`e.actor_user_id is distinct from ${currentUserId}::uuid
          and not exists (
            select 1
            from support.conversation_events own_event
            where own_event.conversation_id = e.conversation_id
              and own_event.event_type <> 'bug_created'
              and own_event.actor_user_id = ${currentUserId}::uuid
              and own_event.create_date >= e.create_date
          )`
    : sql`false`;

  const [cards, totalRows, stats, recentChanges] = await Promise.all([
    sql<any[]>`
      select
        br.*,
        coalesce(nullif(trim(concat_ws(' ', cu.first_name, cu.last_name)), ''), nullif(cu.email, ''), br.guest_name, br.guest_email) as customer_display_name,
        coalesce(cu.email, br.guest_email) as customer_email,
        coalesce(nullif(ast.display_name, ''), nullif(trim(concat_ws(' ', au.first_name, au.last_name)), ''), nullif(au.email, '')) as assigned_to_display_name,
        last_msg.sender_display_name as last_message_author_name,
        last_msg.sender_role as last_message_author_role,
        case when ${latestUpdateByOtherCondition} then latest_update.updated_by_other_at else null end as updated_by_other_at,
        case when ${latestUpdateByOtherCondition} then latest_update.updated_by_other_by else null end as updated_by_other_by,
        case when ${latestUpdateByOtherCondition} then latest_update.updated_by_other_event_type else null end as updated_by_other_event_type
      from support.bug_report_admin_cards br
      left join identity.asp_net_users cu on cu.id = br.customer_user_id
      left join identity.asp_net_users au on au.id = br.assigned_to_user_id
      left join support.agent_statuses ast on ast.user_id = br.assigned_to_user_id
      left join lateral (
        select
          coalesce(
            nullif(ms.display_name, ''),
            nullif(trim(concat_ws(' ', mu.first_name, mu.last_name)), ''),
            nullif(mu.email, ''),
            case when m.sender_type = 'agent' then 'LSevin support' when m.sender_type = 'customer' then 'Customer' else 'System' end
          ) as sender_display_name,
          m.sender_type as sender_role
        from support.messages m
        left join identity.asp_net_users mu on mu.id = m.sender_user_id
        left join support.agent_statuses ms on ms.user_id = m.sender_user_id
        where m.conversation_id = br.conversation_id
          and m.deleted_at is null
        order by m.create_date desc
        limit 1
      ) last_msg on true
      left join lateral (
        select
          e.create_date as updated_by_other_at,
          e.actor_user_id,
          coalesce(
            nullif(east.display_name, ''),
            nullif(trim(concat_ws(' ', eu.first_name, eu.last_name)), ''),
            nullif(eu.email, ''),
            case when e.actor_user_id is null then 'System' else 'Team member' end
          ) as updated_by_other_by,
          e.event_type as updated_by_other_event_type
        from support.conversation_events e
        left join identity.asp_net_users eu on eu.id = e.actor_user_id
        left join support.agent_statuses east on east.user_id = e.actor_user_id
        where e.conversation_id = br.conversation_id
          and e.event_type <> 'bug_created'
        order by e.create_date desc
        limit 1
      ) latest_update on true
      where ${whereSql}
      order by
        case when (${latestUpdateByOtherCondition}) and latest_update.updated_by_other_at >= now() - interval '24 hours' then 0 else 1 end,
        case br.priority when 'urgent' then 1 when 'high' then 2 when 'normal' then 3 else 4 end,
        coalesce(br.last_message_at, br.last_modified_date, br.create_date) desc
      limit ${pageSize}::int
      offset ${offset}::int
    `,
    sql<any[]>`
      select count(*)::int as total
      from support.bug_report_admin_cards br
      where ${whereSql}
    `,
    sql<any[]>`
      select
        count(*)::int as total,
        count(*) filter (where status in ('open','triaged','in_progress','need_info'))::int as active,
        count(*) filter (where status = 'need_info')::int as need_info,
        count(*) filter (where status in ('resolved','closed'))::int as resolved,
        count(*) filter (where severity = 'critical')::int as critical,
        count(*) filter (where assigned_to_user_id is null and status in ('open','triaged','in_progress','need_info'))::int as unassigned
      from support.bug_reports
      where deleted_at is null
    `,
    sql<any[]>`
      select
        e.id,
        br.id as bug_report_id,
        br.report_number,
        br.title,
        e.event_type,
        e.from_value,
        e.to_value,
        e.create_date,
        coalesce(
          nullif(east.display_name, ''),
          nullif(trim(concat_ws(' ', eu.first_name, eu.last_name)), ''),
          nullif(eu.email, ''),
          case when e.actor_user_id is null then 'System' else 'Team member' end
        ) as actor_display_name
      from support.bug_report_admin_cards br
      join support.conversation_events e on e.conversation_id = br.conversation_id
      left join identity.asp_net_users eu on eu.id = e.actor_user_id
      left join support.agent_statuses east on east.user_id = e.actor_user_id
      where ${whereSql}
        and e.event_type <> 'bug_created'
        and ${recentChangeByOtherWhere}
      order by e.create_date desc
      limit 7
    `,
  ]);

  const totalItems = Number(totalRows[0]?.total || 0);
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  return {
    items: cards.map(mapBugReportCard),
    recentChanges: recentChanges.map(mapRecentChange),
    stats: {
      total: Number(stats[0]?.total || 0),
      active: Number(stats[0]?.active || 0),
      needInfo: Number(stats[0]?.need_info || 0),
      resolved: Number(stats[0]?.resolved || 0),
      critical: Number(stats[0]?.critical || 0),
      unassigned: Number(stats[0]?.unassigned || 0),
    },
    pageInfo: {
      page,
      pageSize,
      totalItems,
      totalPages,
      hasPreviousPage: page > 1,
      hasNextPage: page < totalPages,
    },
  };
}

export async function getBugReportAssignableAgents(): Promise<BugReportAssignableAgent[]> {
  noStore();

  const rows = await sql<any[]>`
    select distinct on (u.id)
      u.id as user_id,
      coalesce(
        nullif(ast.display_name, ''),
        nullif(trim(concat_ws(' ', u.first_name, u.last_name)), ''),
        nullif(u.email, ''),
        u.user_name
      ) as display_name,
      nullif(u.email, '') as email,
      coalesce(ast.avatar_url, u.profile_image_url) as avatar_url,
      coalesce(ast.status, 'offline') as status
    from identity.asp_net_users u
    left join support.agent_statuses ast on ast.user_id = u.id
    left join identity.asp_net_user_roles ur on ur.user_id = u.id
    left join identity.asp_net_roles r on r.id = ur.role_id
    where u.user_state = 'Active'
      and (
        ast.user_id is not null
        or lower(coalesce(r.name, '')) in ('admin', 'administrator', 'support', 'agent', 'manager', 'superadmin', 'super_admin')
      )
    order by u.id,
      case coalesce(ast.status, 'offline') when 'online' then 1 when 'away' then 2 else 3 end,
      display_name asc
    limit 200
  `;

  return rows.map((row) => ({
    userId: row.user_id,
    displayName: row.display_name || row.email || 'Team member',
    email: row.email ?? null,
    avatarUrl: row.avatar_url ?? null,
    status: row.status || 'offline',
  }));
}

export async function getAdminBugReportDetails(id: string): Promise<BugReportDetails | null> {
  noStore();
  const userId = await resolveCurrentUserId();
  const rows = await sql<any[]>`
    select
      br.*,
      c.conversation_number,
      c.unread_for_admin_count,
      c.last_message_preview,
      c.last_message_at,
      coalesce(media_counts.media_count, 0)::integer as media_count,
      coalesce(message_counts.message_count, 0)::integer as message_count,
      coalesce(nullif(trim(concat_ws(' ', cu.first_name, cu.last_name)), ''), nullif(cu.email, ''), br.guest_name, br.guest_email) as customer_display_name,
      coalesce(cu.email, br.guest_email) as customer_email,
      coalesce(nullif(ast.display_name, ''), nullif(trim(concat_ws(' ', au.first_name, au.last_name)), ''), nullif(au.email, '')) as assigned_to_display_name,
      coalesce(nullif(rst.display_name, ''), nullif(trim(concat_ws(' ', ru.first_name, ru.last_name)), ''), nullif(ru.email, '')) as resolved_by_display_name
    from support.bug_reports br
    join support.conversations c on c.id = br.conversation_id
    left join identity.asp_net_users cu on cu.id = br.customer_user_id
    left join identity.asp_net_users au on au.id = br.assigned_to_user_id
    left join identity.asp_net_users ru on ru.id = br.resolved_by_user_id
    left join support.agent_statuses ast on ast.user_id = br.assigned_to_user_id
    left join support.agent_statuses rst on rst.user_id = br.resolved_by_user_id
    left join lateral (
      select count(*) as media_count from support.bug_report_media m where m.bug_report_id = br.id
    ) media_counts on true
    left join lateral (
      select count(*) as message_count from support.messages msg where msg.conversation_id = br.conversation_id and msg.deleted_at is null
    ) message_counts on true
    where br.id = ${id}::uuid
      and br.deleted_at is null
    limit 1
  `;

  const row = rows[0];
  if (!row) return null;

  const [messages, media, updates] = await Promise.all([
    getConversationMessages({ conversationId: row.conversation_id, publicOnly: false }),
    sql<any[]>`
      select id, media_id, file_url, file_name, mime_type, media_type, file_size, width, height
      from support.bug_report_media
      where bug_report_id = ${row.id}::uuid
      order by display_order asc, create_date asc
    `,
    getConversationUpdates({ conversationId: row.conversation_id, publicOnly: false }),
  ]);

  await sql`
    update support.conversations
    set unread_for_admin_count = 0,
        last_modified_date = now()
    where id = ${row.conversation_id}::uuid
  `;
  await markBugReportNotificationsRead({ bugReportId: row.id, recipientType: "admin", recipientUserId: userId });

  return {
    ...mapBugReportCard(row),
    currentViewerUserId: userId,
    expectedBehavior: row.expected_behavior,
    actualBehavior: row.actual_behavior,
    reproductionSteps: safeJsonArray(row.reproduction_steps),
    bookingId: row.booking_id,
    providerId: row.provider_id,
    serviceId: row.service_id,
    specialistId: row.specialist_id,
    browserName: row.browser_name,
    operatingSystem: row.operating_system,
    deviceType: row.device_type,
    appVersion: row.app_version,
    environment: row.environment && typeof row.environment === "object" ? row.environment : {},
    resolutionNote: row.resolution_note,
    resolvedByUserId: row.resolved_by_user_id,
    resolvedByDisplayName: row.resolved_by_display_name ?? null,
    conversationId: row.conversation_id,
    messages: messages.map(mapMessage),
    updates: updates.map(mapUpdate),
    media: media.map(mediaFromRow),
  };
}

export async function getCustomerBugReportDetails(id: string): Promise<BugReportDetails | null> {
  noStore();
  const userId = await resolveCurrentUserId();
  const customerId = await resolveCurrentCustomerId();
  if (!userId && !customerId) return null;
  const ownershipWhere = buildCustomerBugReportOwnershipWhere({ userId, customerId });

  const rows = await sql<any[]>`
    select
      br.*,
      c.conversation_number,
      c.unread_for_admin_count,
      c.last_message_preview,
      c.last_message_at,
      coalesce(media_counts.media_count, 0)::integer as media_count,
      coalesce(message_counts.message_count, 0)::integer as message_count,
      coalesce(nullif(trim(concat_ws(' ', cu.first_name, cu.last_name)), ''), nullif(cu.email, ''), br.guest_name, br.guest_email) as customer_display_name,
      coalesce(cu.email, br.guest_email) as customer_email,
      coalesce(nullif(ast.display_name, ''), nullif(trim(concat_ws(' ', au.first_name, au.last_name)), ''), nullif(au.email, '')) as assigned_to_display_name,
      coalesce(nullif(rst.display_name, ''), nullif(trim(concat_ws(' ', ru.first_name, ru.last_name)), ''), nullif(ru.email, '')) as resolved_by_display_name
    from support.bug_reports br
    join support.conversations c on c.id = br.conversation_id
    left join identity.asp_net_users cu on cu.id = br.customer_user_id
    left join identity.asp_net_users au on au.id = br.assigned_to_user_id
    left join identity.asp_net_users ru on ru.id = br.resolved_by_user_id
    left join support.agent_statuses ast on ast.user_id = br.assigned_to_user_id
    left join support.agent_statuses rst on rst.user_id = br.resolved_by_user_id
    left join lateral (
      select count(*) as media_count from support.bug_report_media m where m.bug_report_id = br.id
    ) media_counts on true
    left join lateral (
      select count(*) as message_count
      from support.messages msg
      where msg.conversation_id = br.conversation_id
        and msg.deleted_at is null
        and msg.is_internal_note = false
    ) message_counts on true
    where br.id = ${id}::uuid
      and ${ownershipWhere}
      and br.deleted_at is null
    limit 1
  `;

  const row = rows[0];
  if (!row) return null;

  const [messages, media, updates] = await Promise.all([
    getConversationMessages({ conversationId: row.conversation_id, publicOnly: true }),
    sql<any[]>`
      select id, media_id, file_url, file_name, mime_type, media_type, file_size, width, height
      from support.bug_report_media
      where bug_report_id = ${row.id}::uuid
      order by display_order asc, create_date asc
    `,
    getConversationUpdates({ conversationId: row.conversation_id, publicOnly: true }),
  ]);

  await sql`
    update support.conversations
    set unread_for_customer_count = 0,
        last_modified_date = now()
    where id = ${row.conversation_id}::uuid
  `;
  await markBugReportNotificationsRead({ bugReportId: row.id, recipientType: "customer", recipientUserId: userId ?? customerId });

  return {
    ...mapBugReportCard(row),
    currentViewerUserId: userId,
    expectedBehavior: row.expected_behavior,
    actualBehavior: row.actual_behavior,
    reproductionSteps: safeJsonArray(row.reproduction_steps),
    bookingId: row.booking_id,
    providerId: row.provider_id,
    serviceId: row.service_id,
    specialistId: row.specialist_id,
    browserName: row.browser_name,
    operatingSystem: row.operating_system,
    deviceType: row.device_type,
    appVersion: row.app_version,
    environment: row.environment && typeof row.environment === "object" ? row.environment : {},
    resolutionNote: row.resolution_note,
    resolvedByUserId: row.resolved_by_user_id,
    resolvedByDisplayName: row.resolved_by_display_name ?? null,
    conversationId: row.conversation_id,
    messages: messages.map(mapMessage),
    updates: updates.map(mapUpdate),
    media: media.map(mediaFromRow),
  };
}
