"use server"

import sql from "@/config/database/db";
import { NearbyCategory } from "../../map-discovery/nearby.data";
import { getLocale } from "next-intl/server";


export default  async function getCategories(){

    const locale= await getLocale();
      const categoryRows = await sql<NearbyCategory[]>`
    select distinct
      c.id::text as id,
      c.image_url as image,
      common.get_translation_t(c.name_translations, ${locale}, 'en') as label
    from category.categories c
    join category.service_definitions sd on sd.category_id = c.id and sd.is_active = true
    join category.provider_services ps on ps.service_definition_id = sd.id and ps.is_active = true
    join category.service_providers sp on sp.id = ps.service_provider_id and sp.is_active = true
    
    order by label asc
  `;

  return categoryRows
}