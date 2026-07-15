import { notFound } from "next/navigation";

import { SpecialPackageForm } from "@/features/special-packages/components/special-package-form";
import { getSpecialPackageAdminRow } from "@/features/special-packages/server/repository";

export default async function UpdateSpecialPackagePage({
  params,
}: {
  params: Promise<{ packageId: string }>;
}) {
  const { packageId } = await params;
  const pkg = await getSpecialPackageAdminRow(packageId);
  if (!pkg) notFound();
  return <SpecialPackageForm pkg={pkg} />;
}
