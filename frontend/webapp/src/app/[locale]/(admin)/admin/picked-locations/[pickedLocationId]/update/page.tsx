import { Suspense } from "react";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import ServerFetchResult from "@/components/fetcher/fetch.server";
import { PageHeader } from "@/components/page/page-header";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  PickedLocationForm,
  PickedLocationFormSkeleton,
} from "@/features/picked-locations/components/picked-location-form";
import { getPickedLocationByIdFromDb } from "@/features/picked-locations/db/picked-location-repository";
import { PickedLocationDetails } from "@/features/picked-locations/types";
import { PageParams, PageProps } from "@/types/next";

interface UpdatePickedLocationPageParams extends PageParams {
  pickedLocationId: string;
}

export async function generateMetadata({
  params,
}: PageProps<UpdatePickedLocationPageParams>): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({
    locale,
    namespace: "AdminPages.locationsPolicies.pickedLocations",
  });

  return {
    title: t("updateTitle"),
    description: t("updateTitle"),
  };
}

const UpdatePickedLocationPage = async ({
  params,
}: PageProps<UpdatePickedLocationPageParams>) => {
  return (
    <Suspense fallback={<UpdatePickedLocationPageSkeleton />}>
      <SuspenseBoundary params={params} />
    </Suspense>
  );
};

const UpdatePickedLocationPageSkeleton = () => {
  return (
    <Card>
      <CardHeader className="flex-between border-b">
        <CardTitle>
          <Skeleton className="h-10 w-48" />
        </CardTitle>
      </CardHeader>
      <PickedLocationFormSkeleton />
    </Card>
  );
};

const SuspenseBoundary = async ({
  params,
}: {
  params: Promise<{ locale: string; pickedLocationId: string }>;
}) => {
  const { locale, pickedLocationId } = await params;
  const [result, t] = await Promise.all([
    getPickedLocationByIdFromDb(pickedLocationId, locale),
    getTranslations({
      locale,
      namespace: "AdminPages.locationsPolicies.pickedLocations",
    }),
  ]);

  return (
    <Card>
      <CardHeader className="flex-between border-b">
        <CardTitle>
          <PageHeader title={t("updateTitle")} />
        </CardTitle>
      </CardHeader>
      <ServerFetchResult<PickedLocationDetails> singleData result={result}>
        {(pickedLocation) => <PickedLocationForm pickedLocation={pickedLocation} />}
      </ServerFetchResult>
    </Card>
  );
};

export default UpdatePickedLocationPage;
