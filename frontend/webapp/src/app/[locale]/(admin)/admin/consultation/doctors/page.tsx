import { getTranslations } from "next-intl/server";

import { PageHeader } from "@/components/page/page-header";
import { VideoConsultationDoctorsManager } from "@/features/consultation/components/admin/video-consultation-doctors-manager";
import { assertAdmin } from "@/lib/auth/admin-guard";
import type { LocaleParams } from "@/types/next";

type Props = { params: Promise<LocaleParams> };

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Admin" });
  return { title: t("nav.consultationDoctors") };
}

/**
 * Admins declare which doctors offer video consultation and switch them on or off.
 * The manager loads and saves through its own server actions, which check admin access.
 */
export default async function AdminConsultationDoctorsPage() {
  // The (admin) layout and middleware gate this URL too; repeated so a routing
  // change alone cannot expose it.
  await assertAdmin();
  const t = await getTranslations("Admin");

  return (
    <div className="space-y-5">
      <PageHeader title={t("nav.consultationDoctors")} />
      <VideoConsultationDoctorsManager />
    </div>
  );
}
