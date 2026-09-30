import "server-only";
import { db } from "./db";
import type { LookupOption } from "../types";

export async function getBookingAdminLookups(locale = "fa-IR") {
  const [providers, services, specialists, paymentMethods] = await Promise.all([
    db<LookupOption[]>`
      select common.get_translation_t(name_translations, ${locale}, 'en-US') as label, id::text as value
      from category.service_providers
      order by common.get_translation_t(name_translations, ${locale}, 'en-US') asc
      limit 200
    `,
    db<LookupOption[]>`
      select
        coalesce(
          nullif(common.get_translation_t(ps.display_name_translations, ${locale}, 'en-US'), ''),
          common.get_translation_t(sd.name_translations, ${locale}, 'en-US')
        ) as label,
        ps.id::text as value
      from category.provider_services ps
      join category.service_definitions sd on sd.id = ps.service_definition_id
      order by label asc
      limit 300
    `,
    db<LookupOption[]>`
      select common.get_translation_t(name_translations, ${locale}, 'en-US') as label, id::text as value
      from category.staff
      order by common.get_translation_t(name_translations, ${locale}, 'en-US') asc
      limit 300
    `,
    db<LookupOption[]>`
      select common.get_translation_t(name_translations, ${locale}, 'en-US') as label, code::text as value
      from shop.payment_methods
      where is_active = true
      order by sort_order asc, code asc
      limit 50
    `.catch(() => []),
  ]);

  return {
    providers,
    services,
    specialists,
    paymentMethods,
  };
}
