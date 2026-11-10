import { NextResponse } from "next/server";

import { portalCreateOfferSchema } from "@/features/shop-api/schemas";
import { createPortalOffer } from "@/features/shop-api/server/portal";
import {
  readJsonBody,
  shopPortalRoute,
} from "@/features/shop-api/server/route";

/** Lists a catalog item; it waits for an admin ("pending") before it goes live. */
export const POST = shopPortalRoute(
  "provider",
  async ({ request, principal }) => {
    const { warranty, ...input } = portalCreateOfferSchema.parse(
      await readJsonBody(request)
    );
    return NextResponse.json(
      { data: await createPortalOffer(principal, input, { warranty }) },
      { status: 201 }
    );
  }
);
