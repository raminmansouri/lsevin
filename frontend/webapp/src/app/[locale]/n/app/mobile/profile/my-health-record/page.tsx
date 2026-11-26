import { getTranslations } from "next-intl/server";

import { listDocumentsForPatient } from "@/features/patients/server/documents-repository";
import { getHealthIntake, listSelfEditableRecords } from "@/features/patients/server/intake-repository";
import { listPatientAccessForAccount } from "@/features/patients/server/repository";
import { listRequestsForAccount } from "@/features/patients/server/link-request-repository";
import { getSession } from "@/lib/auth/session";
import { DesktopHealthRecord } from "@/features/web-desktop/health/DesktopHealthRecord";
import { recordShareReady } from "@/features/consultation/server/portal-packages";
import { listConsultationVisits, type ConsultationVisit } from "@/features/consultation/server/record-share";

import { HealthRecordBody } from "./health-record-body";

/** One linked person with their questionnaire answers, lists and documents, read once for both layouts. */
export type HealthRecordEntry = Awaited<ReturnType<typeof listPatientAccessForAccount>>[number] & {
  showClinicalDetail: boolean;
  intake: Awaited<ReturnType<typeof getHealthIntake>>;
  lists: Awaited<ReturnType<typeof listSelfEditableRecords>> | null;
  documents: Awaited<ReturnType<typeof listDocumentsForPatient>>;
  /** Video consultations filed in this record, with the doctor's summary. */
  visits: ConsultationVisit[];
};

export const dynamic = "force-dynamic";

/**
 * V5.5 object-level authorization, customer side: this page never accepts a
 * patientId from the caller -- it only ever shows patients the signed-in
 * account holds an active patient.account_patient_links row for. A "limited"
 * link shows identity only, never clinical detail.
 */
export default async function MyHealthRecordPage() {
  const t = await getTranslations("MobileProfile.myHealthRecord");
  const session = await getSession();
  const accountId = session?.user?.id;
  const links = accountId ? await listPatientAccessForAccount(accountId) : [];
  const linkRequests = accountId ? await listRequestsForAccount(accountId) : [];
  const defaultName = { firstName: session?.user?.firstName ?? "", lastName: session?.user?.lastName ?? "" };

  const visitsReady = await recordShareReady().catch(() => false);
  const records: HealthRecordEntry[] = await Promise.all(
    links.map(async (link) => {
      const showClinicalDetail = link.accessRole !== "limited";
      if (!showClinicalDetail) return { ...link, showClinicalDetail, intake: null, lists: null, documents: [], visits: [] };
      const [intake, lists, documents, visits] = await Promise.all([
        getHealthIntake(link.patient.id),
        listSelfEditableRecords(link.patient.id),
        listDocumentsForPatient(link.patient.id),
        visitsReady ? listConsultationVisits(link.patient.id) : Promise.resolve([]),
      ]);
      return { ...link, showClinicalDetail, intake, lists, documents, visits };
    })
  );

  return (
    <>
      <div className="min-h-screen bg-[#faf6ee] xl:hidden">
        <div className="bg-[#083f30] px-6 pb-8 pt-10 text-white">
          <h1 className="text-2xl font-black text-[#eacb7f]">{t("title")}</h1>
          <p className="mt-1.5 text-sm leading-6 text-white/75">{t("subtitle")}</p>
        </div>
        <div className="p-4 pb-24">
          <HealthRecordBody records={records} linkRequests={linkRequests} defaultName={defaultName} />
        </div>
      </div>
      <DesktopHealthRecord records={records} linkRequests={linkRequests} defaultName={defaultName} />
    </>
  );
}
