import "server-only";
import { sql } from "@core/db/client";
import { assertTimeZone } from "@core/lib/dateTime";

export async function getProviderTimeZone(providerId: string) {
  const rows = await sql<{ timeZone: string | null }[]>`
    select timezone_id as "timeZone"
    from category.service_providers
    where id = ${providerId}::uuid
    limit 1
  `;
  return assertTimeZone(rows[0]?.timeZone);
}
