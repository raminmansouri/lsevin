import sql from "@/config/database/db";

import { BugReportStatus } from "../types";

type SqlLike = any;
type NotificationChannel = "in_app" | "email" | "sms" | "push" | "phone_call";
type TemplateVariables = Record<string, string | number | boolean | Date | null | undefined>;

type BugNotificationEvent = {
  tx: SqlLike;
  bugReportId: string;
  conversationId: string;
  eventType: string;
  actorUserId?: string | null;
  title: string;
  body?: string | null;
  status?: BugReportStatus | string | null;
  messageId?: string | null;
  internalOnly?: boolean;
  notifyCustomer?: boolean;
  notifyAdmins?: boolean;
  payload?: Record<string, unknown>;
};

type NotificationTemplateRow = {
  templateKey: string;
  notificationType: "booking" | "offer" | "system";
  defaultChannels: NotificationChannel[] | null;
  titleTranslations: Record<string, string> | null;
  bodyTranslations: Record<string, string> | null;
  emailSubjectTranslations: Record<string, string> | null;
  emailBodyTranslations: Record<string, string> | null;
  smsBodyTranslations: Record<string, string> | null;
  pushTitleTranslations: Record<string, string> | null;
  pushBodyTranslations: Record<string, string> | null;
};

async function bugNotificationsTableExists(tx: SqlLike) {
  const rows = await tx<{ exists: boolean }[]>`
    select to_regclass('support.bug_report_update_notifications') is not null as exists
  `;
  return Boolean(rows[0]?.exists);
}

async function notifyTablesExist(tx: SqlLike) {
  const rows = await tx<{ notifications_exists: boolean; deliveries_exists: boolean }[]>`
    select
      to_regclass('notify.notifications') is not null as notifications_exists,
      to_regclass('notify.notification_deliveries') is not null as deliveries_exists
  `;
  return Boolean(rows[0]?.notifications_exists && rows[0]?.deliveries_exists);
}

async function notificationTemplatesTableExists(tx: SqlLike) {
  const rows = await tx<{ exists: boolean }[]>`
    select to_regclass('notify.notification_templates') is not null as exists
  `;
  return Boolean(rows[0]?.exists);
}

function normalizeLocaleHeader(locale?: string | null) {
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

function pickTranslation(value: Record<string, string> | null | undefined, locale?: string | null) {
  if (!value || typeof value !== "object") return "";

  const localeHeader = normalizeLocaleHeader(locale);
  const baseLocale = localeHeader.split("-")[0];

  return (
    value[localeHeader]?.trim() ||
    value[baseLocale]?.trim() ||
    value["en-US"]?.trim() ||
    value.en?.trim() ||
    Object.values(value).find((item) => typeof item === "string" && item.trim().length > 0)?.trim() ||
    ""
  );
}

function stringifyVariable(value: TemplateVariables[string]) {
  if (value instanceof Date) return value.toISOString();
  if (value === null || value === undefined) return "";
  return String(value);
}

function renderTemplateText(template: string, variables: TemplateVariables = {}) {
  return template.replace(/{{\s*([a-zA-Z0-9_.-]+)\s*}}/g, (_match, key: string) => {
    return stringifyVariable(variables[key]);
  });
}

function normalizePhone(countryCode?: string | null, phone?: string | null) {
  const rawPhone = phone?.trim();
  if (!rawPhone) return null;

  const cc = countryCode?.trim();
  if (!cc) return rawPhone;
  if (rawPhone.startsWith("+")) return rawPhone;
  return `${cc.startsWith("+") ? cc : `+${cc}`}${rawPhone.replace(/^0+/, "")}`;
}

function uniqueChannels(channels: NotificationChannel[]) {
  return Array.from(new Set(channels));
}

function customerChannels(input: {
  templateChannels?: NotificationChannel[] | null;
  email?: string | null;
  phone?: string | null;
}) {
  const requested = input.templateChannels?.length ? input.templateChannels : (["in_app", "sms"] as NotificationChannel[]);
  return uniqueChannels(
    requested.filter((channel) => {
      if (channel === "email") return Boolean(input.email);
      if (channel === "sms" || channel === "phone_call") return Boolean(input.phone);
      if (channel === "push") return false;
      return true;
    }),
  );
}

function adminChannels(input: { email?: string | null; phone?: string | null }) {
  const channels: NotificationChannel[] = ["in_app"];
  if (input.email) channels.push("email");
  if (input.phone) channels.push("sms");
  return channels;
}

function templateKeyForEvent(input: { eventType: string; recipient: "customer" | "admin" }) {
  const suffix = input.recipient;
  switch (input.eventType) {
    case "bug_created":
      return `bug_report.created.${suffix}`;
    case "agent_replied":
      return `bug_report.agent_replied.${suffix}`;
    case "customer_replied":
      return `bug_report.customer_replied.${suffix}`;
    case "status_changed":
      return `bug_report.status_changed.${suffix}`;
    case "internal_note_added":
      return `bug_report.internal_note.${suffix}`;
    case "assignee_changed":
      return `bug_report.assignee_changed.${suffix}`;
    case "bug_archived":
      return `bug_report.archived.${suffix}`;
    default:
      return `bug_report.updated.${suffix}`;
  }
}

async function getNotificationTemplateByKey(tx: SqlLike, templateKey: string): Promise<NotificationTemplateRow | null> {
  if (!(await notificationTemplatesTableExists(tx))) return null;

  const rows = await tx<NotificationTemplateRow[]>`
    select
      nt.template_key as "templateKey",
      nt.notification_type as "notificationType",
      nt.default_channels as "defaultChannels",
      nt.title_translations as "titleTranslations",
      nt.body_translations as "bodyTranslations",
      nt.email_subject_translations as "emailSubjectTranslations",
      nt.email_body_translations as "emailBodyTranslations",
      nt.sms_body_translations as "smsBodyTranslations",
      nt.push_title_translations as "pushTitleTranslations",
      nt.push_body_translations as "pushBodyTranslations"
    from notify.notification_templates nt
    where nt.template_key = ${templateKey.trim().toLowerCase()}
      and nt.is_active = true
    limit 1
  `;

  return rows[0] || null;
}

async function renderNotificationContent(input: {
  tx: SqlLike;
  templateKey: string;
  locale?: string | null;
  fallbackTitle: string;
  fallbackBody?: string | null;
  variables: TemplateVariables;
}) {
  const template = await getNotificationTemplateByKey(input.tx, input.templateKey);

  const title = template
    ? renderTemplateText(pickTranslation(template.titleTranslations, input.locale), input.variables)
    : input.fallbackTitle;
  const body = template
    ? renderTemplateText(pickTranslation(template.bodyTranslations, input.locale), input.variables)
    : input.fallbackBody || "";

  const emailSubject = template
    ? renderTemplateText(pickTranslation(template.emailSubjectTranslations, input.locale) || title, input.variables)
    : title;
  const emailBody = template
    ? renderTemplateText(pickTranslation(template.emailBodyTranslations, input.locale) || body, input.variables)
    : body;
  const smsBody = template
    ? renderTemplateText(pickTranslation(template.smsBodyTranslations, input.locale) || body, input.variables)
    : body;
  const pushTitle = template
    ? renderTemplateText(pickTranslation(template.pushTitleTranslations, input.locale) || title, input.variables)
    : title;
  const pushBody = template
    ? renderTemplateText(pickTranslation(template.pushBodyTranslations, input.locale) || body, input.variables)
    : body;

  return {
    template,
    title: title || input.fallbackTitle || "Bug report update",
    body: body || input.fallbackBody || "Your bug report has been updated.",
    emailSubject,
    emailBody,
    smsBody,
    pushTitle,
    pushBody,
  };
}

async function mirrorCustomerNotificationToNotify(input: {
  tx: SqlLike;
  customerId: string | null;
  bugReportId: string;
  reportNumber: string;
  title: string;
  body: string | null;
  email: string | null;
  phone: string | null;
  locale: string | null;
  templateKey: string;
  eventType: string;
  channels: NotificationChannel[];
  payload: Record<string, unknown>;
  channelContent: {
    emailSubject: string;
    emailBody: string;
    smsBody: string;
    pushTitle: string;
    pushBody: string;
  };
}) {
  if (!input.customerId || input.channels.length === 0) return null;
  if (!(await notifyTablesExist(input.tx))) return null;

  try {
    const rows = await input.tx<{ id: string }[]>`
      insert into notify.notifications (
        customer_id,
        notification_type,
        title,
        body,
        entity_type,
        entity_id,
        payload,
        status
      ) values (
        ${input.customerId}::uuid,
        'system',
        ${input.title},
        ${input.body ?? "Your bug report has been updated."},
        'bug_report',
        ${input.bugReportId}::uuid,
        ${input.tx.json({
          ...input.payload,
          reportNumber: input.reportNumber,
          templateKey: input.templateKey,
          locale: input.locale,
          channelContent: {
            in_app: { title: input.title, body: input.body },
            email: { subject: input.channelContent.emailSubject, body: input.channelContent.emailBody },
            sms: { body: input.channelContent.smsBody },
            push: { title: input.channelContent.pushTitle, body: input.channelContent.pushBody },
          },
        })}::jsonb,
        'queued'
      )
      returning id::text as id
    `;

    const notificationId = rows[0]?.id;
    if (!notificationId) return null;

    for (const channel of input.channels) {
      await input.tx`
        insert into notify.notification_deliveries (
          notification_id,
          channel,
          recipient_email,
          recipient_phone,
          recipient_push_token,
          status,
          delivered_at
        ) values (
          ${notificationId}::uuid,
          ${channel},
          ${channel === "email" ? input.email : null},
          ${channel === "sms" || channel === "phone_call" ? input.phone : null},
          null,
          ${channel === "in_app" ? "sent" : "queued"},
          ${channel === "in_app" ? input.tx`now()` : null}
        )
      `;
    }

    return notificationId;
  } catch (error) {
    console.error("Bug report notify.* notification failed", error);
    return null;
  }
}

async function getAdminRecipients(input: {
  tx: SqlLike;
  bugReportId: string;
  assignedToUserId: string | null;
  actorUserId?: string | null;
}) {
  const explicitAssigneeSql = input.assignedToUserId
    ? input.tx`select (${input.assignedToUserId}::uuid)::text as user_id`
    : input.tx`select null::text as user_id where false`;
  const actorFilterSql = input.actorUserId
    ? input.tx`and user_id <> (${input.actorUserId}::uuid)::text`
    : input.tx``;

  const rows = await input.tx<{
    user_id: string;
    email: string | null;
    phone_number_country_code: string | null;
    phone_number: string | null;
  }[]>`
    with role_admins as (
      select distinct u.id::text as user_id
      from identity.asp_net_users u
      join identity.asp_net_user_roles ur on ur.user_id = u.id
      join identity.asp_net_roles r on r.id = ur.role_id
      where upper(coalesce(r.normalized_name, r.name, '')) = any (array['ADMIN','SUPERADMIN','SUPER_ADMIN','SUPPORT','SUPPORT_AGENT','AGENT'])
      limit 50
    ), watchers as (
      select w.user_id::text as user_id
      from support.bug_report_watchers w
      where w.bug_report_id = ${input.bugReportId}::uuid
    ), explicit_assignee as (
      ${explicitAssigneeSql}
    ), recipients as (
      select distinct user_id
      from (
        select user_id from role_admins
        union all select user_id from watchers
        union all select user_id from explicit_assignee
      ) all_recipients
      where user_id is not null
        ${actorFilterSql}
    )
    select
      r.user_id,
      u.email,
      u.phone_number_country_code,
      u.phone_number
    from recipients r
    left join identity.asp_net_users u on u.id = r.user_id::uuid
  `;

  return rows.map((row) => ({
    userId: row.user_id,
    email: row.email,
    phone: normalizePhone(row.phone_number_country_code, row.phone_number),
  }));
}

export async function queueBugReportUpdateNotifications(input: BugNotificationEvent) {
  if (!(await bugNotificationsTableExists(input.tx))) return;

  const reportRows = await input.tx<{
    report_number: string;
    title: string;
    customer_user_id: string | null;
    customer_id: string | null;
    guest_name: string | null;
    guest_email: string | null;
    guest_phone_country_code: string | null;
    guest_phone: string | null;
    assigned_to_user_id: string | null;
    locale: string | null;
    customer_email: string | null;
    customer_phone_country_code: string | null;
    customer_phone: string | null;
  }[]>`
    select
      br.report_number,
      br.title,
      br.customer_user_id,
      br.customer_id,
      br.guest_name,
      br.guest_email,
      br.guest_phone_country_code,
      br.guest_phone,
      br.assigned_to_user_id,
      c.locale,
      coalesce(cu.email, iu.email) as customer_email,
      coalesce(cu.phone_number_country_code, iu.phone_number_country_code) as customer_phone_country_code,
      coalesce(cu.phone_number, iu.phone_number) as customer_phone
    from support.bug_reports br
    left join support.conversations c on c.id = br.conversation_id
    left join customer.customers cu on cu.id = br.customer_id
    left join identity.asp_net_users iu on iu.id = br.customer_user_id
    where br.id = ${input.bugReportId}::uuid
    limit 1
  `;
  const report = reportRows[0];
  if (!report) return;

  const customerEmail = report.customer_email || report.guest_email;
  const customerPhone = normalizePhone(report.customer_phone_country_code, report.customer_phone) || normalizePhone(report.guest_phone_country_code, report.guest_phone);

  const payload = {
    ...(input.payload ?? {}),
    bugReportId: input.bugReportId,
    conversationId: input.conversationId,
    reportNumber: report.report_number,
    eventType: input.eventType,
    status: input.status ?? null,
    messageId: input.messageId ?? null,
  };

  const variables: TemplateVariables = {
    reportNumber: report.report_number,
    bugReportId: input.bugReportId,
    conversationId: input.conversationId,
    title: report.title,
    eventType: input.eventType,
    status: input.status ?? "",
    message: input.body ?? "",
    customerName: report.guest_name || "Customer",
  };

  const shouldNotifyCustomer = input.notifyCustomer !== false && !input.internalOnly;
  if (shouldNotifyCustomer && (report.customer_user_id || report.customer_id || report.guest_email || customerPhone)) {
    const templateKey = templateKeyForEvent({ eventType: input.eventType, recipient: "customer" });
    const content = await renderNotificationContent({
      tx: input.tx,
      templateKey,
      locale: report.locale,
      fallbackTitle: input.title,
      fallbackBody: input.body ?? "Your bug report has been updated.",
      variables,
    });
    const channels = customerChannels({ templateChannels: content.template?.defaultChannels, email: customerEmail, phone: customerPhone });
    const notifyNotificationId = await mirrorCustomerNotificationToNotify({
      tx: input.tx,
      customerId: report.customer_id,
      bugReportId: input.bugReportId,
      reportNumber: report.report_number,
      title: content.title,
      body: content.body,
      email: customerEmail ?? null,
      phone: customerPhone,
      locale: report.locale,
      templateKey,
      eventType: input.eventType,
      channels,
      payload,
      channelContent: {
        emailSubject: content.emailSubject,
        emailBody: content.emailBody,
        smsBody: content.smsBody,
        pushTitle: content.pushTitle,
        pushBody: content.pushBody,
      },
    });

    await input.tx`
      insert into support.bug_report_update_notifications (
        bug_report_id,
        conversation_id,
        recipient_type,
        recipient_user_id,
        recipient_email,
        recipient_phone,
        title,
        body,
        event_type,
        entity_id,
        payload,
        delivery_channels,
        notify_notification_id,
        delivery_status
      ) values (
        ${input.bugReportId}::uuid,
        ${input.conversationId}::uuid,
        'customer',
        ${report.customer_user_id ? input.tx`${report.customer_user_id}::uuid` : null},
        ${customerEmail ?? null},
        ${customerPhone},
        ${content.title},
        ${content.body},
        ${input.eventType},
        ${input.bugReportId}::uuid,
        ${input.tx.json({ ...payload, templateKey })}::jsonb,
        ${channels},
        ${notifyNotificationId ? input.tx`${notifyNotificationId}::uuid` : null},
        ${notifyNotificationId ? "queued" : "support_only"}
      )
    `;
  }

  if (input.notifyAdmins !== false) {
    const templateKey = templateKeyForEvent({ eventType: input.eventType, recipient: "admin" });
    const content = await renderNotificationContent({
      tx: input.tx,
      templateKey,
      locale: "en-US",
      fallbackTitle: input.title,
      fallbackBody: input.body ?? "A bug report has been updated.",
      variables,
    });
    const adminRecipients = await getAdminRecipients({
      tx: input.tx,
      bugReportId: input.bugReportId,
      assignedToUserId: report.assigned_to_user_id,
      actorUserId: input.actorUserId,
    });

    if (adminRecipients.length === 0) {
      await input.tx`
        insert into support.bug_report_update_notifications (
          bug_report_id,
          conversation_id,
          recipient_type,
          recipient_user_id,
          title,
          body,
          event_type,
          entity_id,
          payload,
          delivery_channels,
          delivery_status
        ) values (
          ${input.bugReportId}::uuid,
          ${input.conversationId}::uuid,
          'admin',
          null,
          ${content.title},
          ${content.body},
          ${input.eventType},
          ${input.bugReportId}::uuid,
          ${input.tx.json({ ...payload, templateKey })}::jsonb,
          ${["in_app"]},
          'support_only'
        )
      `;
      return;
    }

    for (const admin of adminRecipients) {
      await input.tx`
        insert into support.bug_report_update_notifications (
          bug_report_id,
          conversation_id,
          recipient_type,
          recipient_user_id,
          recipient_email,
          recipient_phone,
          title,
          body,
          event_type,
          entity_id,
          payload,
          delivery_channels,
          delivery_status
        ) values (
          ${input.bugReportId}::uuid,
          ${input.conversationId}::uuid,
          'admin',
          ${admin.userId}::uuid,
          ${admin.email ?? null},
          ${admin.phone ?? null},
          ${content.title},
          ${content.body},
          ${input.eventType},
          ${input.bugReportId}::uuid,
          ${input.tx.json({ ...payload, templateKey })}::jsonb,
          ${adminChannels({ email: admin.email, phone: admin.phone })},
          'support_only'
        )
        on conflict do nothing
      `;
    }
  }
}

export async function markBugReportNotificationsRead(input: {
  bugReportId: string;
  recipientType: "admin" | "customer" | "agent";
  recipientUserId?: string | null;
}) {
  try {
    const rows = await sql<{ exists: boolean }[]>`
      select to_regclass('support.bug_report_update_notifications') is not null as exists
    `;
    if (!rows[0]?.exists) return;

    if (input.recipientUserId) {
      await sql`
        update support.bug_report_update_notifications
        set is_read = true,
            read_at = coalesce(read_at, now())
        where bug_report_id = ${input.bugReportId}::uuid
          and recipient_type = ${input.recipientType}::text
          and is_read = false
          and (recipient_user_id = ${input.recipientUserId}::uuid or recipient_user_id is null)
      `;
      return;
    }

    await sql`
      update support.bug_report_update_notifications
      set is_read = true,
          read_at = coalesce(read_at, now())
      where bug_report_id = ${input.bugReportId}::uuid
        and recipient_type = ${input.recipientType}::text
        and is_read = false
    `;
  } catch (error) {
    console.error("markBugReportNotificationsRead failed", error);
  }
}
