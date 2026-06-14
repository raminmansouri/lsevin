import { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { MarketingLoyaltyUpdatePage } from "@/features/marketing-loyalty/components/page-shell";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "MarketingOffersAdmin" });

  return {
    title: t("updateTitle"),
  };
}

export default async function UpdateMarketingOfferPage({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params;
  return <MarketingLoyaltyUpdatePage entityKey="marketing-offers" id={id} locale={locale} />;
}
