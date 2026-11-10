import { NextResponse } from "next/server";

import { apiId, portalUpdateOfferSchema } from "@/features/shop-api/schemas";
import { notFound } from "@/features/shop-api/server/errors";
import { updatePortalOffer } from "@/features/shop-api/server/portal";
import {
  readJsonBody,
  shopPortalRoute,
} from "@/features/shop-api/server/route";

type Params = { offerId: string };

/** Price, stock, handling, SKU, warranty, on/off: applied at once. `resubmit` sends a rejected listing back for review. */
export const PATCH = shopPortalRoute<Params>(
  "provider",
  async ({ request, principal, params }) => {
    const parsed = apiId.safeParse(params.offerId);
    if (!parsed.success) throw notFound("Offer");
    const { warranty, resubmit, ...input } = portalUpdateOfferSchema.parse(
      await readJsonBody(request)
    );
    return NextResponse.json({
      data: await updatePortalOffer(principal, parsed.data, input, {
        warranty,
        resubmit,
      }),
    });
  }
);
