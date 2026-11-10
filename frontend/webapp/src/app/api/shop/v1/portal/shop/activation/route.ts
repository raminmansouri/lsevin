import { NextResponse } from "next/server";

import { portalActivationSchema } from "@/features/shop-api/schemas";
import { requestShopActivation } from "@/features/shop-api/server/portal";
import {
  readJsonBody,
  shopPortalRoute,
} from "@/features/shop-api/server/route";

/** Requests a shop (or asks again after a rejection). */
export const POST = shopPortalRoute(
  "provider",
  async ({ request, principal }) => {
    const input = portalActivationSchema.parse(await readJsonBody(request));
    return NextResponse.json(
      { data: await requestShopActivation(principal, input) },
      { status: 201 }
    );
  }
);
