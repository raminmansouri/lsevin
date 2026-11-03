import { PatientCallPage } from "@/features/consultation/components/patient-call-page";

export default async function ConsultationPatientCallRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <PatientCallPage sessionId={id} />;
}
