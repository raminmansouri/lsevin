import { Metadata } from "next";
import { MarketingLoyaltyListPage } from "@/features/marketing-loyalty/components/page-shell";
export const metadata: Metadata = { title: "Loyalty accounts", description: "Manage loyalty accounts." };
export default async function LoyaltyAccountsPage({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
  const { locale } = await params;
  return <MarketingLoyaltyListPage entityKey="loyalty-accounts" searchParams={searchParams} locale={locale} />;
}
