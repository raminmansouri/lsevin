import { VideoBookingPage } from "@/features/consultation/components/video-booking-page";

export default async function ConsultationBookingRoute({
  params,
}: {
  params: Promise<{ doctorId: string }>;
}) {
  const { doctorId } = await params;
  return <VideoBookingPage doctorId={doctorId} />;
}
