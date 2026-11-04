import { Edit, Plus } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { PageHeader } from "@/components/page/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { catalogDataLocale } from "@/lib/pwa/data-locale";
import { toSeoPlainText } from "@/lib/seo/plain-text";
import { cn } from "@/lib/utils";

import { listAdminFaqs, listAdminSitePages, sitePageLocales } from "../../server/repository";
import { FAQ_SCOPES, type FaqAdminRow, type FaqScope, type Translations } from "../../types";
import { FaqDeleteButton } from "./faq-delete-button";

const TOTAL_LOCALES = routing.locales.length;

/** Text in the admin's language, else English, else the first language that has it. */
function display(translations: Translations, localeKey: string) {
  const value = translations[localeKey] || translations["en-US"] || Object.values(translations).find(Boolean) || "";
  return toSeoPlainText(value, 140);
}

const filledCount = (translations: Translations) =>
  Object.values(translations).filter((value) => toSeoPlainText(value ?? "", 10)).length;

export async function EditorialHub({
  locale,
  tab,
  scope,
  title,
}: {
  locale: string;
  tab: "pages" | "faqs";
  scope: FaqScope | null;
  title: string;
}) {
  const t = await getTranslations({ locale, namespace: "AdminEditorial" });
  const localeKey = catalogDataLocale(locale);

  return (
    <div className="space-y-6">
      <div>
        <PageHeader title={title} />
        <p className="mt-1 text-sm text-muted-foreground">{t("intro")}</p>
      </div>

      <nav aria-label={title} className="flex gap-2 border-b">
        {(["pages", "faqs"] as const).map((value) => (
          <Link
            key={value}
            href={value === "pages" ? "/admin/editorial" : "/admin/editorial?tab=faqs"}
            aria-current={tab === value ? "page" : undefined}
            className={cn(
              "-mb-px border-b-2 px-4 py-2 text-sm font-semibold",
              tab === value ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {t(`tabs.${value}`)}
          </Link>
        ))}
      </nav>

      {tab === "pages" ? <PagesTable localeKey={localeKey} /> : <FaqsTable localeKey={localeKey} scope={scope} locale={locale} />}
    </div>
  );
}

async function PagesTable({ localeKey }: { localeKey: string }) {
  const t = await getTranslations("AdminEditorial");
  const pages = await listAdminSitePages();
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("tabs.pages")}</CardTitle>
        <CardDescription>{t("pagesHelp")}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto rounded-2xl border">
          <table className="w-full min-w-[640px] text-sm" data-testid="site-pages-table">
            <thead className="bg-muted/60 text-start text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-start font-semibold">{t("page")}</th>
                <th className="px-4 py-3 text-start font-semibold">{t("languages")}</th>
                <th className="px-4 py-3 text-start font-semibold">{t("status")}</th>
                <th className="px-4 py-3 text-end font-semibold">{t("actions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {pages.map((page) => {
                const translated = sitePageLocales({ titleTranslations: page.title, bodyTranslations: page.body }).length;
                return (
                  <tr key={page.slug} className="bg-background align-middle" data-slug={page.slug}>
                    <td className="px-4 py-4">
                      <div className="font-semibold text-foreground">{display(page.title, localeKey) || t(`pages.${page.slug}`)}</div>
                      <div className="font-mono text-xs text-muted-foreground">/{page.slug}</div>
                    </td>
                    <td className="px-4 py-4">
                      <Badge variant={translated === TOTAL_LOCALES ? "default" : "secondary"}>
                        {translated}/{TOTAL_LOCALES}
                      </Badge>
                    </td>
                    <td className="px-4 py-4">
                      <Badge variant={page.isPublished ? "default" : "outline"}>
                        {page.isPublished ? t("published") : page.id ? t("draft") : t("notCreated")}
                      </Badge>
                      {page.isPublished && page.showInFooter ? (
                        <span className="ms-2 text-xs text-muted-foreground">{t("inFooter")}</span>
                      ) : null}
                    </td>
                    <td className="px-4 py-4 text-end">
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/admin/editorial/pages/${page.slug}`}>
                          <Edit className="me-2 h-4 w-4" />
                          {t("edit")}
                        </Link>
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

function targetLabel(faq: FaqAdminRow, t: (key: string) => string) {
  const scope = t(`scopes.${faq.scope}`);
  if (faq.scope === "app" && faq.entityKey) return `${scope}: ${t(`apps.${faq.entityKey}`)}`;
  if (faq.scope === "site_page" && faq.entityKey) return `${scope}: ${t(`pages.${faq.entityKey}`)}`;
  if (faq.entityId) return `${scope}: ${faq.entityLabel ?? faq.entityId}`;
  return scope;
}

async function FaqsTable({ localeKey, scope, locale }: { localeKey: string; scope: FaqScope | null; locale: string }) {
  const t = await getTranslations("AdminEditorial");
  const faqs = await listAdminFaqs({ scope, locale: localeKey });
  return (
    <Card>
      <CardHeader className="gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <CardTitle>{t("tabs.faqs")}</CardTitle>
          <CardDescription>{t("faqsHelp")}</CardDescription>
        </div>
        <Button asChild>
          <Link href={scope ? `/admin/editorial/faqs/new?scope=${scope}` : "/admin/editorial/faqs/new"}>
            <Plus className="me-2 h-4 w-4" />
            {t("newFaq")}
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <nav aria-label={t("showOn")} className="flex flex-wrap gap-2">
          {[null, ...FAQ_SCOPES].map((value) => (
            <Link
              key={value ?? "all"}
              href={value ? `/admin/editorial?tab=faqs&scope=${value}` : "/admin/editorial?tab=faqs"}
              aria-current={scope === value ? "page" : undefined}
              className={cn(
                "rounded-full border px-3 py-1 text-xs",
                scope === value ? "border-primary bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {value ? t(`scopes.${value}`) : t("all")}
            </Link>
          ))}
        </nav>

        {faqs.length ? (
          <div className="overflow-x-auto rounded-2xl border">
            <table className="w-full min-w-[720px] text-sm" data-testid="faqs-table" lang={locale}>
              <thead className="bg-muted/60 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 text-start font-semibold">{t("question")}</th>
                  <th className="px-4 py-3 text-start font-semibold">{t("showOn")}</th>
                  <th className="px-4 py-3 text-start font-semibold">{t("languages")}</th>
                  <th className="px-4 py-3 text-start font-semibold">{t("status")}</th>
                  <th className="px-4 py-3 text-end font-semibold">{t("actions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {faqs.map((faq) => {
                  const question = display(faq.question, localeKey);
                  return (
                    <tr key={faq.id} className="bg-background align-middle">
                      <td className="max-w-[420px] px-4 py-3">
                        <div className="line-clamp-2 font-medium text-foreground">{question}</div>
                        <div className="text-xs text-muted-foreground">
                          {t("displayOrder")}: {faq.displayOrder}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{targetLabel(faq, t)}</td>
                      <td className="px-4 py-3">
                        <Badge variant="secondary">
                          {filledCount(faq.question)}/{TOTAL_LOCALES}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={faq.isActive ? "default" : "outline"}>{faq.isActive ? t("active") : t("inactive")}</Badge>
                      </td>
                      <td className="px-4 py-3 text-end">
                        <div className="flex justify-end gap-1">
                          <Button asChild variant="outline" size="sm">
                            <Link href={`/admin/editorial/faqs/${faq.id}`}>
                              <Edit className="me-2 h-4 w-4" />
                              {t("edit")}
                            </Link>
                          </Button>
                          <FaqDeleteButton id={faq.id} question={question} />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">{t("noFaqs")}</p>
        )}
      </CardContent>
    </Card>
  );
}
