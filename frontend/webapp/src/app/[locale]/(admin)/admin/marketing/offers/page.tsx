import { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { MarketingLoyaltyListPage } from "@/features/marketing-loyalty/components/page-shell";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "MarketingOffersAdmin" });

  return {
    title: t("listTitle"),
    description: t("listDescription"),
  };
}

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
