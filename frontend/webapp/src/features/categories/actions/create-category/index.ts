"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import sql from "@/config/database/db";
import { postData } from "@/config/http/http-service.server";
import {
  ADMIN_BASE_PATH,
  CATEGORY_MODULE_BASE_PATH,
} from "@/features/shared/types/constants";
import { createAuthenticatedSafeAction } from "@/lib/safe-action";
import { LocaleHeaderTypes } from "@/types/common";

import { revalidateCategoryCache } from "../../db/cache";
import { getCpCategoryGroupsTag } from "@/features/service-providers/db/cache";
import { CreateCategorySchema } from "./schema";
import { InputType, ReturnType } from "./types";

function getRouteLocaleSegment(locale: LocaleHeaderTypes) {
  const value = String(locale || "en").trim().toLowerCase();
  if (value.startsWith("fa")) return "fa";
  if (value.startsWith("ar")) return "ar";
  if (value.startsWith("tr")) return "tr";
  if (value.startsWith("de")) return "de";
  if (value.startsWith("fr")) return "fr";
  if (value.startsWith("es")) return "es";
  if (value.startsWith("ku")) return "ku";
  return value.split("-")[0] || "en";
}

function revalidateCategoryPresentationCache(locale: LocaleHeaderTypes) {
  const routeLocale = getRouteLocaleSegment(locale);

  revalidateTag(getCpCategoryGroupsTag());
  revalidatePath(`/${routeLocale}/n/app/mobile/home`);
  revalidatePath(`/${routeLocale}/n/app/mobile/categories`);
  revalidatePath("/[locale]/n/app/mobile/home", "page");
  revalidatePath("/[locale]/n/app/mobile/categories", "page");
}

async function persistCategoryGradient(categoryId: string | undefined, gradient: unknown) {
  if (!categoryId || typeof gradient !== "string") return;

  const normalizedGradient = gradient.trim();

  await sql`
    update category.categories
       set gradient = nullif(${normalizedGradient}, ''),
           last_modified_date = now()
     where id = ${categoryId}::uuid;
  `;
}

const handler = async (
  input: InputType,
  token: string,
  userId: string,
  locale: LocaleHeaderTypes
): Promise<ReturnType> => {
  const { data, error } = await postData<InputType, string>(
    `${CATEGORY_MODULE_BASE_PATH}/${ADMIN_BASE_PATH}/categories`,
    input,
    {
      token,
      locale,
    }
  );

  if (data) {
    try {
      await persistCategoryGradient(data, input.gradient);
    } catch (persistError) {
      console.error("Failed to persist category gradient after create", persistError);
      return {
        data: undefined,
        error: {
          type: "category-gradient-persist-failed",
          title: "Category color was not saved",
          status: 500,
          detail: "Category was created, but its overlay color could not be saved. Please edit the category and save the color again.",
          instance: "create-category",
        },
      };
    }

    revalidateCategoryCache({ id: data, userId });
    revalidateCategoryPresentationCache(locale);
    return {
      data: data,
      error: error,
    };
  }

  return {
    data: undefined,
    error: error,
  };
};

export const createCategoryAction = createAuthenticatedSafeAction(
  CreateCategorySchema,
  handler
);
