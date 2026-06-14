import "server-only";

import sql from "@/config/database/db";
import { readData } from "@/config/http/http-service.server";
import {
  ADMIN_BASE_PATH,
  CATEGORY_MODULE_BASE_PATH,
} from "@/features/shared/types/constants";
import { LocalizedContentResponse } from "@/features/shared/types/localization";
import { BaseRequest, LocaleHeaderTypes } from "@/types/common";
import { ApiReturnType } from "@/types/network";

import { CategoryDetails } from "../../types/category";

type CategoryDetailsRow = {
  category_id: string;
  name_translations: Record<string, string> | null;
  description_translations: Record<string, string> | null;
  parent_id: string | null;
  parent_name: string | null;
  image_url: string | null;
  gradient: string | null;
  display_order: number | null;
  is_active: boolean | null;
  icon_url: string | null;
  create_date: Date | string | null;
  last_modified_date: Date | string | null;
};

function toIsoString(value: Date | string | null | undefined) {
  if (!value) return new Date(0).toISOString();
  if (value instanceof Date) return value.toISOString();
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? new Date(0).toISOString() : date.toISOString();
}

function toLocalizedResponse(
  translations: Record<string, string> | null | undefined
): LocalizedContentResponse {
  const safeTranslations = translations && typeof translations === "object" ? translations : {};

  return {
    translations: safeTranslations as LocalizedContentResponse["translations"],
    availableLocales: Object.entries(safeTranslations)
      .filter(([, value]) => typeof value === "string" && value.trim().length > 0)
      .map(([locale]) => locale as LocaleHeaderTypes),
  };
}

function getFallbackError(message: string) {
  return {
    type: "category-not-found",
    title: "Category not found",
    status: 404,
    detail: message,
    instance: "category-admin-update",
  };
}

async function getCategoryByIdFromDatabase(
  id: string,
  request: BaseRequest
): Promise<ApiReturnType<CategoryDetails>> {
  const rows = await sql<CategoryDetailsRow[]>`
    select
      c.id::text as category_id,
      c.name_translations as name_translations,
      c.description_translations as description_translations,
      c.parent_id::text as parent_id,
      nullif(common.get_translation_t(p.name_translations, ${request.locale || "fa-IR"}, 'en-US'), '') as parent_name,
      nullif(btrim(c.image_url), '') as image_url,
      nullif(btrim(c.gradient), '') as gradient,
      coalesce(c.display_order, 0)::int as display_order,
      coalesce(c.is_active, true) as is_active,
      nullif(btrim(c.icon_url), '') as icon_url,
      c.create_date,
      c.last_modified_date
    from category.categories c
    left join category.categories p on p.id = c.parent_id
    where c.id = ${id}::uuid
    limit 1;
  `;

  const row = rows[0];

  if (!row) {
    return {
      data: undefined,
      error: getFallbackError("Category was not found."),
    } as ApiReturnType<CategoryDetails>;
  }

  return {
    data: {
      categoryId: row.category_id,
      name: toLocalizedResponse(row.name_translations),
      description: toLocalizedResponse(row.description_translations),
      parentId: row.parent_id || undefined,
      parentName: row.parent_name || undefined,
      imageUrl: row.image_url || undefined,
      gradient: row.gradient || undefined,
      displayOrder: Number(row.display_order || 0),
      isActive: Boolean(row.is_active),
      iconUrl: row.icon_url || undefined,
      createDate: toIsoString(row.create_date),
      lastModifiedDate: toIsoString(row.last_modified_date),
    },
    error: undefined,
  } as ApiReturnType<CategoryDetails>;
}

export const getCategoryById = async (
  id: string,
  request: BaseRequest
): Promise<ApiReturnType<CategoryDetails>> => {
  // Do not use `use cache: remote` here. This is an authenticated admin edit page
  // and the last reported failure happened inside the Cache environment before
  // the form rendered. Fetch the latest record directly, then fall back to DB
  // access if the category API is temporarily unreachable.
  const response = await readData<CategoryDetails>(
    `${CATEGORY_MODULE_BASE_PATH}/${ADMIN_BASE_PATH}/categories/${id}`,
    {
      ...request,
    }
  );

  if (response?.data) return response;

  try {
    return await getCategoryByIdFromDatabase(id, request);
  } catch {
    return response;
  }
};
