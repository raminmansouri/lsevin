import React, { Suspense } from "react";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import ServerFetchResult from "@/components/fetcher/fetch.server";
import { PageHeader } from "@/components/page/page-header";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { withBaseHeaders } from "@/config/http/http-service.server";
import ServiceProviderForm, {
  ServiceProviderFormSkeleton,
} from "@/features/service-providers/components/service-provider-data-entry/service-provider-form";
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
    title: t("add.page.title"),
    description: t("add.page.description"),
  };
}

const AddServiceProviderPage = ({ params }: PageProps) => {
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
  params: Promise<{ locale: string }>;
}) => {
  const { locale } = await params;
  const t = await getTranslations({
    locale,
    namespace: TRANSLATION_KEY,
  });

  const countriesResult = await withBaseHeaders(
    (locale, token) => getAllCountries({ locale, token }),
    {
      adminRequired: true,
    }
  );

  return (
    <Card>
      <CardHeader className="flex-between border-b">
        <CardTitle>
          <PageHeader title={t("add.title")} />
        </CardTitle>
      </CardHeader>
      <ServerFetchResult<ILocationCountry[]> result={countriesResult}>
        {(countries) => <ServiceProviderForm countries={countries} />}
      </ServerFetchResult>
    </Card>
  );
};

export default AddServiceProviderPage;
