"use server";

import { unstable_cache } from "next/cache";
import { getLocale } from "next-intl/server";

import sql from "@/config/database/db";
import { getCpCategoryGroupsTag } from "@/features/service-providers/db/cache";

export type CategoryBrowserCategory = {
  id: string;
  name: string;
  description: string;
  image: string | null;
  icon: string | null;
  iconUrl: string | null;
  gradient: string | null;
  count: number;
  serviceCount: number;
  displayOrder: number;
};

export type CategoryBrowserGroup = {
  id: string;
  title: string;
  categories: CategoryBrowserCategory[];
};

type CategoryBrowserRow = {
  group_id: number | null;
  group_title: string | null;
  id: string;
  name: string | null;
  description: string | null;
  image: string | null;
  icon: string | null;
  icon_url: string | null;
  gradient: string | null;
  provider_count: number;
  service_count: number;
  display_order: number;
};

const getCategoryBrowserRows = unstable_cache(
  async (locale: string): Promise<CategoryBrowserRow[]> => {
    return sql<CategoryBrowserRow[]>`
      select
        c.group_id,
        nullif(btrim(cg.title), '') as group_title,
        c.id::text as id,
        nullif(common.get_translation_t(c.name_translations, ${locale}, 'en-US'), '') as name,
        nullif(common.get_translation_t(c.description_translations, ${locale}, 'en-US'), '') as description,
        nullif(btrim(c.image_url), '') as image,
        nullif(btrim(c.icon), '') as icon,
        nullif(btrim(c.icon_url), '') as icon_url,
        nullif(btrim(c.gradient), '') as gradient,
        count(distinct sp.id)::int as provider_count,
        count(distinct sd.id)::int as service_count,
        coalesce(c.display_order, 0)::int as display_order
      from category.categories c
      left join category.category_groups cg
        on cg.id = c.group_id
      left join category.service_definitions sd
        on sd.category_id = c.id
       and sd.is_active = true
      left join category.provider_services ps
        on ps.service_definition_id = sd.id
       and ps.is_active = true
      left join category.service_providers sp
        on sp.id = ps.service_provider_id
       and sp.is_active = true
      where c.is_active = true
      group by
        c.group_id,
        cg.title,
        c.id,
        c.name_translations,
        c.description_translations,
        c.image_url,
        c.icon,
        c.icon_url,
        c.gradient,
        c.display_order
      order by
        coalesce(c.group_id, 2147483647) asc,
        coalesce(c.display_order, 0) asc,
        name asc;
    `;
  },
  ["mobile-category-browser-groups"],
  {
    revalidate: 300,
    tags: [getCpCategoryGroupsTag()],
  }
);

function normalizeLocale(locale: string | undefined | null) {
  const value = locale?.trim();
  return value && value.length > 0 ? value : "en-US";
}

export async function getCategoryBrowserGroups(): Promise<CategoryBrowserGroup[]> {
  const locale = normalizeLocale(await getLocale());
  const rows = await getCategoryBrowserRows(locale);
  const groups = new Map<string, CategoryBrowserGroup>();

  for (const row of rows) {
    const groupId = row.group_id?.toString() ?? "other";
    const groupTitle = row.group_title || "Other Services";

    if (!groups.has(groupId)) {
      groups.set(groupId, {
        id: groupId,
        title: groupTitle,
        categories: [],
      });
    }

    groups.get(groupId)!.categories.push({
      id: row.id,
      name: row.name || "Untitled category",
      description: row.description || "",
      image: row.image,
      icon: row.icon,
      iconUrl: row.icon_url,
      gradient: row.gradient,
      count: Number(row.provider_count || 0),
      serviceCount: Number(row.service_count || 0),
      displayOrder: Number(row.display_order || 0),
    });
  }

  return Array.from(groups.values()).filter((group) => group.categories.length > 0);
}
