"use server"

import sql from "@/config/database/db";
import { categoryTreeOrderCte } from "@/features/categories/db/category-tree";
import { NearbyCategory } from "../../map-discovery/nearby.data";
import { getLocale } from "next-intl/server";

export default async function getCategories() {
  const locale = await getLocale();

  const categoryRows = await sql<NearbyCategory[]>`
    with recursive ${categoryTreeOrderCte()}
    select
      c.id::text as id,
      c.image_url as image,
      nullif(c.gradient, '') as gradient,
      common.get_translation_t(c.name_translations, ${locale}, 'en-US') as label
    from category.categories c
    left join category_tree_order o on o.category_id = c.id
    where c.is_active = true
      and coalesce(c.display_in_home_page, true) = true
    -- The admin's display order: each main category, then its subcategories. The old
    -- "display_order asc" put unprioritised (0) categories first and mixed parents.
    order by o.sort_path asc nulls last, label asc
  `;

  return categoryRows;
}
