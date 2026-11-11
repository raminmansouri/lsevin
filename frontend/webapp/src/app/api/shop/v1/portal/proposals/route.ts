import { NextResponse } from "next/server";

import { portalCreateProposalSchema } from "@/features/shop-api/schemas";
import {
  createProductProposal,
  listProviderProposals,
} from "@/features/shop-api/server/portal";
import {
  readJsonBody,
  shopPortalRoute,
} from "@/features/shop-api/server/route";

/** The provider's proposals of new products, and the categories it may propose in. */
export const GET = shopPortalRoute("provider", async ({ principal }) =>
  NextResponse.json({ data: await listProviderProposals(principal) })
);

/** Proposes a product that is not in the catalog; it waits for an admin ("pending"). */
export const POST = shopPortalRoute(
  "provider",
  async ({ request, principal }) => {
    const input = portalCreateProposalSchema.parse(await readJsonBody(request));
    return NextResponse.json(
      { data: await createProductProposal(principal, input) },
      { status: 201 }
    );
  }
);
