import { NextResponse } from "next/server";

import { getProviderShop } from "@/features/shop-api/server/portal";
import { shopPortalRoute } from "@/features/shop-api/server/route";

/** The provider's seller and shop state, with its allowed categories. */
export const GET = shopPortalRoute("provider", async ({ principal }) =>
  NextResponse.json({ data: await getProviderShop(principal) })
);
