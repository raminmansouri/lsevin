import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { MarketingLoyaltyCreatePage } from "@/features/marketing-loyalty/components/page-shell";
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("AdminPages.marketingLoyalty");
  return {
    title: t("entities.loyalty-customer-coupons.createTitle"),
  };
}
export default async function AddCustomerCouponPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return <MarketingLoyaltyCreatePage entityKey="loyalty-customer-coupons" locale={locale} />;
}
