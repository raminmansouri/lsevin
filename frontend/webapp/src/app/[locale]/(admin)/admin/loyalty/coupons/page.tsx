import { Metadata } from "next";
import { MarketingLoyaltyListPage } from "@/features/marketing-loyalty/components/page-shell";
export const metadata: Metadata = { title: "Loyalty coupons", description: "Manage loyalty coupons." };
export default async function LoyaltyCouponsPage({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
  const { locale } = await params;
  return <MarketingLoyaltyListPage entityKey="loyalty-coupons" searchParams={searchParams} locale={locale} />;
}
