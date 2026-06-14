import { Metadata } from "next";
import { MarketingLoyaltyUpdatePage } from "@/features/marketing-loyalty/components/page-shell";
export const metadata: Metadata = { title: "Update loyalty account" };
export default async function UpdateLoyaltyAccountPage({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params;
  return <MarketingLoyaltyUpdatePage entityKey="loyalty-accounts" id={id} locale={locale} />;
}
