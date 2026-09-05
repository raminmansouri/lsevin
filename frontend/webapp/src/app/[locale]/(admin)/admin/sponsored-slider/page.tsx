import { SponseredSliderAdminTable } from "@/features/sponsered-slider/components/sponsered-slider-admin-table";
import { getSponseredSliderAdminRows } from "@/features/sponsered-slider/server/repository";


export default async function SponsoredSliderAdminPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolved = (await searchParams) ?? {};
  const raw = resolved.placement;
  const placementFilter = (Array.isArray(raw) ? raw[0] : raw)?.trim() || null;

  const rows = await getSponseredSliderAdminRows();
  return <SponseredSliderAdminTable rows={rows} placementFilter={placementFilter} />;
}
