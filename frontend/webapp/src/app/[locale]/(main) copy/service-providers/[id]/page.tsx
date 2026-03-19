import { Suspense } from "react";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import MultiServerFetchResult from "@/components/fetcher/multi-fetch.server";
import LocaleBoundary from "@/components/locale/locale-boundary";
import { withBaseHeaders } from "@/config/http/http-service.server";
import { getCommentsByServiceProvider } from "@/features/service-providers/api/server/get-comments-by-service-provider";
import { getPublicServiceProvider } from "@/features/service-providers/api/server/get-public-service-provider";
import { AddCommentForm } from "@/features/service-providers/components/comments/add-comment-form";
import { CommentsList } from "@/features/service-providers/components/comments/comments-list";
import { ServiceProviderDetails } from "@/features/service-providers/components/service-provider-details-public/service-provider-details";
import { ServiceProviderDetailsSkeleton } from "@/features/service-providers/components/service-provider-details-public/service-provider-details-skeleton";
import {
  IServiceProviderComment,
  IServiceProviderDetails,
} from "@/features/service-providers/types";
import { SERVICE_PROVIDER_PAGE_TRANSLATION_KEY as TRANSLATION_KEY } from "@/features/service-providers/types/constants";
import { PaginatedResult } from "@/types/network";
import { ComponentProps, TranslationType } from "@/types/next";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations(TRANSLATION_KEY);

  return {
    title: t("title"),
    description: t("description"),
    keywords: t("keywords").split(","),
    openGraph: {
      title: t("title"),
      description: t("description"),
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: t("title"),
      description: t("description"),
    },
  };
}

const ServiceProviderPage = ({ params }: ComponentProps) => {
  return (
    <Suspense fallback={<ServiceProviderDetailsSkeleton />}>
      <LocaleBoundary tanslationNameSpace={TRANSLATION_KEY} params={params}>
        {(t) => <SuspenseBoundary params={params} t={t} />}
      </LocaleBoundary>
    </Suspense>
  );
};

const SuspenseBoundary = async ({
  params,
  t,
}: ComponentProps & { t: TranslationType }) => {
  const { id } = await params;

  // Fetch provider and initial comments in parallel
  const [providerResult, commentsResult] = await withBaseHeaders(
    (locale, token) =>
      Promise.all([
        getPublicServiceProvider({ locale, token }, id),
        getCommentsByServiceProvider({ locale, token }, id, {
          filters: "",
          startDate: "",
          endDate: "",
          pageNumber: 1,
          pageSize: 20,
          sortOrder: "",
        }),
      ])
  );

  return (
    <MultiServerFetchResult<
      [IServiceProviderDetails, PaginatedResult<IServiceProviderComment>]
    >
      results={[providerResult, commentsResult]}
    >
      {([serviceProvider, _]) => (
        <div className="container mx-auto px-0 pb-8 md:px-4">
          {/* Service Provider Details */}
          <ServiceProviderDetails serviceProvider={serviceProvider} t={t} />

          {/* Comments Section */}
          <div className="mt-12 flex flex-col gap-4 px-4 md:px-0">
            <h2 className="text-2xl font-bold">{t("Comments.title")}</h2>

            <AddCommentForm serviceProviderId={id} />

            <CommentsList serviceProviderId={id} />
          </div>
        </div>
      )}
    </MultiServerFetchResult>
  );
};

export default ServiceProviderPage;
