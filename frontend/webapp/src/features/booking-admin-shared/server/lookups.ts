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
      select common.get_translation_t(display_name_translations, ${locale}, 'en-US') as label, id::text as value
      from category.provider_services
      order by common.get_translation_t(display_name_translations, ${locale}, 'en-US') asc
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
