import { Metadata } from "next";
import { MarketingLoyaltyListPage } from "@/features/marketing-loyalty/components/page-shell";
export const metadata: Metadata = { title: "Referrals", description: "Manage loyalty referrals." };
export default async function LoyaltyReferralsPage({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
  const { locale } = await params;
  return <MarketingLoyaltyListPage entityKey="loyalty-referrals" searchParams={searchParams} locale={locale} />;
}
