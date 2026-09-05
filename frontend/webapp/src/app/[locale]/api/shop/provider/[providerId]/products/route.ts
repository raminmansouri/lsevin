import { NextRequest, NextResponse } from "next/server";

import { getProductsForProvider } from "@/features/shop/api/service-relations.repository";

/**
 * Public Shop contract: products recommended around every service a provider
 * offers (SHP-V02-007). A provider page calls this instead of touching `shop.*`.
 *
 *   GET .../api/shop/provider/<uuid>/products?limit=24
 */
export async function GET(req: NextRequest, ctx: { params: Promise<{ providerId: string }> }) {
  const { providerId } = await ctx.params;
  if (!/^[0-9a-fA-F-]{36}$/.test(providerId)) {
    return NextResponse.json({ error: "invalid provider id" }, { status: 400 });
  }
  const limit = Math.min(40, Math.max(1, Number(new URL(req.url).searchParams.get("limit")) || 24));
  try {
    const result = await getProductsForProvider(providerId, { limit });
    return NextResponse.json(
      { providerId, ...result },
      { headers: { "cache-control": "public, max-age=60, s-maxage=120" } },
    );
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "failed" }, { status: 500 });
  }
}
