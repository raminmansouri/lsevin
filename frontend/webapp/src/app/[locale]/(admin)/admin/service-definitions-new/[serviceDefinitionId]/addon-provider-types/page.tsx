import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/page/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SERVICE_RELATIONS_TRANSLATION_KEY } from "@/features/service-relations/constants";
import getServiceDefinitionRelations from "@/features/service-relations/api/server/get-service-definition-relations";
import ServiceDefinitionAddonProviderTypesManager from "@/features/service-relations/components/service-definition-addon-provider-types-manager";

type Props = {
  params: Promise<{
    locale: string;
    serviceDefinitionId: string;
  }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: SERVICE_RELATIONS_TRANSLATION_KEY });
  return {
    title: t("pages.addonProviderTypes.title", { default: "Add-on Provider Types" }),
  };
}

export default async function Page({ params }: Props) {
  const { locale, serviceDefinitionId } = await params;
  const details = await getServiceDefinitionRelations(serviceDefinitionId, locale);

  if (!details) {
    notFound();
  }

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>
          <PageHeader title={`${details.serviceDefinitionName} · Add-on Provider Types`} />
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <ServiceDefinitionAddonProviderTypesManager serviceDefinitionId={details.serviceDefinitionId} items={details.addonProviderTypes} />
      </CardContent>
    </Card>
  );
}
