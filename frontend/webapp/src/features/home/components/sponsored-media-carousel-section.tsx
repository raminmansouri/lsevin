import { getSponsoredSlides } from '../api/server/get-sponsored-slides';
import { SponsoredMediaCarousel } from './sponsored-media-carousel';

export async function SponsoredMediaCarouselSection() {
  const slides = await getSponsoredSlides();

  if (!slides.length) return null;

  return <SponsoredMediaCarousel slides={slides} />;
}
