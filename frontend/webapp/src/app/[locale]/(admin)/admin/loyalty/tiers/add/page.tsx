import { Metadata } from "next";

import { MarketingLoyaltyCreatePage } from "@/features/marketing-loyalty/components/page-shell";

export const metadata: Metadata = { title: "Create loyalty tier" };

export default async function AddLoyaltyTierPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return <MarketingLoyaltyCreatePage entityKey="loyalty-tiers" locale={locale} />;
}
