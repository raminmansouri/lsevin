"use server";

import { createAuthenticatedSafeAction } from "@/lib/safe-action";
import type { LocaleHeaderTypes } from "@/types/common";
import sql from "@/config/database/db";
import { createNotification } from "@/app/[locale]/n/app/mobile/notifications/notification-service";
import { dispatchQueuedDeliveries } from "@/features/notification/server/dispatch";

import { SendTestNotificationSchema } from "./schema";
import type { InputType, OutputType, ReturnType } from "./types";

function normalizePhone(countryCode?: string | null, phone?: string | null) {
  const rawPhone = phone?.trim();
  if (!rawPhone) return null;
  const cc = countryCode?.trim();
  if (!cc) return rawPhone;
  if (rawPhone.startsWith("+")) return rawPhone;
  return `${cc.startsWith("+") ? cc : `+${cc}`}${rawPhone.replace(/^0+/, "")}`;
}

const handler = async (
  input: InputType,
  _token: string,
  _userId: string,
  _locale: LocaleHeaderTypes
): Promise<ReturnType> => {
  try {
    const [user] = await sql<{ email: string | null; phoneCountryCode: string | null; phoneNumber: string | null }[]>`
      select email, phone_number_country_code as "phoneCountryCode", phone_number as "phoneNumber"
      from identity.asp_net_users
      where id = ${input.targetUserId}::uuid
      limit 1
    `;
    if (!user) throw new Error("Selected user was not found.");

    const email = user.email;
    const phone = normalizePhone(user.phoneCountryCode, user.phoneNumber);

    // notify.notifications.customer_id FKs to customer.customers, which is keyed by
    // the same id as identity.asp_net_users for anyone who has actually registered as
    // a customer -- routing the in-app test through whichever id the target's real
    // notification center reads is what makes "send test in-app" actually visible to
    // them, instead of landing somewhere only the admin bell would ever show it.
    const [customerRow] = await sql<{ id: string }[]>`
      select id::text as id from customer.customers where id = ${input.targetUserId}::uuid limit 1
    `;

    const notificationId = await createNotification({
      customerId: customerRow ? input.targetUserId : null,
      recipientUserId: customerRow ? null : input.targetUserId,
      notificationType: "system",
      title: input.title,
      body: input.body,
      channels: [input.channel],
      emailTo: input.channel === "email" ? email : null,
      phoneTo: input.channel === "sms" || input.channel === "whatsapp" ? phone : null,
      data: { test: true, sentBy: _userId },
    });

    if (input.channel === "in_app") {
      return {
        data: { status: "sent", providerResponse: null, errorMessage: null },
        error: undefined,
        payload: input,
      };
    }

    // Dispatch immediately instead of waiting for the ~20s background tick -- the
    // point of a "test" button is to know right away whether it actually sent.
    await dispatchQueuedDeliveries(10);

    const [delivery] = await sql<{ status: string; providerResponse: string | null; errorMessage: string | null }[]>`
      select status, provider_response as "providerResponse", error_message as "errorMessage"
      from notify.notification_deliveries
      where notification_id = ${notificationId}::uuid and channel = ${input.channel}
      limit 1
    `;

    return {
      data: {
        status: (delivery?.status as OutputType["status"]) ?? "queued",
        providerResponse: delivery?.providerResponse ?? null,
        errorMessage: delivery?.errorMessage ?? null,
      },
      error: undefined,
      payload: input,
    };
  } catch (error) {
    return {
      data: undefined,
      error: {
        title: "Unable to send test notification",
        status: 500,
        detail: error instanceof Error ? error.message : "Please try again.",
      },
      payload: input,
    };
  }
};

export const sendTestNotificationAction = createAuthenticatedSafeAction(
  SendTestNotificationSchema,
  handler,
  { adminRequired: true }
);
