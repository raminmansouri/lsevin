import { Suspense } from "react";
import { Metadata } from "next";

import { PageHeader } from "@/components/page/page-header";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import {
  PickedLocationForm,
  PickedLocationFormSkeleton,
} from "@/features/picked-locations/components/picked-location-form";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Add picked location",
    description: "Create a picked location for the mobile home location picker",
  };
}

const AddPickedLocationPage = async () => {
  return (
    <Suspense fallback={<AddPickedLocationPageSkeleton />}>
      <Card>
        <CardHeader className="flex-between border-b">
          <CardTitle>
            <PageHeader title="Add picked location" />
          </CardTitle>
        </CardHeader>
        <PickedLocationForm />
      </Card>
    </Suspense>
  );
};

const AddPickedLocationPageSkeleton = () => {
  return (
    <Card>
      <CardHeader className="flex-between border-b">
        <CardTitle>
          <PageHeader title="Add picked location" />
        </CardTitle>
      </CardHeader>
      <PickedLocationFormSkeleton />
    </Card>
  );
};

export default AddPickedLocationPage;
