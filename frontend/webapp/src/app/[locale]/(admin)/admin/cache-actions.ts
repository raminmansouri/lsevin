"use server";

import { revalidatePath, revalidateTag } from "next/cache";

import { getSession } from "@/lib/auth/session";
import { UserRole } from "@/types/common";

/**
 * Server actions are public POST endpoints — the middleware only gates the admin
 * area by URL, so this is the authorization boundary for the cache purge. Mirrors
 * the wallet-approval guard: SuperAdmin or Admin only. Do NOT weaken it.
 */
async function assertPrivilegedAdmin() {
  const session = await getSession().catch(() => null);
  const roles = session?.user?.roles;
  const isPrivileged =
    roles?.includes(UserRole.SuperAdmin) || roles?.includes(UserRole.Admin);
  if (!session?.user?.id || !isPrivileged) {
    throw new Error("Not authorized: admin role required.");
  }
}

// Tag string formats — must stay identical to @/lib/data-cache (getGlobalTag / getIdTag).
const g = (ns: string) => `global:${ns}`;
const idt = (ns: string, id: string) => `id:${ns}-${id}`;

/**
 * The app caches with the Next 15 `"use cache"` model — entries are invalidated
 * ONLY by revalidateTag with the exact tag they were written under (revalidatePath
 * does NOT clear `use cache` data). The public pages are cached under `id:*`
 * COLLECTION tags (e.g. id:home-page-home, id:service-providers-featured-services),
 * NOT under `global:*` — so the purge must hit those exact collection tags.
 */

// `global:<ns>` — used by admin list queries + mutation revalidation.
const GLOBAL_NAMESPACES = [
  "users",
  "user-documents",
  "consulting",
  "home-page",
  "service-providers",
  "service-provider-requests",
  "service-provider-comments",
  "categories",
  "bookings",
  "provider-types",
  "service-definitions",
  "staff",
  "sponsered-slider",
  "marketing-loyalty",
];

// `id:home-page-*` — the customer home page + its widgets.
const HOME_PAGE_IDS = ["home", "picked-locations"];

// `id:service-providers-*` — home widgets, listings, search, category groups.
const SERVICE_PROVIDER_IDS = [
  "featured-services",
  "trending-services",
  "trusted-providers",
  "explore",
  "get-offers",
  "cp-category-groups",
  "search-results",
  "search-history",
  "bookings",
  "get-booking-by-id",
];

// Plain string tags used directly via cacheTag() (not `global:`/`id:` scoped).
const RAW_TAGS = [
  "all-countries",
  "get-popular-searches",
  "service-definition-options",
  "service-definitions-all-locales",
  "booking-getAvailableDates",
  "booking-getBookingSteps",
  "booking-getPendingBooking",
  "booking-getAddons",
  "booking-GetBookingAvailableTimes",
  "admin:picked-locations",
];

function buildPurgeTags(): string[] {
  return [
    ...GLOBAL_NAMESPACES.map(g),
    ...HOME_PAGE_IDS.map((id) => idt("home-page", id)),
    ...SERVICE_PROVIDER_IDS.map((id) => idt("service-providers", id)),
    idt("provider-types", "getNotificationCountTag"),
    ...RAW_TAGS,
  ];
}

export type PurgeCacheResult = {
  ok: boolean;
  revalidatedAt: string;
  tagCount: number;
  error?: string;
};

/**
 * Purge all shared/collection caches. Revalidates every enumerable collection tag
 * (home, listings, search, categories, countries, …) and then revalidatePath the
 * whole app for the route + fetch caches.
 *
 * NOTE: per-entity detail caches (a specific service/provider/city by id, and
 * per-user personalized data) are keyed by unbounded id/user tags and cannot be
 * enumerated here — those already revalidate when that entity is edited.
 */
export async function purgeAllCacheAction(): Promise<PurgeCacheResult> {
  await assertPrivilegedAdmin();

  try {
    const tags = buildPurgeTags();

    for (const tag of tags) {
      revalidateTag(tag);
    }

    // Clears the Full Route Cache + fetch-based Data Cache for every route.
    revalidatePath("/", "layout");

    return {
      ok: true,
      revalidatedAt: new Date().toISOString(),
      tagCount: tags.length,
    };
  } catch (error) {
    return {
      ok: false,
      revalidatedAt: new Date().toISOString(),
      tagCount: 0,
      error: (error as Error).message,
    };
  }
}
