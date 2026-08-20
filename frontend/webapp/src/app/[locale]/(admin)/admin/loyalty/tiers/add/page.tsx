import { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { MarketingLoyaltyCreatePage } from "@/features/marketing-loyalty/components/page-shell";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("AdminPages.marketingLoyalty");
  return {
    title: t("entities.loyalty-tiers.createTitle"),
  };
}

export default async function AddLoyaltyTierPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return <MarketingLoyaltyCreatePage entityKey="loyalty-tiers" locale={locale} />;
}
