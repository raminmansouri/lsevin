import React, { Suspense } from "react";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import ServerFetchResult from "@/components/fetcher/fetch.server";
import { PageHeader } from "@/components/page/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ServiceProviderAdminForm } from "@/features/service-providers/components/admin/service-provider-admin-form";
import { getAdminProviderLookupData } from "@/features/service-providers/db/admin-service-providers.queries";
import { TRANSLATION_KEY } from "@/features/service-providers/types/constants";
import { PageProps } from "@/types/next";

export async function generateMetadata(
  props: Omit<PageProps, "children">
): Promise<Metadata> {
  const { locale } = await props.params;
  const t = await getTranslations({ locale, namespace: TRANSLATION_KEY });

  return {
    title: t("add.page.title"),
    description: t("add.page.description"),
  };
}

const AddServiceProviderPage = ({ params }: PageProps) => {
  return (
    <Suspense fallback={<ServiceProviderFormSkeleton />}>
      <SuspenseBoundary params={params} />
    </Suspense>
  );
};

const SuspenseBoundary = async ({ params }: { params: Promise<{ locale: string }> }) => {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: TRANSLATION_KEY });
  const lookupsResult = await getAdminProviderLookupData(locale);

  return (
    <div className="space-y-6">
      <PageHeader title={t("add.title")} />
      <ServerFetchResult result={lookupsResult}>
        {(lookups) => <ServiceProviderAdminForm lookups={lookups} locale={locale} />}
      </ServerFetchResult>
    </div>
  );
};

function ServiceProviderFormSkeleton() {
  return (
    <Card>
      <CardHeader className="border-b"><CardTitle><Skeleton className="h-8 w-64" /></CardTitle></CardHeader>
      <CardContent className="space-y-4 pt-6">
        {Array.from({ length: 10 }).map((_, i) => <Skeleton key={i} className="h-11 w-full" />)}
      </CardContent>
    </Card>
  );
}

export default AddServiceProviderPage;
