import { Metadata } from "next";

import { MarketingLoyaltyCreatePage } from "@/features/marketing-loyalty/components/page-shell";

export const metadata: Metadata = {
  title: "Create marketing offer",
};

export default async function AddMarketingOfferPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return <MarketingLoyaltyCreatePage entityKey="marketing-offers" locale={locale} />;
}
