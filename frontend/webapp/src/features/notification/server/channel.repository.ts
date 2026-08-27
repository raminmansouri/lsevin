import "server-only";

import sql from "@/config/database/db";

export const NOTIFICATION_CHANNEL_CODES = ["in_app", "email", "sms", "push", "whatsapp", "bale"] as const;
export type NotificationChannelCode = (typeof NOTIFICATION_CHANNEL_CODES)[number];

export type NotificationChannelSettings = {
  // email (generic SMTP via nodemailer)
  smtpHost?: string | null;
  smtpPort?: number | null;
  smtpUser?: string | null;
  smtpPassword?: string | null;
  smtpSecure?: boolean;
  fromAddress?: string | null;
  fromName?: string | null;
  // sms (MeliPayamak override; blank falls back to MELIPAYAMAK_* env vars)
  smsUsername?: string | null;
  smsPassword?: string | null;
  smsBaseUrl?: string | null;
  // push (Web Push / VAPID)
  vapidPublicKey?: string | null;
  vapidPrivateKey?: string | null;
  vapidSubject?: string | null;
  // whatsapp (WhatsiPlus override; blank falls back to WHATSIPLUS_API_KEY env var)
  whatsappApiKey?: string | null;
  whatsappBaseUrl?: string | null;
  // bale (Bale Bot API, Telegram-Bot-API-compatible)
  baleBotToken?: string | null;
  baleBotUsername?: string | null;
};

export type NotificationChannelConfig = {
  code: NotificationChannelCode;
  displayName: string;
  isEnabled: boolean;
  settings: NotificationChannelSettings;
  updatedAt: string | null;
};

type NotificationChannelRow = {
  code: string;
  displayName: string;
  isEnabled: boolean;
  settings: NotificationChannelSettings | null;
  updatedAt: string | null;
};

const DISPLAY_NAMES: Record<NotificationChannelCode, string> = {
  in_app: "In-app",
  email: "Email",
  sms: "SMS",
  push: "Web push",
  whatsapp: "WhatsApp",
  bale: "Bale",
};

// Same footgun as every other jsonb column in this codebase: postgres.js infers jsonb
// from the cast, so a pre-stringified value gets encoded twice. Never JSON.stringify(...)
// before handing a value to sql.json().
function jsonb(value: unknown) {
  return sql.json((value ?? {}) as never);
}

function maskSecret(value?: string | null) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (raw.length <= 8) return "••••";
  return `${raw.slice(0, 4)}••••${raw.slice(-4)}`;
}

export function maskChannelSecrets<T extends NotificationChannelConfig>(channel: T): T {
  const s = channel.settings;
  return {
    ...channel,
    settings: {
      ...s,
      smtpPassword: s.smtpPassword ? maskSecret(s.smtpPassword) : s.smtpPassword,
      smsPassword: s.smsPassword ? maskSecret(s.smsPassword) : s.smsPassword,
      vapidPrivateKey: s.vapidPrivateKey ? maskSecret(s.vapidPrivateKey) : s.vapidPrivateKey,
      whatsappApiKey: s.whatsappApiKey ? maskSecret(s.whatsappApiKey) : s.whatsappApiKey,
      baleBotToken: s.baleBotToken ? maskSecret(s.baleBotToken) : s.baleBotToken,
    },
  };
}

function normalizeCode(value: string): NotificationChannelCode {
  const code = String(value || "").trim().toLowerCase();
  if (!NOTIFICATION_CHANNEL_CODES.includes(code as NotificationChannelCode)) {
    throw new Error(`Unsupported notification channel: ${value}`);
  }
  return code as NotificationChannelCode;
}

function mapRow(row: NotificationChannelRow): NotificationChannelConfig {
  return {
    code: normalizeCode(row.code),
    displayName: row.displayName,
    isEnabled: row.isEnabled,
    settings: row.settings && typeof row.settings === "object" ? row.settings : {},
    updatedAt: row.updatedAt,
  };
}

// Cached for the life of the process: the schema-shape checks below (enum value
// existence, constraint definition, column existence) are cheap but not free, and
// channel config is read on every notification dispatch tick. Once the schema has been
// extended in this Postgres instance it never needs re-checking until the next deploy.
let schemaEnsured = false;

async function ensureDeliveryChannelEnumValues(): Promise<void> {
  const rows = await sql<{ label: string }[]>`
    select enumlabel as label
    from pg_enum
    where enumtypid = 'notify.delivery_channel'::regtype
  `;
  const existing = new Set(rows.map((r) => r.label));

  if (!existing.has("whatsapp")) {
    await sql`alter type notify.delivery_channel add value if not exists 'whatsapp'`;
  }
  if (!existing.has("bale")) {
    await sql`alter type notify.delivery_channel add value if not exists 'bale'`;
  }
}

async function ensureNotificationTemplatesChannelConstraint(): Promise<void> {
  const [row] = await sql<{ def: string | null }[]>`
    select pg_get_constraintdef(oid) as def
    from pg_constraint
    where conname = 'ck_notification_templates_channels'
      and conrelid = 'notify.notification_templates'::regclass
  `;

  if (row?.def && row.def.includes("whatsapp") && row.def.includes("bale")) return;

  await sql`
    alter table notify.notification_templates
    drop constraint if exists ck_notification_templates_channels
  `;
  await sql`
    alter table notify.notification_templates
    add constraint ck_notification_templates_channels
    check (default_channels <@ array['in_app','email','sms','push','phone_call','whatsapp','bale'])
  `;
}

async function ensureNotificationRecipientColumn(): Promise<void> {
  const [row] = await sql<{ exists: boolean }[]>`
    select exists (
      select 1 from information_schema.columns
      where table_schema = 'notify' and table_name = 'notifications' and column_name = 'recipient_user_id'
    ) as exists
  `;
  if (row?.exists) return;

  // Additive on purpose: notify.notifications.customer_id stays NOT NULL and FKs to
  // customer.customers, which only exists for people who registered as customers.
  // Admin staff and providers are identity.asp_net_users rows with no customer.customers
  // row, so they cannot satisfy that FK -- this new nullable column is how they become
  // valid recipients without repointing (and risking) the existing live constraint.
  await sql`
    alter table notify.notifications
    add column if not exists recipient_user_id uuid references identity.asp_net_users(id)
  `;
  await sql`
    alter table notify.notifications
    alter column customer_id drop not null
  `;
  await sql`
    alter table notify.notifications
    drop constraint if exists ck_notifications_has_recipient
  `;
  await sql`
    alter table notify.notifications
    add constraint ck_notifications_has_recipient
    check (customer_id is not null or recipient_user_id is not null)
  `;
}

export async function ensureNotificationChannelsTable(): Promise<void> {
  await sql`
    create table if not exists notify.channels (
      id uuid default public.uuid_generate_v4() not null primary key,
      code text not null unique,
      display_name text not null,
      is_enabled boolean default false not null,
      settings jsonb default '{}'::jsonb not null,
      updated_at timestamp with time zone default now() not null,
      updated_by uuid
    )
  `;

  for (const code of NOTIFICATION_CHANNEL_CODES) {
    await sql`
      insert into notify.channels (code, display_name, is_enabled, settings)
      values (${code}, ${DISPLAY_NAMES[code]}, ${code === "in_app"}, ${jsonb({})})
      on conflict (code) do nothing
    `;
  }

  if (!schemaEnsured) {
    await ensureDeliveryChannelEnumValues();
    await ensureNotificationTemplatesChannelConstraint();
    await ensureNotificationRecipientColumn();
    schemaEnsured = true;
  }
}

export async function listChannelConfigs(): Promise<NotificationChannelConfig[]> {
  await ensureNotificationChannelsTable();

  const rows = await sql<NotificationChannelRow[]>`
    select code, display_name as "displayName", is_enabled as "isEnabled", settings,
           updated_at::text as "updatedAt"
    from notify.channels
    order by case code
      when 'in_app' then 1 when 'email' then 2 when 'sms' then 3
      when 'push' then 4 when 'whatsapp' then 5 when 'bale' then 6 else 99 end
  `;

  return rows.map(mapRow).map(maskChannelSecrets);
}

/**
 * Real credentials, unmasked. For the delivery dispatcher's use only -- never return
 * this from an action or route a client can reach; use `listChannelConfigs` (masked)
 * for anything the admin UI renders.
 */
export async function listChannelConfigsForDispatch(): Promise<Map<NotificationChannelCode, NotificationChannelConfig>> {
  await ensureNotificationChannelsTable();

  const rows = await sql<NotificationChannelRow[]>`
    select code, display_name as "displayName", is_enabled as "isEnabled", settings,
           updated_at::text as "updatedAt"
    from notify.channels
  `;

  const map = new Map<NotificationChannelCode, NotificationChannelConfig>();
  for (const row of rows.map(mapRow)) map.set(row.code, row);
  return map;
}

export async function getChannelConfig(code: string, includeSecrets = false): Promise<NotificationChannelConfig | null> {
  await ensureNotificationChannelsTable();
  const normalized = normalizeCode(code);

  const rows = await sql<NotificationChannelRow[]>`
    select code, display_name as "displayName", is_enabled as "isEnabled", settings,
           updated_at::text as "updatedAt"
    from notify.channels
    where code = ${normalized}
    limit 1
  `;

  const channel = rows[0] ? mapRow(rows[0]) : null;
  if (!channel) return null;
  return includeSecrets ? channel : maskChannelSecrets(channel);
}

export async function saveChannelConfig(input: {
  code: string;
  isEnabled: boolean;
  settings: NotificationChannelSettings;
  updatedBy?: string | null;
}): Promise<NotificationChannelConfig> {
  await ensureNotificationChannelsTable();
  const code = normalizeCode(input.code);
  const existing = await getChannelConfig(code, true);
  const existingSettings = existing?.settings ?? {};

  // Secrets arrive masked from the form; a blank field means "keep the stored value",
  // not "clear it" -- otherwise toggling isEnabled on an unrelated save would wipe
  // every credential on this channel. Same pattern as payment-gateway.repository.ts.
  const keepSecret = (incoming: unknown, existingValue: unknown) =>
    String(incoming ?? "").trim() || String(existingValue ?? "").trim() || null;

  const settings: NotificationChannelSettings = {
    ...existingSettings,
    ...input.settings,
    smtpPassword: keepSecret(input.settings.smtpPassword, existingSettings.smtpPassword),
    smsPassword: keepSecret(input.settings.smsPassword, existingSettings.smsPassword),
    vapidPrivateKey: keepSecret(input.settings.vapidPrivateKey, existingSettings.vapidPrivateKey),
    whatsappApiKey: keepSecret(input.settings.whatsappApiKey, existingSettings.whatsappApiKey),
    baleBotToken: keepSecret(input.settings.baleBotToken, existingSettings.baleBotToken),
  };

  const rows = await sql<NotificationChannelRow[]>`
    update notify.channels
       set is_enabled = ${input.isEnabled},
           settings = ${jsonb(settings)},
           updated_by = ${input.updatedBy || null}::uuid,
           updated_at = now()
     where code = ${code}
     returning code, display_name as "displayName", is_enabled as "isEnabled", settings,
               updated_at::text as "updatedAt"
  `;

  const channel = rows[0];
  if (!channel) throw new Error(`Notification channel ${code} was not found.`);
  return maskChannelSecrets(mapRow(channel));
}

export async function toggleChannelConfig(input: {
  code: string;
  isEnabled: boolean;
  updatedBy?: string | null;
}): Promise<NotificationChannelConfig> {
  await ensureNotificationChannelsTable();
  const code = normalizeCode(input.code);

  const rows = await sql<NotificationChannelRow[]>`
    update notify.channels
       set is_enabled = ${input.isEnabled},
           updated_by = ${input.updatedBy || null}::uuid,
           updated_at = now()
     where code = ${code}
     returning code, display_name as "displayName", is_enabled as "isEnabled", settings,
               updated_at::text as "updatedAt"
  `;

  const channel = rows[0];
  if (!channel) throw new Error(`Notification channel ${code} was not found.`);
  return maskChannelSecrets(mapRow(channel));
}
