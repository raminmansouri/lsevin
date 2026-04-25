import { Metadata } from "next";
import { MarketingLoyaltyListPage } from "@/features/marketing-loyalty/components/page-shell";
export const metadata: Metadata = { title: "Customer coupons", description: "Manage assigned customer coupons." };
export default async function CustomerCouponsPage({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
  const { locale } = await params;
  return <MarketingLoyaltyListPage entityKey="loyalty-customer-coupons" searchParams={searchParams} locale={locale} />;
}
