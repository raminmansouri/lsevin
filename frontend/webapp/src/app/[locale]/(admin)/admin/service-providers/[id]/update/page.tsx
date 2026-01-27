import React, { Suspense } from "react";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

import MultiServerFetchResult from "@/components/fetcher/multi-fetch.server";
import { PageHeader } from "@/components/page/page-header";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { withBaseHeaders } from "@/config/http/http-service.server";
import { getServiceProviderById } from "@/features/service-providers/api/server/get-service-provider-by-id";
import ServiceProviderForm, {
  ServiceProviderFormSkeleton,
} from "@/features/service-providers/components/service-provider-data-entry/service-provider-form";
import { ServiceProviderDetails } from "@/features/service-providers/types";
import { TRANSLATION_KEY } from "@/features/service-providers/types/constants";
import { getAllCountries } from "@/features/shared/api/server/get-all-countries";
import { ILocationCountry } from "@/features/shared/types/location";
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
    title: t("update.page.title"),
    description: t("update.page.description"),
  };
}

interface UpdateServiceProviderPageProps extends PageProps {
  params: Promise<{ locale: string; id: string }>;
}

const UpdateServiceProviderPage = ({
  params,
}: UpdateServiceProviderPageProps) => {
  return (
    <Suspense
      fallback={
        <Card>
          <CardHeader className="flex-between border-b">
            <CardTitle>
              <PageHeader title="" />
            </CardTitle>
          </CardHeader>
          <ServiceProviderFormSkeleton />
        </Card>
      }
    >
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

  const serviceProviderPromise = withBaseHeaders(
    async (locale, token) => {
      return getServiceProviderById({ locale, token }, id);
    },
    {
      adminRequired: true,
    }
  );

  const countriesPromise = withBaseHeaders(
    (locale, token) => getAllCountries({ locale, token }),
    {
      adminRequired: true,
    }
  );

  const [serviceProviderResult, countriesResult] = await Promise.all([
    serviceProviderPromise,
    countriesPromise,
  ]);
  return (
    <Card>
      <CardHeader className="flex-between border-b">
        <CardTitle>
          <PageHeader title={t("update.title")} />
        </CardTitle>
      </CardHeader>
      <MultiServerFetchResult<[ServiceProviderDetails, ILocationCountry[]]>
        results={[serviceProviderResult, countriesResult]}
      >
        {([serviceProvider, countries]) => {
          return (
            <ServiceProviderForm
              serviceProvider={serviceProvider}
              countries={countries}
            />
          );
        }}
      </MultiServerFetchResult>
    </Card>
  );
};

export default UpdateServiceProviderPage;
