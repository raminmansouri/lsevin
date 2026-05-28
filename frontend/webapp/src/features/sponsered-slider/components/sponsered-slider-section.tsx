import { getActiveSponseredSliderItems } from "../server/repository";
import { SponseredSliderCarousel } from "./sponsered-slider-carousel";

export async function SponseredSliderSection({
  locale,
  placementKey = "home_native_ad",
  limit = 10,
}: {
  locale?: string;
  placementKey?: string;
  limit?: number;
}) {
  const items = await getActiveSponseredSliderItems({ locale, placementKey, limit });
  if (!items.length) return null;
  return <SponseredSliderCarousel items={items} />;
}
