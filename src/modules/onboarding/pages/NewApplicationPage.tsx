import { PageHeader } from "@core/ui/PageHeader";
import { ApplicationForm } from "../components/ApplicationForm";
import { listProviderTypes } from "../repository";

export async function NewApplicationPage() {
  const providerTypes = await listProviderTypes();
  return (
    <div>
      <PageHeader title="Become a provider" description="Submit your provider information. LSevin admins can approve it and create or attach a provider workspace." />
      <ApplicationForm providerTypes={providerTypes} mode="provider" />
    </div>
  );
}
