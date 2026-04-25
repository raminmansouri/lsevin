import { Metadata } from "next";

import { MarketingLoyaltyUpdatePage } from "@/features/marketing-loyalty/components/page-shell";

export const metadata: Metadata = { title: "Update loyalty tier" };

export default async function UpdateLoyaltyTierPage({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params;
  return <MarketingLoyaltyUpdatePage entityKey="loyalty-tiers" id={id} locale={locale} />;
}
