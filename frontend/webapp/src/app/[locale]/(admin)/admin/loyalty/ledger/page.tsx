import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { MarketingLoyaltyListPage } from "@/features/marketing-loyalty/components/page-shell";
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("AdminPages.marketingLoyalty");
  return {
    title: t("entities.loyalty-ledger.title"),
    description: t("entities.loyalty-ledger.description"),
  };
}
export default async function LoyaltyLedgerPage({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
  const { locale } = await params;
  return <MarketingLoyaltyListPage entityKey="loyalty-ledger" searchParams={searchParams} locale={locale} />;
}
