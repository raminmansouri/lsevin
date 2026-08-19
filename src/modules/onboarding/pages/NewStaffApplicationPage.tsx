import { PageHeader } from "@core/ui/PageHeader";
import { ApplicationForm } from "../components/ApplicationForm";
import { listProviderTypes } from "../repository";

export async function NewStaffApplicationPage() {
  const providerTypes = await listProviderTypes();
  return (
    <div>
      <PageHeader title="Claim or create a staff profile" description="Submit your staff profile ownership request. Clinic confirmation and LSevin approval are required before profile management is enabled." />
      <ApplicationForm providerTypes={providerTypes} mode="staff" />
    </div>
  );
}
