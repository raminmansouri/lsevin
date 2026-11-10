import { NextResponse } from "next/server";

import { createProductSchema } from "@/features/shop-api/schemas";
import { createOwnProduct, listOwnProducts } from "@/features/shop-api/server/repository";
import { pageParams, readJsonBody, shopApiRoute } from "@/features/shop-api/server/route";

/** The token's own products (any status except deleted). */
export const GET = shopApiRoute("products:read", async ({ request, principal }) =>
  NextResponse.json(await listOwnProducts(principal, { ...pageParams(request), status: request.nextUrl.searchParams.get("status") })),
);

/** Creates a product owned by the token's seller. It is a draft until an admin approves it. */
export const POST = shopApiRoute("products:write", async ({ request, principal }) => {
  const input = createProductSchema.parse(await readJsonBody(request));
  return NextResponse.json({ data: await createOwnProduct(principal, input) }, { status: 201 });
});
