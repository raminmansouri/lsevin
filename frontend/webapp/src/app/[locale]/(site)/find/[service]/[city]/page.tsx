import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { cache } from "react";

import { loadLandingPage } from "@/features/search/server/landing-page";
import { LandingView } from "@/features/search/ui/landing-view";

// Built on demand and refreshed hourly. Off (404) until SEARCH_LANDING_PAGES=1.
export const revalidate = 3600;

type Props = { params: Promise<{ locale: string; service: string; city: string }> };

const load = cache(loadLandingPage);

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, service, city } = await params;
  const page = await load(locale, service, city);
  // A page that will 404 must not be indexed under any circumstances.
  return page?.metadata ?? { robots: { index: false, follow: false } };
}

export default async function LandingPage({ params }: Props) {
  const { locale, service, city } = await params;
  setRequestLocale(locale);
  const page = await load(locale, service, city);
  if (!page) notFound();
  return <LandingView locale={locale} data={page.data} jsonLd={page.jsonLd} />;
}
