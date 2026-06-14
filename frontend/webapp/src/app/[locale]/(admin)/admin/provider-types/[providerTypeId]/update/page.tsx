import React, { Suspense } from "react";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import ServerFetchResult from "@/components/fetcher/fetch.server";
import LocaleBoundary from "@/components/locale/locale-boundary";
import { PageHeader } from "@/components/page/page-header";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { withBaseHeaders } from "@/config/http/http-service.server";
import { getProviderTypeById } from "@/features/provider-types/api/server/get-provider-type-by-id";
import {
  ProviderTypeForm,
  ProviderTypeFormSkeleton,
} from "@/features/provider-types/components/provider-type-form";
import { ProviderAttributeDefinitionManager } from "@/features/provider-types/components/provider-attribute-definition-manager";
import { PROVIDER_TYPE_TRANSLATION_KEY } from "@/features/provider-types/constants";
import { ProviderType } from "@/features/provider-types/types/provider-type";
import { PageParams, PageProps } from "@/types/next";

interface UpdateProviderTypePageProps extends PageParams {
  providerTypeId: string;
}

export async function generateMetadata(
  props: PageProps<UpdateProviderTypePageProps>
): Promise<Metadata> {
  const { locale } = await props.params;
  const t = await getTranslations({
    locale,
    namespace: PROVIDER_TYPE_TRANSLATION_KEY,
  });

  return {
    title: t("update.page.title"),
    description: t("update.page.description"),
  };
}

const UpdateProviderTypePage = async ({
  params,
}: PageProps<UpdateProviderTypePageProps>) => {
  return (
    <Suspense fallback={<UpdateProviderTypePageSkeleton />}>
      <SuspenseBoundary params={params} />
    </Suspense>
  );
};

const UpdateProviderTypePageSkeleton = () => {
  return (
    <Card>
      <CardHeader className="flex-between">
        <CardTitle>
          <Skeleton className="h-10 w-32" />
        </CardTitle>
      </CardHeader>
      <ProviderTypeFormSkeleton />
    </Card>
  );
};

const SuspenseBoundary = async ({
  params,
}: {
  params: Promise<{ locale: string; providerTypeId: string }>;
}) => {
  const { providerTypeId } = await params;

  const result = await withBaseHeaders((locale, token) => {
    return getProviderTypeById(providerTypeId, { locale, token });
  });

  return (
    <LocaleBoundary
      params={params}
      tanslationNameSpace={PROVIDER_TYPE_TRANSLATION_KEY}
    >
      {(t) => (
        <Card>
          <CardHeader className="flex-between border-b">
            <CardTitle>
              <PageHeader title={t("update.title")} />
            </CardTitle>
          </CardHeader>
          <ServerFetchResult<ProviderType> singleData result={result}>
            {(providerType) => (
              <>
                <ProviderTypeForm providerType={providerType} />
                <div className="border-t p-6">
                  <ProviderAttributeDefinitionManager providerType={providerType} />
                </div>
              </>
            )}
          </ServerFetchResult>
        </Card>
      )}
    </LocaleBoundary>
  );
};

export default UpdateProviderTypePage;
