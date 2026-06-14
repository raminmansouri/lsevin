import "server-only";

import sql from "@/config/database/db";
import { DEFAULT_SUPPORT_LABELS } from "../constants";
import type {
  SupportActionError,
  SupportAgent,
  SupportBootstrapData,
  SupportCannedReply,
  SupportConversationDetail,
  SupportConversationEvent,
  SupportConversationListItem,
  SupportConversationListResult,
  SupportMessage,
  SupportPagination,
  SupportPriority,
  SupportSettings,
  SupportStatus,
  SupportTag,
} from "../types";
import type {
  AddInternalNoteInput,
  AssignConversationInput,
  ConversationTagInput,
  CreateGuestConversationInput,
  GetOrCreateConversationInput,
  SendAgentMessageInput,
  SendCustomerMessageInput,
  SupportSettingsInput,
  UpsertCannedReplyInput,
  UpsertSupportTagInput,
} from "../schemas";

type QueryLike = typeof sql;
type JsonRecord = Record<string, unknown>;

type DbSettingsRow = {
  id: number;
  floatingChatEnabled: boolean;
  supportPageEnabled: boolean;
  requireLogin: boolean;
  allowGuestConversation: boolean;
  showOnAppPages: boolean;
  showOnBookingPages: boolean;
  showOnProviderPages: boolean;
  showOnAdminPages: boolean;
  launcherPosition: "bottom-right" | "bottom-left";
  launcherIcon: string;
  primaryColor: string;
  accentColor: string;
  textColor: string;
  borderRadius: string;
  themeMode: "system" | "light" | "dark";
  compactMode: boolean;
  labels: SupportSettings["labels"];
  officeHours: JsonRecord;
  offlineSettings: JsonRecord;
  autoReplySettings: JsonRecord;
  metadata: JsonRecord;
  createDate: string;
  lastModifiedDate: string;
};

type ConversationRow = Omit<SupportConversationListItem, "tags"> & { tags: SupportTag[] | null };

function supportError(error: unknown, title = "Support database error"): SupportActionError {
  console.error("[support]", title, error);
  return {
    title,
    detail: error instanceof Error ? error.message : "Unexpected support error.",
    status: 500,
  };
}

function clean(value?: string | null) {
  const trimmed = String(value || "").trim();
  return trimmed || null;
}

function normalizePhone(countryCode?: string | null, phone?: string | null) {
  return {
    countryCode: clean(countryCode),
    phone: clean(phone),
  };
}

function normalizeSettings(row: DbSettingsRow): SupportSettings {
  return {
    id: Number(row.id),
    floatingChatEnabled: Boolean(row.floatingChatEnabled),
    supportPageEnabled: Boolean(row.supportPageEnabled),
    requireLogin: Boolean(row.requireLogin),
    allowGuestConversation: Boolean(row.allowGuestConversation),
    showOnAppPages: Boolean(row.showOnAppPages),
    showOnBookingPages: Boolean(row.showOnBookingPages),
    showOnProviderPages: Boolean(row.showOnProviderPages),
    showOnAdminPages: Boolean(row.showOnAdminPages),
    launcherPosition: row.launcherPosition || "bottom-right",
    launcherIcon: row.launcherIcon || "message-circle",
    primaryColor: row.primaryColor || "#083f30",
    accentColor: row.accentColor || "#eac074",
    textColor: row.textColor || "#ffffff",
    borderRadius: row.borderRadius || "24px",
    themeMode: row.themeMode || "system",
    compactMode: Boolean(row.compactMode),
    labels: { ...DEFAULT_SUPPORT_LABELS, ...(row.labels || {}) },
    officeHours: row.officeHours || {},
    offlineSettings: row.offlineSettings || {},
    autoReplySettings: row.autoReplySettings || {},
    metadata: row.metadata || {},
    createDate: row.createDate,
    lastModifiedDate: row.lastModifiedDate,
  };
}

const SETTINGS_SELECT = sql.unsafe(`
  select
    id::int as id,
    floating_chat_enabled as "floatingChatEnabled",
    support_page_enabled as "supportPageEnabled",
    require_login as "requireLogin",
    allow_guest_conversation as "allowGuestConversation",
    show_on_app_pages as "showOnAppPages",
    show_on_booking_pages as "showOnBookingPages",
    show_on_provider_pages as "showOnProviderPages",
    show_on_admin_pages as "showOnAdminPages",
    launcher_position as "launcherPosition",
    launcher_icon as "launcherIcon",
    primary_color as "primaryColor",
    accent_color as "accentColor",
    text_color as "textColor",
    border_radius as "borderRadius",
    theme_mode as "themeMode",
    compact_mode as "compactMode",
    labels,
    office_hours as "officeHours",
    offline_settings as "offlineSettings",
    auto_reply_settings as "autoReplySettings",
    metadata,
    create_date::text as "createDate",
    last_modified_date::text as "lastModifiedDate"
  from support.settings
`);

const CONVERSATION_SELECT = sql.unsafe(`
  select
    c.id::text as id,
    c.conversation_number as "conversationNumber",
    c.customer_user_id::text as "customerUserId",
    c.customer_id::text as "customerId",
    c.guest_name as "guestName",
    c.guest_email as "guestEmail",
    c.guest_phone_country_code as "guestPhoneCountryCode",
    c.guest_phone as "guestPhone",
    coalesce(nullif(btrim(c.guest_name), ''), nullif(btrim(concat_ws(' ', u.first_name, u.last_name)), ''), c.guest_email, c.guest_phone, 'Guest') as "displayName",
    coalesce(nullif(btrim(c.guest_email), ''), nullif(btrim(concat_ws(' ', c.guest_phone_country_code, c.guest_phone)), ''), u.email, u.phone_number) as "displayContact",
    c.source,
    c.source_url as "sourceUrl",
    c.locale,
    c.status,
    c.priority,
    c.assigned_to_user_id::text as "assignedToUserId",
    nullif(btrim(concat_ws(' ', au.first_name, au.last_name)), '') as "assignedAgentName",
    c.last_message_preview as "lastMessagePreview",
    c.last_message_at::text as "lastMessageAt",
    c.unread_for_admin_count::int as "unreadForAdminCount",
    c.unread_for_customer_count::int as "unreadForCustomerCount",
    c.create_date::text as "createDate",
    c.last_modified_date::text as "lastModifiedDate",
    c.closed_at::text as "closedAt",
    coalesce(
      jsonb_agg(
        distinct jsonb_build_object(
          'id', t.id::text,
          'name', t.name,
          'color', t.color,
          'isActive', t.is_active
        )
      ) filter (where t.id is not null),
      '[]'::jsonb
    ) as tags
  from support.conversations c
  left join identity.asp_net_users u on u.id = c.customer_user_id
  left join identity.asp_net_users au on au.id = c.assigned_to_user_id
  left join support.conversation_tags ct on ct.conversation_id = c.id
  left join support.tags t on t.id = ct.tag_id
`);

function normalizeConversation(row: ConversationRow): SupportConversationListItem {
  return {
    ...row,
    unreadForAdminCount: Number(row.unreadForAdminCount || 0),
    unreadForCustomerCount: Number(row.unreadForCustomerCount || 0),
    tags: Array.isArray(row.tags) ? row.tags : [],
  };
}

function normalizePagination(pageNumber: number, pageSize: number, totalCount: number): SupportPagination {
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  return {
    pageNumber,
    pageSize,
    totalCount,
    totalPages,
    hasNextPage: pageNumber < totalPages,
    hasPreviousPage: pageNumber > 1,
  };
}

export function resolveSupportLabel(settings: SupportSettings, locale: string | undefined, key: keyof SupportSettings["labels"][string]) {
  const normalizedLocale = locale || "fa-IR";
  const baseLocale = normalizedLocale.split("-")[0];
  const candidates = [normalizedLocale, normalizedLocale.replace("_", "-"), baseLocale, "en-US", "fa-IR"];
  for (const candidate of candidates) {
    const value = settings.labels?.[candidate]?.[key];
    if (value) return value;
  }
  return DEFAULT_SUPPORT_LABELS["en-US"][key] || "";
}

export async function getSupportSettings(db: QueryLike = sql): Promise<SupportSettings> {
  const rows = await db<DbSettingsRow[]>`${SETTINGS_SELECT} where id = 1 limit 1`;
  if (rows[0]) return normalizeSettings(rows[0]);

  const inserted = await db<DbSettingsRow[]>`
    insert into support.settings (id, labels)
    values (1, ${sql.json(DEFAULT_SUPPORT_LABELS)}::jsonb)
    on conflict (id) do update set id = excluded.id
    returning
      id::int as id,
      floating_chat_enabled as "floatingChatEnabled",
      support_page_enabled as "supportPageEnabled",
      require_login as "requireLogin",
      allow_guest_conversation as "allowGuestConversation",
      show_on_app_pages as "showOnAppPages",
      show_on_booking_pages as "showOnBookingPages",
      show_on_provider_pages as "showOnProviderPages",
      show_on_admin_pages as "showOnAdminPages",
      launcher_position as "launcherPosition",
      launcher_icon as "launcherIcon",
      primary_color as "primaryColor",
      accent_color as "accentColor",
      text_color as "textColor",
      border_radius as "borderRadius",
      theme_mode as "themeMode",
      compact_mode as "compactMode",
      labels,
      office_hours as "officeHours",
      offline_settings as "offlineSettings",
      auto_reply_settings as "autoReplySettings",
      metadata,
      create_date::text as "createDate",
      last_modified_date::text as "lastModifiedDate"
  `;
  return normalizeSettings(inserted[0]);
}

export async function updateSupportSettings(input: SupportSettingsInput): Promise<SupportSettings> {
  const rows = await sql<DbSettingsRow[]>`
    update support.settings
       set floating_chat_enabled = ${input.floatingChatEnabled},
           support_page_enabled = ${input.supportPageEnabled},
           require_login = ${input.requireLogin},
           allow_guest_conversation = ${input.allowGuestConversation},
           show_on_app_pages = ${input.showOnAppPages},
           show_on_booking_pages = ${input.showOnBookingPages},
           show_on_provider_pages = ${input.showOnProviderPages},
           show_on_admin_pages = ${input.showOnAdminPages},
           launcher_position = ${input.launcherPosition},
           launcher_icon = ${input.launcherIcon},
           primary_color = ${input.primaryColor},
           accent_color = ${input.accentColor},
           text_color = ${input.textColor},
           border_radius = ${input.borderRadius},
           theme_mode = ${input.themeMode},
           compact_mode = ${input.compactMode},
           labels = ${sql.json(input.labels)}::jsonb,
           office_hours = ${sql.json(input.officeHours)}::jsonb,
           offline_settings = ${sql.json(input.offlineSettings)}::jsonb,
           auto_reply_settings = ${sql.json(input.autoReplySettings)}::jsonb,
           metadata = ${sql.json(input.metadata || {})}::jsonb
     where id = 1
     returning
      id::int as id,
      floating_chat_enabled as "floatingChatEnabled",
      support_page_enabled as "supportPageEnabled",
      require_login as "requireLogin",
      allow_guest_conversation as "allowGuestConversation",
      show_on_app_pages as "showOnAppPages",
      show_on_booking_pages as "showOnBookingPages",
      show_on_provider_pages as "showOnProviderPages",
      show_on_admin_pages as "showOnAdminPages",
      launcher_position as "launcherPosition",
      launcher_icon as "launcherIcon",
      primary_color as "primaryColor",
      accent_color as "accentColor",
      text_color as "textColor",
      border_radius as "borderRadius",
      theme_mode as "themeMode",
      compact_mode as "compactMode",
      labels,
      office_hours as "officeHours",
      offline_settings as "offlineSettings",
      auto_reply_settings as "autoReplySettings",
      metadata,
      create_date::text as "createDate",
      last_modified_date::text as "lastModifiedDate"
  `;
  return normalizeSettings(rows[0]);
}

export async function listAdminConversations(params?: {
  search?: string;
  status?: SupportStatus | "all" | "unassigned" | "assigned_to_me";
  priority?: SupportPriority | "all";
  assignedToUserId?: string;
  tagId?: string;
  pageNumber?: number;
  pageSize?: number;
}): Promise<SupportConversationListResult> {
  const search = clean(params?.search) || "";
  const like = `%${search}%`;
  const status = params?.status || "all";
  const priority = params?.priority || "all";
  const assignedToUserId = clean(params?.assignedToUserId);
  const tagId = clean(params?.tagId);
  const pageNumber = Math.max(1, Number(params?.pageNumber || 1));
  const pageSize = Math.max(1, Math.min(100, Number(params?.pageSize || 20)));
  const offset = (pageNumber - 1) * pageSize;

  const rows = await sql<ConversationRow[]>`
    ${CONVERSATION_SELECT}
    where
      (${search}::text = ''
        or c.conversation_number ilike ${like}::text
        or coalesce(c.guest_name, '') ilike ${like}::text
        or coalesce(c.guest_email, '') ilike ${like}::text
        or coalesce(c.guest_phone, '') ilike ${like}::text
        or coalesce(c.last_message_preview, '') ilike ${like}::text
        or exists (
          select 1 from support.messages sm
          where sm.conversation_id = c.id and coalesce(sm.body, '') ilike ${like}::text
        )
      )
      and (${status}::text = 'all' or (${status}::text = 'unassigned' and c.assigned_to_user_id is null) or (${status}::text = 'assigned_to_me' and ${assignedToUserId}::uuid is not null and c.assigned_to_user_id = ${assignedToUserId}::uuid) or c.status::text = ${status}::text)
      and (${priority}::text = 'all' or c.priority::text = ${priority}::text)
      and (${tagId}::uuid is null or exists (select 1 from support.conversation_tags ctf where ctf.conversation_id = c.id and ctf.tag_id = ${tagId}::uuid))
    group by c.id, u.id, au.id
    order by c.last_message_at desc nulls last, c.create_date desc
    limit ${pageSize}::int
    offset ${offset}::int
  `;

  const countRows = await sql<{ count: number }[]>`
    select count(distinct c.id)::int as count
    from support.conversations c
    where
      (${search}::text = ''
        or c.conversation_number ilike ${like}::text
        or coalesce(c.guest_name, '') ilike ${like}::text
        or coalesce(c.guest_email, '') ilike ${like}::text
        or coalesce(c.guest_phone, '') ilike ${like}::text
        or coalesce(c.last_message_preview, '') ilike ${like}::text
        or exists (
          select 1 from support.messages sm
          where sm.conversation_id = c.id and coalesce(sm.body, '') ilike ${like}::text
        )
      )
      and (${status}::text = 'all' or (${status}::text = 'unassigned' and c.assigned_to_user_id is null) or (${status}::text = 'assigned_to_me' and ${assignedToUserId}::uuid is not null and c.assigned_to_user_id = ${assignedToUserId}::uuid) or c.status::text = ${status}::text)
      and (${priority}::text = 'all' or c.priority::text = ${priority}::text)
      and (${tagId}::uuid is null or exists (select 1 from support.conversation_tags ctf where ctf.conversation_id = c.id and ctf.tag_id = ${tagId}::uuid))
  `;

  return {
    items: rows.map(normalizeConversation),
    pagination: normalizePagination(pageNumber, pageSize, Number(countRows[0]?.count || 0)),
  };
}

async function listMessages(conversationId: string, includeInternalNotes: boolean, db: QueryLike = sql): Promise<SupportMessage[]> {
  return await db<SupportMessage[]>`
    select
      id::text as id,
      conversation_id::text as "conversationId",
      sender_type as "senderType",
      sender_user_id::text as "senderUserId",
      body,
      body_json as "bodyJson",
      message_type as "messageType",
      is_internal_note as "isInternalNote",
      attachments,
      read_at::text as "readAt",
      delivered_at::text as "deliveredAt",
      metadata,
      create_date::text as "createDate",
      edited_at::text as "editedAt",
      deleted_at::text as "deletedAt"
    from support.messages
    where conversation_id = ${conversationId}::uuid
      and deleted_at is null
      and (${includeInternalNotes} = true or is_internal_note = false)
    order by create_date asc
  `;
}

async function listEvents(conversationId: string, db: QueryLike = sql): Promise<SupportConversationEvent[]> {
  return await db<SupportConversationEvent[]>`
    select
      id::text as id,
      conversation_id::text as "conversationId",
      actor_user_id::text as "actorUserId",
      event_type as "eventType",
      from_value as "fromValue",
      to_value as "toValue",
      metadata,
      create_date::text as "createDate"
    from support.conversation_events
    where conversation_id = ${conversationId}::uuid
    order by create_date asc
  `;
}

async function getConversationDetail(conversationId: string, includeInternalNotes: boolean, db: QueryLike = sql): Promise<SupportConversationDetail | null> {
  const rows = await db<ConversationRow[]>`
    ${CONVERSATION_SELECT}
    where c.id = ${conversationId}::uuid
    group by c.id, u.id, au.id
    limit 1
  `;
  if (!rows[0]) return null;
  const [messages, events] = await Promise.all([
    listMessages(conversationId, includeInternalNotes, db),
    includeInternalNotes ? listEvents(conversationId, db) : Promise.resolve([]),
  ]);
  return { ...normalizeConversation(rows[0]), messages, events };
}

export async function getAdminConversationDetail(conversationId: string): Promise<SupportConversationDetail | null> {
  return getConversationDetail(conversationId, true);
}

export async function getCustomerConversationDetail(conversationId: string): Promise<SupportConversationDetail | null> {
  return getConversationDetail(conversationId, false);
}

export async function getOrCreateConversationForUser(input: GetOrCreateConversationInput): Promise<SupportConversationDetail> {
  const settings = await getSupportSettings();
  if (settings.requireLogin && !input.customerUserId) throw new Error("Login is required to start support conversation.");

  return await sql.begin(async (db) => {
    if (input.customerUserId) {
      const existing = await db<{ id: string }[]>`
        select id::text as id
        from support.conversations
        where customer_user_id = ${input.customerUserId}::uuid
          and status in ('open', 'pending')
        order by last_message_at desc nulls last, create_date desc
        limit 1
      `;
      if (existing[0]?.id) {
        const detail = await getCustomerConversationDetail(existing[0].id);
        if (detail) return detail;
      }
    }

    const rows = await db<{ id: string }[]>`
      insert into support.conversations (
        customer_user_id,
        customer_id,
        guest_name,
        source,
        source_url,
        locale,
        metadata
      ) values (
        ${input.customerUserId || null}::uuid,
        ${input.customerId || null}::uuid,
        ${clean(input.displayName)},
        ${input.source},
        ${clean(input.sourceUrl)},
        ${input.locale || "fa-IR"},
        ${sql.json(input.metadata || {})}::jsonb
      ) returning id::text
    `;

    await insertSystemEvent(db, rows[0].id, "conversation_created", null, "open", input.metadata || {});
    const detail = await getConversationDetail(rows[0].id, false, db);
    if (!detail) throw new Error("Conversation was created but could not be loaded.");
    return detail;
  });
}

export async function createGuestConversation(input: CreateGuestConversationInput): Promise<SupportConversationDetail> {
  const settings = await getSupportSettings();
  if (!settings.allowGuestConversation) throw new Error("Guest conversations are disabled.");
  if (settings.requireLogin) throw new Error("Login is required to start support conversation.");

  return await sql.begin(async (db) => {
    const phone = normalizePhone(input.guestPhoneCountryCode, input.guestPhone);
    const rows = await db<{ id: string }[]>`
      insert into support.conversations (
        guest_name,
        guest_email,
        guest_phone_country_code,
        guest_phone,
        source,
        source_url,
        locale,
        metadata
      ) values (
        ${clean(input.guestName)},
        ${clean(input.guestEmail)},
        ${phone.countryCode},
        ${phone.phone},
        ${input.source},
        ${clean(input.sourceUrl)},
        ${input.locale || "fa-IR"},
        ${sql.json(input.metadata || {})}::jsonb
      ) returning id::text
    `;

    await db`
      insert into support.messages (conversation_id, sender_type, body, message_type)
      values (${rows[0].id}::uuid, 'customer', ${input.body}, 'text')
    `;
    await insertSystemEvent(db, rows[0].id, "conversation_created", null, "open", input.metadata || {});

    const detail = await getConversationDetail(rows[0].id, false, db);
    if (!detail) throw new Error("Conversation was created but could not be loaded.");
    return detail;
  });
}

async function insertMessage(db: QueryLike, input: {
  conversationId: string;
  senderType: "customer" | "agent" | "system";
  senderUserId?: string | null;
  body?: string | null;
  messageType?: "text" | "note" | "system";
  isInternalNote?: boolean;
  attachments?: unknown[];
  metadata?: JsonRecord;
}): Promise<SupportMessage> {
  const rows = await db<SupportMessage[]>`
    insert into support.messages (
      conversation_id,
      sender_type,
      sender_user_id,
      body,
      message_type,
      is_internal_note,
      attachments,
      metadata
    ) values (
      ${input.conversationId}::uuid,
      ${input.senderType},
      ${input.senderUserId || null}::uuid,
      ${clean(input.body)},
      ${input.messageType || "text"},
      ${input.isInternalNote || false},
      ${sql.json(input.attachments || [])}::jsonb,
      ${sql.json(input.metadata || {})}::jsonb
    ) returning
      id::text as id,
      conversation_id::text as "conversationId",
      sender_type as "senderType",
      sender_user_id::text as "senderUserId",
      body,
      body_json as "bodyJson",
      message_type as "messageType",
      is_internal_note as "isInternalNote",
      attachments,
      read_at::text as "readAt",
      delivered_at::text as "deliveredAt",
      metadata,
      create_date::text as "createDate",
      edited_at::text as "editedAt",
      deleted_at::text as "deletedAt"
  `;
  return rows[0];
}

export async function sendCustomerMessage(input: SendCustomerMessageInput): Promise<SupportMessage> {
  return await sql.begin(async (db) => {
    const message = await insertMessage(db, {
      conversationId: input.conversationId,
      senderType: "customer",
      senderUserId: input.senderUserId,
      body: input.body,
      attachments: input.attachments,
    });
    return message;
  });
}

export async function sendAgentMessage(input: SendAgentMessageInput): Promise<SupportMessage> {
  return await sql.begin(async (db) => {
    const message = await insertMessage(db, {
      conversationId: input.conversationId,
      senderType: "agent",
      senderUserId: input.agentUserId,
      body: input.body,
      attachments: input.attachments,
    });
    return message;
  });
}

export async function addInternalNote(input: AddInternalNoteInput): Promise<SupportMessage> {
  return await sql.begin(async (db) => {
    const message = await insertMessage(db, {
      conversationId: input.conversationId,
      senderType: "agent",
      senderUserId: input.agentUserId,
      body: input.body,
      messageType: "note",
      isInternalNote: true,
    });
    await insertSystemEvent(db, input.conversationId, "note_added", null, null, {});
    return message;
  });
}

async function insertSystemEvent(db: QueryLike, conversationId: string, eventType: string, fromValue?: string | null, toValue?: string | null, metadata?: JsonRecord, actorUserId?: string | null) {
  await db`
    insert into support.conversation_events (conversation_id, actor_user_id, event_type, from_value, to_value, metadata)
    values (${conversationId}::uuid, ${actorUserId || null}::uuid, ${eventType}, ${fromValue || null}, ${toValue || null}, ${sql.json(metadata || {})}::jsonb)
  `;
}

export async function updateConversationStatus(input: { conversationId: string; status: SupportStatus; actorUserId?: string }): Promise<SupportConversationDetail> {
  return await sql.begin(async (db) => {
    const previous = await db<{ status: SupportStatus }[]>`select status from support.conversations where id = ${input.conversationId}::uuid limit 1`;
    const rows = await db<{ id: string }[]>`
      update support.conversations
         set status = ${input.status},
             closed_at = case when ${input.status} in ('resolved', 'closed', 'archived') then now() else null end
       where id = ${input.conversationId}::uuid
       returning id::text
    `;
    if (!rows[0]) throw new Error("Conversation not found.");
    await insertSystemEvent(db, input.conversationId, "status_changed", previous[0]?.status, input.status, {}, input.actorUserId);
    const detail = await getConversationDetail(input.conversationId, true, db);
    if (!detail) throw new Error("Conversation not found.");
    return detail;
  });
}

export async function updateConversationPriority(input: { conversationId: string; priority: SupportPriority; actorUserId?: string }): Promise<SupportConversationDetail> {
  return await sql.begin(async (db) => {
    const previous = await db<{ priority: SupportPriority }[]>`select priority from support.conversations where id = ${input.conversationId}::uuid limit 1`;
    const rows = await db<{ id: string }[]>`
      update support.conversations
         set priority = ${input.priority}
       where id = ${input.conversationId}::uuid
       returning id::text
    `;
    if (!rows[0]) throw new Error("Conversation not found.");
    await insertSystemEvent(db, input.conversationId, "priority_changed", previous[0]?.priority, input.priority, {}, input.actorUserId);
    const detail = await getConversationDetail(input.conversationId, true, db);
    if (!detail) throw new Error("Conversation not found.");
    return detail;
  });
}

export async function assignConversation(input: AssignConversationInput): Promise<SupportConversationDetail> {
  return await sql.begin(async (db) => {
    const previous = await db<{ assignedToUserId?: string | null }[]>`
      select assigned_to_user_id::text as "assignedToUserId"
      from support.conversations
      where id = ${input.conversationId}::uuid
      limit 1
    `;
    const rows = await db<{ id: string }[]>`
      update support.conversations
         set assigned_to_user_id = ${input.assignedToUserId || null}::uuid
       where id = ${input.conversationId}::uuid
       returning id::text
    `;
    if (!rows[0]) throw new Error("Conversation not found.");
    await insertSystemEvent(db, input.conversationId, "assigned", previous[0]?.assignedToUserId || null, input.assignedToUserId || null, {}, input.actorUserId);
    const detail = await getConversationDetail(input.conversationId, true, db);
    if (!detail) throw new Error("Conversation not found.");
    return detail;
  });
}

export async function addTagToConversation(input: ConversationTagInput): Promise<SupportConversationDetail> {
  return await sql.begin(async (db) => {
    await db`
      insert into support.conversation_tags (conversation_id, tag_id)
      values (${input.conversationId}::uuid, ${input.tagId}::uuid)
      on conflict do nothing
    `;
    await insertSystemEvent(db, input.conversationId, "tag_added", null, input.tagId, {}, input.actorUserId);
    const detail = await getConversationDetail(input.conversationId, true, db);
    if (!detail) throw new Error("Conversation not found.");
    return detail;
  });
}

export async function removeTagFromConversation(input: ConversationTagInput): Promise<SupportConversationDetail> {
  return await sql.begin(async (db) => {
    await db`
      delete from support.conversation_tags
      where conversation_id = ${input.conversationId}::uuid and tag_id = ${input.tagId}::uuid
    `;
    await insertSystemEvent(db, input.conversationId, "tag_removed", input.tagId, null, {}, input.actorUserId);
    const detail = await getConversationDetail(input.conversationId, true, db);
    if (!detail) throw new Error("Conversation not found.");
    return detail;
  });
}

export async function markConversationReadForAdmin(conversationId: string): Promise<void> {
  await sql`update support.conversations set unread_for_admin_count = 0 where id = ${conversationId}::uuid`;
}

export async function markConversationReadForCustomer(conversationId: string): Promise<void> {
  await sql`update support.conversations set unread_for_customer_count = 0 where id = ${conversationId}::uuid`;
}

export async function listSupportTags(includeInactive = false): Promise<SupportTag[]> {
  return await sql<SupportTag[]>`
    select id::text as id, name, color, is_active as "isActive", create_date::text as "createDate", last_modified_date::text as "lastModifiedDate"
    from support.tags
    where ${includeInactive} = true or is_active = true
    order by lower(name) asc
  `;
}

export async function upsertSupportTag(input: UpsertSupportTagInput): Promise<SupportTag> {
  const rows = input.id
    ? await sql<SupportTag[]>`
        update support.tags
           set name = ${input.name}, color = ${input.color}, is_active = ${input.isActive}
         where id = ${input.id}::uuid
         returning id::text as id, name, color, is_active as "isActive", create_date::text as "createDate", last_modified_date::text as "lastModifiedDate"
      `
    : await sql<SupportTag[]>`
        insert into support.tags (name, color, is_active)
        values (${input.name}, ${input.color}, ${input.isActive})
        returning id::text as id, name, color, is_active as "isActive", create_date::text as "createDate", last_modified_date::text as "lastModifiedDate"
      `;
  if (!rows[0]) throw new Error("Support tag was not saved.");
  return rows[0];
}

export async function deleteSupportTag(id: string): Promise<string> {
  const rows = await sql<{ id: string }[]>`delete from support.tags where id = ${id}::uuid returning id::text`;
  if (!rows[0]) throw new Error("Support tag not found.");
  return rows[0].id;
}

export async function listCannedReplies(includeInactive = false): Promise<SupportCannedReply[]> {
  return await sql<SupportCannedReply[]>`
    select
      id::text as id,
      title,
      shortcut,
      body_translations as "bodyTranslations",
      is_active as "isActive",
      display_order::int as "displayOrder",
      create_date::text as "createDate",
      last_modified_date::text as "lastModifiedDate"
    from support.canned_replies
    where ${includeInactive} = true or is_active = true
    order by display_order asc, lower(title) asc
  `;
}

export async function upsertCannedReply(input: UpsertCannedReplyInput): Promise<SupportCannedReply> {
  const rows = input.id
    ? await sql<SupportCannedReply[]>`
        update support.canned_replies
           set title = ${input.title},
               shortcut = ${clean(input.shortcut)},
               body_translations = ${sql.json(input.bodyTranslations || {})}::jsonb,
               is_active = ${input.isActive},
               display_order = ${input.displayOrder}
         where id = ${input.id}::uuid
         returning id::text as id, title, shortcut, body_translations as "bodyTranslations", is_active as "isActive", display_order::int as "displayOrder", create_date::text as "createDate", last_modified_date::text as "lastModifiedDate"
      `
    : await sql<SupportCannedReply[]>`
        insert into support.canned_replies (title, shortcut, body_translations, is_active, display_order)
        values (${input.title}, ${clean(input.shortcut)}, ${sql.json(input.bodyTranslations || {})}::jsonb, ${input.isActive}, ${input.displayOrder})
        returning id::text as id, title, shortcut, body_translations as "bodyTranslations", is_active as "isActive", display_order::int as "displayOrder", create_date::text as "createDate", last_modified_date::text as "lastModifiedDate"
      `;
  if (!rows[0]) throw new Error("Canned reply was not saved.");
  return rows[0];
}

export async function deleteCannedReply(id: string): Promise<string> {
  const rows = await sql<{ id: string }[]>`delete from support.canned_replies where id = ${id}::uuid returning id::text`;
  if (!rows[0]) throw new Error("Canned reply not found.");
  return rows[0].id;
}

export async function listOnlineAgents(): Promise<SupportAgent[]> {
  return await sql<SupportAgent[]>`
    select user_id::text as "userId", status, display_name as "displayName", avatar_url as "avatarUrl", last_seen_at::text as "lastSeenAt"
    from support.agent_statuses
    where status in ('online', 'away') and last_seen_at > now() - interval '20 minutes'
    order by case status when 'online' then 1 else 2 end, last_seen_at desc
  `;
}

export async function upsertAgentPresence(input: { userId: string; status: "online" | "away" | "offline"; displayName?: string; avatarUrl?: string }): Promise<void> {
  await sql`
    insert into support.agent_statuses (user_id, status, display_name, avatar_url, last_seen_at)
    values (${input.userId}::uuid, ${input.status}, ${clean(input.displayName)}, ${clean(input.avatarUrl)}, now())
    on conflict (user_id) do update set
      status = excluded.status,
      display_name = coalesce(excluded.display_name, support.agent_statuses.display_name),
      avatar_url = coalesce(excluded.avatar_url, support.agent_statuses.avatar_url),
      last_seen_at = now()
  `;
}

export async function getFloatingWidgetBootstrapData(input?: { customerUserId?: string; locale?: string }): Promise<SupportBootstrapData> {
  const [settings, onlineAgents] = await Promise.all([getSupportSettings(), listOnlineAgents()]);
  let activeConversation: SupportConversationDetail | null = null;
  if (input?.customerUserId) {
    const rows = await sql<{ id: string }[]>`
      select id::text as id
      from support.conversations
      where customer_user_id = ${input.customerUserId}::uuid and status in ('open', 'pending')
      order by last_message_at desc nulls last, create_date desc
      limit 1
    `;
    if (rows[0]?.id) activeConversation = await getCustomerConversationDetail(rows[0].id);
  }
  return { settings, onlineAgents, activeConversation };
}

export { supportError };
