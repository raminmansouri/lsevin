import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";

import { getSpecialistPageFromDbCached } from "@/features/service-providers/server/specialist-page.repository.cached";
import { listActiveSpecialistPageIds } from "@/features/service-providers/server/specialist-page.repository";

import { buildPublicMetadata } from "@/lib/seo/metadata";
import { isFastBuild } from "@/lib/build-mode";
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
    const data = await getSpecialistPageFromDbCached({ specialistId: id, locale }).catch(() => null);
    const specialist = data?.specialist;

  if (!specialist) {
    return buildPublicMetadata({ locale, path: `/n/app/mobile/specialist/${encodeURIComponent(id)}` });
  }

  return buildPublicMetadata({
    locale,
    path: `/n/app/mobile/specialist/${encodeURIComponent(id)}`,
    title: specialist.title ? `${specialist.name} ? ${specialist.title}` : specialist.name,
    descriptions: [specialist.biography, specialist.specialty],
    image: specialist.image,
    type: "profile",
  });
}

export default async function SpecialistPage({ params }: PageProps) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const data = await getSpecialistPageFromDbCached({ specialistId: id, locale }).catch(() => null);

  if (!data) notFound();

  return <SpecialistProfileClient data={data} specialistId={id} locale={locale} />;
}
