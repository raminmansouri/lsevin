import "server-only";

import sql from "@/config/database/db";

export type RoomMealPlans = {
  currency: string | null;
  roomOnlyPrice: number | null;
  breakfast: number | null;
  fullBoard: number | null;
};

export async function getRoomMealPlans(providerServiceId: string): Promise<RoomMealPlans> {
  const [room] = await sql<{ value: string | null; currency: string | null }[]>`
    select value::text as value, currency
    from category.provider_services
    where id = ${providerServiceId}::uuid
    limit 1
  `;
  const rows = await sql<{ code: string; price: string }[]>`
    select plan_code as code, price::text as price
    from category.provider_service_meal_plans
    where provider_service_id = ${providerServiceId}::uuid
  `;
  const priceOf = (code: string) => {
    const row = rows.find((r) => r.code === code);
    return row ? Number(row.price) : null;
  };
  return {
    currency: room?.currency ?? null,
    roomOnlyPrice: room?.value == null ? null : Number(room.value),
    breakfast: priceOf("breakfast"),
    fullBoard: priceOf("full_board"),
  };
}

// An empty price removes the plan; a price creates or updates it.
export async function saveRoomMealPlans(
  providerServiceId: string,
  prices: { breakfast: number | null; fullBoard: number | null },
) {
  const entries: Array<[string, number | null]> = [
    ["breakfast", prices.breakfast],
    ["full_board", prices.fullBoard],
  ];
  await sql.begin(async (tx) => {
    for (const [code, price] of entries) {
      if (price == null) {
        await tx`
          delete from category.provider_service_meal_plans
          where provider_service_id = ${providerServiceId}::uuid and plan_code = ${code}
        `;
      } else {
        await tx`
          insert into category.provider_service_meal_plans (provider_service_id, plan_code, price)
          values (${providerServiceId}::uuid, ${code}, ${price})
          on conflict (provider_service_id, plan_code)
          do update set price = excluded.price, updated_at = now()
        `;
      }
    }
  });
}
