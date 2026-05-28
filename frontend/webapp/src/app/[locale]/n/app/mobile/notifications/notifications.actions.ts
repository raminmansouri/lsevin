"use server";

import sql from "@/config/database/db";
import { resolveCurrentNotificationCustomerId } from "@/features/notification/server/current-notification-customer";
import { revalidatePath } from "next/cache";

async function resolveCurrentCustomerId(): Promise<string | null> {
  return resolveCurrentNotificationCustomerId();
}

export async function markNotificationReadAction(notificationId: string) {
  const customerId = await resolveCurrentCustomerId();
  if (!customerId) throw new Error("Unauthorized");

  await sql`
    update notify.notifications
    set read_at = now(), updated_at = now()
    where id = ${notificationId}::uuid
      and customer_id = ${customerId}::uuid
      and read_at is null
  `;

  revalidatePath("/n/app/mobile/notifications");
}

export async function markAllNotificationsReadAction() {
  const customerId = await resolveCurrentCustomerId();
  if (!customerId) throw new Error("Unauthorized");

  await sql`
    update notify.notifications
    set read_at = now(), updated_at = now()
    where customer_id = ${customerId}::uuid
      and read_at is null
  `;

  revalidatePath("/n/app/mobile/notifications");
}
