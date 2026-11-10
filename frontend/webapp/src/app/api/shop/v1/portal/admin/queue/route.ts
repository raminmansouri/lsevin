import { NextResponse } from "next/server";

import { portalQueueStatusSchema } from "@/features/shop-api/schemas";
import { listAdminQueue } from "@/features/shop-api/server/portal";
import { shopPortalRoute } from "@/features/shop-api/server/route";

/** Shop activations, catalog listings and blocked items, by review status. */
export const GET = shopPortalRoute("admin", async ({ request, principal }) =>
  NextResponse.json({
    data: await listAdminQueue(
      principal,
      portalQueueStatusSchema.parse(request.nextUrl.searchParams.get("status"))
    ),
  })
);
