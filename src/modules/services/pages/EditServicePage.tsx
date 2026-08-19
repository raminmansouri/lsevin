import { notFound } from "next/navigation";
import { PageHeader } from "@core/ui/PageHeader";
import type { ModulePageProps } from "@core/modules/types";
import { ServiceForm } from "../components/ServiceForm";
import { getProviderService, listServiceDefinitions } from "../repository";

export async function EditServicePage({ params }: ModulePageProps) {
  const providerId = params.providerId;
  const serviceId = params.serviceId;
  const [definitions, service] = await Promise.all([listServiceDefinitions(), getProviderService(providerId, serviceId)]);
  if (!service) notFound();
  return <div><PageHeader title="Edit service" /><ServiceForm providerId={providerId} definitions={definitions} service={service} /></div>;
}
