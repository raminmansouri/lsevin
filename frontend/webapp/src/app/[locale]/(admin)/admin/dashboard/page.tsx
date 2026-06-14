import React, { Suspense } from "react";
import { getTranslations } from "next-intl/server";

import ServerFetchResult from "@/components/fetcher/fetch.server";
import MultiServerFetchResult from "@/components/fetcher/multi-fetch.server";
import LocaleBoundary from "@/components/locale/locale-boundary";
import { PageHeader } from "@/components/page/page-header";
import { withBaseHeaders } from "@/config/http/http-service.server";
import { getCategories } from "@/features/categories/api/server/get-categories";
import { Category } from "@/features/categories/types/category";
import { getConsultingsByAdmin } from "@/features/consulting/api/server/get-consultings-by-admin";
import { IConsulting } from "@/features/consulting/types";
import {
  DashboardQuickActions,
  DashboardQuickActionsSkeleton,
} from "@/features/dashboard-overview/components/dashboard-quick-actions";
import {
  DashboardRecentConsultings,
  DashboardRecentConsultingsSkeleton,
} from "@/features/dashboard-overview/components/dashboard-recent-consultings";
import {
  DashboardRecentRequests,
  DashboardRecentRequestsSkeleton,
} from "@/features/dashboard-overview/components/dashboard-recent-requests";
import {
  DashboardStatsCards,
  DashboardStatsCardsSkeleton,
} from "@/features/dashboard-overview/components/dashboard-stats-cards";
import { DashboardStats } from "@/features/dashboard-overview/types";
import {
  DASHBOARD_RECENT_ITEMS_LIMIT,
  DASHBOARD_TRANSLATION_KEY,
} from "@/features/dashboard-overview/types/constants";
import { getProviderTypes } from "@/features/provider-types/api/server/get-provider-types";
import { ProviderType } from "@/features/provider-types/types/provider-type";
import { getServiceDefinitions } from "@/features/service-definitions/api/server/get-service-definitions";
import { ServiceDefinition } from "@/features/service-definitions/types/service-definition";
import { getServiceProviderRequestsByAdmin } from "@/features/service-providers/api/server/get-service-provider-requests-by-admin";
import { getServiceProviders } from "@/features/service-providers/api/server/get-service-providers";
import {
  IServiceProviderRequestAdmin,
  ServiceProvider,
} from "@/features/service-providers/types";
import { getStaff } from "@/features/staff/api/server/get-staff";
import { Staff } from "@/features/staff/types";
import { FilterParams } from "@/types/filter";
import { PaginatedResult } from "@/types/network";
import {
  LocalePageProps,
  SearchComponentProps,
  TranslationType,
} from "@/types/next";

export async function generateMetadata(
  props: Omit<LocalePageProps, "children">
) {
  const { locale } = await props.params;
  const t = await getTranslations({
    locale,
    namespace: DASHBOARD_TRANSLATION_KEY,
  });
  return {
    title: t("page.title"),
    description: t("page.description"),
  };
}

const AdminDashboardOverviewPage = ({
  params,
}: Omit<SearchComponentProps, "searchParams">) => {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <LocaleBoundary
        params={params}
        tanslationNameSpace={DASHBOARD_TRANSLATION_KEY}
      >
        {(t) => (
          <div className="space-y-6">
            <div className="space-y-2">
              <PageHeader title={t("page.title")} />
              <p className="text-muted-foreground">{t("page.description")}</p>
            </div>

            {/* Stats Cards */}
            <Suspense fallback={<DashboardStatsCardsSkeleton />}>
              <StatsSuspenseBoundary t={t} />
            </Suspense>

            {/* Recent Activity Section */}
            <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
              <Suspense fallback={<DashboardRecentConsultingsSkeleton />}>
                <RecentConsultingsSuspenseBoundary t={t} />
              </Suspense>
              <Suspense fallback={<DashboardRecentRequestsSkeleton />}>
                <RecentRequestsSuspenseBoundary t={t} />
              </Suspense>
            </div>

            {/* Quick Actions */}
            <Suspense fallback={<DashboardQuickActionsSkeleton />}>
              <QuickActionsSuspenseBoundary t={t} />
            </Suspense>
          </div>
        )}
      </LocaleBoundary>
    </Suspense>
  );
};

// Stats Cards Suspense Boundary - fetches counts from all entities
const StatsSuspenseBoundary = async ({ t }: { t: TranslationType }) => {
  const filterParams: FilterParams = {
    pageNumber: 1,
    pageSize: 1, // Just need count, so minimal page size
    filters: "",
    startDate: "",
    endDate: "",
    sortOrder: "",
  };

  const pendingRequestsFilter: FilterParams = {
    ...filterParams,
    filters: "status:Pending", // Filter for pending requests only
  };

  // Fetch all counts in parallel
  const [
    consultingsResult,
    serviceProvidersResult,
    categoriesResult,
    staffResult,
    providerTypesResult,
    serviceDefinitionsResult,
    pendingRequestsResult,
  ] = await Promise.all([
    withBaseHeaders((locale, token) =>
      getConsultingsByAdmin({ locale, token }, filterParams)
    ),
    withBaseHeaders((locale, token) =>
      getServiceProviders({ locale, token }, filterParams)
    ),
    withBaseHeaders((locale, token) =>
      getCategories({ locale, token }, filterParams)
    ),
    withBaseHeaders((locale, token) =>
      getStaff({ locale, token }, filterParams)
    ),
    withBaseHeaders((locale, token) =>
      getProviderTypes({ locale, token }, filterParams)
    ),
    withBaseHeaders((locale, token) =>
      getServiceDefinitions({ locale, token }, filterParams)
    ),
    withBaseHeaders((locale, token) =>
      getServiceProviderRequestsByAdmin(
        { locale, token },
        pendingRequestsFilter
      )
    ),
  ]);

  return (
    <MultiServerFetchResult<
      [
        PaginatedResult<IConsulting>,
        PaginatedResult<ServiceProvider>,
        PaginatedResult<Category>,
        PaginatedResult<Staff>,
        PaginatedResult<ProviderType>,
        PaginatedResult<ServiceDefinition>,
        PaginatedResult<IServiceProviderRequestAdmin>,
      ]
    >
      results={[
        consultingsResult,
        serviceProvidersResult,
        categoriesResult,
        staffResult,
        providerTypesResult,
        serviceDefinitionsResult,
        pendingRequestsResult,
      ]}
    >
      {([
        consultings,
        serviceProviders,
        categories,
        staff,
        providerTypes,
        serviceDefinitions,
        pendingRequests,
      ]) => {
        const stats: DashboardStats = {
          totalConsultings: consultings?.totalCount || 0,
          totalServiceProviders: serviceProviders?.totalCount || 0,
          totalCategories: categories?.totalCount || 0,
          totalStaff: staff?.totalCount || 0,
          totalProviderTypes: providerTypes?.totalCount || 0,
          totalServiceDefinitions: serviceDefinitions?.totalCount || 0,
          pendingServiceProviderRequests: pendingRequests?.totalCount || 0,
          pendingConsultingRequests: 0, // Will be calculated if needed
        };

        return <DashboardStatsCards stats={stats} t={t} />;
      }}
    </MultiServerFetchResult>
  );
};

// Recent Consultings Suspense Boundary
const RecentConsultingsSuspenseBoundary = async ({
  t,
}: {
  t: TranslationType;
}) => {
  const filterParams: FilterParams = {
    pageNumber: 1,
    pageSize: DASHBOARD_RECENT_ITEMS_LIMIT,
    filters: "",
    startDate: "",
    endDate: "",
    sortOrder: "createDate:desc",
  };

  const result = await withBaseHeaders((locale, token) =>
    getConsultingsByAdmin({ locale, token }, filterParams)
  );

  return (
    <ServerFetchResult<PaginatedResult<IConsulting>> result={result}>
      {(data) => <DashboardRecentConsultings consultings={data.items} t={t} />}
    </ServerFetchResult>
  );
};

// Recent Requests Suspense Boundary
const RecentRequestsSuspenseBoundary = async ({
  t,
}: {
  t: TranslationType;
}) => {
  const filterParams: FilterParams = {
    pageNumber: 1,
    pageSize: DASHBOARD_RECENT_ITEMS_LIMIT,
    filters: "",
    startDate: "",
    endDate: "",
    sortOrder: "createDate:desc",
  };

  const result = await withBaseHeaders((locale, token) =>
    getServiceProviderRequestsByAdmin({ locale, token }, filterParams)
  );

  return (
    <ServerFetchResult<PaginatedResult<IServiceProviderRequestAdmin>>
      result={result}
    >
      {(data) => <DashboardRecentRequests requests={data.items} t={t} />}
    </ServerFetchResult>
  );
};

// Quick Actions Suspense Boundary - reuses the stats calculation
const QuickActionsSuspenseBoundary = async ({ t }: { t: TranslationType }) => {
  const filterParams: FilterParams = {
    pageNumber: 1,
    pageSize: 1,
    filters: "",
    startDate: "",
    endDate: "",
    sortOrder: "",
  };

  // Fetch all counts for quick actions
  const [
    consultingsResult,
    serviceProvidersResult,
    categoriesResult,
    staffResult,
    providerTypesResult,
    serviceDefinitionsResult,
  ] = await Promise.all([
    withBaseHeaders((locale, token) =>
      getConsultingsByAdmin({ locale, token }, filterParams)
    ),
    withBaseHeaders((locale, token) =>
      getServiceProviders({ locale, token }, filterParams)
    ),
    withBaseHeaders((locale, token) =>
      getCategories({ locale, token }, filterParams)
    ),
    withBaseHeaders((locale, token) =>
      getStaff({ locale, token }, filterParams)
    ),
    withBaseHeaders((locale, token) =>
      getProviderTypes({ locale, token }, filterParams)
    ),
    withBaseHeaders((locale, token) =>
      getServiceDefinitions({ locale, token }, filterParams)
    ),
  ]);

  return (
    <MultiServerFetchResult<
      [
        PaginatedResult<IConsulting>,
        PaginatedResult<ServiceProvider>,
        PaginatedResult<Category>,
        PaginatedResult<Staff>,
        PaginatedResult<ProviderType>,
        PaginatedResult<ServiceDefinition>,
      ]
    >
      results={[
        consultingsResult,
        serviceProvidersResult,
        categoriesResult,
        staffResult,
        providerTypesResult,
        serviceDefinitionsResult,
      ]}
    >
      {([
        consultings,
        serviceProviders,
        categories,
        staff,
        providerTypes,
        serviceDefinitions,
      ]) => {
        const stats: DashboardStats = {
          totalConsultings: consultings?.totalCount || 0,
          totalServiceProviders: serviceProviders?.totalCount || 0,
          totalCategories: categories?.totalCount || 0,
          totalStaff: staff?.totalCount || 0,
          totalProviderTypes: providerTypes?.totalCount || 0,
          totalServiceDefinitions: serviceDefinitions?.totalCount || 0,
          pendingServiceProviderRequests: 0,
          pendingConsultingRequests: 0,
        };

        return <DashboardQuickActions stats={stats} t={t} />;
      }}
    </MultiServerFetchResult>
  );
};

// Dashboard Skeleton Fallback
const DashboardSkeleton = () => {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="bg-muted h-8 w-48 animate-pulse rounded" />
        <div className="bg-muted h-4 w-96 animate-pulse rounded" />
      </div>
      <DashboardStatsCardsSkeleton />
      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
        <DashboardRecentConsultingsSkeleton />
        <DashboardRecentRequestsSkeleton />
      </div>
      <DashboardQuickActionsSkeleton />
    </div>
  );
};

export default AdminDashboardOverviewPage;
