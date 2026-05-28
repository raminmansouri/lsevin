import { Metadata } from "next";

import { MarketingLoyaltyListPage } from "@/features/marketing-loyalty/components/page-shell";

export const metadata: Metadata = {
  title: "Loyalty tiers",
  description: "Manage loyalty tiers.",
};

export default async function LoyaltyTiersPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  return <MarketingLoyaltyListPage entityKey="loyalty-tiers" searchParams={searchParams} locale={locale} />;
}
