"use server";

import { revalidatePath } from "next/cache";

import { getCurrentUserIdOrThrow } from "./auth";
import {
  createFavoritesSqlClient,
  getFavoritesPageData,
  removeFavorite,
} from "./queries";
import type { FavoritesPageData, RemoveFavoriteResult } from "./types";

export async function getFavoritesPageDataAction(
  preferredLanguage = "en"
): Promise<FavoritesPageData> {
  const userId = await getCurrentUserIdOrThrow();
  const sql = createFavoritesSqlClient();

  return await getFavoritesPageData(sql, userId, preferredLanguage);
}

export async function removeFavoriteAction(
  favoriteId: string
): Promise<RemoveFavoriteResult> {
  if (!favoriteId) {
    return {
      ok: false,
      favoriteId,
      message: "Favorite id is required.",
    };
  }

  const userId = await getCurrentUserIdOrThrow();
  const sql = createFavoritesSqlClient();

  try {
    const deleted = await removeFavorite(sql, userId, favoriteId);

    if (!deleted) {
      return {
        ok: false,
        favoriteId,
        message: "Favorite was not found or does not belong to this user.",
      };
    }

    revalidatePath("/app/favorites");

    return {
      ok: true,
      favoriteId,
      message: "Removed from favorites.",
    };
  } catch (error) {
    return {
      ok: false,
      favoriteId,
      message:
        error instanceof Error ? error.message : "Unable to remove favorite.",
    };
  }
}
