import 'server-only';

import { resolvePublicEntity } from './public-slugs';

/**
 * The category and provider type of a listing request (explore, map, offers,
 * specialty and category landings), read from the readable query values
 * (?category=hotel&type=clinic) and from the old id parameters
 * (?categoryId=<uuid>, ?providerTypeId=<uuid>) that existing links and
 * bookmarks still carry. See src/lib/routes/filter-paths.ts for the URLs.
 */

export type RawSearchParams = Record<string, string | string[] | undefined>;

export type ResolvedListing = {
  /** The request with the category and type replaced by their ids, for the parse*Filters functions. */
  params: RawSearchParams;
  categoryId: string | null;
  providerTypeId: string | null;
  categorySlug: string | null;
  typeSlug: string | null;
  /**
   * The request names the category or type in a form other than its URL: an id,
   * an old parameter name, a previous slug, or a value that matches nothing.
   * The page answers with a permanent redirect to the canonical address.
   */
  stale: boolean;
};

const TAXONOMY_KEYS = ['category', 'type', 'categoryId', 'providerTypeId'] as const;

function one(value: string | string[] | undefined): string | null {
  const first = Array.isArray(value) ? value[0] : value;
  const trimmed = first?.trim();
  return trimmed && trimmed !== 'all' ? trimmed : null;
}

async function resolveOne(kind: 'category' | 'specialty', value: string | null) {
  if (!value) return null;
  return resolvePublicEntity(kind, value.toLowerCase());
}

export async function resolveListingParams(raw: RawSearchParams): Promise<ResolvedListing> {
  const categoryValue = one(raw.category) ?? one(raw.categoryId);
  const typeValue = one(raw.type) ?? one(raw.providerTypeId);
  const [category, type] = await Promise.all([
    resolveOne('category', categoryValue),
    resolveOne('specialty', typeValue),
  ]);

  const params: RawSearchParams = { ...raw };
  for (const key of TAXONOMY_KEYS) delete params[key];
  if (category) params.categoryId = category.id;
  if (type) params.providerTypeId = type.id;

  const spelledAsUrl = (value: string | null, ref: { id: string; slug: string | null } | null) =>
    !value || (ref !== null && value === (ref.slug ?? ref.id));

  const stale =
    raw.categoryId !== undefined ||
    raw.providerTypeId !== undefined ||
    !spelledAsUrl(categoryValue, category) ||
    !spelledAsUrl(typeValue, type);

  return {
    params,
    categoryId: category?.id ?? null,
    providerTypeId: type?.id ?? null,
    categorySlug: category ? (category.slug ?? category.id) : null,
    typeSlug: type ? (type.slug ?? type.id) : null,
    stale,
  };
}

/** Every filter of the request except the category and type, in their original order. */
export function otherFilters(raw: RawSearchParams, drop: readonly string[] = []): URLSearchParams {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(raw)) {
    if ((TAXONOMY_KEYS as readonly string[]).includes(key) || drop.includes(key) || value === undefined) continue;
    for (const item of Array.isArray(value) ? value : [value]) params.append(key, item);
  }
  return params;
}

/** Slug lookups for filter-paths.ts built from a resolved request. */
export function resolvedSlugs(resolved: ResolvedListing) {
  return {
    category: (id: string) => (id === resolved.categoryId ? resolved.categorySlug : null),
    type: (id: string) => (id === resolved.providerTypeId ? resolved.typeSlug : null),
  };
}
