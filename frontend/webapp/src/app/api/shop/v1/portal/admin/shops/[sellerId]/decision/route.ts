import { NextResponse } from "next/server";

import { apiId, portalShopDecisionSchema } from "@/features/shop-api/schemas";
import { notFound } from "@/features/shop-api/server/errors";
import { decideShop } from "@/features/shop-api/server/portal";
import {
  readJsonBody,
  shopPortalRoute,
} from "@/features/shop-api/server/route";

type Params = { sellerId: string };

/** approve (with allowed categories), reject / suspend (with a reason), or unsuspend. */
export const POST = shopPortalRoute<Params>(
  "admin",
  async ({ request, principal, params }) => {
    const parsed = apiId.safeParse(params.sellerId);
    if (!parsed.success) throw notFound("Shop");
    const input = portalShopDecisionSchema.parse(await readJsonBody(request));
    return NextResponse.json({
      data: await decideShop(principal, parsed.data, input),
    });
  }
);
