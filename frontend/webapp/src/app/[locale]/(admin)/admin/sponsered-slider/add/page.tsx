import type { Metadata } from "next";

import { PageHeader } from "@/components/page/page-header";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { SponseredSliderForm } from "@/features/sponsered-slider/components/sponsered-slider-form";
import { getSponseredSliderFormOptions } from "@/features/sponsered-slider/lib/sponsered-slider-db";

export const metadata: Metadata = {
  title: "Add Sponsored Slider Media",
  description: "Create a home page sponsored slider item.",
};

const AddSponseredSliderPage = async () => {
  const options = await getSponseredSliderFormOptions();

  return (
    <Card className="border-gray-200 shadow-sm">
      <CardHeader className="border-b bg-gradient-to-r from-[#083f30]/5 to-[#eac074]/10">
        <CardTitle>
          <PageHeader title="Add sponsored media" description="Create a home page image, GIF, or video banner from the central media manager." />
        </CardTitle>
      </CardHeader>
      <SponseredSliderForm options={options} />
    </Card>
  );
};

export default AddSponseredSliderPage;
