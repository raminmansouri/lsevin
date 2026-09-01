import { NextRequest, NextResponse } from "next/server";

import {
  getProductsForService,
  getProductsForServiceViaCategory,
  type ServiceRelationType,
} from "@/features/shop/api/service-relations.repository";

/**
 * Public Shop contract: products related to an LSevin service definition
 * (SHP-V02-007, SHP-API-005). A service page / care-journey step calls this
 * instead of touching `shop.*` tables. Prices are already resolved into the
 * caller's display currency by the Shop pricing policy.
 *
 *   GET .../api/shop/service/<uuid>/products?relation=recommended_after&via=category&limit=12
 */
const RELATIONS = new Set([
  "general",
  "recommended_before",
  "recommended_after",
  "compatible",
  "required",
  "optional_addon",
]);

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ serviceDefinitionId: string }> },
) {
  const { serviceDefinitionId } = await ctx.params;
  if (!/^[0-9a-fA-F-]{36}$/.test(serviceDefinitionId)) {
    return NextResponse.json({ error: "invalid service definition id" }, { status: 400 });
  }
  const url = new URL(req.url);
  const relationParam = url.searchParams.get("relation");
  const relationType = relationParam && RELATIONS.has(relationParam) ? (relationParam as ServiceRelationType) : undefined;
  const limit = Math.min(40, Math.max(1, Number(url.searchParams.get("limit")) || 24));

  try {
    if (url.searchParams.get("via") === "category") {
      const products = await getProductsForServiceViaCategory(serviceDefinitionId, { limit });
      return NextResponse.json(
        { serviceDefinitionId, source: "category", products },
        { headers: { "cache-control": "public, max-age=60, s-maxage=120" } },
      );
    }
    const result = await getProductsForService(serviceDefinitionId, { relationType, limit });
    return NextResponse.json(result, {
      headers: { "cache-control": "public, max-age=60, s-maxage=120" },
    });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "failed" }, { status: 500 });
  }
}
