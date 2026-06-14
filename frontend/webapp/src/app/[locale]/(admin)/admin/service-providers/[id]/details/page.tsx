import React, { Suspense } from "react";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

import MultiServerFetchResult from "@/components/fetcher/multi-fetch.server";
import { PageHeader } from "@/components/page/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ServiceProviderAdminDashboard } from "@/features/service-providers/components/admin/service-provider-admin-dashboard";
import {
  AdminProviderLookupData,
  AdminServiceProviderDetails,
  getAdminProviderLookupData,
  getAdminServiceProviderById,
} from "@/features/service-providers/db/admin-service-providers.queries";
import { TRANSLATION_KEY } from "@/features/service-providers/types/constants";
import { PageProps } from "@/types/next";

export async function generateMetadata(
  props: Omit<PageProps, "children">
): Promise<Metadata> {
  const { locale } = await props.params;
  const t = await getTranslations({ locale, namespace: TRANSLATION_KEY });

  return {
    title: t("details.page.title"),
    description: t("details.page.description"),
  };
}

interface ServiceProviderDetailsPageProps extends PageProps {
  params: Promise<{ locale: string; id: string }>;
}

const ServiceProviderDetailsPage = ({ params }: ServiceProviderDetailsPageProps) => {
  return (
    <Suspense fallback={<DetailsSkeleton />}>
      <SuspenseBoundary params={params} />
    </Suspense>
  );
};

const SuspenseBoundary = async ({ params }: { params: Promise<{ locale: string; id: string }> }) => {
  const { id, locale } = await params;
  if (!id) notFound();

  const t = await getTranslations({ locale, namespace: TRANSLATION_KEY });
  const [providerResult, lookupsResult] = await Promise.all([
    getAdminServiceProviderById(locale, id),
    getAdminProviderLookupData(locale),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader title={t("details.title")} />
      <MultiServerFetchResult<[AdminServiceProviderDetails, AdminProviderLookupData]> results={[providerResult, lookupsResult]}>
        {([provider, lookups]) => <ServiceProviderAdminDashboard provider={provider} lookups={lookups} locale={locale} />}
      </MultiServerFetchResult>
    </div>
  );
};

function DetailsSkeleton() {
  return (
    <Card>
      <CardHeader className="border-b"><CardTitle><Skeleton className="h-8 w-64" /></CardTitle></CardHeader>
      <CardContent className="space-y-4 pt-6">
        {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
      </CardContent>
    </Card>
  );
}

export default ServiceProviderDetailsPage;
