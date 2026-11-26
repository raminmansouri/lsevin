import { notFound, permanentRedirect } from "next/navigation";

import { consultationBookHref, toQuery } from "@/features/consultation/lib/paths";
import { findPublicVideoDoctorRef } from "@/features/consultation/server/video-doctors-repository";

type SearchParams = Record<string, string | string[] | undefined>;

/**
 * Old booking URL (/n/app/mobile/consultation/doctors/<id>/book): one permanent
 * redirect straight to /consultation/doctors/<slug>/book, query kept. Done in
 * metadata so it is a real 308, not a streamed meta refresh.
 */
export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; doctorId: string }>;
  searchParams: Promise<SearchParams>;
}): Promise<never> {
  const [{ locale, doctorId }, query] = await Promise.all([params, searchParams]);
  const ref = await findPublicVideoDoctorRef(decodeURIComponent(doctorId));
  if (!ref) notFound();
  permanentRedirect(`/${locale}${consultationBookHref(ref, toQuery(query))}`);
}

export default function LegacyConsultationBookPage(): never {
  notFound();
}
