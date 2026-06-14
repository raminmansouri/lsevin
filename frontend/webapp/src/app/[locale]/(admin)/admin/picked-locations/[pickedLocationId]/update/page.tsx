import { Suspense } from "react";
import { Metadata } from "next";

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

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Update picked location",
    description: "Update picked location",
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
  const result = await getPickedLocationByIdFromDb(pickedLocationId, locale);

  return (
    <Card>
      <CardHeader className="flex-between border-b">
        <CardTitle>
          <PageHeader title="Update picked location" />
        </CardTitle>
      </CardHeader>
      <ServerFetchResult<PickedLocationDetails> singleData result={result}>
        {(pickedLocation) => <PickedLocationForm pickedLocation={pickedLocation} />}
      </ServerFetchResult>
    </Card>
  );
};

export default UpdatePickedLocationPage;
