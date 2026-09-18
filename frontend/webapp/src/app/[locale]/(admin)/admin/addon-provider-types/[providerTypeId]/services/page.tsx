import { Metadata } from "next";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/page/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ProviderTypeAddonServiceDefinitionsManager from "@/features/service-relations/components/provider-type-addon-service-definitions-manager";
import {
  getProviderTypeSummary,
  listServiceDefinitionsOfferingProviderTypeAddon,
} from "@/features/service-relations/server/repository";

type Props = {
  params: Promise<{
    locale: string;
    providerTypeId: string;
  }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, providerTypeId } = await params;
  const providerType = await getProviderTypeSummary(providerTypeId, locale);
  return { title: providerType ? `${providerType.name} · Service Definitions` : "Add-on Provider Type" };
}

export default async function Page({ params }: Props) {
  const { locale, providerTypeId } = await params;
  const providerType = await getProviderTypeSummary(providerTypeId, locale);
  if (!providerType) notFound();

  const linked = await listServiceDefinitionsOfferingProviderTypeAddon(providerTypeId, locale);

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>
          <PageHeader title={`${providerType.name} · Service Definitions`} />
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <ProviderTypeAddonServiceDefinitionsManager providerTypeId={providerType.id} initialLinked={linked} />
      </CardContent>
    </Card>
  );
}
