import "server-only";
import { sql } from "@core/db/client";
import { translationSql } from "@core/db/translations";
import { normalizeOptionSearchLimit, normalizeOptionSearchQuery } from "@core/lib/optionSearch";
import type { GalleryItem } from "./types";

export async function listGallery(providerId: string) {
  return sql<GalleryItem[]>`
    select id::text, title_translations as "titleTranslations", url, media_type as "mediaType", display_order as "displayOrder"
    from category.provider_gallery_items
    where service_provider_id = ${providerId}::uuid
    order by display_order asc, create_date desc
  `;
}

export async function addGalleryItem(input: { providerId: string; titleTranslations: Record<string, string>; descriptionTranslations: Record<string, string>; url: string; mediaType: string; displayOrder: number }) {
  await sql`
    insert into category.provider_gallery_items (id, service_provider_id, title_translations, description_translations, url, media_type, display_order, create_date, last_modified_date)
    values (public.uuid_generate_v4(), ${input.providerId}::uuid, ${sql.json(input.titleTranslations)}, ${sql.json(input.descriptionTranslations)}, ${input.url}, ${input.mediaType}, ${input.displayOrder}, now(), now())
  `;
}

export async function deleteGalleryItem(providerId: string, galleryItemId: string) {
  await sql`delete from category.provider_gallery_items where service_provider_id = ${providerId}::uuid and id = ${galleryItemId}::uuid`;
}


export async function searchShareableStaff(input: { providerId: string; query?: string; selected?: string; locale?: string; limit?: number }) {
  const query=normalizeOptionSearchQuery(input.query); const selected=input.selected?.trim()??""; const locale=input.locale||"fa-IR"; const limit=normalizeOptionSearchLimit(input.limit);
  return sql<{value:string;label:string;description:string|null}[]>`
    select st.id::text as value,
      coalesce(${translationSql(sql`st.name_translations`,locale)},st.id::text) as label,
      nullif(trim(concat_ws(' · ',${translationSql(sql`st.title_translations`,locale)},st.specialty)),'') as description
    from category.provider_staffs ps join category.staff st on st.id=ps.staff_id and st.is_active=true
    where ps.service_provider_id=${input.providerId}::uuid and ps.is_active=true
      and (${query}='' or st.id::text ilike '%'||${query}||'%' or coalesce(st.specialty,'') ilike '%'||${query}||'%'
        or exists(select 1 from jsonb_each_text(coalesce(st.name_translations,'{}'::jsonb)) j where j.value ilike '%'||${query}||'%'))
    order by case when st.id::text=${selected} then 0 else 1 end,label limit ${limit}`;
}
