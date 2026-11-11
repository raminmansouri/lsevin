import { NextResponse } from "next/server";

import {
  apiId,
  portalProposalDecisionSchema,
} from "@/features/shop-api/schemas";
import { notFound } from "@/features/shop-api/server/errors";
import { decideProposal } from "@/features/shop-api/server/portal";
import {
  readJsonBody,
  shopPortalRoute,
} from "@/features/shop-api/server/route";

type Params = { proposalId: string };

/**
 * approve (creates the catalog product and the shop's approved offer; name, categoryId and price
 * may be corrected first) or reject (with a reason).
 */
export const POST = shopPortalRoute<Params>(
  "admin",
  async ({ request, principal, params }) => {
    const parsed = apiId.safeParse(params.proposalId);
    if (!parsed.success) throw notFound("Proposal");
    const input = portalProposalDecisionSchema.parse(
      await readJsonBody(request)
    );
    return NextResponse.json({
      data: await decideProposal(principal, parsed.data, input),
    });
  }
);
