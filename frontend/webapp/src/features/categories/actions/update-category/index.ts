"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import sql from "@/config/database/db";
import { putData } from "@/config/http/http-service.server";
import {
  ADMIN_BASE_PATH,
  CATEGORY_MODULE_BASE_PATH,
} from "@/features/shared/types/constants";
import { createAuthenticatedSafeAction } from "@/lib/safe-action";
import { LocaleHeaderTypes } from "@/types/common";

import { revalidateCategoryCache } from "../../db/cache";
import { readCategoryPriority, restoreCategoryPriority } from "../../db/priority";
import { getCpCategoryGroupsTag } from "@/features/service-providers/db/cache";
import { UpdateCategorySchema } from "./schema";
import { InputType, RequestOutputType, ReturnType } from "./types";

function getRouteLocaleSegment(locale: LocaleHeaderTypes) {
  const value = String(locale || "fa").trim().toLowerCase();
  if (value.startsWith("fa")) return "fa";
  if (value.startsWith("ar")) return "ar";
  if (value.startsWith("tr")) return "tr";
  if (value.startsWith("de")) return "de";
  if (value.startsWith("fr")) return "fr";
  if (value.startsWith("es")) return "es";
  if (value.startsWith("ku")) return "ku";
  return value.split("-")[0] || "fa";
}

function revalidateCategoryPresentationCache(locale: LocaleHeaderTypes) {
  const routeLocale = getRouteLocaleSegment(locale);

  revalidateTag(getCpCategoryGroupsTag());
  // The landing shelf is a "use cache" entry; names and images shown there change with this edit.
  revalidateTag("home-rails");
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
  // The .NET update writes DisplayOrder from the request, and this form does not send it, so every
  // save reset the category's landing priority to 0. Keep the value set from the categories list.
  const priorityBefore = await readCategoryPriority(input.categoryId).catch((readError) => {
    console.error("Failed to read category priority before update", { categoryId: input.categoryId, readError });
    return null;
  });

  const { data, error } = await putData<InputType, RequestOutputType>(
    `${CATEGORY_MODULE_BASE_PATH}/${ADMIN_BASE_PATH}/categories/${input.categoryId}`,
    input,
    { locale, token }
  );

  if (data) {
    try {
      await restoreCategoryPriority(input.categoryId, priorityBefore);
    } catch (persistError) {
      // Not fatal: the category itself was saved; only its landing position may have moved.
      console.error("Failed to restore category priority after update", { categoryId: input.categoryId, persistError });
    }
    try {
      await persistCategoryGradient(input.categoryId, input.gradient);
    } catch (persistError) {
      console.error("Failed to persist category gradient after update", persistError);
      return {
        data: undefined,
        error: {
          type: "category-gradient-persist-failed",
          title: "Category color was not saved",
          status: 500,
          detail: "The category was updated by the API, but its overlay color could not be saved. Please try saving the category color again.",
          instance: "update-category",
        },
      };
    }

    revalidateCategoryCache({ id: input.categoryId, userId });
    revalidateCategoryPresentationCache(locale);
    return { data: input.categoryId, error: undefined };
  }
  return { data: undefined, error };
};

export const updateCategoryAction = createAuthenticatedSafeAction(
  UpdateCategorySchema,
  handler
);
