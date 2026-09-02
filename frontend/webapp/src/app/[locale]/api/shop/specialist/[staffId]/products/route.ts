import { NextRequest, NextResponse } from "next/server";

import { getProductsForStaff } from "@/features/shop/api/service-relations.repository";

/**
 * Public Shop contract: products recommended around every service a staff
 * member / doctor offers (SHP-V02-007).
 *
 *   GET .../api/shop/specialist/<uuid>/products?limit=24
 */
export async function GET(req: NextRequest, ctx: { params: Promise<{ staffId: string }> }) {
  const { staffId } = await ctx.params;
  if (!/^[0-9a-fA-F-]{36}$/.test(staffId)) {
    return NextResponse.json({ error: "invalid staff id" }, { status: 400 });
  }
  const limit = Math.min(40, Math.max(1, Number(new URL(req.url).searchParams.get("limit")) || 24));
  try {
    const result = await getProductsForStaff(staffId, { limit });
    return NextResponse.json(
      { staffId, ...result },
      { headers: { "cache-control": "public, max-age=60, s-maxage=120" } },
    );
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "failed" }, { status: 500 });
  }
}
