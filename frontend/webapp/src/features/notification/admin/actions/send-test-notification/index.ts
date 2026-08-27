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

    // recipientUserId is always set -- it's what the admin bell reads (and what every
    // real admin/provider booking notification already uses), so "send a test to
    // myself" is always visible there regardless of who the target is. customerId is
    // set *additionally* when the target also has a customer.customers row (same id
    // as identity.asp_net_users for anyone who registered as a customer), so testing
    // against an actual customer also shows up in their real mobile notification
    // center, which reads by customer_id specifically. The two are not exclusive --
    // the schema allows both on one row.
    const [customerRow] = await sql<{ id: string }[]>`
      select id::text as id from customer.customers where id = ${input.targetUserId}::uuid limit 1
    `;

    const notificationId = await createNotification({
      recipientUserId: input.targetUserId,
      customerId: customerRow ? input.targetUserId : null,
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
