import { NextResponse } from "next/server";

import { listPortalRequests } from "@/features/shop-api/server/portal";
import { shopPortalRoute } from "@/features/shop-api/server/route";

/** The shop activation and every listing, with admin status, reason and dates. */
export const GET = shopPortalRoute("provider", async ({ principal }) =>
  NextResponse.json({ data: await listPortalRequests(principal) })
);
