import { NextResponse } from "next/server";

import { listPortalCatalog } from "@/features/shop-api/server/portal";
import { shopPortalRoute } from "@/features/shop-api/server/route";

/** Catalog products/variants the provider could list, marked allowed / already listed. */
export const GET = shopPortalRoute("provider", async ({ request, principal }) =>
  NextResponse.json(
    await listPortalCatalog(
      principal,
      request.nextUrl.searchParams.get("search")?.slice(0, 100) ?? null
    )
  )
);
