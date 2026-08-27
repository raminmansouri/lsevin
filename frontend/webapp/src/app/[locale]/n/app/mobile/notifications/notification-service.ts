import sql from "@/config/database/db";

export type NotificationChannel =
  | "in_app"
  | "email"
  | "sms"
  | "push"
  | "phone_call"
  | "whatsapp"
  | "bale";

export type NotificationType = "booking" | "offer" | "system";

export type SendNotificationInput = {
  /**
   * Exactly one of customerId/recipientUserId identifies the recipient.
   * customerId is the legacy, customer-only path (FKs to customer.customers, which
   * only exists for people who registered as customers). recipientUserId points at
   * identity.asp_net_users directly, so admin staff and providers -- who have no
   * customer.customers row -- can be notification recipients too.
   */
  customerId?: string | null;
  recipientUserId?: string | null;
  notificationType: NotificationType;
  title: string;
  body: string;
  channels: NotificationChannel[];
  entityType?: string | null;
  entityId?: string | null;
  data?: Record<string, unknown> | null;
  emailTo?: string | null;
  phoneTo?: string | null;
  pushToken?: string | null;
};

export type TemplateVariables = Record<
  string,
  string | number | boolean | Date | null | undefined
>;

export type SendTemplateNotificationInput = {
  templateKey: string;
  locale?: string | null;
  /** Exactly one of customerId/recipientUserId is required -- see SendNotificationInput. */
  customerId?: string | null;
  recipientUserId?: string | null;
  variables?: TemplateVariables;
  channels?: NotificationChannel[] | null;
  entityType?: string | null;
  entityId?: string | null;
  data?: Record<string, unknown> | null;
  emailTo?: string | null;
  phoneTo?: string | null;
  pushToken?: string | null;
  fallbackTitle?: string;
  fallbackBody?: string;
};

type TranslationRecord = Record<string, string>;

type NotificationTemplateRow = {
  templateKey: string;
  notificationType: NotificationType;
  defaultChannels: NotificationChannel[] | null;
  titleTranslations: TranslationRecord | null;
  bodyTranslations: TranslationRecord | null;
  emailSubjectTranslations: TranslationRecord | null;
  emailBodyTranslations: TranslationRecord | null;
  smsBodyTranslations: TranslationRecord | null;
  pushTitleTranslations: TranslationRecord | null;
  pushBodyTranslations: TranslationRecord | null;
  variables: string[] | null;
  metadata: Record<string, unknown> | null;
};

function normalizeLocaleHeader(locale?: string | null) {
  const normalized = (locale || "fa-IR").trim().replace("_", "-").toLowerCase();
  if (normalized === "fa" || normalized.startsWith("fa-")) return "fa-IR";
  if (normalized === "ar" || normalized.startsWith("ar-")) return "ar-SA";
  if (normalized === "tr" || normalized.startsWith("tr-")) return "tr-TR";
  if (normalized === "ku" || normalized.startsWith("ku-")) return "ku-KU";
  if (normalized === "de" || normalized.startsWith("de-")) return "de-DE";
  if (normalized === "fr" || normalized.startsWith("fr-")) return "fr-FR";
  if (normalized === "es" || normalized.startsWith("es-")) return "es-ES";
  if (normalized === "ru" || normalized.startsWith("ru-")) return "ru-RU";
  if (normalized === "tg" || normalized.startsWith("tg-")) return "tg-TJ";
  if (normalized === "zh" || normalized.startsWith("zh-")) return "zh-CN";
  return "en-US";
}

/** Public alias -- notification producers (booking-notifications.ts,
 *  support-notifications.ts) resolve a raw app locale ("fa", "fa-IR", ...) to a
 *  concrete Intl locale tag before formatting dates, without duplicating this map. */
export function resolveNotificationLocale(locale?: string | null) {
  return normalizeLocaleHeader(locale);
}

/**
 * fa-IR's default Intl calendar is Jalali (Solar Hijri) -- Intl.DateTimeFormat("fa-IR")
 * renders Jalali dates and Persian digits with no extra options needed. Every other
 * supported locale defaults to Gregorian. This is the single place notification bodies
 * should format a date so "selected language" -> "correct calendar" stays consistent
 * everywhere a booking/support timestamp is interpolated into a template.
 */
export function formatLocalizedDate(value: string | Date | null | undefined, locale?: string | null) {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  try {
    return new Intl.DateTimeFormat(normalizeLocaleHeader(locale), { dateStyle: "medium" }).format(date);
  } catch {
    return String(value);
  }
}

export function formatLocalizedDateTime(value: string | Date | null | undefined, locale?: string | null) {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  try {
    return new Intl.DateTimeFormat(normalizeLocaleHeader(locale), { dateStyle: "medium", timeStyle: "short" }).format(date);
  } catch {
    return String(value);
  }
}

/** Formats a bare "HH:MM" or "HH:MM - HH:MM" clock-time string (no date component,
 *  as booking.bookings.selected_time_from/to come back as) in the given locale's
 *  numbering system -- e.g. Persian digits for fa-IR, matching the rest of that UI. */
export function formatLocalizedTime(value: string | null | undefined, locale?: string | null) {
  if (!value) return "";
  const localeTag = normalizeLocaleHeader(locale);
  const formatOne = (hhmm: string) => {
    const [h, m] = hhmm.trim().split(":").map(Number);
    if (!Number.isFinite(h) || !Number.isFinite(m)) return hhmm.trim();
    try {
      return new Intl.DateTimeFormat(localeTag, { hour: "2-digit", minute: "2-digit", timeZone: "UTC" }).format(
        new Date(Date.UTC(1970, 0, 1, h, m)),
      );
    } catch {
      return hhmm.trim();
    }
  };
  return value.includes(" - ") ? value.split(" - ").map(formatOne).join(" - ") : formatOne(value);
}

function pickTranslation(value: TranslationRecord | null | undefined, locale?: string | null) {
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

export function renderNotificationTemplateText(
  template: string,
  variables: TemplateVariables = {},
) {
  return template.replace(/{{\s*([a-zA-Z0-9_.-]+)\s*}}/g, (_match, key: string) => {
    return stringifyVariable(variables[key]);
  });
}

async function notificationTemplatesTableExists() {
  const [row] = await sql<{ exists: boolean }[]>`
    select to_regclass('notify.notification_templates') is not null as exists
  `;
  return Boolean(row?.exists);
}

export async function getNotificationTemplateByKey(
  templateKey: string,
): Promise<NotificationTemplateRow | null> {
  if (!(await notificationTemplatesTableExists())) return null;

  const [row] = await sql<NotificationTemplateRow[]>`
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
      nt.push_body_translations as "pushBodyTranslations",
      nt.variables,
      nt.metadata
    from notify.notification_templates nt
    where nt.template_key = ${templateKey.trim().toLowerCase()}
      and nt.is_active = true
    limit 1
  `;

  return row || null;
}

export async function createNotification(input: SendNotificationInput) {
  if (!input.customerId && !input.recipientUserId) {
    throw new Error("createNotification requires either customerId or recipientUserId.");
  }

  const [notification] = await sql<{ id: string }[]>`
    insert into notify.notifications (
      customer_id,
      recipient_user_id,
      notification_type,
      title,
      body,
      entity_type,
      entity_id,
      payload,
      status
    )
    values (
      ${input.customerId ? sql`${input.customerId}::uuid` : null},
      ${input.recipientUserId ? sql`${input.recipientUserId}::uuid` : null},
      ${input.notificationType},
      ${input.title},
      ${input.body},
      ${input.entityType ?? null},
      ${input.entityId ? sql`${input.entityId}::uuid` : null},
      ${sql.json(input.data ?? {})},
      'queued'
    )
    returning id::text as id
  `;

  if (!notification?.id) {
    throw new Error("Notification was not created.");
  }

  for (const channel of input.channels) {
    const deliveryStatus = channel === "in_app" ? "sent" : "queued";

    await sql`
      insert into notify.notification_deliveries (
        notification_id,
        channel,
        recipient_email,
        recipient_phone,
        recipient_push_token,
        status,
        delivered_at
      )
      values (
        ${notification.id}::uuid,
        ${channel},
        ${channel === "email" ? input.emailTo ?? null : null},
        ${channel === "sms" || channel === "phone_call" || channel === "whatsapp" ? input.phoneTo ?? null : null},
        ${channel === "push" ? input.pushToken ?? null : null},
        ${deliveryStatus},
        ${channel === "in_app" ? sql`now()` : null}
      )
    `;
  }

  return notification.id;
}

export async function createNotificationFromTemplate(
  input: SendTemplateNotificationInput,
) {
  const template = await getNotificationTemplateByKey(input.templateKey);

  const variables = input.variables || {};
  const title = template
    ? renderNotificationTemplateText(
        pickTranslation(template.titleTranslations, input.locale),
        variables,
      )
    : input.fallbackTitle || "Notification";

  const body = template
    ? renderNotificationTemplateText(
        pickTranslation(template.bodyTranslations, input.locale),
        variables,
      )
    : input.fallbackBody || "";

  if (!template && (!input.fallbackTitle || !input.fallbackBody)) {
    throw new Error(
      `Notification template "${input.templateKey}" was not found. Provide fallbackTitle and fallbackBody or create the template in admin.`,
    );
  }

  const emailSubject = template
    ? renderNotificationTemplateText(
        pickTranslation(template.emailSubjectTranslations, input.locale) || title,
        variables,
      )
    : title;

  const emailBody = template
    ? renderNotificationTemplateText(
        pickTranslation(template.emailBodyTranslations, input.locale) || body,
        variables,
      )
    : body;

  const smsBody = template
    ? renderNotificationTemplateText(
        pickTranslation(template.smsBodyTranslations, input.locale) || body,
        variables,
      )
    : body;

  const pushTitle = template
    ? renderNotificationTemplateText(
        pickTranslation(template.pushTitleTranslations, input.locale) || title,
        variables,
      )
    : title;

  const pushBody = template
    ? renderNotificationTemplateText(
        pickTranslation(template.pushBodyTranslations, input.locale) || body,
        variables,
      )
    : body;

  const channels = input.channels?.length
    ? input.channels
    : template?.defaultChannels?.length
      ? template.defaultChannels
      : (["in_app"] as NotificationChannel[]);

  return createNotification({
    customerId: input.customerId,
    recipientUserId: input.recipientUserId,
    notificationType: template?.notificationType || "system",
    title: title || pushTitle || emailSubject || input.fallbackTitle || "Notification",
    body: body || pushBody || smsBody || emailBody || input.fallbackBody || "",
    entityType: input.entityType,
    entityId: input.entityId,
    channels,
    emailTo: input.emailTo,
    phoneTo: input.phoneTo,
    pushToken: input.pushToken,
    data: {
      ...(input.data || {}),
      templateKey: input.templateKey,
      templateVariables: variables,
      channelContent: {
        in_app: { title, body },
        email: { subject: emailSubject, body: emailBody },
        sms: { body: smsBody },
        push: { title: pushTitle, body: pushBody },
      },
    },
  });
}

export async function queueBookingCreatedNotifications(input: {
  customerId: string;
  providerId: string;
  bookingId: string;
  title?: string;
  body?: string;
  emailTo?: string | null;
  phoneTo?: string | null;
  pushToken?: string | null;
  locale?: string | null;
  variables?: TemplateVariables;
}) {
  return createNotificationFromTemplate({
    templateKey: "booking.created.customer",
    locale: input.locale,
    customerId: input.customerId,
    entityType: "booking",
    entityId: input.bookingId,
    channels: ["in_app", "email", "sms", "push"],
    emailTo: input.emailTo,
    phoneTo: input.phoneTo,
    pushToken: input.pushToken,
    fallbackTitle: input.title || "Booking request received",
    fallbackBody: input.body || "Your booking request has been received.",
    variables: {
      bookingId: input.bookingId,
      providerId: input.providerId,
      ...(input.variables || {}),
    },
    data: { providerId: input.providerId, bookingId: input.bookingId },
  });
}
