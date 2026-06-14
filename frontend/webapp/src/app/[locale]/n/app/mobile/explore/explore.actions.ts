"use server";

import sql from "@/config/database/db";
import { revalidatePath } from "next/cache";

// import { sql } from "@/lib/postgres";

export type FavoriteEntityType = "provider" | "service";

export async function toggleExploreFavoriteAction(input: {
  customerId: string | null;
  entityId: string;
  favoriteType: FavoriteEntityType;
  path?: string;
}) {
  if (!input.customerId) {
    return { ok: false, message: "Authentication required." };
  }

  const existing = await sql<{ id: number }[]>`
    select id
    from customer.favorites
    where customer_id = ${input.customerId}::uuid
      and favorite_type = ${input.favoriteType}
      and entity_id = ${input.entityId}::uuid
    limit 1
  `;

  if (existing.length > 0) {
    await sql`
      delete from customer.favorites
      where customer_id = ${input.customerId}::uuid
        and favorite_type = ${input.favoriteType}
        and entity_id = ${input.entityId}::uuid
    `;
  } else {
    await sql`
      insert into customer.favorites (customer_id, favorite_type, entity_id)
      values (${input.customerId}::uuid, ${input.favoriteType}, ${input.entityId}::uuid)
      on conflict (customer_id, favorite_type, entity_id) do nothing
    `;
  }

  revalidatePath(input.path ?? "/n/app/mobile/explore");
  return { ok: true, active: existing.length === 0 };
}
