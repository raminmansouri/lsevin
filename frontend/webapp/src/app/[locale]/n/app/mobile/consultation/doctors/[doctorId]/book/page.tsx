import { VideoBookingPage } from "@/features/consultation/components/video-booking-page";
import { BOOKING_SOURCES, type BookingSource } from "@/features/consultation/patient-booking-types";

type SearchParams = Record<string, string | string[] | undefined>;

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value) ?? null;

export default async function ConsultationBookingRoute({
  params,
  searchParams,
}: {
  params: Promise<{ doctorId: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const [{ doctorId }, query] = await Promise.all([params, searchParams]);
  const source = first(query.source);
  return (
    <VideoBookingPage
      doctorId={doctorId}
      serviceId={first(query.service)}
      source={BOOKING_SOURCES.includes(source as BookingSource) ? (source as BookingSource) : null}
    />
  );
}
