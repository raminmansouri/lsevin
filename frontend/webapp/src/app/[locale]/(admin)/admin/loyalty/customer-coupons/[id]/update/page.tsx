import { Metadata } from "next";
import { MarketingLoyaltyUpdatePage } from "@/features/marketing-loyalty/components/page-shell";
export const metadata: Metadata = { title: "Update customer coupon" };
export default async function UpdateCustomerCouponPage({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params;
  return <MarketingLoyaltyUpdatePage entityKey="loyalty-customer-coupons" id={id} locale={locale} />;
}
