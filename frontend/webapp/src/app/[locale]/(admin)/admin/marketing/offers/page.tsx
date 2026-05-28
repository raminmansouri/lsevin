import { Metadata } from "next";

import { MarketingLoyaltyListPage } from "@/features/marketing-loyalty/components/page-shell";

export const metadata: Metadata = {
  title: "Marketing offers",
  description: "Manage marketing offers.",
};

export default async function MarketingOffersPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  return <MarketingLoyaltyListPage entityKey="marketing-offers" searchParams={searchParams} locale={locale} />;
}
