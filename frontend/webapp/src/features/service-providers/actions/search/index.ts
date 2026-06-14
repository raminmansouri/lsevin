"use server";

import { revalidateTag } from "next/cache";
import { z } from "zod/v4";

import { getSearchHistoryTag, getSearchResultsTag } from "../../db/cache";
import {
  clearSearchHistory,
  getSearchHistory,
  getSearchResults,
  normalizeSearchTerm,
  recordSearchTerm,
} from "../../server/search.repository";

const searchTermSchema = z.object({
  term: z.string().trim().min(1).max(120),
});

const clearHistorySchema = z
  .object({
    term: z.string().trim().max(120).optional().nullable(),
  })
  .optional();

const searchResultsSchema = z
  .object({
    term: z.string().trim().max(120).optional().nullable(),
    locale: z.string().trim().max(20).optional().nullable(),
    limit: z.coerce.number().int().min(1).max(60).optional(),
    categoryId: z.guid().optional().nullable(),
    providerTypeId: z.guid().optional().nullable(),
    country: z.string().trim().max(50).optional().nullable(),
    city: z.string().trim().max(50).optional().nullable(),
  })
  .optional();

export async function getSearchHistoryAction(locale?: string) {
  return getSearchHistory(locale);
}

export async function recordSearchTermAction(input: unknown) {
  const parsed = searchTermSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      term: "",
      error: parsed.error.issues[0]?.message || "Please enter a search term.",
    };
  }

  const result = await recordSearchTerm(parsed.data.term);
  revalidateTag(getSearchHistoryTag());
  revalidateTag(getSearchResultsTag());

  return {
    ok: result.ok,
    term: normalizeSearchTerm(result.term),
  };
}

export async function clearSearchHistoryAction(input?: unknown) {
  const parsed = clearHistorySchema.safeParse(input);

  if (!parsed.success) {
    return { ok: false, error: "Could not update search history." };
  }

  await clearSearchHistory(parsed.data?.term);
  revalidateTag(getSearchHistoryTag());

  return { ok: true };
}

export async function getSearchResultsAction(input?: unknown) {
  const parsed = searchResultsSchema.safeParse(input);

  if (!parsed.success) {
    return {
      results: [],
      categories: [],
      filters: [],
    };
  }

  return getSearchResults(parsed.data);
}
