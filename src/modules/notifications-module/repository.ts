import "server-only";
import { sql } from "@core/db/client";
import { translatedPortalValue } from "@core/i18n/config";
import type { NotificationChannel, TemplateNotificationPayload, TemplateNotificationResult } from "@core/notifications/types";

export type ModuleRecord = { id: string; status?: string | null; type?: string | null; createdAt?: string | null };
export type NotificationTemplateItem = {
  id: string;
  templateKey: string;
  titleTranslations: Record<string, string>;
  bodyTranslations: Record<string, string>;
  channels: string[];
  variables: string[];
  isActive: boolean;
  createdAt: string;
};
export type InboxItem = {
  id: string;
  recipientEntityType: string;
  recipientEntityId: string;
  title: string;
  body: string;
  sourceModule: string | null;
  readAt: string | null;
  createdAt: string;
};
export type DeliveryLogItem = {
  id: string;
  templateKey: string | null;
  recipientEntityType: string;
  recipientEntityId: string;
  channel: string;
  status: string;
  sourceModule: string | null;
  createdAt: string;
};

export async function getModuleSummary(providerId?: string) {
  const [templates, inbox, logs] = await Promise.all([listTemplates(), listInbox(providerId), listDeliveryLogs(providerId)]);
  return {
    recordCount: inbox.length,
    providerId: providerId ?? null,
    templatesCount: templates.length,
    activeTemplatesCount: templates.filter((template) => template.isActive).length,
    unreadCount: inbox.filter((item) => !item.readAt).length,
    deliveryCount: logs.length,
  };
}

export async function listRecentRecords(providerId?: string): Promise<ModuleRecord[]> {
  try {
    if (providerId) {
      return sql<ModuleRecord[]>`
        select id::text as id, case when read_at is null then 'unread' else 'read' end as status, source_module as type, created_at::text as "createdAt"
        from notifications_ext.inbox_items
        where recipient_entity_type = 'provider' and recipient_entity_id = ${providerId}::uuid
        order by created_at desc
        limit 10
      `;
    }
    return sql<ModuleRecord[]>`
      select id::text as id, case when read_at is null then 'unread' else 'read' end as status, source_module as type, created_at::text as "createdAt"
      from notifications_ext.inbox_items
      order by created_at desc
      limit 10
    `;
  } catch {
    return [];
  }
}

export async function listTemplates(limit = 100): Promise<NotificationTemplateItem[]> {
  try {
    return sql<NotificationTemplateItem[]>`
      select id::text as id, template_key as "templateKey", title_translations as "titleTranslations", body_translations as "bodyTranslations", channels, variables, is_active as "isActive", created_at::text as "createdAt"
      from notifications_ext.templates
      order by template_key
      limit ${limit}
    `;
  } catch {
    return [];
  }
}

export async function listInbox(providerId?: string, limit = 50): Promise<InboxItem[]> {
  try {
    if (providerId) {
      return sql<InboxItem[]>`
        select id::text as id, recipient_entity_type as "recipientEntityType", recipient_entity_id::text as "recipientEntityId", title, body, source_module as "sourceModule", read_at::text as "readAt", created_at::text as "createdAt"
        from notifications_ext.inbox_items
        where recipient_entity_type = 'provider' and recipient_entity_id = ${providerId}::uuid
        order by created_at desc
        limit ${limit}
      `;
    }
    return sql<InboxItem[]>`
      select id::text as id, recipient_entity_type as "recipientEntityType", recipient_entity_id::text as "recipientEntityId", title, body, source_module as "sourceModule", read_at::text as "readAt", created_at::text as "createdAt"
      from notifications_ext.inbox_items
      order by created_at desc
      limit ${limit}
    `;
  } catch {
    return [];
  }
}

export async function listDeliveryLogs(providerId?: string, limit = 50): Promise<DeliveryLogItem[]> {
  try {
    if (providerId) {
      return sql<DeliveryLogItem[]>`
        select id::text as id, template_key as "templateKey", recipient_entity_type as "recipientEntityType", recipient_entity_id::text as "recipientEntityId", channel, status, source_module as "sourceModule", created_at::text as "createdAt"
        from notifications_ext.delivery_logs
        where recipient_entity_type = 'provider' and recipient_entity_id = ${providerId}::uuid
        order by created_at desc
        limit ${limit}
      `;
    }
    return sql<DeliveryLogItem[]>`
      select id::text as id, template_key as "templateKey", recipient_entity_type as "recipientEntityType", recipient_entity_id::text as "recipientEntityId", channel, status, source_module as "sourceModule", created_at::text as "createdAt"
      from notifications_ext.delivery_logs
      order by created_at desc
      limit ${limit}
    `;
  } catch {
    return [];
  }
}


const SUPPORTED_NOTIFICATION_CHANNELS = new Set<NotificationChannel>(["in_app", "email", "sms", "push"]);

function supportedChannels(channels: string[]): NotificationChannel[] {
  return channels.filter((channel): channel is NotificationChannel => SUPPORTED_NOTIFICATION_CHANNELS.has(channel as NotificationChannel));
}

function interpolateTemplate(value: string, variables: TemplateNotificationPayload["variables"] = {}) {
  return value.replace(/\{([A-Za-z0-9_]+)\}/g, (_match, key: string) => {
    const replacement = variables?.[key];
    return replacement == null ? `{${key}}` : String(replacement);
  });
}

async function resolveRecipientLocale(input: TemplateNotificationPayload) {
  if (input.locale?.trim()) return input.locale.trim();
  try {
    if (input.recipientEntityType === "user") {
      const rows = await sql<{ locale: string }[]>`select preferred_locale as locale from identity.user_preferences where user_id = ${input.recipientEntityId}::uuid limit 1`;
      return rows[0]?.locale || "fa-IR";
    }
    if (input.recipientEntityType === "provider") {
      const rows = await sql<{ locale: string }[]>`
        select coalesce(up.preferred_locale, 'fa') as locale
        from provider_portal.provider_members pm
        left join identity.user_preferences up on up.user_id = pm.user_id
        where pm.service_provider_id = ${input.recipientEntityId}::uuid
        order by pm.is_default desc, (pm.role = 'owner') desc, pm.create_date asc
        limit 1
      `;
      return rows[0]?.locale || "fa-IR";
    }
    if (input.recipientEntityType === "staff") {
      const rows = await sql<{ locale: string }[]>`
        select coalesce(up.preferred_locale, 'fa') as locale
        from provider_portal_ext.profile_claims pc
        left join identity.user_preferences up on up.user_id = pc.claimant_user_id
        where pc.target_type = 'staff' and pc.target_id = ${input.recipientEntityId}::uuid
          and pc.status = 'approved' and pc.clinic_review_status = 'approved' and pc.lsevin_review_status = 'approved'
        order by pc.updated_at desc
        limit 1
      `;
      return rows[0]?.locale || "fa-IR";
    }
  } catch {
    // Locale lookup is best-effort; notification delivery must not depend on profile preferences.
  }
  return "fa-IR";
}

export async function dispatchTemplateNotification(input: TemplateNotificationPayload): Promise<TemplateNotificationResult> {
  const rows = await sql<NotificationTemplateItem[]>`
    select id::text as id, template_key as "templateKey", title_translations as "titleTranslations", body_translations as "bodyTranslations", channels, variables, is_active as "isActive", created_at::text as "createdAt"
    from notifications_ext.templates
    where template_key = ${input.templateKey}
    limit 1
  `;
  const template = rows[0];
  if (!template) return { delivered: false, skipped: true, reason: "template_missing", templateKey: input.templateKey, channels: [] };
  if (!template.isActive) return { delivered: false, skipped: true, reason: "template_inactive", templateKey: input.templateKey, channels: [] };

  if (input.audienceKey) {
    const subscriptions = await sql<{ status: string }[]>`
      select status
      from notifications_ext.audience_subscriptions
      where recipient_entity_type = ${input.recipientEntityType}
        and recipient_entity_id = ${input.recipientEntityId}::uuid
        and audience_key = ${input.audienceKey}
      limit 1
    `;
    if (subscriptions[0] && subscriptions[0].status !== "active") {
      return { delivered: false, skipped: true, reason: "subscription_disabled", templateKey: input.templateKey, channels: [] };
    }
  }

  const channels = supportedChannels(template.channels);
  if (!channels.length) return { delivered: false, skipped: true, reason: "no_supported_channels", templateKey: input.templateKey, channels: [] };

  const locale = await resolveRecipientLocale(input);
  const title = interpolateTemplate(translatedPortalValue(template.titleTranslations, locale, input.templateKey), input.variables);
  const body = interpolateTemplate(translatedPortalValue(template.bodyTranslations, locale, ""), input.variables);

  await sql.begin(async (tx) => {
    if (channels.includes("in_app")) {
      await tx`
        insert into notifications_ext.inbox_items(recipient_entity_type, recipient_entity_id, title, body, source_module, source_entity_type, source_entity_id)
        values (${input.recipientEntityType}, ${input.recipientEntityId}::uuid, ${title}, ${body}, ${input.sourceModule || "notifications-module"}, ${input.sourceEntityType || input.templateKey}, nullif(${input.sourceEntityId || ""}, '')::uuid)
      `;
    }
    for (const channel of channels) {
      const sent = channel === "in_app";
      await tx`
        insert into notifications_ext.delivery_logs(template_key, recipient_entity_type, recipient_entity_id, channel, status, source_module, source_entity_type, source_entity_id, delivered_at)
        values (${input.templateKey}, ${input.recipientEntityType}, ${input.recipientEntityId}::uuid, ${channel}, ${sent ? "sent" : "queued"}, ${input.sourceModule || "notifications-module"}, ${input.sourceEntityType || null}, nullif(${input.sourceEntityId || ""}, '')::uuid, ${sent ? new Date() : null})
      `;
    }
  });

  return { delivered: true, skipped: false, templateKey: input.templateKey, channels };
}

export async function upsertTemplate(input: { templateKey: string; titleTranslations: Record<string, string>; bodyTranslations: Record<string, string>; channels: string[]; variables: string[]; isActive: boolean }) {
  await sql`
    insert into notifications_ext.templates(template_key, title_translations, body_translations, channels, variables, is_active, updated_at)
    values (${input.templateKey}, ${sql.json(input.titleTranslations)}, ${sql.json(input.bodyTranslations)}, ${input.channels}, ${input.variables}, ${input.isActive}, now())
    on conflict (template_key) do update set title_translations = excluded.title_translations, body_translations = excluded.body_translations, channels = excluded.channels, variables = excluded.variables, is_active = excluded.is_active, updated_at = now()
  `;
}

export async function createInboxNotification(input: { recipientEntityType: string; recipientEntityId: string; title: string; body: string; sourceModule?: string; templateKey?: string; channel?: string; sourceEntityType?: string; sourceEntityId?: string; metadata?: Record<string, unknown> }) {
  const channel = supportedChannels([input.channel || "in_app"])[0] || "in_app";
  await sql.begin(async (tx) => {
    if (channel === "in_app") {
      await tx`
        insert into notifications_ext.inbox_items(recipient_entity_type, recipient_entity_id, title, body, source_module, source_entity_type, source_entity_id)
        values (${input.recipientEntityType}, ${input.recipientEntityId}::uuid, ${input.title}, ${input.body}, ${input.sourceModule || "notifications-module"}, ${input.sourceEntityType || input.templateKey || "manual"}, nullif(${input.sourceEntityId || ""}, '')::uuid)
      `;
    }
    const delivered = channel === "in_app";
    await tx`
      insert into notifications_ext.delivery_logs(template_key, recipient_entity_type, recipient_entity_id, channel, status, source_module, source_entity_type, source_entity_id, delivered_at)
      values (${input.templateKey || null}, ${input.recipientEntityType}, ${input.recipientEntityId}::uuid, ${channel}, ${delivered ? "sent" : "queued"}, ${input.sourceModule || "notifications-module"}, ${input.sourceEntityType || null}, nullif(${input.sourceEntityId || ""}, '')::uuid, ${delivered ? new Date() : null})
    `;
  });
}

export async function markInboxRead(inboxItemId: string) {
  await sql`update notifications_ext.inbox_items set read_at = now() where id = ${inboxItemId}::uuid`;
}


export type BridgeEventItem = {
  id: string;
  eventName: string;
  recipientEntityType: string;
  recipientEntityId: string;
  sourceModule: string | null;
  status: string;
  createdAt: string;
};

export async function recordLSevinNotificationEvent(input: { eventName: string; recipientEntityType: string; recipientEntityId: string; title: string; body: string; templateKey?: string; channel?: string; sourceModule?: string; sourceEntityType?: string; sourceEntityId?: string; locale?: string; metadata?: Record<string, unknown> }) {
  const rows = await sql<{ id: string }[]>`
    insert into notifications_ext.external_events(event_name, recipient_entity_type, recipient_entity_id, title, body, template_key, channel, source_module, source_entity_type, source_entity_id, locale, metadata, status, processed_at)
    values (${input.eventName}, ${input.recipientEntityType}, ${input.recipientEntityId}::uuid, ${input.title}, ${input.body}, ${input.templateKey || null}, ${input.channel || "in_app"}, ${input.sourceModule || "lsevin-platform"}, ${input.sourceEntityType || null}, ${input.sourceEntityId || null}::uuid, ${input.locale || "fa-IR"}, ${sql.json(input.metadata || {})}, 'processed', now())
    returning id::text
  `;
  await createInboxNotification({
    recipientEntityType: input.recipientEntityType,
    recipientEntityId: input.recipientEntityId,
    title: input.title,
    body: input.body,
    sourceModule: input.sourceModule || "lsevin-platform",
    templateKey: input.templateKey || input.eventName,
    channel: input.channel || "in_app",
  });
  return { id: rows[0]?.id, eventName: input.eventName, status: "processed" };
}

export async function createAudienceSubscription(input: { recipientEntityType: string; recipientEntityId: string; audienceKey: string; channel?: string; locale?: string }) {
  await sql`
    insert into notifications_ext.audience_subscriptions(recipient_entity_type, recipient_entity_id, audience_key, preferred_channel, locale, status, updated_at)
    values (${input.recipientEntityType}, ${input.recipientEntityId}::uuid, ${input.audienceKey}, ${input.channel || "in_app"}, ${input.locale || "fa-IR"}, 'active', now())
    on conflict(recipient_entity_type, recipient_entity_id, audience_key) do update set preferred_channel = excluded.preferred_channel, locale = excluded.locale, status = 'active', updated_at = now()
  `;
  return { recipientEntityType: input.recipientEntityType, recipientEntityId: input.recipientEntityId, audienceKey: input.audienceKey, status: "active" };
}

export async function listBridgeEvents(limit = 50): Promise<BridgeEventItem[]> {
  try {
    return sql<BridgeEventItem[]>`
      select id::text, event_name as "eventName", recipient_entity_type as "recipientEntityType", recipient_entity_id::text as "recipientEntityId", source_module as "sourceModule", status, created_at::text as "createdAt"
      from notifications_ext.external_events
      order by created_at desc
      limit ${limit}
    `;
  } catch { return []; }
}

export async function getBridgeSummary() {
  try {
    const rows = await sql<{ events: number; subscriptions: number; processed: number }[]>`
      select
        (select count(*)::int from notifications_ext.external_events) as events,
        (select count(*)::int from notifications_ext.audience_subscriptions where status = 'active') as subscriptions,
        (select count(*)::int from notifications_ext.external_events where status = 'processed') as processed
    `;
    return rows[0] ?? { events: 0, subscriptions: 0, processed: 0 };
  } catch { return { events: 0, subscriptions: 0, processed: 0 }; }
}

export async function listRecipientInbox(recipientEntityType:string, recipientEntityId:string, limit=50):Promise<InboxItem[]> {
  return sql<InboxItem[]>`
    select id::text as id, recipient_entity_type as "recipientEntityType", recipient_entity_id::text as "recipientEntityId", title, body, source_module as "sourceModule", read_at::text as "readAt", created_at::text as "createdAt"
    from notifications_ext.inbox_items
    where recipient_entity_type=${recipientEntityType} and recipient_entity_id=${recipientEntityId}::uuid
    order by created_at desc limit ${Math.min(100,Math.max(1,limit))}
  `;
}
export async function markRecipientInboxRead(input:{inboxItemId:string;recipientEntityType:string;recipientEntityId:string}) {
  await sql`update notifications_ext.inbox_items set read_at=coalesce(read_at,now()) where id=${input.inboxItemId}::uuid and recipient_entity_type=${input.recipientEntityType} and recipient_entity_id=${input.recipientEntityId}::uuid`;
}
