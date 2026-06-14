import { NextResponse, type NextRequest } from "next/server";

import { getNotificationUnreadCountByCustomerId } from "@/features/notification/db/notification-count.queries";
import { resolveCurrentNotificationCustomerId } from "@/features/notification/server/current-notification-customer";
import { EMPTY_NOTIFICATION_COUNT } from "@/features/notification/types/notification-count";

export async function GET(request: NextRequest) {
  try {
    const locale = request.headers.get("x-lsevin-locale") || "fa";
    const customerId = await resolveCurrentNotificationCustomerId({ request, locale });

    if (!customerId) {
      return NextResponse.json(EMPTY_NOTIFICATION_COUNT, {
        headers: { "Cache-Control": "no-store" },
      });
    }

    const data = await getNotificationUnreadCountByCustomerId(customerId);

    return NextResponse.json(data, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error("Failed to load notification count", error);

    return NextResponse.json(EMPTY_NOTIFICATION_COUNT, {
      status: 200,
      headers: { "Cache-Control": "no-store" },
    });
  }
}
