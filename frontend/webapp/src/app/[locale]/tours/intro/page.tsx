import { getTranslations, setRequestLocale } from "next-intl/server";

import { PageFaq } from "@/features/site-content/components/faq-section";
import { IntroScreen } from "@/features/tours/ui/customer/intro/intro-screen";
import { tourAlternates, tourCatalogLanguages } from "@/features/tours/server/platform/seo";
import { contentLocaleFor } from "@/features/tours/domain/content";
import { listDestinations } from "@/features/tours/server/platform/catalog";
import { absoluteUrl } from "@/lib/seo/alternates";
import { PageBreadcrumbs } from "@/lib/seo/page-breadcrumbs";

/**
 * First-visit introduction (C-002..C-005, 1-intro_page_before_landing_page.png). Also reopenable from Profile.
 * Uses a fixed, licensed background (public/images/tours/CREDITS.json) so the first screen never
 * depends on catalog content and never falls back to a bare gradient.
 */
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return tourAlternates(locale, "/tours/intro", await tourCatalogLanguages().catch(() => []));
}

export default async function ToursIntroPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ next?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { next } = await searchParams;
  const safeNext =
    typeof next === "string" && /^\/tours(\/[A-Za-z0-9/_?=&%.-]*)?$/.test(next)
      ? next
      : "/tours";
  // /tours sends first-time visitors (and every crawler) here, so the tours FAQ
  // (admin → Editorial) is shown below the intro as well as on the tours home.
  const [brand, destinations] = await Promise.all([
    getTranslations({ locale, namespace: "TourApp.nav" }).then((t) => t("brand")),
    listDestinations(contentLocaleFor(locale)).catch(() => []),
  ]);
  return (
    <>
      {/* The tours landing: its destinations, each with its own page. */}
      <PageBreadcrumbs
        locale={locale}
        trail={[{ name: brand, path: "/tours/intro" }]}
        items={destinations.map((d) => ({
          url: absoluteUrl(locale, `/tours/destinations/${d.slug}`),
          name: d.name?.value ?? d.slug,
          image: d.coverUrl,
        }))}
      />
      <IntroScreen next={safeNext} />
      <PageFaq target={{ scope: "app", entityKey: "tours" }} locale={locale} />
    </>
  );
}
