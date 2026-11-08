import { NextResponse } from "next/server";

import { apiId, updateProductSchema } from "@/features/shop-api/schemas";
import { notFound } from "@/features/shop-api/server/errors";
import { deleteOwnProduct, getOwnProduct, updateOwnProduct } from "@/features/shop-api/server/repository";
import { readJsonBody, shopApiRoute } from "@/features/shop-api/server/route";

type Params = { productId: string };
const id = (params: Params) => {
  const parsed = apiId.safeParse(params.productId);
  if (!parsed.success) throw notFound("Product");
  return parsed.data;
};

export const GET = shopApiRoute<Params>("products:read", async ({ principal, params }) =>
  NextResponse.json({ data: await getOwnProduct(principal, id(params)) }),
);

/**
 * Content edit. 200 when applied (product still in review), 202 when an approved product's edit
 * waits for an admin; the live product is unchanged until then.
 */
export const PATCH = shopApiRoute<Params>("products:write", async ({ request, principal, params }) => {
  const productId = id(params);
  const input = updateProductSchema.parse(await readJsonBody(request));
  const result = await updateOwnProduct(principal, productId, input);
  return NextResponse.json(
    { data: result.product, pendingReview: !result.appliedImmediately },
    { status: result.appliedImmediately ? 200 : 202 },
  );
});

export const DELETE = shopApiRoute<Params>("products:delete", async ({ principal, params }) => {
  await deleteOwnProduct(principal, id(params));
  return new NextResponse(null, { status: 204 });
});
