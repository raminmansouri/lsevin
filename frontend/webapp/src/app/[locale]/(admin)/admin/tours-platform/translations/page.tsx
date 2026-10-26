import { getTranslations } from "next-intl/server";

import { PageHeader } from "@/components/page/page-header";
import { adminPageActor, sp } from "@/features/tours/server/admin/page-actor";
import { coverageReport, filterLookups, listTranslatorsAndGlossary } from "@/features/tours/server/admin/queries";
import { TranslationsAdmin } from "@/features/tours/ui/admin/translations-admin";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function generateMetadata() {
  const t = await getTranslations("TourAdmin.translations");
  return { title: t("title") };
}

export default async function TranslationsPage({ searchParams }: Props) {
  const actor = await adminPageActor();
  const q = await searchParams;
  const t = await getTranslations("TourAdmin.translations");
  const [report, governance, lookups] = await Promise.all([coverageReport(actor, { status: sp(q, "status") }), listTranslatorsAndGlossary(actor), filterLookups(actor)]);
  return (
    <div className="space-y-5">
      <PageHeader title={t("title")} description={t("description")} />
      <TranslationsAdmin report={report} assignments={governance.assignments} glossary={governance.glossary} providers={lookups.providers} />
    </div>
  );
}
