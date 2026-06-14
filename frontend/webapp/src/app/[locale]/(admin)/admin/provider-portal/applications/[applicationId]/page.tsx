import { notFound } from "next/navigation";

import { AdminApplicationReview } from "@/features/provider-portal/components/admin-application-review";
import { getProviderApplicationForAdmin } from "@/features/provider-portal/server/repository";
import { requireCurrentUserId } from "@/features/provider-portal/server/session";

export default async function AdminProviderApplicationReviewPage({
  params,
}: {
  params: Promise<{ locale: string; applicationId: string }>;
}) {
  const { locale, applicationId } = await params;
  await requireCurrentUserId(true);
  const application = await getProviderApplicationForAdmin(applicationId, locale);

  if (!application) notFound();

  return <AdminApplicationReview application={application} />;
}
