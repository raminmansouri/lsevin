import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { MobileSearchPageClient } from "@/features/service-providers/components/search/mobile-search-page-client";
import { getSearchHistory } from "@/features/service-providers/server/search.repository";

type SearchPageProps = {
  params: Promise<{ locale: string }> | { locale: string };
};

export async function generateMetadata({ params }: SearchPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "MobileSearch.metadata" });

  return {
    title: t("title"),
    description: t("description"),
  };
}

export default async function SearchPage({ params }: SearchPageProps) {
  const { locale } = await params;
  const data = await getSearchHistory(locale);

  return <MobileSearchPageClient initialData={data} />;
}
