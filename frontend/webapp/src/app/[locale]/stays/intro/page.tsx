import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { contentLocaleFor } from "@/features/tours/domain/content";
import { listCities } from "@/features/stays/server/catalog";
import { STAY_INDEXABLE_LOCALES } from "@/features/stays/server/seo";
import { StaysIntro } from "@/features/stays/ui/intro/intro-screen";
import { PageFaq } from "@/features/site-content/components/faq-section";
import { buildPublicMetadata } from "@/lib/seo/metadata";
import { PageBreadcrumbs } from "@/lib/seo/page-breadcrumbs";
import { absoluteUrl } from "@/lib/seo/alternates";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "StayApp.meta" });
  const ti = await getTranslations({ locale, namespace: "StayApp.intro" });
  return buildPublicMetadata({
    locale,
    path: "/stays/intro",
    title: t("introTitle"),
    descriptions: [ti("subtitle"), t("description")],
    image: "/images/stays/yazd-traditional-courtyard.webp",
    eligibleLocales: STAY_INDEXABLE_LOCALES,
  });
}

/**
 * First-visit introduction. /stays sends first-time visitors — and every
 * crawler, which keeps no cookie — here, so it carries crawlable content,
 * links to the destination pages and the stays FAQ.
 */
export default async function StaysIntroPage({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ next?: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { next } = await searchParams;
  const safeNext = typeof next === "string" && /^\/stays(\/[A-Za-z0-9/_?=&%.,-]*)?$/.test(next) ? next : "/stays";
  const cities = await listCities(contentLocaleFor(locale)).catch(() => []);
  const [stays, ti] = await Promise.all([
    getTranslations({ locale, namespace: "StayApp.nav" }).then((t) => t("stays")),
    getTranslations({ locale, namespace: "StayApp.intro" }),
  ]);
  return (
    <>
      {/* The stays landing: its destinations, each with its own city page. */}
      <PageBreadcrumbs
        locale={locale}
        trail={[{ name: stays, path: "/stays/intro" }]}
        description={ti("subtitle")}
        items={cities.filter((c) => c.propertyCount > 0).map((c) => ({ url: absoluteUrl(locale, `/stays/city/${c.slug}`), name: c.name }))}
      />
      <StaysIntro next={safeNext} cities={cities.map((c) => ({ slug: c.slug, name: c.name, count: c.propertyCount }))} />
      <PageFaq target={{ scope: "app", entityKey: "stays" }} locale={locale} />
    </>
  );
}
