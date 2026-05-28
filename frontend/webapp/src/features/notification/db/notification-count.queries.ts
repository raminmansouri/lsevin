import "server-only";

import sql from "@/config/database/db";

import {
  EMPTY_NOTIFICATION_COUNT,
  type NotificationCountResponse,
  type NotificationTypeKey,
} from "../types/notification-count";

type CountRow = {
  notification_type: string;
  unread_count: number | string;
  total_count: number | string;
};

export async function getNotificationUnreadCountByCustomerId(
  customerId: string | null | undefined,
): Promise<NotificationCountResponse> {
  const normalizedCustomerId = customerId?.trim();
  if (!normalizedCustomerId) return EMPTY_NOTIFICATION_COUNT;

  const tableExistsRows = await sql<{ exists: boolean }[]>`
    select to_regclass('notify.notifications') is not null as exists
  `;

  if (!tableExistsRows[0]?.exists) return EMPTY_NOTIFICATION_COUNT;

  const rows = await sql<CountRow[]>`
    select
      n.notification_type::text as notification_type,
      count(*) filter (where n.read_at is null)::int as unread_count,
      count(*)::int as total_count
    from notify.notifications n
    where n.customer_id = ${normalizedCustomerId}::uuid
    group by n.notification_type
  `;

  const byType: Record<NotificationTypeKey, number> = {
    booking: 0,
    offer: 0,
    system: 0,
  };

  let totalCount = 0;

  for (const row of rows) {
    const key = row.notification_type as NotificationTypeKey;
    const unreadCount = Number(row.unread_count ?? 0);
    const rowTotal = Number(row.total_count ?? 0);

    totalCount += Number.isFinite(rowTotal) ? rowTotal : 0;

    if (key === "booking" || key === "offer" || key === "system") {
      byType[key] = Number.isFinite(unreadCount) ? unreadCount : 0;
    }
  }

  const unreadCount = byType.booking + byType.offer + byType.system;

  return {
    count: unreadCount,
    unreadCount,
    totalCount,
    bookingCount: byType.booking,
    offerCount: byType.offer,
    systemCount: byType.system,
    byType,
  };
}
