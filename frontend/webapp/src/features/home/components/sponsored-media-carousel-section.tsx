import { getSponsoredSlides } from '../api/server/get-sponsored-slides';
import { SponsoredMediaCarousel } from './sponsored-media-carousel';

export async function SponsoredMediaCarouselSection({ locale }: { locale?: string }) {
  const slides = await getSponsoredSlides(locale);

  if (!slides.length) return null;

  return <SponsoredMediaCarousel slides={slides} />;
}
