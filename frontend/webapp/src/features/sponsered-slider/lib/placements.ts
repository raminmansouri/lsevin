import {
  SPONSERED_SLIDER_PLACEMENTS,
  type SponseredSliderPlacement,
} from "../types";

/**
 * The slot a slide can be pinned to.
 *
 * A placement is only useful if some page actually renders it, so the registry
 * records where each one is mounted. `isMounted: false` means the key is still
 * accepted (rows already carry it) but nothing on the site renders it yet -- the
 * admin list and form say so rather than letting someone publish into a void.
 */
export type SponseredSliderPlacementMeta = {
  key: SponseredSliderPlacement;
  /** Key inside the `AdminGenerated` message namespace. */
  labelKey: string;
  /** Where the slot renders, shown as a hint in the admin panel. */
  route: string;
  isMounted: boolean;
};

export const DEFAULT_SPONSERED_SLIDER_PLACEMENT: SponseredSliderPlacement = "home_native_ad";

export const SPONSERED_SLIDER_PLACEMENT_META: readonly SponseredSliderPlacementMeta[] = [
  { key: "home_top", labelKey: "placementHomeTop", route: "/n/app/mobile/home", isMounted: true },
  { key: "home_native_ad", labelKey: "placementHomeNativeAd", route: "/n/app/mobile/home", isMounted: true },
  { key: "home_bottom", labelKey: "placementHomeBottom", route: "/n/app/mobile/home", isMounted: true },
  { key: "search_results", labelKey: "placementSearchResults", route: "/n/app/mobile/search-results", isMounted: true },
  { key: "explore", labelKey: "placementExplore", route: "/n/app/mobile/explore", isMounted: true },
  { key: "categories", labelKey: "placementCategories", route: "/n/app/mobile/categories", isMounted: true },
  { key: "offers", labelKey: "placementOffers", route: "/n/app/mobile/offers", isMounted: true },
  { key: "packages", labelKey: "placementPackages", route: "/n/app/mobile/packages", isMounted: true },
  { key: "provider_detail", labelKey: "placementProviderDetail", route: "/n/app/mobile/provider/[id]", isMounted: true },
  { key: "service_detail", labelKey: "placementServiceDetail", route: "/n/app/mobile/service/[id]", isMounted: true },
  { key: "shop_home", labelKey: "placementShopHome", route: "/n/app/mobile/shop", isMounted: true },
  { key: "booking_review", labelKey: "placementBookingReview", route: "/n/app/mobile/booking-v2", isMounted: false },
];

function humanize(key: string) {
  // `String.prototype.replaceAll` is outside this project's ES2020 lib target.
  return key.split("_").join(" ");
}

const META_BY_KEY = new Map(SPONSERED_SLIDER_PLACEMENT_META.map((item) => [item.key, item]));

export function getSponseredSliderPlacementMeta(key?: string | null) {
  return META_BY_KEY.get(normalizeSponseredSliderPlacement(key));
}

/** Rows written before the column existed read back as null; those are home slides. */
export function normalizeSponseredSliderPlacement(key?: string | null): SponseredSliderPlacement {
  const trimmed = String(key || "").trim();
  return (SPONSERED_SLIDER_PLACEMENTS as readonly string[]).includes(trimmed)
    ? (trimmed as SponseredSliderPlacement)
    : DEFAULT_SPONSERED_SLIDER_PLACEMENT;
}

/**
 * Readable name for a placement, translated when the message exists and falling
 * back to the humanized key so a placement added to the enum is never blank.
 */
export function sponseredSliderPlacementLabel(
  translate: (key: string) => string,
  key?: string | null
) {
  const normalized = normalizeSponseredSliderPlacement(key);
  const meta = META_BY_KEY.get(normalized);
  if (!meta) return humanize(normalized);

  try {
    const label = translate(meta.labelKey);
    // next-intl returns the key path itself when a message is missing.
    return label && !label.includes(meta.labelKey) ? label : humanize(normalized);
  } catch {
    return humanize(normalized);
  }
}
