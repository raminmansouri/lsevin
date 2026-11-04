import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { EditorialHub } from "@/features/site-content/components/admin/editorial-hub";
import { FAQ_SCOPES, type FaqScope } from "@/features/site-content/types";

export const metadata: Metadata = {
  title: "Editorial",
  description: "Site pages and FAQs in every language.",
};

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ tab?: string; scope?: string }>;
};

export default async function AdminEditorialPage({ params, searchParams }: Props) {
  const [{ locale }, query] = await Promise.all([params, searchParams]);
  const t = await getTranslations({ locale, namespace: "AdminEditorial" });
  const scope = (FAQ_SCOPES as readonly string[]).includes(query.scope ?? "") ? (query.scope as FaqScope) : null;
  return (
    <EditorialHub
      locale={locale}
      tab={query.tab === "faqs" ? "faqs" : "pages"}
      scope={scope}
      title={t("heading")}
    />
  );
}
