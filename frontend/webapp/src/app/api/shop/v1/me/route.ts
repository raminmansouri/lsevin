import { NextResponse } from "next/server";

import { shopApiRoute } from "@/features/shop-api/server/route";

/** Who am I: the token's name, its seller and its permissions. Handy for checking a new token. */
export const GET = shopApiRoute(null, async ({ principal }) =>
  NextResponse.json({
    data: { tokenName: principal.tokenName, seller: { id: principal.sellerId, slug: principal.sellerSlug }, scopes: principal.scopes },
  }),
);
