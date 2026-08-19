import { LinkButton } from "@core/ui/Button";
import { EmptyState } from "@core/ui/EmptyState";
import { PageHeader } from "@core/ui/PageHeader";
import type { ModulePageProps } from "@core/modules/types";
import { ServicesTable } from "../components/ServicesTable";
import { listProviderServices } from "../repository";

export async function ServicesPage({ params }: ModulePageProps) {
  const providerId = params.providerId;
  const services = await listProviderServices(providerId);
  return <div><PageHeader title="Services" description="Provider-specific prices, names, durations and booking settings." action={<LinkButton href={`/providers/${providerId}/services/new`}>New service</LinkButton>} />{services.length ? <ServicesTable providerId={providerId} services={services} /> : <EmptyState title="No services yet" action={<LinkButton href={`/providers/${providerId}/services/new`}>Add service</LinkButton>} />}</div>;
}
