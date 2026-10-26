import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { PrivacyPolicyContent } from "@/features/legal/components/privacy-policy-content";

type PageProps = { params: Promise<{ locale: string }> };

// Public on purpose: no auth segment in the path (see lib/auth/routes.ts), so a
// signed-out visitor can read the policy before creating an account.
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "MobileProfile.privacyPolicy" });
  return { title: t("title") };
}

export default async function PublicPrivacyPolicyPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <PrivacyPolicyContent backHref={`/${locale}`} />;
}
