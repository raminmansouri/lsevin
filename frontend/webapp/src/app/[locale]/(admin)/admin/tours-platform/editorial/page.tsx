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
        tours={tours.map((x) => ({ id: x.id, label: x.title ?? x.slug, status: x.status }))}
        destinations={destinations.map((d) => ({ id: d.id, label: d.name_translations["en-US"] ?? d.slug }))}
        categories={terms.filter((x) => x.kind === "category").map((x) => x.code)}
        locales={settings.enabledLocales}
      />
    </div>
  );
}
