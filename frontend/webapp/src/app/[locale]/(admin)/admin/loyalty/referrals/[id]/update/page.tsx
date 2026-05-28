import { Metadata } from "next";
import { MarketingLoyaltyUpdatePage } from "@/features/marketing-loyalty/components/page-shell";
export const metadata: Metadata = { title: "Update referral" };
export default async function UpdateLoyaltyReferralPage({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params;
  return <MarketingLoyaltyUpdatePage entityKey="loyalty-referrals" id={id} locale={locale} />;
}
