import { NextResponse } from "next/server";

import { apiId, portalOrderStatusUpdateSchema } from "@/features/shop-api/schemas";
import { notFound } from "@/features/shop-api/server/errors";
import { updatePortalOrderStatus } from "@/features/shop-api/server/portal-orders";
import { readJsonBody, shopPortalRoute } from "@/features/shop-api/server/route";

type Params = { orderId: string };

/** ready_for_pickup or picked_up, for the clinic's part of a paid order. */
export const POST = shopPortalRoute<Params>("provider", async ({ request, principal, params }) => {
  const parsed = apiId.safeParse(params.orderId);
  if (!parsed.success) throw notFound("Order");
  const { status } = portalOrderStatusUpdateSchema.parse(await readJsonBody(request));
  return NextResponse.json({ data: await updatePortalOrderStatus(principal, parsed.data, status) });
});
