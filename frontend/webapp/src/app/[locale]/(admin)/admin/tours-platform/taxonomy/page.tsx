import { getTranslations } from "next-intl/server";

import { PageHeader } from "@/components/page/page-header";
import { adminPageActor } from "@/features/tours/server/admin/page-actor";
import { listTaxonomy } from "@/features/tours/server/admin/queries";
import { getTourSettings } from "@/features/tours/server/platform/settings";
import { TaxonomyManager } from "@/features/tours/ui/admin/taxonomy-manager";

export async function generateMetadata() {
  const t = await getTranslations("TourAdmin.taxonomy");
  return { title: t("title") };
}

export default async function TaxonomyPage() {
  const actor = await adminPageActor();
  const t = await getTranslations("TourAdmin.taxonomy");
  const [terms, settings] = await Promise.all([listTaxonomy(actor), getTourSettings()]);
  return (
    <div className="space-y-5">
      <PageHeader title={t("title")} description={t("description")} />
      <TaxonomyManager terms={terms} locales={settings.enabledLocales} />
    </div>
  );
}
