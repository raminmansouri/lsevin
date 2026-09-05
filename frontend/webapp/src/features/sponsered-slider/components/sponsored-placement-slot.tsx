import { SponsoredMediaCarouselSection } from "@/features/home/components/sponsored-media-carousel-section";

import type { SponseredSliderPlacement } from "../types";

/**
 * One sponsored ad slot, rendered wherever a page mounts it.
 *
 * Renders nothing at all until an admin assigns a slide to this placement, so a
 * slot can be mounted on a page ahead of anyone selling it. The carousel itself
 * is the one the home page already ships -- same media handling, same
 * bandwidth-aware video behaviour -- driven by a different placement key.
 */
export async function SponsoredPlacementSlot({
  locale,
  placement,
  limit = 8,
}: {
  locale?: string;
  placement: SponseredSliderPlacement;
  limit?: number;
}) {
  return <SponsoredMediaCarouselSection locale={locale} placement={placement} limit={limit} />;
}
