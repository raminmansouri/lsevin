import { notFound } from "next/navigation";

import { SponseredSliderAdminForm } from "@/features/sponsered-slider/components/sponsered-slider-admin-form";
import { getSponseredSliderAdminRow } from "@/features/sponsered-slider/server/repository";


export default async function UpdateSponsoredSliderPage({
  params,
}: {
  params: Promise<{ sliderId: string }>;
}) {
  const { sliderId } = await params;
  const slider = await getSponseredSliderAdminRow(sliderId);
  if (!slider) notFound();
  return <SponseredSliderAdminForm slider={slider} />;
}
