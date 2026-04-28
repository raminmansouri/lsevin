import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/page/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SERVICE_RELATIONS_TRANSLATION_KEY } from "@/features/service-relations/constants";
import getProviderServiceRelations from "@/features/service-relations/api/server/get-provider-service-relations";
import ServiceAttributeValuesManager from "@/features/service-relations/components/service-attribute-values-manager";

type Props = {
  params: Promise<{
    locale: string;
    serviceId: string;
  }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: SERVICE_RELATIONS_TRANSLATION_KEY });
  return {
    title: t("pages.serviceAttributeValues.title", { default: "Attribute Values" }),
  };
}

export default async function Page({ params }: Props) {
  const { locale, serviceId } = await params;
  const details = await getProviderServiceRelations(serviceId, locale);

  if (!details) {
    notFound();
  }

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>
          <PageHeader title={`${details.providerServiceName} · Attribute Values`} />
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <ServiceAttributeValuesManager providerServiceId={details.providerServiceId} items={details.attributeValues} availableDefinitions={details.availableAttributeDefinitions} />
      </CardContent>
    </Card>
  );
}
