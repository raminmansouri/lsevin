import { Metadata } from "next";
import { MarketingLoyaltyCreatePage } from "@/features/marketing-loyalty/components/page-shell";
export const metadata: Metadata = { title: "Create referral" };
export default async function AddLoyaltyReferralPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return <MarketingLoyaltyCreatePage entityKey="loyalty-referrals" locale={locale} />;
}
