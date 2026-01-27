import React, { Suspense } from "react";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import ServerFetchResult from "@/components/fetcher/fetch.server";
import LocaleBoundary from "@/components/locale/locale-boundary";
import { PageHeader } from "@/components/page/page-header";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { withBaseHeaders } from "@/config/http/http-service.server";
import { getServiceDefinitionById } from "@/features/service-definitions/api/server/get-service-definition-by-id";
import {
  ServiceDefinitionForm,
  ServiceDefinitionFormSkeleton,
} from "@/features/service-definitions/components/service-definition-form";
import { SERVICE_DEFINITION_TRANSLATION_KEY } from "@/features/service-definitions/constants";
import { ServiceDefinitionDetails } from "@/features/service-definitions/types/service-definition";
import { PageParams, PageProps } from "@/types/next";

interface UpdateServiceDefinitionPageProps extends PageParams {
  serviceDefinitionId: string;
}

export async function generateMetadata(
  props: PageProps<UpdateServiceDefinitionPageProps>
): Promise<Metadata> {
  const { locale } = await props.params;
  const t = await getTranslations({
    locale,
    namespace: SERVICE_DEFINITION_TRANSLATION_KEY,
  });

  return {
    title: t("update.page.title"),
    description: t("update.page.description"),
  };
}

const UpdateServiceDefinitionPage = async ({
  params,
}: PageProps<UpdateServiceDefinitionPageProps>) => {
  return (
    <Suspense fallback={<UpdateServiceDefinitionPageSkeleton />}>
      <SuspenseBoundary params={params} />
    </Suspense>
  );
};

const UpdateServiceDefinitionPageSkeleton = () => {
  return (
    <Card>
      <CardHeader className="flex-between">
        <CardTitle>
          <Skeleton className="h-10 w-32" />
        </CardTitle>
      </CardHeader>
      <ServiceDefinitionFormSkeleton />
    </Card>
  );
};

const SuspenseBoundary = async ({
  params,
}: {
  params: Promise<{ locale: string; serviceDefinitionId: string }>;
}) => {
  const { serviceDefinitionId } = await params;

  const result = await withBaseHeaders((locale, token) => {
    return getServiceDefinitionById(serviceDefinitionId, { locale, token });
  });

  return (
    <LocaleBoundary
      params={params}
      tanslationNameSpace={SERVICE_DEFINITION_TRANSLATION_KEY}
    >
      {(t) => (
        <Card>
          <CardHeader className="flex-between border-b">
            <CardTitle>
              <PageHeader title={t("update.title")} />
            </CardTitle>
          </CardHeader>
          <ServerFetchResult<ServiceDefinitionDetails>
            singleData
            result={result}
          >
            {(serviceDefinition) => (
              <ServiceDefinitionForm serviceDefinition={serviceDefinition} />
            )}
          </ServerFetchResult>
        </Card>
      )}
    </LocaleBoundary>
  );
};

export default UpdateServiceDefinitionPage;
