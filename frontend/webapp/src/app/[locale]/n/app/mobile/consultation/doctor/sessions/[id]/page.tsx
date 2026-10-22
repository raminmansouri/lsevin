import { DoctorSessionPage } from "@/features/consultation/components/doctor-panel/doctor-session-page";
import { requireDoctorForRoute } from "@/features/consultation/server/doctor-route";

export const dynamic = "force-dynamic";

export default async function ConsultationDoctorSessionRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireDoctorForRoute(`/n/app/mobile/consultation/doctor/sessions/${encodeURIComponent(id)}`);
  return <DoctorSessionPage sessionId={id} />;
}
