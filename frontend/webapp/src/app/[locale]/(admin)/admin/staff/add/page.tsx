import type { Metadata } from "next";

import { PageHeader } from "@/components/page/page-header";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { StaffForm } from "@/features/staff/components/staff-form";
import { getStaffFormOptions } from "@/features/staff/lib/staff-db";
import type { PageProps } from "@/types/next";

export const metadata: Metadata = {
  title: "Add staff",
  description: "Create a full staff profile with all related staff tables.",
};

const AddStaffPage = async ({ params }: PageProps) => {
  const { locale } = await params;
  const options = await getStaffFormOptions(locale);

  return (
    <Card className="border-gray-200 shadow-sm">
      <CardHeader className="border-b bg-gradient-to-r from-[#083f30]/5 to-[#eac074]/10">
        <CardTitle>
          <PageHeader title="Add staff" description="Create the core profile and all related staff records in one place." />
        </CardTitle>
      </CardHeader>
      <StaffForm options={options} locale={locale} />
    </Card>
  );
};

export default AddStaffPage;
