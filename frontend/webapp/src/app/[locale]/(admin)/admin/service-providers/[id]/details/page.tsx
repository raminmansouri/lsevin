import React, { Suspense } from "react";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

import ServerFetchResult from "@/components/fetcher/fetch.server";
import { PageHeader } from "@/components/page/page-header";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { withBaseHeaders } from "@/config/http/http-service.server";
import { getServiceProviderById } from "@/features/service-providers/api/server/get-service-provider-by-id";
import {
  ServiceProviderDetails,
  ServiceProviderDetailsSkeleton,
} from "@/features/service-providers/components/details/service-provider-details";
import { ServiceProviderDetails as ServiceProviderDetailsData } from "@/features/service-providers/types";
import { TRANSLATION_KEY } from "@/features/service-providers/types/constants";
import { PageProps } from "@/types/next";

export async function generateMetadata(
  props: Omit<PageProps, "children">
): Promise<Metadata> {
  const { locale } = await props.params;
  const t = await getTranslations({
    locale,
    namespace: TRANSLATION_KEY,
  });

  return {
    title: t("details.page.title"),
    description: t("details.page.description"),
  };
}

interface ServiceProviderDetailsPageProps extends PageProps {
  params: Promise<{ locale: string; id: string }>;
}

const ServiceProviderDetailsPage = ({
  params,
}: ServiceProviderDetailsPageProps) => {
  return (
    <Suspense fallback={<ServiceProviderDetailsSkeleton />}>
      <SuspenseBoundary params={params} />
    </Suspense>
  );
};

const SuspenseBoundary = async ({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) => {
  const { id, locale } = await params;

  if (!id) {
    notFound();
  }

  const t = await getTranslations({
    locale,
    namespace: TRANSLATION_KEY,
  });

  const serviceProviderResult = await withBaseHeaders(
    async (locale, token) => {
      return getServiceProviderById({ locale, token }, id);
    },
    {
      adminRequired: true,
    }
  );

  return (
    <Card>
      <CardHeader className="flex-between border-b">
        <CardTitle>
          <PageHeader title={t("details.title")} />
        </CardTitle>
      </CardHeader>
      <ServerFetchResult<ServiceProviderDetailsData>
        result={serviceProviderResult}
      >
        {(serviceProvider) => {
          return <ServiceProviderDetails serviceProvider={serviceProvider} />;
        }}
      </ServerFetchResult>
    </Card>
  );
};

export default ServiceProviderDetailsPage;
