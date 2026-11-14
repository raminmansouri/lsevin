import { getLocale, getTranslations } from "next-intl/server";

import { listReviewsAdmin } from "@/features/stays/server/admin/operations";
import { ReviewsAdmin } from "@/features/stays/ui/admin/operations-admin";
import { contentLocaleFor } from "@/features/tours/domain/content";
import { adminPageActor, sp } from "@/features/tours/server/admin/page-actor";

export async function generateMetadata() {
  const t = await getTranslations("StayAdmin.reviews");
  return { title: t("title") };
}

export default async function StaysAdminReviewsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await adminPageActor();
  const status = sp(await searchParams, "status") ?? "";
  const rows = await listReviewsAdmin(["pending", "published", "hidden", "rejected"].includes(status) ? status : null, contentLocaleFor(await getLocale()));
  return <ReviewsAdmin rows={rows} status={status} />;
}
