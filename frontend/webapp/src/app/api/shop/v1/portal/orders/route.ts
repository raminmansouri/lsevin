import { NextResponse } from "next/server";

import { portalOrderListStatusSchema } from "@/features/shop-api/schemas";
import { listPortalOrders } from "@/features/shop-api/server/portal-orders";
import { shopPortalRoute } from "@/features/shop-api/server/route";

/** The clinic's paid orders (its own lines only) by pickup status, with a count per status. */
export const GET = shopPortalRoute("provider", async ({ request, principal }) =>
  NextResponse.json({
    data: await listPortalOrders(
      principal,
      portalOrderListStatusSchema.parse(request.nextUrl.searchParams.get("status"))
    ),
  })
);
