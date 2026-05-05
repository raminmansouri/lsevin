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
};

export type NotificationTabItem = {
  id: NotificationTab;
  label: string;
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
  return locale?.trim() || "en";
}

async function resolveCurrentCustomerId(): Promise<string | null> {
  return resolveCurrentNotificationCustomerId();
}

function humanizeDistance(from: Date) {
  const seconds = Math.max(1, Math.floor((Date.now() - from.getTime()) / 1000));
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
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
        { id: "all", label: "All", unreadCount: 0 },
        { id: "booking", label: "Bookings", unreadCount: 0 },
        { id: "offer", label: "Offers", unreadCount: 0 },
        { id: "system", label: "System", unreadCount: 0 },
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
  }[]>`
    select
      n.id::text as id,
      n.notification_type,
      n.title,
      n.body,
      n.read_at::text as read_at,
      n.created_at::text as created_at
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
    timeLabel: humanizeDistance(new Date(row.created_at)),
  }));

  return {
    customerId,
    notifications,
    unreadCount,
    tabs: [
      { id: "all", label: "All", unreadCount },
      { id: "booking", label: "Bookings", unreadCount: byType.get("booking") ?? 0 },
      { id: "offer", label: "Offers", unreadCount: byType.get("offer") ?? 0 },
      { id: "system", label: "System", unreadCount: byType.get("system") ?? 0 },
    ],
  };
}
