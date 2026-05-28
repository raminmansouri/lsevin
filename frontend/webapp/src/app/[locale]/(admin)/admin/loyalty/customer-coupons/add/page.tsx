import { Metadata } from "next";
import { MarketingLoyaltyCreatePage } from "@/features/marketing-loyalty/components/page-shell";
export const metadata: Metadata = { title: "Assign customer coupon" };
export default async function AddCustomerCouponPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return <MarketingLoyaltyCreatePage entityKey="loyalty-customer-coupons" locale={locale} />;
}
