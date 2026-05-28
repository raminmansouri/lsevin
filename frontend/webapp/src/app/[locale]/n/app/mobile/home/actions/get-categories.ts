"use server"

import sql from "@/config/database/db";
import { NearbyCategory } from "../../map-discovery/nearby.data";
import { getLocale } from "next-intl/server";

export default async function getCategories() {
  const locale = await getLocale();

  const categoryRows = await sql<NearbyCategory[]>`
    select
      c.id::text as id,
      c.image_url as image,
      nullif(c.gradient, '') as gradient,
      common.get_translation_t(c.name_translations, ${locale}, 'en-US') as label
    from category.categories c
    where c.is_active = true
      and coalesce(c.display_in_home_page, true) = true
    order by coalesce(c.display_order, 0) asc, label asc
  `;

  return categoryRows;
}
