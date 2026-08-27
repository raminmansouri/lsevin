import sql from "@/config/database/db";
import { resolveCurrentNotificationCustomerId } from "@/features/notification/server/current-notification-customer";
import { unstable_noStore as noStore } from "next/cache";

export type NotificationTab = "all" | "booking" | "offer" | "system";

export type NotificationsFiltersInput = {
  tab: NotificationTab;
};

export type NotificationItem = {
  id: string;
  type: "booking" | "offer" | "system";
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  timeLabel: string;
  entityType: string | null;
  entityId: string | null;
};

export type NotificationTabItem = {
  id: NotificationTab;
  unreadCount: number;
};

export type NotificationsPageData = {
  customerId: string | null;
  notifications: NotificationItem[];
  unreadCount: number;
  tabs: NotificationTabItem[];
};

function toSingleString(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

export function parseNotificationsFilters(
  params: Record<string, string | string[] | undefined>,
): NotificationsFiltersInput {
  const tab = toSingleString(params.tab).trim().toLowerCase();
  return {
    tab:
      tab === "booking" || tab === "offer" || tab === "system"
        ? (tab as NotificationTab)
        : "all",
  };
}

function normalizeLocale(locale: string) {
  return locale?.trim() || "fa";
}

async function resolveCurrentCustomerId(): Promise<string | null> {
  return resolveCurrentNotificationCustomerId();
}

const RELATIVE_TIME_LOCALE_MAP: Record<string, string> = {
  fa: "fa-IR", en: "en-US", ar: "ar-SA", tr: "tr-TR", de: "de-DE",
  fr: "fr-FR", es: "es-ES", ku: "ku-KU", ru: "ru-RU", tg: "tg-TJ", zh: "zh-CN",
};

/** Intl.RelativeTimeFormat renders "just now"/"5 minutes ago" natively translated for
 *  whatever locale is passed -- fa-IR gives "اکنون"/"۵ دقیقه پیش" with Persian digits,
 *  instead of the English-only string this used to hardcode regardless of locale. */
function humanizeDistance(from: Date, locale: string) {
  const localeTag = RELATIVE_TIME_LOCALE_MAP[normalizeLocale(locale).toLowerCase()] || "fa-IR";
  const rtf = new Intl.RelativeTimeFormat(localeTag, { numeric: "auto" });
  const seconds = Math.max(0, Math.floor((Date.now() - from.getTime()) / 1000));
  if (seconds < 60) return rtf.format(0, "second");
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return rtf.format(-minutes, "minute");
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return rtf.format(-hours, "hour");
  const days = Math.floor(hours / 24);
  return rtf.format(-days, "day");
}

export async function getNotificationsPageData({
  locale,
  filters,
}: {
  locale: string;
  filters: NotificationsFiltersInput;
}): Promise<NotificationsPageData> {
  noStore();
  normalizeLocale(locale);

  const customerId = await resolveCurrentCustomerId();

  const tableExistsRows = await sql<{ exists: boolean }[]>`
    select to_regclass('notify.notifications') is not null as exists
  `;

  if (!tableExistsRows[0]?.exists || !customerId) {
    return {
      customerId,
      notifications: [],
      unreadCount: 0,
      tabs: [
        { id: "all", unreadCount: 0 },
        { id: "booking", unreadCount: 0 },
        { id: "offer", unreadCount: 0 },
        { id: "system", unreadCount: 0 },
      ],
    };
  }

  const rows = await sql<{
    id: string;
    notification_type: string;
    title: string;
    body: string;
    read_at: string | null;
    created_at: string;
    entity_type: string | null;
    entity_id: string | null;
  }[]>`
    select
      n.id::text as id,
      n.notification_type,
      n.title,
      n.body,
      n.read_at::text as read_at,
      n.created_at::text as created_at,
      n.entity_type,
      n.entity_id::text as entity_id
    from notify.notifications n
    where n.customer_id = ${customerId}::uuid
      and (${filters.tab} = 'all' or n.notification_type = ${filters.tab})
    order by n.created_at desc
    limit 100
  `;

  const unreadCounts = await sql<{
    notification_type: string;
    unread_count: number;
  }[]>`
    select
      n.notification_type,
      count(*)::int as unread_count
    from notify.notifications n
    where n.customer_id = ${customerId}::uuid
      and n.read_at is null
    group by n.notification_type
  `;

  const byType = new Map(unreadCounts.map((x) => [x.notification_type, Number(x.unread_count)]));
  const unreadCount =
    [...byType.values()].reduce((sum, count) => sum + count, 0);

  const notifications: NotificationItem[] = rows.map((row) => ({
    id: row.id,
    type:
      row.notification_type === "booking" ||
      row.notification_type === "offer" ||
      row.notification_type === "system"
        ? row.notification_type
        : "system",
    title: row.title,
    message: row.body,
    read: row.read_at != null,
    createdAt: row.created_at,
    timeLabel: humanizeDistance(new Date(row.created_at), locale),
    entityType: row.entity_type,
    entityId: row.entity_id,
  }));

  return {
    customerId,
    notifications,
    unreadCount,
    tabs: [
      { id: "all", unreadCount },
      { id: "booking", unreadCount: byType.get("booking") ?? 0 },
      { id: "offer", unreadCount: byType.get("offer") ?? 0 },
      { id: "system", unreadCount: byType.get("system") ?? 0 },
    ],
  };
}
