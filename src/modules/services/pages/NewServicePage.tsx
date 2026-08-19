import { PageHeader } from "@core/ui/PageHeader";
import type { ModulePageProps } from "@core/modules/types";
import { ServiceForm } from "../components/ServiceForm";
import { listServiceDefinitions } from "../repository";

export async function NewServicePage({ params }: ModulePageProps) {
  const providerId = params.providerId;
  const definitions = await listServiceDefinitions();
  return <div><PageHeader title="New service" description="Attach a global LSevin service definition to this provider." /><ServiceForm providerId={providerId} definitions={definitions} /></div>;
}
