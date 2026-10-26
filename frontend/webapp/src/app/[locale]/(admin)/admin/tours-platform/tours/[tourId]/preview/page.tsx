import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { adminPageActor, sp } from "@/features/tours/server/admin/page-actor";
import { previewTour } from "@/features/tours/server/admin/preview";
import { ToursError } from "@/features/tours/server/platform/errors";
import { TourPreviewView } from "@/features/tours/ui/admin/tour-preview";

type Props = {
  params: Promise<{ locale: string; tourId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata() {
  const t = await getTranslations("TourAdmin.preview");
  return { title: t("title") };
}

export default async function TourPreviewPage({ params, searchParams }: Props) {
  const actor = await adminPageActor();
  const { tourId } = await params;
  const q = await searchParams;
  try {
    const data = await previewTour(actor, { tourId, locale: sp(q, "lang"), calendar: sp(q, "calendar"), currency: sp(q, "currency") });
    return <TourPreviewView data={data} tourId={tourId} />;
  } catch (e) {
    if (e instanceof ToursError && (e.kind === "not_found" || e.code === "tour_not_found")) notFound();
    throw e;
  }
}
