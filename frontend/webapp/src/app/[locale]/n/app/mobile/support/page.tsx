import type { Metadata } from "next";

import { SupportPageClient } from "@/features/support/components/support-page-client";
import { getFloatingWidgetBootstrapData } from "@/features/support/server/repository";

type Props = { params: Promise<{ locale: string }> };

export const metadata: Metadata = {
  title: "Support",
  description: "Chat with LSevin support.",
};

export default async function MobileSupportPage({ params }: Props) {
  const { locale } = await params;
  const bootstrap = await getFloatingWidgetBootstrapData({ locale });
  return <SupportPageClient bootstrap={bootstrap} source="support_page" />;
}
