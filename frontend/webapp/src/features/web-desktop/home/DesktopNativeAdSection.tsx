import { getTranslations } from "next-intl/server";

import { getSponsoredSlides } from "@/features/home/api/server/get-sponsored-slides";

import { DesktopNativeAdShowcase } from "./DesktopNativeAdShowcase";

/** The in-page native ad, loaded with the same query as the mobile slider. */
export async function DesktopNativeAdSection({ locale, placement }: { locale: string; placement: string }) {
  const slides = await getSponsoredSlides(locale, 8, placement).catch(() => []);
  if (!slides.length) return null;

  const t = await getTranslations({ locale, namespace: "Home.sponsoredCarousel" });

  return (
    <DesktopNativeAdShowcase
      slides={slides}
      labels={{
        sponsored: t("sponsored"),
        button: t("fallbackButton"),
        previous: t("previousSlideAria"),
        next: t("nextSlideAria"),
      }}
    />
  );
}