import { notFound, permanentRedirect } from "next/navigation";

import { VideoBookingPage } from "@/features/consultation/components/video-booking-page";
import { consultationBookHref, toQuery } from "@/features/consultation/lib/paths";
import { BOOKING_SOURCES, type BookingSource } from "@/features/consultation/patient-booking-types";
import { findPublicVideoDoctorRef } from "@/features/consultation/server/video-doctors-repository";
import { privateMetadata } from "@/lib/seo/robots-policy";

type SearchParams = Record<string, string | string[] | undefined>;

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value) ?? null;


/**
 * A doctor linked by id (an old link, or one without a slug yet) moves to the
 * slug URL here: metadata resolves before the page streams, so this is a real
 * 308 rather than the meta refresh a redirect inside the page gives.
 */
export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; doctor: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const [{ locale, doctor }, query] = await Promise.all([params, searchParams]);
  const ref = await findPublicVideoDoctorRef(decodeURIComponent(doctor));
  if (!ref) notFound();
  if (ref.slug && ref.slug !== decodeURIComponent(doctor)) {
    permanentRedirect(`/${locale}${consultationBookHref(ref, toQuery(query))}`);
  }
  // Booking needs sign-in (lib/auth/routes.ts): out of the index and the link graph.
  return privateMetadata;
}

/** Booking a video consultation with one doctor (was /n/app/mobile/consultation/doctors/<id>/book). */
export default async function ConsultationBookPage({
  params,
  searchParams,
}: {
  params: Promise<{ doctor: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const [{ doctor }, query] = await Promise.all([params, searchParams]);
  const ref = await findPublicVideoDoctorRef(decodeURIComponent(doctor));
  if (!ref) notFound();
  const source = first(query.source);
  return (
    <VideoBookingPage
      doctorId={ref.id}
      serviceId={first(query.service)}
      source={BOOKING_SOURCES.includes(source as BookingSource) ? (source as BookingSource) : null}
    />
  );
}
