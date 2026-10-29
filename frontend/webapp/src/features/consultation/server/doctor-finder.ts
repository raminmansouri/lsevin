"use server";

import { unstable_cache } from "next/cache";
import { getLocale } from "next-intl/server";
import { z } from "zod/v4";

import sql from "@/config/database/db";
import { categorySubtreeIds } from "@/features/categories/db/category-tree";
import { getCpCategoryGroupsTag } from "@/features/service-providers/db/cache";

import type {
  DoctorFinderCategory,
  DoctorFinderDoctor,
  DoctorFinderError,
  DoctorFinderGroup,
} from "../doctor-finder-types";
import type { ConsultationActionResult } from "../types";

const FALLBACK_LOCALE = "en-US";
const DOCTOR_LIMIT = 40;

type CategoryRow = {
  id: string;
  name: string | null;
  icon: string | null;
  icon_url: string | null;
  parent_id: string | null;
  doctor_count: number;
};

type DoctorRow = {
  id: string;
  name: string | null;
  title: string | null;
  specialty: string | null;
  image_url: string | null;
  rating: string | number | null;
  review_count: number | null;
  experience_years: number | null;
  provider_name: string | null;
};

/**
 * A doctor belongs to a category through either of two links: a service they
 * perform (staff_services → service_definitions.category_id), or the provider
 * they work at (provider_staffs → service_providers.category_id). Only doctors
 * attached to at least one active, public provider are listed — the same rule
 * the specialist pages use, so every card here opens a real profile.
 */
const getCategoryRows = unstable_cache(
  async (locale: string): Promise<CategoryRow[]> => {
    return sql<CategoryRow[]>`
      with recursive category_ancestry as (
        select c.id as node_id, c.id as ancestor_id, c.parent_id
        from category.categories c
        where c.is_active = true
        union all
        select a.node_id, parent.id as ancestor_id, parent.parent_id
        from category_ancestry a
        join category.categories parent
          on parent.id = a.parent_id
         and parent.is_active = true
      ),
      listed_doctors as (
        select s.id
        from category.staff s
        where s.is_active = true
          and exists (
            select 1
            from category.provider_staffs ps
            join category.service_providers sp on sp.id = ps.service_provider_id
            where ps.staff_id = s.id
              and ps.is_active = true
              and sp.is_active = true
              and category.provider_type_is_public(sp.provider_type_id)
          )
      ),
      doctor_membership as (
        select ss.staff_id, sd.category_id as node_id
        from category.staff_services ss
        join category.service_definitions sd on sd.id = ss.service_definition_id
        where ss.is_active = true and sd.is_active = true
        union
        select ps.staff_id, sp.category_id as node_id
        from category.provider_staffs ps
        join category.service_providers sp on sp.id = ps.service_provider_id
        where ps.is_active = true
          and sp.is_active = true
          and sp.category_id is not null
      ),
      category_doctor_counts as (
        select a.ancestor_id as category_id, count(distinct m.staff_id)::int as doctor_count
        from doctor_membership m
        join listed_doctors d on d.id = m.staff_id
        join category_ancestry a on a.node_id = m.node_id
        group by a.ancestor_id
      )
      select
        c.id::text as id,
        nullif(common.get_translation_t(c.name_translations, ${locale}, ${FALLBACK_LOCALE}), '') as name,
        nullif(btrim(c.icon), '') as icon,
        nullif(btrim(c.icon_url), '') as icon_url,
        c.parent_id::text as parent_id,
        cdc.doctor_count
      from category.categories c
      join category_doctor_counts cdc on cdc.category_id = c.id
      where c.is_active = true
      order by coalesce(c.display_order, 0) asc, name asc
    `;
  },
  ["consultation-doctor-finder-categories"],
  { revalidate: 300, tags: [getCpCategoryGroupsTag()] }
);

const getDoctorRows = unstable_cache(
  async (locale: string, categoryId: string): Promise<DoctorRow[]> => {
    return sql<DoctorRow[]>`
      select
        s.id::text as id,
        nullif(common.get_translation_t(s.name_translations, ${locale}, ${FALLBACK_LOCALE}), '') as name,
        nullif(common.get_translation_t(s.title_translations, ${locale}, ${FALLBACK_LOCALE}), '') as title,
        coalesce(
          nullif(common.get_translation_t(s.specialty_translations, ${locale}, ${FALLBACK_LOCALE}), ''),
          nullif(s.specialty, '')
        ) as specialty,
        coalesce(profile_media.file_url, nullif(s.profile_image_url, '')) as image_url,
        s.rating,
        s.review_count,
        s.experience_years,
        (
          select nullif(common.get_translation_t(sp.name_translations, ${locale}, ${FALLBACK_LOCALE}), '')
          from category.provider_staffs ps
          join category.service_providers sp on sp.id = ps.service_provider_id
          where ps.staff_id = s.id
            and ps.is_active = true
            and sp.is_active = true
            and category.provider_type_is_public(sp.provider_type_id)
          order by sp.rating desc nulls last
          limit 1
        ) as provider_name
      from category.staff s
      left join media.media_library profile_media
        on profile_media.id::text = nullif(s.profile_image_url, '')
      where s.is_active = true
        and exists (
          select 1
          from category.provider_staffs ps
          join category.service_providers sp on sp.id = ps.service_provider_id
          where ps.staff_id = s.id
            and ps.is_active = true
            and sp.is_active = true
            and category.provider_type_is_public(sp.provider_type_id)
        )
        and (
          exists (
            select 1
            from category.staff_services ss
            join category.service_definitions sd on sd.id = ss.service_definition_id
            where ss.staff_id = s.id
              and ss.is_active = true
              and sd.is_active = true
              and sd.category_id in (${categorySubtreeIds(categoryId)})
          )
          or exists (
            select 1
            from category.provider_staffs ps
            join category.service_providers sp on sp.id = ps.service_provider_id
            where ps.staff_id = s.id
              and ps.is_active = true
              and sp.is_active = true
              and sp.category_id in (${categorySubtreeIds(categoryId)})
          )
        )
      order by s.rating desc nulls last, s.review_count desc nulls last, s.create_date desc
      limit ${DOCTOR_LIMIT}
    `;
  },
  ["consultation-doctor-finder-doctors"],
  { revalidate: 300, tags: [getCpCategoryGroupsTag()] }
);

function toCategory(row: CategoryRow): DoctorFinderCategory {
  return {
    id: row.id,
    name: row.name || "—",
    icon: row.icon,
    iconUrl: row.icon_url,
    parentId: row.parent_id,
    doctorCount: Number(row.doctor_count || 0),
  };
}

/**
 * Groups the counted categories under their top-level ancestor. A category is
 * only returned when it has doctors, and doctors roll up to every ancestor, so
 * a counted node's whole parent chain is always present in `rows`.
 */
function groupByRoot(rows: CategoryRow[]): DoctorFinderGroup[] {
  const byId = new Map(rows.map((row) => [row.id, toCategory(row)]));
  const rootOf = (category: DoctorFinderCategory) => {
    let current = category;
    const seen = new Set<string>();
    while (current.parentId && byId.has(current.parentId) && !seen.has(current.id)) {
      seen.add(current.id);
      current = byId.get(current.parentId)!;
    }
    return current;
  };

  const groups = new Map<string, DoctorFinderGroup>();
  for (const category of byId.values()) {
    const root = rootOf(category);
    if (!groups.has(root.id)) groups.set(root.id, { root, categories: [] });
    if (category.id !== root.id) groups.get(root.id)!.categories.push(category);
  }
  const order = new Map(rows.map((row, index) => [row.id, index]));
  return Array.from(groups.values()).sort(
    (a, b) => (order.get(a.root.id) ?? 0) - (order.get(b.root.id) ?? 0)
  );
}

/** The database error text, in development only, so the sheet can show why it failed. */
function devDetail(error: unknown): Record<string, string[]> | undefined {
  if (process.env.NODE_ENV === "production") return undefined;
  return { detail: [error instanceof Error ? error.message : String(error)] };
}

export async function getDoctorFinderCategoriesAction(): Promise<
  ConsultationActionResult<DoctorFinderGroup[]>
> {
  try {
    const locale = (await getLocale()) || FALLBACK_LOCALE;
    const rows = await getCategoryRows(locale);
    return { ok: true, data: groupByRoot(rows) };
  } catch (error) {
    console.error("[consultation] doctor finder categories failed", error);
    return {
      ok: false,
      error: "loadFailed" satisfies DoctorFinderError,
      fieldErrors: devDetail(error),
    };
  }
}

const CategoryIdSchema = z.uuid();

export async function getDoctorFinderDoctorsAction(
  categoryId: string
): Promise<ConsultationActionResult<DoctorFinderDoctor[]>> {
  const parsed = CategoryIdSchema.safeParse(categoryId);
  if (!parsed.success) {
    return { ok: false, error: "invalidCategory" satisfies DoctorFinderError };
  }

  try {
    const locale = (await getLocale()) || FALLBACK_LOCALE;
    const rows = await getDoctorRows(locale, parsed.data);
    return {
      ok: true,
      data: rows.map((row) => ({
        id: row.id,
        name: row.name || "—",
        title: row.title,
        specialty: row.specialty,
        imageUrl: row.image_url,
        rating: Number(row.rating || 0),
        reviewCount: Number(row.review_count || 0),
        experienceYears: row.experience_years,
        providerName: row.provider_name,
      })),
    };
  } catch (error) {
    console.error("[consultation] doctor finder doctors failed", error);
    return {
      ok: false,
      error: "loadFailed" satisfies DoctorFinderError,
      fieldErrors: devDetail(error),
    };
  }
}
