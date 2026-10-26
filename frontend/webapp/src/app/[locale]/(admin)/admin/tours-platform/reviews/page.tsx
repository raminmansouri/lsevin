import { getTranslations } from "next-intl/server";

import { PageHeader } from "@/components/page/page-header";
import { adminPageActor, sp } from "@/features/tours/server/admin/page-actor";
import { reviewQueue } from "@/features/tours/server/admin/queries";
import { ReviewsPanel } from "@/features/tours/ui/admin/ops-panels";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function generateMetadata() {
  const t = await getTranslations("TourAdmin.reviews");
  return { title: t("title") };
}

export default async function ReviewsPage({ searchParams }: Props) {
  const actor = await adminPageActor();
  const q = await searchParams;
  const t = await getTranslations("TourAdmin.reviews");
  const status = sp(q, "status") ?? "pending";
  const reviews = await reviewQueue(actor, { status });
  return (
    <div className="space-y-5">
      <PageHeader title={t("title")} description={t("description")} />
      <ReviewsPanel reviews={reviews} status={status} />
    </div>
  );
}
