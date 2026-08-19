import "server-only";
import { sql } from "@core/db/client";
import type { CoreProviderSummary } from "./types";

export async function listUserProvidersForShell(userId: string) {
  const rows = await sql<CoreProviderSummary[]>`
    select
      sp.id::text,
      coalesce(common.get_translation_t(sp.name_translations, 'fa-IR', 'en-US'), sp.email, sp.id::text) as name,
      coalesce(common.get_translation_t(pt.name_translations, 'fa-IR', 'en-US'), '') as "providerTypeName",
      pm.role::text as role,
      pm.is_default as "isDefault"
    from provider_portal.provider_members pm
    join category.service_providers sp on sp.id = pm.service_provider_id
    left join category.provider_types pt on pt.id = sp.provider_type_id
    where pm.user_id = ${userId}::uuid
    order by pm.is_default desc, sp.create_date desc
  `;
  return rows;
}
