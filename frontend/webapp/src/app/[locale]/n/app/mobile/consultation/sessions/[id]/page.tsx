import { PatientSessionPage } from "@/features/consultation/components/patient-session-page";

export default async function ConsultationSessionRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <PatientSessionPage sessionId={id} />;
}
