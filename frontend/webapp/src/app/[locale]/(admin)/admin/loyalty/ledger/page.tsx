import { Metadata } from "next";
import { MarketingLoyaltyListPage } from "@/features/marketing-loyalty/components/page-shell";
export const metadata: Metadata = { title: "Loyalty ledger", description: "View and add loyalty ledger entries." };
export default async function LoyaltyLedgerPage({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
  const { locale } = await params;
  return <MarketingLoyaltyListPage entityKey="loyalty-ledger" searchParams={searchParams} locale={locale} />;
}
