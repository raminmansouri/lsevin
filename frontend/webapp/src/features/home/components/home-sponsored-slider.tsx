import { SponseredSliderSection } from "@/features/sponsered-slider";

export async function HomeSponsoredSlider({ locale }: { locale: string }) {
  return <SponseredSliderSection locale={locale} placementKey="home_native_ad" />;
}
