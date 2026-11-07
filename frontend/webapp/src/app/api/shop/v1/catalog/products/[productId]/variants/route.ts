import { NextResponse } from "next/server";

import { apiId } from "@/features/shop-api/schemas";
import { notFound } from "@/features/shop-api/server/errors";
import { listCatalogVariants } from "@/features/shop-api/server/repository";
import { shopApiRoute } from "@/features/shop-api/server/route";

/** Variants (size, colour…) of a catalog product; an offer on such a product names its variantId. */
export const GET = shopApiRoute<{ productId: string }>("catalog:read", async ({ params }) => {
  const parsed = apiId.safeParse(params.productId);
  if (!parsed.success) throw notFound("Product");
  return NextResponse.json(await listCatalogVariants(parsed.data));
});
