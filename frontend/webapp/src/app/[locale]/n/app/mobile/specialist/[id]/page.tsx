import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { listActiveSpecialistPageIds } from "@/features/service-providers/server/specialist-page.repository";
import { getSpecialistPageFromDbCached } from "@/features/service-providers/server/specialist-page.repository.cached";
import { isFastBuild } from "@/lib/build-mode";
import { absoluteUrl } from "@/lib/seo/alternates";
import {
  breadcrumbList,
  graph,
  personSchema,
  specialistUrl,
} from "@/lib/seo/entity-schema";
import { JsonLd } from "@/lib/seo/json-ld";
import { getIndexableLocales } from "@/lib/seo/locale-eligibility";
import { buildPublicMetadata } from "@/lib/seo/metadata";

import SpecialistProfileClient from "./specialist-page";

type Awaitable<T> = T | Promise<T>;

type PageProps = {
  params: Awaitable<{ locale: string; id: string }>;
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
    return ids.map((id) => ({ id }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: Pick<PageProps, "params">) {
  const { locale, id } = await params;
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
    path: `/n/app/mobile/specialist/${encodeURIComponent(id)}`,
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
  const { locale, id } = await params;
  setRequestLocale(locale);

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
            name: specialist.name,
            jobTitle: specialist.title || specialist.specialty,
            description: specialist.biography,
            image: specialist.image,
            specialties: specialist.specializations,
            providers: data.providers,
          }),
          breadcrumbList([
            { name: brand, url: absoluteUrl(locale, "/n/app/mobile/home") },
            { name: specialist.name, url: specialistUrl(locale, id) },
          ])
        )}
      />
      <SpecialistProfileClient data={data} specialistId={id} locale={locale} />
    </>
  );
}
