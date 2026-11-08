import { NextResponse } from "next/server";

import { apiId, updateOfferSchema } from "@/features/shop-api/schemas";
import { notFound } from "@/features/shop-api/server/errors";
import { deleteOwnOffer, getOwnOffer, updateOwnOffer } from "@/features/shop-api/server/repository";
import { readJsonBody, shopApiRoute } from "@/features/shop-api/server/route";

type Params = { offerId: string };
const id = (params: Params) => {
  const parsed = apiId.safeParse(params.offerId);
  if (!parsed.success) throw notFound("Offer");
  return parsed.data;
};

export const GET = shopApiRoute<Params>("offers:read", async ({ principal, params }) =>
  NextResponse.json({ data: await getOwnOffer(principal, id(params)) }),
);

export const PATCH = shopApiRoute<Params>("offers:write", async ({ request, principal, params }) => {
  const offerId = id(params);
  const input = updateOfferSchema.parse(await readJsonBody(request));
  return NextResponse.json({ data: await updateOwnOffer(principal, offerId, input) });
});

export const DELETE = shopApiRoute<Params>("offers:delete", async ({ principal, params }) => {
  await deleteOwnOffer(principal, id(params));
  return new NextResponse(null, { status: 204 });
});
