import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { adminPageActor, sp } from "@/features/tours/server/admin/page-actor";
import { filterLookups, tourBundle } from "@/features/tours/server/admin/queries";
import { ToursError } from "@/features/tours/server/platform/errors";
import { TOUR_EDITOR_TABS, type TourEditorTab } from "@/features/tours/ui/admin/paths";
import { TourEditor } from "@/features/tours/ui/admin/tour-editor";

type Props = {
  params: Promise<{ locale: string; tourId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata() {
  const t = await getTranslations("TourAdmin.editor");
  return { title: t("title") };
}

export default async function TourEditorPage({ params, searchParams }: Props) {
  const actor = await adminPageActor();
  const { tourId } = await params;
  const query = await searchParams;
  const tab = (TOUR_EDITOR_TABS as readonly string[]).includes(sp(query, "tab") ?? "") ? (sp(query, "tab") as TourEditorTab) : "overview";
  let bundle;
  try {
    bundle = await tourBundle(actor, tourId);
  } catch (e) {
    if (e instanceof ToursError && (e.kind === "not_found" || e.code === "tour_not_found")) notFound();
    throw e;
  }
  const lookups = await filterLookups(actor);
  return <TourEditor bundle={bundle} tab={tab} targetLocale={sp(query, "locale")} lookups={lookups} />;
}
