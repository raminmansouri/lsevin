import { DoctorCallPage } from "@/features/consultation/components/doctor-panel/doctor-call-page";
import { requireDoctorForRoute } from "@/features/consultation/server/doctor-route";

export const dynamic = "force-dynamic";

export default async function ConsultationDoctorCallRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireDoctorForRoute(
    `/n/app/mobile/consultation/doctor/sessions/${encodeURIComponent(id)}/call`
  );
  return <DoctorCallPage sessionId={id} />;
}
