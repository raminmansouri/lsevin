import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { MarketingLoyaltyUpdatePage } from "@/features/marketing-loyalty/components/page-shell";
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("AdminPages.marketingLoyalty");
  return {
    title: t("entities.loyalty-coupons.updateTitle"),
  };
}
export default async function UpdateLoyaltyCouponPage({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params;
  return <MarketingLoyaltyUpdatePage entityKey="loyalty-coupons" id={id} locale={locale} />;
}
