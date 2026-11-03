import { PatientSessionPage } from "@/features/consultation/components/patient-session-page";

export default async function ConsultationSessionRoute({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ payment?: string }>;
}) {
  const [{ id }, { payment }] = await Promise.all([params, searchParams]);
  return <PatientSessionPage sessionId={id} payment={payment} />;
}
