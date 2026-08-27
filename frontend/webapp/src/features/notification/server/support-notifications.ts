import "server-only";

import sql from "@/config/database/db";
import { createNotificationFromTemplate, type NotificationChannel } from "@/app/[locale]/n/app/mobile/notifications/notification-service";

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

/** Same eligibility logic as booking-notifications.ts -- kept as a separate copy
 *  rather than a shared import, matching that file's established convention. */
function eligibleChannels(input: { email?: string | null; phone?: string | null }): NotificationChannel[] {
  const channels: NotificationChannel[] = ["in_app"];
  if (input.email) channels.push("email");
  if (input.phone) {
    channels.push("sms");
    channels.push("whatsapp");
  }
  channels.push("push");
  channels.push("bale");
  return uniqueChannels(channels);
}

const APP_BASE_URL = (process.env.NEXT_PUBLIC_URL || "").replace(/\/$/, "");

function buildAdminConversationLink(conversationId: string) {
  return `${APP_BASE_URL}/admin/support/conversations/${conversationId}`;
}

function truncate(value: string, max = 200) {
  const trimmed = value.trim();
  return trimmed.length > max ? `${trimmed.slice(0, max - 1)}…` : trimmed;
}

function formatTimestamp(iso: string) {
  try {
    return new Intl.DateTimeFormat("fa-IR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(iso));
  } catch {
    return iso;
  }
}

async function notifyTablesExist() {
  const [row] = await sql<{ exists: boolean }[]>`
    select to_regclass('notify.notifications') is not null as exists
  `;
  return Boolean(row?.exists);
}

/** Same role join booking-notifications.ts uses for its admin recipients -- kept as a
 *  separate copy here rather than a shared import, matching this codebase's established
 *  per-feature-notifier convention. */
async function getAdminRecipients() {
  const rows = await sql<{
    userId: string;
    email: string | null;
    phoneCountryCode: string | null;
    phoneNumber: string | null;
  }[]>`
    select distinct u.id::text as "userId", u.email,
           u.phone_number_country_code as "phoneCountryCode", u.phone_number as "phoneNumber"
    from identity.asp_net_users u
    join identity.asp_net_user_roles ur on ur.user_id = u.id
    join identity.asp_net_roles r on r.id = ur.role_id
    where upper(coalesce(r.normalized_name, r.name, '')) = any (
      array['ADMIN','SUPERADMIN','SUPER_ADMIN','SUPPORT','SUPPORT_AGENT','AGENT']
    )
    limit 50
  `;

  return rows.map((row) => ({
    userId: row.userId,
    email: row.email,
    phone: normalizePhone(row.phoneCountryCode, row.phoneNumber),
  }));
}

type ConversationSummary = {
  conversationNumber: string;
  customerUserId: string | null;
  displayName: string;
  displayContact: string | null;
  customerEmail: string | null;
  customerPhone: string | null;
  assignedAgentName: string | null;
  source: string;
};

/** "Who" for the admin notification and "how to reach them" for the customer one --
 *  works for both logged-in customers (customer_user_id) and guests (guest_* columns). */
async function getConversationSummaryForNotification(conversationId: string): Promise<ConversationSummary | null> {
  const [row] = await sql<{
    conversationNumber: string;
    customerUserId: string | null;
    guestName: string | null;
    guestEmail: string | null;
    guestPhoneCountryCode: string | null;
    guestPhone: string | null;
    userEmail: string | null;
    userPhoneCountryCode: string | null;
    userPhoneNumber: string | null;
    userFirstName: string | null;
    userLastName: string | null;
    assignedAgentName: string | null;
    source: string;
  }[]>`
    select
      c.conversation_number as "conversationNumber",
      c.customer_user_id::text as "customerUserId",
      c.guest_name as "guestName",
      c.guest_email as "guestEmail",
      c.guest_phone_country_code as "guestPhoneCountryCode",
      c.guest_phone as "guestPhone",
      u.email as "userEmail",
      u.phone_number_country_code as "userPhoneCountryCode",
      u.phone_number as "userPhoneNumber",
      u.first_name as "userFirstName",
      u.last_name as "userLastName",
      nullif(btrim(concat_ws(' ', au.first_name, au.last_name)), '') as "assignedAgentName",
      c.source
    from support.conversations c
    left join identity.asp_net_users u on u.id = c.customer_user_id
    left join identity.asp_net_users au on au.id = c.assigned_to_user_id
    where c.id = ${conversationId}::uuid
    limit 1
  `;

  if (!row) return null;

  const displayName =
    row.guestName?.trim() ||
    [row.userFirstName, row.userLastName].filter(Boolean).join(" ").trim() ||
    row.guestEmail ||
    row.userEmail ||
    "مشتری";

  const customerPhone = row.customerUserId
    ? normalizePhone(row.userPhoneCountryCode, row.userPhoneNumber)
    : normalizePhone(row.guestPhoneCountryCode, row.guestPhone);

  return {
    conversationNumber: row.conversationNumber,
    customerUserId: row.customerUserId,
    displayName,
    displayContact: row.userEmail || row.guestEmail || customerPhone,
    customerEmail: row.userEmail || row.guestEmail,
    customerPhone,
    assignedAgentName: row.assignedAgentName,
    source: row.source,
  };
}

let supportTemplatesEnsured = false;

/** Same upsert-once seeding pattern as booking-notifications.ts's
 *  ensureBookingNotificationTemplates -- these two keys were only just introduced, so
 *  it's safe to force-refresh their content on every deploy until an admin customizes
 *  them through /admin/notification-templates. */
async function ensureSupportNotificationTemplates(): Promise<void> {
  if (supportTemplatesEnsured) return;

  const [row] = await sql<{ exists: boolean }[]>`
    select to_regclass('notify.notification_templates') is not null as exists
  `;
  if (!row?.exists) {
    supportTemplatesEnsured = true;
    return;
  }

  const translations = (fa: string, en: string) => sql.json({ "fa-IR": fa, "en-US": en } as never);

  const templates = [
    {
      key: "support.message.admin",
      name: "New support message (admin)",
      channels: ["in_app", "email"],
      title: translations("پیام جدید در گفتگوی پشتیبانی", "New support message"),
      body: translations(
        "{{customerName}} در گفتگوی {{conversationNumber}} در تاریخ {{sentAt}} پیام داد: «{{messagePreview}}»\nمشاهده در پنل مدیریت: {{adminLink}}",
        '{{customerName}} sent a message in conversation {{conversationNumber}} at {{sentAt}}: "{{messagePreview}}"\nView in admin: {{adminLink}}'
      ),
    },
    {
      key: "support.message.customer",
      name: "New support reply (customer)",
      channels: ["in_app", "sms", "email"],
      title: translations("پاسخ جدید از پشتیبانی", "New support reply"),
      body: translations(
        "{{agentName}} در تاریخ {{sentAt}} پاسخ داد: «{{messagePreview}}»",
        '{{agentName}} replied at {{sentAt}}: "{{messagePreview}}"'
      ),
    },
  ];

  for (const template of templates) {
    await sql`
      insert into notify.notification_templates (
        template_key, name, notification_type, default_channels,
        title_translations, body_translations
      ) values (
        ${template.key}, ${template.name}, 'system', ${template.channels},
        ${template.title}, ${template.body}
      )
      on conflict (template_key) do update set
        title_translations = excluded.title_translations,
        body_translations = excluded.body_translations,
        default_channels = excluded.default_channels
    `;
  }

  supportTemplatesEnsured = true;
}

export type SupportMessageNotificationInput = {
  conversationId: string;
  senderType: "customer" | "agent";
  body: string;
  createdAt?: string | null;
};

/**
 * Fires after a support message insert commits (see sendCustomerMessage /
 * sendAgentMessage in features/support/server/repository.ts). Never allowed to fail the
 * message send itself -- same fire-and-forget-but-logged posture as
 * notifyBookingCreated -- so every failure path just logs and returns.
 */
export async function notifySupportMessage(input: SupportMessageNotificationInput): Promise<void> {
  if (!(await notifyTablesExist())) return;
  if (!input.body?.trim()) return;
  await ensureSupportNotificationTemplates();

  const summary = await getConversationSummaryForNotification(input.conversationId).catch((error) => {
    console.error("notifySupportMessage: conversation summary lookup failed", error);
    return null;
  });
  if (!summary) return;

  const sentAt = formatTimestamp(input.createdAt || new Date().toISOString());
  const messagePreview = truncate(input.body);

  if (input.senderType === "customer") {
    try {
      const admins = await getAdminRecipients();
      const variables = {
        conversationId: input.conversationId,
        conversationNumber: summary.conversationNumber,
        customerName: summary.displayName,
        customerContact: summary.displayContact || "",
        messagePreview,
        sentAt,
        source: summary.source,
        adminLink: buildAdminConversationLink(input.conversationId),
      };
      for (const admin of admins) {
        await createNotificationFromTemplate({
          templateKey: "support.message.admin",
          locale: "fa-IR",
          recipientUserId: admin.userId,
          entityType: "support_conversation",
          entityId: input.conversationId,
          channels: eligibleChannels({ email: admin.email, phone: admin.phone }),
          emailTo: admin.email,
          phoneTo: admin.phone,
          fallbackTitle: "New support message",
          fallbackBody: `${summary.displayName}: ${messagePreview}`,
          variables,
          data: { audience: "admin" },
        }).catch((error) => console.error(`notifySupportMessage: admin notify failed for ${admin.userId}`, error));
      }
    } catch (error) {
      console.error("notifySupportMessage: admin recipient lookup failed", error);
    }
    return;
  }

  // Agent replied -> notify the customer. Only possible for a logged-in customer:
  // notify.notifications.customer_id/recipient_user_id both require a real
  // identity.asp_net_users row, which a guest conversation doesn't have.
  if (!summary.customerUserId) return;
  try {
    const variables = {
      conversationId: input.conversationId,
      conversationNumber: summary.conversationNumber,
      agentName: summary.assignedAgentName || "پشتیبانی",
      messagePreview,
      sentAt,
    };
    await createNotificationFromTemplate({
      templateKey: "support.message.customer",
      locale: "fa-IR",
      customerId: summary.customerUserId,
      entityType: "support_conversation",
      entityId: input.conversationId,
      channels: eligibleChannels({ email: summary.customerEmail, phone: summary.customerPhone }),
      emailTo: summary.customerEmail,
      phoneTo: summary.customerPhone,
      fallbackTitle: "New support reply",
      fallbackBody: messagePreview,
      variables,
      data: { audience: "customer" },
    });
  } catch (error) {
    console.error("notifySupportMessage: customer notification failed", error);
  }
}
