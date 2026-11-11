import { NextResponse } from "next/server";

import { portalProposalStatusSchema } from "@/features/shop-api/schemas";
import { listAdminProposals } from "@/features/shop-api/server/portal";
import { shopPortalRoute } from "@/features/shop-api/server/route";

/** Product proposals by status (pending, approved, rejected). */
export const GET = shopPortalRoute("admin", async ({ request, principal }) =>
  NextResponse.json({
    data: await listAdminProposals(
      principal,
      portalProposalStatusSchema.parse(
        request.nextUrl.searchParams.get("status")
      )
    ),
  })
);
