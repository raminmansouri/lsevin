import "server-only";

import db from "@/config/database/db";

export type ProviderService = { id: string; providerId: string; name: string };

/** An active clinic service with its name in this locale, or null. */
export async function getProviderService(serviceId: string, locale: string): Promise<ProviderService | null> {
  const rows = await db<ProviderService[]>`
    select
      ps.id::text as id,
      ps.service_provider_id::text as "providerId",
      coalesce(
        nullif(common.get_translation_t(ps.display_name_translations, ${locale}, 'fa-IR'), ''),
        nullif(common.get_translation_t(sd.name_translations, ${locale}, 'fa-IR'), ''),
        ''
      ) as name
    from category.provider_services ps
    left join category.service_definitions sd on sd.id = ps.service_definition_id
    where ps.id = ${serviceId}::uuid and ps.is_active = true
  `;
  return rows[0] ?? null;
}
