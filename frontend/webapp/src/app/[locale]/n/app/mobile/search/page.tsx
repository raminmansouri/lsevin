import type { Metadata } from "next";

import { MobileSearchPageClient } from "@/features/service-providers/components/search/mobile-search-page-client";
import { getSearchHistory } from "@/features/service-providers/server/search.repository";

type SearchPageProps = {
  params: Promise<{ locale: string }> | { locale: string };
};

export const metadata: Metadata = {
  title: "Search | LSevin",
  description: "Search LSevin services, providers, clinics, doctors, and wellness offers.",
};

export default async function SearchPage({ params }: SearchPageProps) {
  const { locale } = await params;
  const data = await getSearchHistory(locale);

  return <MobileSearchPageClient initialData={data} />;
}
