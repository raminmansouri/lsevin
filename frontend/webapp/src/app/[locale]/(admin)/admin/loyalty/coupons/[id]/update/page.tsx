import { Metadata } from "next";
import { MarketingLoyaltyUpdatePage } from "@/features/marketing-loyalty/components/page-shell";
export const metadata: Metadata = { title: "Update loyalty coupon" };
export default async function UpdateLoyaltyCouponPage({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params;
  return <MarketingLoyaltyUpdatePage entityKey="loyalty-coupons" id={id} locale={locale} />;
}
