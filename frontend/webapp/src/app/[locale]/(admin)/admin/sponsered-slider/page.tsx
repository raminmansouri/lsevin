import { SponseredSliderAdminTable } from "@/features/sponsered-slider/components/sponsered-slider-admin-table";
import { getSponseredSliderAdminRows } from "@/features/sponsered-slider/server/repository";


export default async function SponseredSliderAdminPage() {
  const rows = await getSponseredSliderAdminRows();
  return <SponseredSliderAdminTable rows={rows} />;
}
