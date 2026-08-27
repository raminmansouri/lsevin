import { NextRequest, NextResponse } from "next/server";

import { env } from "@/config/env/server";
import { dispatchQueuedDeliveries } from "@/features/notification/server/dispatch";

/**
 * Manual/backup trigger for the queued-delivery dispatcher that otherwise runs on an
 * in-process interval (see src/instrumentation.ts). Useful for testing and as an ops
 * fallback if the interval-based loop ever needs to be supplemented by an external
 * scheduler. Same bearer pattern as the existing internal webhook,
 * src/app/api/webhooks/cache-invalidation/route.ts.
 */
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("X-WEBHOOK-KEY");
  if (!authHeader || authHeader !== env.WEBHOOK_KEY) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await dispatchQueuedDeliveries();
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "Dispatch failed" },
      { status: 500 }
    );
  }
}
