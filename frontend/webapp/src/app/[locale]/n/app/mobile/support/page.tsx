import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { SupportPageClient } from "@/features/support/components/support-page-client";
import { getFloatingWidgetBootstrapData } from "@/features/support/server/repository";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "SupportPages.mobileSupport" });
  return { title: t("metadataTitle"), description: t("metadataDescription") };
}

export default async function MobileSupportPage({ params }: Props) {
  const { locale } = await params;
  const bootstrap = await getFloatingWidgetBootstrapData({ locale });
  return <SupportPageClient bootstrap={bootstrap} source="support_page" />;
}
