import { getTranslations } from "next-intl/server";

import { getSponsoredSlides } from "@/features/home/api/server/get-sponsored-slides";

import { DesktopSponsoredShowcase } from "./DesktopSponsoredShowcase";

/** Loads one sponsored placement with the same query the mobile slider uses. */
export async function DesktopSponsoredSection({
  locale,
  placement,
  overlapHero = false,
}: {
  locale: string;
  placement: string;
  overlapHero?: boolean;
}) {
  const slides = await getSponsoredSlides(locale, 8, placement).catch(() => []);
  if (!slides.length) return null;

  const t = await getTranslations({ locale, namespace: "Home.sponsoredCarousel" });

  return (
    <DesktopSponsoredShowcase
      slides={slides}
      overlapHero={overlapHero}
      labels={{
        sponsored: t("sponsored"),
        button: t("fallbackButton"),
        previous: t("previousSlideAria"),
        next: t("nextSlideAria"),
      }}
    />
  );
}