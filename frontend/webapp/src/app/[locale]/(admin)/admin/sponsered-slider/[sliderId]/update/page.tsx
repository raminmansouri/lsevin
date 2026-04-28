import type { Metadata } from "next";
import { notFound } from "next/navigation";

import ServerFetchResult from "@/components/fetcher/fetch.server";
import { PageHeader } from "@/components/page/page-header";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { getSponseredSliderDetails } from "@/features/sponsered-slider/api/server/get-sponsered-slider-by-id";
import { SponseredSliderForm } from "@/features/sponsered-slider/components/sponsered-slider-form";
import { getSponseredSliderFormOptions } from "@/features/sponsered-slider/lib/sponsered-slider-db";
import type { SponseredSliderDetails } from "@/features/sponsered-slider/types";

type Props = {
  params: Promise<{ sliderId: string; locale: string }>;
};

export const metadata: Metadata = {
  title: "Update Sponsored Slider Media",
  description: "Update a home page sponsored slider item.",
};

const UpdateSponseredSliderPage = async ({ params }: Props) => {
  const { sliderId } = await params;
  const [result, options] = await Promise.all([
    getSponseredSliderDetails(sliderId),
    getSponseredSliderFormOptions(),
  ]);

  if (result.error?.status === 404) notFound();

  return (
    <Card className="border-gray-200 shadow-sm">
      <CardHeader className="border-b bg-gradient-to-r from-[#083f30]/5 to-[#eac074]/10">
        <CardTitle>
          <PageHeader title="Update sponsored media" description="Edit the image, GIF, video, CTA, activation state, and display order." />
        </CardTitle>
      </CardHeader>
      <ServerFetchResult<SponseredSliderDetails> result={result}>
        {(item) => <SponseredSliderForm item={item} options={options} />}
      </ServerFetchResult>
    </Card>
  );
};

export default UpdateSponseredSliderPage;
