import { DoctorPanelPage } from "@/features/consultation/components/doctor-panel/doctor-panel-page";
import { getDoctorPanelOverviewAction } from "@/features/consultation/server/doctor-panel";
import { requireDoctorForRoute } from "@/features/consultation/server/doctor-route";

export const dynamic = "force-dynamic";

/** The consultation GP's panel. Guests go to sign-in, everyone else home. */
export default async function ConsultationDoctorPanelRoute() {
  await requireDoctorForRoute("/n/app/mobile/consultation/doctor");
  const result = await getDoctorPanelOverviewAction();
  if (!result.ok || !result.data) {
    throw new Error(result.fieldErrors?.detail?.[0] ?? "Doctor panel failed to load");
  }
  return <DoctorPanelPage overview={result.data} />;
}
