import { Suspense } from "react";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { PageHeader } from "@/components/page/page-header";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import {
  PickedLocationForm,
  PickedLocationFormSkeleton,
} from "@/features/picked-locations/components/picked-location-form";
import { PageProps } from "@/types/next";

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({
    locale,
    namespace: "AdminPages.locationsPolicies.pickedLocations",
  });

  return {
    title: t("addTitle"),
    description: t("addDescription"),
  };
}

const AddPickedLocationPage = async ({ params }: PageProps) => {
  const { locale } = await params;
  const t = await getTranslations({
    locale,
    namespace: "AdminPages.locationsPolicies.pickedLocations",
  });
  const title = t("addTitle");

  return (
    <Suspense fallback={<AddPickedLocationPageSkeleton title={title} />}>
      <Card>
        <CardHeader className="flex-between border-b">
          <CardTitle>
            <PageHeader title={title} />
          </CardTitle>
        </CardHeader>
        <PickedLocationForm />
      </Card>
    </Suspense>
  );
};

const AddPickedLocationPageSkeleton = ({ title }: { title: string }) => {
  return (
    <Card>
      <CardHeader className="flex-between border-b">
        <CardTitle>
          <PageHeader title={title} />
        </CardTitle>
      </CardHeader>
      <PickedLocationFormSkeleton />
    </Card>
  );
};

export default AddPickedLocationPage;
