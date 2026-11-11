import { NextResponse } from "next/server";

import { portalOrdersSummary } from "@/features/shop-api/server/portal-orders";
import { shopPortalRoute } from "@/features/shop-api/server/route";

/** Counts for the portal menu badge (paid orders waiting for the clinic). */
export const GET = shopPortalRoute("provider", async ({ principal }) =>
  NextResponse.json({ data: await portalOrdersSummary(principal) })
);
