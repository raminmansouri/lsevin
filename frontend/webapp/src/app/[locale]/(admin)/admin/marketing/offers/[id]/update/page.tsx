import { Metadata } from "next";

import { MarketingLoyaltyUpdatePage } from "@/features/marketing-loyalty/components/page-shell";

export const metadata: Metadata = {
  title: "Update marketing offer",
};

export default async function UpdateMarketingOfferPage({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params;
  return <MarketingLoyaltyUpdatePage entityKey="marketing-offers" id={id} locale={locale} />;
}
