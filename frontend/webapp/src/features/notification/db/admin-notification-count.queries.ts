import "server-only";

import sql from "@/config/database/db";

async function notifyTablesExist() {
  const [row] = await sql<{ exists: boolean }[]>`
    select to_regclass('notify.notifications') is not null as exists
  `;
  return Boolean(row?.exists);
}

export async function getUnreadCountForRecipientUser(userId: string): Promise<number> {
  if (!userId || !(await notifyTablesExist())) return 0;

  const [row] = await sql<{ count: number }[]>`
    select count(*)::int as count
    from notify.notifications
    where recipient_user_id = ${userId}::uuid and read_at is null
  `;

  return row?.count ?? 0;
}

export type AdminNotificationListItem = {
  id: string;
  title: string;
  body: string;
  notificationType: string;
  entityType: string | null;
  entityId: string | null;
  createdAt: string;
  readAt: string | null;
};

export async function listNotificationsForRecipientUser(userId: string, limit = 20): Promise<AdminNotificationListItem[]> {
  if (!userId || !(await notifyTablesExist())) return [];

  const rows = await sql<AdminNotificationListItem[]>`
    select id::text as id, title, body, notification_type as "notificationType",
           entity_type as "entityType", entity_id::text as "entityId",
           created_at::text as "createdAt", read_at::text as "readAt"
    from notify.notifications
    where recipient_user_id = ${userId}::uuid
    order by created_at desc
    limit ${limit}
  `;

  return rows;
}

export async function markNotificationRead(input: { notificationId: string; userId: string }): Promise<void> {
  if (!(await notifyTablesExist())) return;
  await sql`
    update notify.notifications
    set read_at = now(), updated_at = now()
    where id = ${input.notificationId}::uuid
      and recipient_user_id = ${input.userId}::uuid
      and read_at is null
  `;
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
  if (!(await notifyTablesExist())) return;
  await sql`
    update notify.notifications
    set read_at = now(), updated_at = now()
    where recipient_user_id = ${userId}::uuid and read_at is null
  `;
}
