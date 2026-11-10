import { NextResponse } from "next/server";

import { apiId, portalOfferDecisionSchema } from "@/features/shop-api/schemas";
import { notFound } from "@/features/shop-api/server/errors";
import { decideOffer } from "@/features/shop-api/server/portal";
import {
  readJsonBody,
  shopPortalRoute,
} from "@/features/shop-api/server/route";

type Params = { offerId: string };

/** approve, reject / block (with a reason), or unblock (back to approved). */
export const POST = shopPortalRoute<Params>(
  "admin",
  async ({ request, principal, params }) => {
    const parsed = apiId.safeParse(params.offerId);
    if (!parsed.success) throw notFound("Offer");
    const input = portalOfferDecisionSchema.parse(await readJsonBody(request));
    return NextResponse.json({
      data: await decideOffer(principal, parsed.data, input),
    });
  }
);
