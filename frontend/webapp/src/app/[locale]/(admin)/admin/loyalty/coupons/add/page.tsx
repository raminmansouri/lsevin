import { Metadata } from "next";
import { MarketingLoyaltyCreatePage } from "@/features/marketing-loyalty/components/page-shell";
export const metadata: Metadata = { title: "Create loyalty coupon" };
export default async function AddLoyaltyCouponPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return <MarketingLoyaltyCreatePage entityKey="loyalty-coupons" locale={locale} />;
}
