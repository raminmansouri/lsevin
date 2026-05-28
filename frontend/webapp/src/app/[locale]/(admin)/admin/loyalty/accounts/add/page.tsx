import { Metadata } from "next";
import { MarketingLoyaltyCreatePage } from "@/features/marketing-loyalty/components/page-shell";
export const metadata: Metadata = { title: "Create loyalty account" };
export default async function AddLoyaltyAccountPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return <MarketingLoyaltyCreatePage entityKey="loyalty-accounts" locale={locale} />;
}
