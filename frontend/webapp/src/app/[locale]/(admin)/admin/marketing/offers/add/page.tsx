import { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { MarketingLoyaltyCreatePage } from "@/features/marketing-loyalty/components/page-shell";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "MarketingOffersAdmin" });

  return {
    title: t("createTitle"),
  };
}

export default async function AddMarketingOfferPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return <MarketingLoyaltyCreatePage entityKey="marketing-offers" locale={locale} />;
}
