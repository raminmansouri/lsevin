"use server";

import { unstable_cache } from "next/cache";
import { getLocale } from "next-intl/server";

import sql from "@/config/database/db";
import {
  categoryProviderCountsCte,
  categoryTotalProviderCount,
} from "@/features/categories/db/category-tree";
import { getCpCategoryGroupsTag } from "@/features/service-providers/db/cache";

export type CategoryBrowserCategory = {
  id: string;
  name: string;
  description: string;
  image: string | null;
  icon: string | null;
  iconUrl: string | null;
  gradient: string | null;
  parentId: string | null;
  childCount: number;
  /** Active providers filed under this category or anything beneath it. */
  count: number;
  displayOrder: number;
};

export type CategoryBrowserGroup = {
  id: string;
  title: string;
  categories: CategoryBrowserCategory[];
};

export type CategoryBrowserData = {
  groups: CategoryBrowserGroup[];
  totalCategories: number;
  /** Distinct providers reachable through the tree — not the sum of the counts
   *  above, which counts a provider once per ancestor it rolls up into. */
  totalProviders: number;
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
  parent_id: string | null;
  child_count: number;
  provider_count: number;
  total_providers: number;
  display_order: number;
};

const getCategoryBrowserRows = unstable_cache(
  async (locale: string): Promise<CategoryBrowserRow[]> => {
    // Counts roll up over each subtree: a provider filed under Clinic counts for
    // Clinic and for Health, treatment and beauty, once each. Without the roll-up a
    // parent category reads as empty, since businesses hang off the leaves.
    //
    // They are provider counts, always — this used to fall back to a service count
    // whenever the provider count came out zero, so the same shelf showed
    // "70 providers" next to "121 services" and the two could not be compared.
    return sql<CategoryBrowserRow[]>`
      with recursive ${categoryProviderCountsCte()}
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
        c.parent_id::text as parent_id,
        coalesce(cc.child_count, 0) as child_count,
        coalesce(pc.provider_count, 0) as provider_count,
        ${categoryTotalProviderCount()} as total_providers,
        coalesce(c.display_order, 0)::int as display_order
      from category.categories c
      left join category.category_groups cg
        on cg.id = c.group_id
      left join category_child_counts cc
        on cc.category_id = c.id
      left join category_provider_counts pc
        on pc.category_id = c.id
      where c.is_active = true
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

export async function getCategoryBrowserGroups(): Promise<CategoryBrowserData> {
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
      parentId: row.parent_id,
      childCount: Number(row.child_count || 0),
      count: Number(row.provider_count || 0),
      displayOrder: Number(row.display_order || 0),
    });
  }

  return {
    groups: Array.from(groups.values()).filter((group) => group.categories.length > 0),
    totalCategories: rows.length,
    totalProviders: Number(rows[0]?.total_providers || 0),
  };
}
