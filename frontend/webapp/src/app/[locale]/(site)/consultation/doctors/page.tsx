import { getTranslations } from "next-intl/server";

import { VideoDoctorsPage } from "@/features/consultation/components/video-doctors-page";
import { CONSULTATION_DOCTORS_PATH } from "@/features/consultation/lib/paths";
import { INDEXABLE_CONSULTATION_LOCALES } from "@/lib/seo/locale-eligibility";
import { buildPublicMetadata } from "@/lib/seo/metadata";

type SearchParams = Record<string, string | string[] | undefined>;

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value) ?? null;

/** Canonical is the plain list: the provider/staff/service filters are left out. */
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Consultation.doctorsPage" });
  return buildPublicMetadata({
    locale,
    path: CONSULTATION_DOCTORS_PATH,
    title: t("title"),
    descriptions: [t("subtitle")],
    eligibleLocales: INDEXABLE_CONSULTATION_LOCALES,
  });
}

/** The doctors a patient can book for a video consultation (was /n/app/mobile/consultation/doctors). */
export default async function ConsultationDoctorsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const query = await searchParams;
  // The "consult before treatment" button sends a provider with several doctors here.
  const bookQuery = new URLSearchParams();
  const service = first(query.service);
  const source = first(query.source);
  if (service) bookQuery.set("service", service);
  if (source) bookQuery.set("source", source);
  return (
    <VideoDoctorsPage
      providerId={first(query.provider)}
      staffId={first(query.staff)}
      bookQuery={bookQuery.toString() || undefined}
    />
  );
}
