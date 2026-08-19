import { notFound } from "next/navigation";
import { PageHeader } from "@core/ui/PageHeader";
import type { ModulePageProps } from "@core/modules/types";
import { StaffForm } from "../components/StaffForm";
import { getProviderStaff } from "../repository";

export async function EditStaffPage({ params }: ModulePageProps) {
  const providerId = params.providerId;
  const providerStaffId = params.providerStaffId;
  const staff = await getProviderStaff(providerId, providerStaffId);
  if (!staff) notFound();
  return <div><PageHeader title="Edit staff" description="Update staff profile, title, specialty, image and active status." /><StaffForm providerId={providerId} staff={staff} /></div>;
}
