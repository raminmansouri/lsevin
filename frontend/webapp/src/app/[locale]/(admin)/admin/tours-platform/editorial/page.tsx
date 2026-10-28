import { getTranslations } from "next-intl/server";

import { PageHeader } from "@/components/page/page-header";
import { adminPageActor } from "@/features/tours/server/admin/page-actor";
import { listAllDestinations, listModules, listTaxonomy, publishedTourOptions } from "@/features/tours/server/admin/queries";
import { getTourSettings } from "@/features/tours/server/platform/settings";
import { EditorialManager } from "@/features/tours/ui/admin/editorial-manager";

export async function generateMetadata() {
  const t = await getTranslations("TourAdmin.editorial");
  return { title: t("title") };
}

export default async function EditorialPage() {
  const actor = await adminPageActor();
  const t = await getTranslations("TourAdmin.editorial");
  const [modules, tours, destinations, terms, settings] = await Promise.all([
    listModules(actor), publishedTourOptions(actor), listAllDestinations(actor), listTaxonomy(actor), getTourSettings(),
  ]);
  return (
    <div className="space-y-5">
      <PageHeader title={t("title")} description={t("description")} />
      <EditorialManager
        modules={modules}
        tours={tours.map((x) => ({ id: x.id, labels: x.title_translations ?? {}, fallback: x.title ?? x.slug, status: x.status }))}
        destinations={destinations.map((d) => ({ id: d.id, labels: d.name_translations ?? {}, fallback: d.slug }))}
        categories={terms.filter((x) => x.kind === "category" && x.is_active).map((x) => ({ id: x.id, labels: x.label_translations ?? {}, fallback: x.code }))}
        locales={settings.enabledLocales}
      />
    </div>
  );
}
