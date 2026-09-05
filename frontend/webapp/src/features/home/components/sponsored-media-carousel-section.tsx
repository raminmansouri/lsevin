import {
  DEFAULT_SPONSORED_PLACEMENT,
  getSponsoredSlides,
} from '../api/server/get-sponsored-slides';
import { SponsoredMediaCarousel } from './sponsored-media-carousel';

export async function SponsoredMediaCarouselSection({
  locale,
  placement = DEFAULT_SPONSORED_PLACEMENT,
  limit = 8,
}: {
  locale?: string;
  /** Which slot on the site this instance renders. See the placement registry. */
  placement?: string;
  limit?: number;
}) {
  const slides = await getSponsoredSlides(locale, limit, placement);

  if (!slides.length) return null;

  return <SponsoredMediaCarousel slides={slides} />;
}
