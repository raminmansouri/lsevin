import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { contentLocaleFor } from "@/features/tours/domain/content";
import { currentActor, ownerKey } from "@/features/tours/server/platform/access";
import { DEFAULT_SEARCH } from "@/features/stays/domain/search";
import { listRecentViews, wishlistIds } from "@/features/stays/server/catalog";
import { cachedCities, cachedKindCounts, catalogSearch } from "@/features/stays/server/cache";
import { STAY_INDEXABLE_LOCALES } from "@/features/stays/server/seo";
import { isStaysIntroCompleted } from "@/features/stays/server/state";
import { StaysHome } from "@/features/stays/ui/home/stays-home";
import { PageFaq } from "@/features/site-content/components/faq-section";
import { redirect } from "@/i18n/navigation";
import { buildPublicMetadata } from "@/lib/seo/metadata";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "StayApp.meta" });
  return buildPublicMetadata({ locale, path: "/stays", title: t("homeTitle"), descriptions: [t("description")], image: "/images/stays/yazd-traditional-courtyard.webp", eligibleLocales: STAY_INDEXABLE_LOCALES });
}

/**
 * Stays home. The first visit goes through the intro (same rule as tours);
 * after that: search, recently viewed, destinations, featured stays.
 */
export default async function StaysHomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const actor = await currentActor();
  if (!(await isStaysIntroCompleted(actor))) {
    redirect({ href: "/stays/intro", locale });
  }
  const content = contentLocaleFor(locale);
  const owner = await ownerKey(actor);
  const [cities, featured, recent, saved, kinds] = await Promise.all([
    cachedCities(content),
    catalogSearch({ ...DEFAULT_SEARCH, adults: 1 }, content, { pageSize: 8 }),
    owner ? listRecentViews(owner, content, 10) : Promise.resolve([]),
    actor.userId ? wishlistIds(actor.userId) : Promise.resolve([] as string[]),
    cachedKindCounts().catch(() => ({}) as Record<string, number>),
  ]);
  return (
    <>
      <StaysHome
        cities={cities}
        cityOptions={cities.map((c) => ({ slug: c.slug, name: c.name, region: c.region }))}
        featured={featured.items}
        recent={recent}
        savedIds={saved}
        kindCounts={kinds}
      />
      <PageFaq target={{ scope: "app", entityKey: "stays" }} locale={locale} />
    </>
  );
}
