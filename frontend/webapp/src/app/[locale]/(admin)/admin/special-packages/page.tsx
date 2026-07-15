import { SpecialPackagesTable } from "@/features/special-packages/components/special-packages-table";
import { getSpecialPackagesAdminRows } from "@/features/special-packages/server/repository";

export default async function SpecialPackagesAdminPage() {
  const rows = await getSpecialPackagesAdminRows();
  return <SpecialPackagesTable rows={rows} />;
}
