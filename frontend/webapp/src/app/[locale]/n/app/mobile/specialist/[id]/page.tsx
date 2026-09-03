import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { getSpecialistPageFromDbCached } from "@/features/service-providers/server/specialist-page.repository.cached";
import { listActiveSpecialistPageIds } from "@/features/service-providers/server/specialist-page.repository";

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
  try {
    const ids = await listActiveSpecialistPageIds(400);
    return ids.map((id) => ({ id }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: Pick<PageProps, "params">) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "SpecialistPage" });

  return {
    title: t("metadata.title"),
    description: t("metadata.description"),
  };
}

export default async function SpecialistPage({ params }: PageProps) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const data = await getSpecialistPageFromDbCached({ specialistId: id, locale });

  if (!data) notFound();

  return <SpecialistProfileClient data={data} specialistId={id} locale={locale} />;
}
