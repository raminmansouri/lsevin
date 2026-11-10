import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound, permanentRedirect } from "next/navigation";

import { listActiveSpecialistPageIds } from "@/features/service-providers/server/specialist-page.repository";
import { getSpecialistPageFromDbCached } from "@/features/service-providers/server/specialist-page.repository.cached";
import { isFastBuild } from "@/lib/build-mode";
import { absoluteUrl } from "@/lib/seo/alternates";
import {
  breadcrumbList,
  graph,
  personSchema,
} from "@/lib/seo/entity-schema";
import { JsonLd } from "@/lib/seo/json-ld";
import { getIndexableLocales } from "@/lib/seo/locale-eligibility";
import { buildPublicMetadata } from "@/lib/seo/metadata";
import { publicSegmentsForIds, resolvePublicEntity } from "@/lib/seo/public-slugs";

import SpecialistProfileClient from "./specialist-page";
import { PageFaq } from "@/features/site-content/components/faq-section";

type Awaitable<T> = T | Promise<T>;

type PageProps = {
  params: Awaitable<{ locale: string; slug: string }>;
};

// Static / ISR. No visitor context (default currency, favourite state resolved
// client-side by the interactive view). `generateStaticParams` prewarms active
// specialists; anything else is ISR'd on first hit.
export const dynamic = "force-static";
export const revalidate = 3600;

export async function generateStaticParams() {
  if (isFastBuild()) return [];
  try {
    const ids = await listActiveSpecialistPageIds(400);
    return (await publicSegmentsForIds("specialist", ids)).map((slug) => ({ slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: Pick<PageProps, "params">) {
  const { locale, slug: identifier } = await params;
  const ref = await resolvePublicEntity('specialist', identifier);
  if (!ref) notFound();
  const id = ref.id;
  const data = await getSpecialistPageFromDbCached({
    specialistId: id,
    locale,
  });
  const specialist = data?.specialist;

  if (!specialist) {
    notFound();
  }

  return buildPublicMetadata({
    locale,
    path: `/specialists/${ref.slug ?? id}`,
    title: specialist.title
      ? `${specialist.name} | ${specialist.title}`
      : specialist.name,
    descriptions: [specialist.biography, specialist.specialty],
    image: specialist.image,
    type: "profile",
    eligibleLocales: await getIndexableLocales("specialist", id),
  });
}

export default async function SpecialistPage({ params }: PageProps) {
  const { locale, slug: identifier } = await params;
  setRequestLocale(locale);
  const ref = await resolvePublicEntity('specialist', identifier);
  if (!ref) notFound();
  if (ref.slug && identifier !== ref.slug) permanentRedirect(`/${locale}/specialists/${ref.slug}`);
  const id = ref.id;
  const canonicalPath = `/specialists/${ref.slug ?? id}`;
  const canonicalUrl = absoluteUrl(locale, canonicalPath);

  const data = await getSpecialistPageFromDbCached({
    specialistId: id,
    locale,
  });

  if (!data) notFound();

  const { specialist } = data;
  const brand = (await getTranslations({ locale, namespace: "LocaleLayout" }))("title");

  return (
    <>
      <JsonLd
        data={graph(
          personSchema({
            locale,
            id,
            url: canonicalUrl,
            name: specialist.name,
            jobTitle: specialist.title || specialist.specialty,
            description: specialist.biography,
            image: specialist.image,
            specialties: specialist.specializations,
            providers: data.providers,
          }),
          breadcrumbList([
            { name: brand, url: absoluteUrl(locale) },
            { name: specialist.name, url: canonicalUrl },
          ])
        )}
      />
      <SpecialistProfileClient data={data} specialistId={id} locale={locale} />
      <PageFaq target={{ scope: "specialist", entityId: id }} locale={locale} pageUrl={canonicalUrl} />
    </>
  );
}
