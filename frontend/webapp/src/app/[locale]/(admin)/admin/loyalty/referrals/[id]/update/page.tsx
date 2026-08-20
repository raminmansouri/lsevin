import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { MarketingLoyaltyUpdatePage } from "@/features/marketing-loyalty/components/page-shell";
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("AdminPages.marketingLoyalty");
  return {
    title: t("entities.loyalty-referrals.updateTitle"),
  };
}
export default async function UpdateLoyaltyReferralPage({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params;
  return <MarketingLoyaltyUpdatePage entityKey="loyalty-referrals" id={id} locale={locale} />;
}
