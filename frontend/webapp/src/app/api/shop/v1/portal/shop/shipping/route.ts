import { NextResponse } from "next/server";

import { portalShippingSchema } from "@/features/shop-api/schemas";
import { getPortalShipping, updatePortalShipping } from "@/features/shop-api/server/portal-orders";
import { readJsonBody, shopPortalRoute } from "@/features/shop-api/server/route";

/** The clinic's own shipping fee (rial) and delivery days, with Lsevin's cap on the fee. */
export const GET = shopPortalRoute("provider", async ({ principal }) =>
  NextResponse.json({ data: await getPortalShipping(principal) })
);

export const PUT = shopPortalRoute("provider", async ({ request, principal }) => {
  const input = portalShippingSchema.parse(await readJsonBody(request));
  return NextResponse.json({ data: await updatePortalShipping(principal, input) });
});
