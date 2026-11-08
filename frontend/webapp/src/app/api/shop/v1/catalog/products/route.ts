import { NextResponse } from "next/server";

import { apiId } from "@/features/shop-api/schemas";
import { listCatalogProducts } from "@/features/shop-api/server/repository";
import { pageParams, shopApiRoute } from "@/features/shop-api/server/route";

/** Live products of the platform catalog a seller can sell (POST /offers). ?search=&categoryId= */
export const GET = shopApiRoute("catalog:read", async ({ request }) => {
  const rawCategory = request.nextUrl.searchParams.get("categoryId");
  return NextResponse.json(
    await listCatalogProducts({
      ...pageParams(request),
      search: request.nextUrl.searchParams.get("search")?.slice(0, 100) ?? null,
      categoryId: rawCategory ? apiId.parse(rawCategory) : null,
    }),
  );
});
