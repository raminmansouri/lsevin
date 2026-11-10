import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { PrivacyPolicyContent } from "@/features/legal/components/privacy-policy-content";
import { sitePageRoute } from "@/features/site-content/components/site-page-route";
import { getPublishedSitePage } from "@/features/site-content/server/repository";
import { buildPublicMetadata } from "@/lib/seo/metadata";

type PageProps = { params: Promise<{ locale: string }> };

// Public on purpose: no auth segment in the path (see lib/auth/routes.ts), so a
// signed-out visitor can read the policy before creating an account.
// SSG like the other editorial pages (see about-us/page.tsx).
export const dynamic = "force-static";
export const revalidate = 3600;

const route = sitePageRoute("privacy-policy");

// The policy edited in admin → Editorial wins once it is published; until then
// (or while the database is unreachable) the built-in policy text is shown.
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  if (await getPublishedSitePage("privacy-policy", locale)) return route.generateMetadata({ params });
  const t = await getTranslations({ locale, namespace: "MobileProfile.privacyPolicy" });
  return buildPublicMetadata({ locale, path: "/privacy-policy", title: t("title"), descriptions: [t("intro")] });
}

export default async function PublicPrivacyPolicyPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  if (await getPublishedSitePage("privacy-policy", locale)) return route.Page({ params });
  return <PrivacyPolicyContent backHref={`/${locale}`} />;
}
