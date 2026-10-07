import { NextRequest, NextResponse } from "next/server";

import sql from "@/config/database/db";
import { priceItemsForViewer } from "@/features/finance/lib/server/viewer-pricing";

// The plans a room offers and their nightly prices, converted for this visitor with the same
// conversion and markup as the room price. Room only is always first. Prices are per visitor,
// so nothing here may be cached.
export async function GET(request: NextRequest) {
  const serviceId = request.nextUrl.searchParams.get("serviceId") ?? "";
  const headers = { "Cache-Control": "private, no-store" };
  if (!/^[0-9a-fA-F-]{36}$/.test(serviceId)) return NextResponse.json({ plans: [] }, { headers });

  try {
    const [room] = await sql<{ value: string | null; currency: string | null; providerId: string }[]>`
      select value::text as value, currency, service_provider_id::text as "providerId"
      from category.provider_services
      where id = ${serviceId}::uuid and is_active = true
      limit 1
    `;
    if (!room || room.value == null || !room.currency) return NextResponse.json({ plans: [] }, { headers });

    const rows = await sql<{ code: string; price: string }[]>`
      select plan_code as code, price::text as price
      from category.provider_service_meal_plans
      where provider_service_id = ${serviceId}::uuid
    `;
    const order = ["breakfast", "full_board"];
    const offered = order.map((code) => rows.find((r) => r.code === code)).filter(Boolean) as { code: string; price: string }[];
    if (!offered.length) return NextResponse.json({ plans: [] }, { headers });

    const items = [{ code: "room_only", price: room.value }, ...offered.map((r) => ({ code: r.code, price: r.price }))];
    const priced = await priceItemsForViewer(
      items.map((item) => ({ amount: Number(item.price), sourceCurrencyCode: room.currency as string, providerId: room.providerId })),
    );
    const plans = items.flatMap((item, index) => {
      const p = priced[index];
      return p ? [{ code: item.code, amount: p.amount, currencyCode: p.currencyCode }] : [];
    });
    return NextResponse.json({ plans: plans.length === items.length ? plans : [] }, { headers });
  } catch {
    return NextResponse.json({ plans: [] }, { headers });
  }
}
