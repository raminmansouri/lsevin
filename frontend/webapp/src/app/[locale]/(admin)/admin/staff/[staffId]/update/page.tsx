import { Suspense } from "react";
import type { Metadata } from "next";

import ServerFetchResult from "@/components/fetcher/fetch.server";
import { PageHeader } from "@/components/page/page-header";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { getStaffById } from "@/features/staff/api/server/get-staff-by-id";
import { StaffForm, StaffFormSkeleton } from "@/features/staff/components/staff-form";
import { getStaffFormOptions } from "@/features/staff/lib/staff-db";
import type { StaffDetails } from "@/features/staff/types";
import type { PageProps } from "@/types/next";

type UpdateStaffPageParams = {
  locale: string;
  staffId: string;
};

export const metadata: Metadata = {
  title: "Update staff",
  description: "Update a staff profile and all related records.",
};

const UpdateStaffPage = ({ params }: PageProps<UpdateStaffPageParams>) => {
  return (
    <Suspense fallback={<UpdateStaffPageSkeleton />}>
      <SuspenseBoundary params={params} />
    </Suspense>
  );
};

const UpdateStaffPageSkeleton = () => (
  <Card className="border-gray-200 shadow-sm">
    <CardHeader className="border-b">
      <CardTitle>
        <PageHeader title="Update staff" />
      </CardTitle>
    </CardHeader>
    <StaffFormSkeleton />
  </Card>
);

const SuspenseBoundary = async ({ params }: { params: Promise<UpdateStaffPageParams> }) => {
  const { locale, staffId } = await params;
  const [result, options] = await Promise.all([
    getStaffById(staffId, { locale }),
    getStaffFormOptions(locale),
  ]);

  return (
    <Card className="border-gray-200 shadow-sm">
      <CardHeader className="border-b bg-gradient-to-r from-[#083f30]/5 to-[#eac074]/10">
        <CardTitle>
          <PageHeader title="Update staff" description="Edit core profile, services, availability, credentials, provider links, and media." />
        </CardTitle>
      </CardHeader>
      <ServerFetchResult<StaffDetails> singleData result={result}>
        {(staff) => <StaffForm staff={staff} options={options} />}
      </ServerFetchResult>
    </Card>
  );
};

export default UpdateStaffPage;
