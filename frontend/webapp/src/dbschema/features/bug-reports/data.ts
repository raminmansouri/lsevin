import sql from "@/config/database/db";
import { getUserId } from "@/lib/auth/session";
import { unstable_noStore as noStore } from "next/cache";

import { adminBugReportFiltersSchema } from "./schemas";
import {
  AdminBugReportFilters,
  BugReportAttachment,
  BugReportCard,
  BugReportDetails,
  BugReportMessage,
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
  });
}

async function resolveCurrentUserId(): Promise<string | null> {
  try {
    return await getUserId();
  } catch {
    return null;
  }
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
      mediaType:
        item.mediaType === "video" || item.media_type === "video"
          ? "video"
          : item.mediaType === "file" || item.media_type === "file"
            ? "file"
            : "image",
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
    customerUserId: row.customer_user_id,
    guestName: row.guest_name,
    guestEmail: row.guest_email,
    createDate: row.create_date instanceof Date ? row.create_date.toISOString() : String(row.create_date),
    lastModifiedDate: row.last_modified_date instanceof Date ? row.last_modified_date.toISOString() : String(row.last_modified_date),
    resolvedAt: row.resolved_at ? (row.resolved_at instanceof Date ? row.resolved_at.toISOString() : String(row.resolved_at)) : null,
    conversationNumber: row.conversation_number,
    unreadForAdminCount: Number(row.unread_for_admin_count || 0),
    lastMessagePreview: row.last_message_preview,
    lastMessageAt: row.last_message_at ? (row.last_message_at instanceof Date ? row.last_message_at.toISOString() : String(row.last_message_at)) : null,
    mediaCount: Number(row.media_count || 0),
    messageCount: Number(row.message_count || 0),
  };
}

function mapMessage(row: any): BugReportMessage {
  return {
    id: row.id,
    senderType: row.sender_type,
    senderUserId: row.sender_user_id,
    body: row.body,
    messageType: row.message_type,
    isInternalNote: Boolean(row.is_internal_note),
    attachments: safeAttachments(row.attachments),
    createDate: row.create_date instanceof Date ? row.create_date.toISOString() : String(row.create_date),
  };
}

export async function getCustomerBugReportPageData() {
  noStore();
  const userId = await resolveCurrentUserId();

  if (!userId) {
    return { userId: null, reports: [] as CustomerBugReportListItem[] };
  }

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
    where br.customer_user_id = ${userId}::uuid
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
      createDate: row.create_date instanceof Date ? row.create_date.toISOString() : String(row.create_date),
      lastMessagePreview: row.last_message_preview,
      lastMessageAt: row.last_message_at ? (row.last_message_at instanceof Date ? row.last_message_at.toISOString() : String(row.last_message_at)) : null,
      unreadForAdminCount: Number(row.unread_for_admin_count || 0),
      unreadForCustomerCount: Number(row.unread_for_customer_count || 0),
    })) as CustomerBugReportListItem[],
  };
}

export async function getAdminBugReports(filters: AdminBugReportFilters) {
  noStore();

  const whereParts = [sql`true`];
  if (filters.status !== "all") whereParts.push(sql`br.status = ${filters.status}`);
  if (filters.severity !== "all") whereParts.push(sql`br.severity = ${filters.severity}`);
  if (filters.priority !== "all") whereParts.push(sql`br.priority = ${filters.priority}`);
  if (filters.area !== "all") whereParts.push(sql`br.source_area = ${filters.area}`);
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

  const [cards, stats] = await Promise.all([
    sql<any[]>`
      select *
      from support.bug_report_admin_cards br
      where ${whereSql}
      order by
        case br.priority when 'urgent' then 1 when 'high' then 2 when 'normal' then 3 else 4 end,
        coalesce(br.last_message_at, br.create_date) desc
      limit 120
    `,
    sql<any[]>`
      select
        count(*)::int as total,
        count(*) filter (where status in ('open','triaged','in_progress','need_info'))::int as active,
        count(*) filter (where status = 'need_info')::int as need_info,
        count(*) filter (where status in ('resolved','closed'))::int as resolved,
        count(*) filter (where severity = 'critical')::int as critical
      from support.bug_reports
      where deleted_at is null
    `,
  ]);

  return {
    items: cards.map(mapBugReportCard),
    stats: {
      total: Number(stats[0]?.total || 0),
      active: Number(stats[0]?.active || 0),
      needInfo: Number(stats[0]?.need_info || 0),
      resolved: Number(stats[0]?.resolved || 0),
      critical: Number(stats[0]?.critical || 0),
    },
  };
}

export async function getAdminBugReportDetails(id: string): Promise<BugReportDetails | null> {
  noStore();
  const rows = await sql<any[]>`
    select
      br.*,
      c.conversation_number,
      c.unread_for_admin_count,
      c.last_message_preview,
      c.last_message_at,
      coalesce(media_counts.media_count, 0)::integer as media_count,
      coalesce(message_counts.message_count, 0)::integer as message_count
    from support.bug_reports br
    join support.conversations c on c.id = br.conversation_id
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

  const [messages, media] = await Promise.all([
    sql<any[]>`
      select id, sender_type, sender_user_id, body, message_type, is_internal_note, attachments, create_date
      from support.messages
      where conversation_id = ${row.conversation_id}::uuid
        and deleted_at is null
      order by create_date asc
    `,
    sql<any[]>`
      select id, media_id, file_url, file_name, mime_type, media_type, file_size, width, height
      from support.bug_report_media
      where bug_report_id = ${row.id}::uuid
      order by display_order asc, create_date asc
    `,
  ]);

  await sql`
    update support.conversations
    set unread_for_admin_count = 0,
        last_modified_date = now()
    where id = ${row.conversation_id}::uuid
  `;

  return {
    ...mapBugReportCard(row),
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
    conversationId: row.conversation_id,
    messages: messages.map(mapMessage),
    media: media.map((item) => ({
      id: item.id,
      mediaId: item.media_id,
      fileUrl: item.file_url,
      fileName: item.file_name,
      mimeType: item.mime_type,
      mediaType: item.media_type,
      fileSize: Number(item.file_size || 0),
      width: item.width,
      height: item.height,
    })),
  };
}

export async function getCustomerBugReportDetails(id: string): Promise<BugReportDetails | null> {
  noStore();
  const userId = await resolveCurrentUserId();
  if (!userId) return null;

  const rows = await sql<any[]>`
    select
      br.*,
      c.conversation_number,
      c.unread_for_admin_count,
      c.last_message_preview,
      c.last_message_at,
      coalesce(media_counts.media_count, 0)::integer as media_count,
      coalesce(message_counts.message_count, 0)::integer as message_count
    from support.bug_reports br
    join support.conversations c on c.id = br.conversation_id
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
      and br.customer_user_id = ${userId}::uuid
      and br.deleted_at is null
    limit 1
  `;

  const row = rows[0];
  if (!row) return null;

  const [messages, media] = await Promise.all([
    sql<any[]>`
      select id, sender_type, sender_user_id, body, message_type, is_internal_note, attachments, create_date
      from support.messages
      where conversation_id = ${row.conversation_id}::uuid
        and deleted_at is null
        and is_internal_note = false
      order by create_date asc
    `,
    sql<any[]>`
      select id, media_id, file_url, file_name, mime_type, media_type, file_size, width, height
      from support.bug_report_media
      where bug_report_id = ${row.id}::uuid
      order by display_order asc, create_date asc
    `,
  ]);

  await sql`
    update support.conversations
    set unread_for_customer_count = 0,
        last_modified_date = now()
    where id = ${row.conversation_id}::uuid
  `;

  return {
    ...mapBugReportCard(row),
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
    conversationId: row.conversation_id,
    messages: messages.map(mapMessage),
    media: media.map((item) => ({
      id: item.id,
      mediaId: item.media_id,
      fileUrl: item.file_url,
      fileName: item.file_name,
      mimeType: item.mime_type,
      mediaType: item.media_type,
      fileSize: Number(item.file_size || 0),
      width: item.width,
      height: item.height,
    })),
  };
}
