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

/** Only queues a channel the recipient can actually be reached on. */
function eligibleChannels(input: { email?: string | null; phone?: string | null }): NotificationChannel[] {
  const channels: NotificationChannel[] = ["in_app"];
  if (input.email) channels.push("email");
  if (input.phone) {
    channels.push("sms");
    channels.push("whatsapp");
  }
  // push/bale are opt-in and resolved per-recipient at dispatch time (subscription /
  // linked chat id), not from contact info here -- always offered, dispatch.ts / the
  // senders themselves skip a recipient who never subscribed or linked.
  channels.push("push");
  channels.push("bale");
  return uniqueChannels(channels);
}

/**
 * Same role join bug-reports/server/notifications.ts uses for its admin recipients
 * (getAdminRecipients) -- kept as a separate, simpler copy here rather than importing
 * that module's version because it also pulls in bug-report-specific watcher/assignee
 * joins this call site has no use for.
 */
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

/** booking.bookings.provider_id -> category.service_providers.id ->
 *  provider_portal.provider_members.service_provider_id -> .user_id -> identity.asp_net_users.id,
 *  active memberships only. */
async function getProviderRecipients(providerId: string) {
  const rows = await sql<{
    userId: string;
    email: string | null;
    phoneCountryCode: string | null;
    phoneNumber: string | null;
  }[]>`
    select distinct u.id::text as "userId", u.email,
           u.phone_number_country_code as "phoneCountryCode", u.phone_number as "phoneNumber"
    from provider_portal.provider_members pm
    join identity.asp_net_users u on u.id = pm.user_id
    where pm.service_provider_id = ${providerId}::uuid
      and pm.status = 'active'
  `;

  return rows.map((row) => ({
    userId: row.userId,
    email: row.email,
    phone: normalizePhone(row.phoneCountryCode, row.phoneNumber),
  }));
}

async function notifyTablesExist() {
  const [row] = await sql<{ exists: boolean }[]>`
    select to_regclass('notify.notifications') is not null as exists
  `;
  return Boolean(row?.exists);
}

type Recipient = { userId: string; email: string | null; phone: string | null };

/** Fans a templated notification out to a list of resolved recipients, one row each. */
async function notifyRecipients(
  recipients: Recipient[],
  input: {
    templateKey: string;
    entityType: string;
    entityId: string;
    variables: Record<string, string | number | boolean | Date | null | undefined>;
    fallbackTitle: string;
    fallbackBody: string;
    audience: "admin" | "provider";
  }
): Promise<void> {
  for (const recipient of recipients) {
    await createNotificationFromTemplate({
      templateKey: input.templateKey,
      locale: "fa-IR",
      recipientUserId: recipient.userId,
      entityType: input.entityType,
      entityId: input.entityId,
      channels: eligibleChannels({ email: recipient.email, phone: recipient.phone }),
      emailTo: recipient.email,
      phoneTo: recipient.phone,
      fallbackTitle: input.fallbackTitle,
      fallbackBody: input.fallbackBody,
      variables: input.variables,
      data: { audience: input.audience },
    }).catch((error) => console.error(`notifyRecipients: ${input.templateKey} failed for ${recipient.userId}`, error));
  }
}

let bookingTemplatesEnsured = false;

/**
 * Seeds the three booking template keys so the first booking after this feature ships
 * gets real Persian/English content instead of the generic English fallback text --
 * on-conflict-do-nothing, so an admin who has already edited these via
 * /admin/notification-templates never has their changes overwritten.
 */
async function ensureBookingNotificationTemplates(): Promise<void> {
  if (bookingTemplatesEnsured) return;

  const [row] = await sql<{ exists: boolean }[]>`
    select to_regclass('notify.notification_templates') is not null as exists
  `;
  if (!row?.exists) {
    bookingTemplatesEnsured = true;
    return;
  }

  const translations = (fa: string, en: string) => sql.json({ "fa-IR": fa, "en-US": en } as never);

  const templates = [
    {
      key: "booking.created.customer",
      name: "Booking created (customer)",
      channels: ["in_app", "sms", "email"],
      title: translations("رزرو شما ثبت شد", "Your booking was received"),
      body: translations(
        "درخواست رزرو شما با شناسه {{bookingId}} ثبت شد و در حال بررسی است.",
        "Your booking request {{bookingId}} has been received and is being reviewed."
      ),
    },
    {
      key: "booking.created.admin",
      name: "Booking created (admin)",
      channels: ["in_app", "email"],
      title: translations("رزرو جدید ثبت شد", "New booking received"),
      body: translations(
        "یک رزرو جدید با شناسه {{bookingId}} برای ارائه‌دهنده {{providerId}} ثبت شد.",
        "A new booking {{bookingId}} was submitted for provider {{providerId}}."
      ),
    },
    {
      key: "booking.created.provider",
      name: "Booking created (provider)",
      channels: ["in_app", "sms", "email"],
      title: translations("رزرو جدید دریافت شد", "New booking received"),
      body: translations(
        "یک درخواست رزرو جدید با شناسه {{bookingId}} برای شما ثبت شد.",
        "A new booking request {{bookingId}} was submitted to you."
      ),
    },
    {
      key: "booking.started.admin",
      name: "Booking started (admin)",
      channels: ["in_app"],
      title: translations("یک مشتری شروع به رزرو کرد", "A customer started a booking"),
      body: translations(
        "یک مشتری فرآیند رزرو (پیش‌نویس {{draftId}}) را آغاز کرده است.",
        "A customer has started a booking process (draft {{draftId}})."
      ),
    },
    {
      key: "booking.started.provider",
      name: "Booking started (provider)",
      channels: ["in_app"],
      title: translations("یک مشتری در حال رزرو با شماست", "A customer is booking with you"),
      body: translations(
        "یک مشتری فرآیند رزرو با شما را آغاز کرده است (پیش‌نویس {{draftId}}).",
        "A customer has started booking with you (draft {{draftId}})."
      ),
    },
  ];

  for (const template of templates) {
    await sql`
      insert into notify.notification_templates (
        template_key, name, notification_type, default_channels,
        title_translations, body_translations
      ) values (
        ${template.key}, ${template.name}, 'booking', ${template.channels},
        ${template.title}, ${template.body}
      )
      on conflict (template_key) do nothing
    `;
  }

  bookingTemplatesEnsured = true;
}

export type BookingNotificationInput = {
  bookingId: string;
  customerUserId: string;
  providerId?: string | null;
  locale?: string | null;
  variables?: Record<string, string | number | boolean | Date | null | undefined>;
};

/**
 * Fires after a booking's transaction has committed (see checkoutDraft in
 * features/booking-pro/server/repository.ts, right after applyCommercialSnapshotAfterCheckout).
 * Never allowed to fail the booking itself -- every recipient group is wrapped so one
 * failing group (a bad template, a DB hiccup) doesn't block the others, and the whole
 * thing is expected to be called inside a try/catch by its caller regardless.
 */
export async function notifyBookingCreated(input: BookingNotificationInput): Promise<void> {
  if (!(await notifyTablesExist())) return;
  await ensureBookingNotificationTemplates();

  const variables = {
    bookingId: input.bookingId,
    providerId: input.providerId,
    ...(input.variables || {}),
  };

  const [customer] = await sql<{ email: string | null; phoneCountryCode: string | null; phoneNumber: string | null }[]>`
    select email, phone_number_country_code as "phoneCountryCode", phone_number as "phoneNumber"
    from identity.asp_net_users
    where id = ${input.customerUserId}::uuid
    limit 1
  `;
  const customerEmail = customer?.email ?? null;
  const customerPhone = normalizePhone(customer?.phoneCountryCode, customer?.phoneNumber);

  try {
    await createNotificationFromTemplate({
      templateKey: "booking.created.customer",
      locale: input.locale,
      customerId: input.customerUserId,
      entityType: "booking",
      entityId: input.bookingId,
      channels: eligibleChannels({ email: customerEmail, phone: customerPhone }),
      emailTo: customerEmail,
      phoneTo: customerPhone,
      fallbackTitle: "Booking request received",
      fallbackBody: "Your booking request has been received.",
      variables,
      data: { audience: "customer" },
    });
  } catch (error) {
    console.error("notifyBookingCreated: customer notification failed", error);
  }

  try {
    const admins = await getAdminRecipients();
    await notifyRecipients(admins, {
      templateKey: "booking.created.admin",
      entityType: "booking",
      entityId: input.bookingId,
      variables,
      fallbackTitle: "New booking received",
      fallbackBody: "A new booking has been submitted and needs review.",
      audience: "admin",
    });
  } catch (error) {
    console.error("notifyBookingCreated: admin recipient lookup failed", error);
  }

  try {
    const providerRecipients = input.providerId ? await getProviderRecipients(input.providerId) : [];
    await notifyRecipients(providerRecipients, {
      templateKey: "booking.created.provider",
      entityType: "booking",
      entityId: input.bookingId,
      variables,
      fallbackTitle: "New booking received",
      fallbackBody: "You have a new booking request.",
      audience: "provider",
    });
  } catch (error) {
    console.error("notifyBookingCreated: provider recipient lookup failed", error);
  }
}

export type BookingStartedNotificationInput = {
  draftId: string;
  /** Provider isn't known at the moment a draft is first created -- pass it once it is
   * (see upsertMainDraftSelection in booking-pro/server/repository.ts), and this only
   * notifies the provider audience, never re-notifying admin. */
  providerId?: string | null;
  audience: "admin" | "provider";
};

/**
 * Fires (a) once, when a brand-new booking.booking_drafts row is inserted -- notifies
 * admin that a customer has begun a booking -- and (b) once per draft, the first time a
 * provider becomes known on that draft -- notifies that provider's active members.
 * Both call sites are fire-and-forget from the caller; this function itself never
 * throws past its own try/catch, same posture as notifyBookingCreated.
 */
export async function notifyBookingStarted(input: BookingStartedNotificationInput): Promise<void> {
  if (!(await notifyTablesExist())) return;
  await ensureBookingNotificationTemplates();

  const variables = { draftId: input.draftId, providerId: input.providerId ?? "" };

  try {
    if (input.audience === "admin") {
      const admins = await getAdminRecipients();
      await notifyRecipients(admins, {
        templateKey: "booking.started.admin",
        entityType: "booking_draft",
        entityId: input.draftId,
        variables,
        fallbackTitle: "New booking started",
        fallbackBody: "A customer has started a new booking.",
        audience: "admin",
      });
      return;
    }

    if (!input.providerId) return;
    const providerRecipients = await getProviderRecipients(input.providerId);
    await notifyRecipients(providerRecipients, {
      templateKey: "booking.started.provider",
      entityType: "booking_draft",
      entityId: input.draftId,
      variables,
      fallbackTitle: "A customer is booking with you",
      fallbackBody: "A customer has started a booking with you.",
      audience: "provider",
    });
  } catch (error) {
    console.error("notifyBookingStarted: recipient lookup failed", error);
  }
}
