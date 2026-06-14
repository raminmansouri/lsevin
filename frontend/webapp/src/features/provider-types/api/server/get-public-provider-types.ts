
import "server-only";

import sql from "@/config/database/db";
import { ApiReturnType } from "@/types/network";

import { PublicProviderType } from "../../types/provider-type";

export const getPublicProviderTypes = async (locale = "fa-IR"): Promise<ApiReturnType<PublicProviderType[]>> => {
  try {
    const rows = await sql<PublicProviderType[]>`
      select
        pt.id,
        common.get_translation_t(pt.name_translations, ${locale}, 'en-US') as name,
        common.get_translation_t(pt.description_translations, ${locale}, 'en-US') as description,
        pt.icon_url as "iconUrl",
        pt.image_url as "imageUrl",
        coalesce(ml.file_url, pt.image_url) as "imagePreviewUrl"
      from category.provider_types pt
      left join media.media_library ml on ml.id::text = pt.image_url
      where pt.is_active = true
      order by common.get_translation_t(pt.name_translations, ${locale}, 'en-US') asc
    `;
    return { data: rows, error: undefined } as ApiReturnType<PublicProviderType[]>;
  } catch (error) {
    return {
      data: undefined,
      error: {
        title: "Database operation failed",
        detail: error instanceof Error ? error.message : "Unexpected database error.",
        status: 500,
      },
    } as ApiReturnType<PublicProviderType[]>;
  }
};
