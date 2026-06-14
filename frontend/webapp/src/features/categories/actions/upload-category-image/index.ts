// src/features/category/actions/update-category-image.ts
"use server";

import { cookies, headers } from "next/headers";

import { putData } from "@/config/http/http-service.server";
import {
  ADMIN_BASE_PATH,
  CATEGORY_MODULE_BASE_PATH,
} from "@/features/shared/types/constants";
import { LocaleHeaderTypes } from "@/types/common";
import { revalidateCategoryCache } from "../../db/cache";
import { UpdateCategoryImageActionState } from "./types";
import { getSession } from "@/lib/auth/session";
import { getLocaleHeader } from "@/i18n/navigation";


// Adjust cookie names here if your auth cookie keys are different.
async function getAuthContext() {
  const cookieStore = await cookies();
  const headerStore = await headers();

  const token =
    cookieStore.get("accessToken")?.value ??
    cookieStore.get("token")?.value ??
    cookieStore.get("authToken")?.value ??
    "";

  const userId =
    cookieStore.get("userId")?.value ??
    cookieStore.get("sub")?.value ??
    "";

  const locale =
    ((headerStore.get("x-next-intl-locale") ??
      cookieStore.get("NEXT_LOCALE")?.value ??
      "en-US") as LocaleHeaderTypes) ?? "fa-IR";

  return { token, userId, locale };
}

type RequestOutputType = Guid | { id?: Guid };
type Guid = string;

export async function updateCategoryImageAction(
  _prevState: UpdateCategoryImageActionState,
  submittedFormData: FormData,
): Promise<UpdateCategoryImageActionState> {
  try {
    const categoryId = submittedFormData.get("categoryId")?.toString().trim();
    const file = submittedFormData.get("file");

    if (!categoryId) {
      return {
        ok: false,
        error: { detail: "Category id is required." },
        timestamp: Date.now(),
      };
    }

    if (!(file instanceof File) || file.size === 0) {
      return {
        ok: false,
        error: { detail: "Please select an image file." },
        timestamp: Date.now(),
      };
    }

    const body = new FormData();
    body.append("file", file);
    body.append("CategoryId", categoryId);

     const options = {
        redirectToLogin: true,
        adminRequired: false,
      }

     const session = await getSession({
          redirectToLogin: options.redirectToLogin,
          adminRequired: options.adminRequired,
        });
     
    const locale = await getLocaleHeader();
    const user = session?.user;
    const userId = session?.user?.id;
    const token = session?.user?.accessToken;


    	  console.log('---------------------------------------------')
  console.log('---------------------------------------------')
  console.log('---------------------------------------------')
  console.log('---------------------------------------------')
  console.log('---------------------------------------------')
  console.log('---------------------------------------------')
  console.log('---------------------------------------------')
  console.log('---------------------------------------------')
  console.log('---------------------------------------------')
  console.log(token,userId)
    // Change only this path if your backend route is different.
    const endpoint = `${CATEGORY_MODULE_BASE_PATH}/${ADMIN_BASE_PATH}/categories/UpdateImage/${categoryId}?categoryId=${categoryId}`;

   
    const { data, error } = await putData<FormData, RequestOutputType>(
      endpoint,
      body,
      { locale, token }
    );

    if (data) {
      if (userId) {
        revalidateCategoryCache({ id: categoryId, userId });
      }

      return {
        ok: true,
        message: "Category image updated successfully.",
        categoryId,
        timestamp: Date.now(),
      };
    }

    return {
      ok: false,
      error: error ?? { detail: "Failed to update category image." },
      categoryId,
      timestamp: Date.now(),
    };
  } catch (error) {
    return {
      ok: false,
      error: { detail: "Failed to update category image." },
      timestamp: Date.now(),
    };
  }
}