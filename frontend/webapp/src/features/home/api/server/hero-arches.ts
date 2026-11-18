import "server-only";

import sql from "@/config/database/db";

export type HeroArch = {
  slot: number;
  imageUrl: string | null;
  label: string;
  linkUrl: string | null;
};

export async function getHeroArches(locale: string): Promise<HeroArch[]> {
  const rows = await sql<HeroArch[]>`
    select
      slot::int as slot,
      nullif(btrim(coalesce(image_url, '')), '') as "imageUrl",
      coalesce(common.get_translation_t(label_translations, ${locale}, 'en'), '') as label,
      nullif(btrim(coalesce(link_url, '')), '') as "linkUrl"
    from marketing.home_hero_arches
    order by slot
  `;
  return rows;
}