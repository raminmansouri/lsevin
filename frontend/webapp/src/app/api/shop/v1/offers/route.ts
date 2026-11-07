import { NextResponse } from "next/server";

import { apiId, createOfferSchema } from "@/features/shop-api/schemas";
import { createOwnOffer, listOwnOffers } from "@/features/shop-api/server/repository";
import { pageParams, readJsonBody, shopApiRoute } from "@/features/shop-api/server/route";

/** The token's own offers; ?productId= narrows to one product. */
export const GET = shopApiRoute("offers:read", async ({ request, principal }) => {
  const raw = request.nextUrl.searchParams.get("productId");
  const productId = raw ? apiId.parse(raw) : null;
  return NextResponse.json(await listOwnOffers(principal, { ...pageParams(request), productId }));
});

/** Price and stock for one item, sold by the token's seller. Takes effect immediately. */
export const POST = shopApiRoute("offers:write", async ({ request, principal }) => {
  const input = createOfferSchema.parse(await readJsonBody(request));
  return NextResponse.json({ data: await createOwnOffer(principal, input) }, { status: 201 });
});
