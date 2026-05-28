import { notFound } from "next/navigation";

import { BookableResourceForm } from "@/features/booking-pro/admin/components/bookable-resource-form";
import { getBookableResourceById } from "@/features/booking-pro/server/generic-availability-admin.repository";

type Props = {
  params: Promise<{ locale: string; resourceId: string }> | { locale: string; resourceId: string };
};

export default async function UpdateBookableResourcePage({ params }: Props) {
  const resolvedParams = await params;
  const locale = resolvedParams.locale || "fa-IR";
  const resource = await getBookableResourceById(resolvedParams.resourceId, locale);
  if (!resource) notFound();
  return <BookableResourceForm locale={locale} resource={resource} />;
}
