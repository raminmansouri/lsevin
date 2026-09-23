import { getTranslations } from "next-intl/server";

import { listConsentsForPatient, listShareGrantsForPatient } from "@/features/patients/server/sharing-repository";
import { listPatientAccessForAccount } from "@/features/patients/server/repository";

import { requireAuthenticatedUserId } from "./auth";
import { SharingPanel } from "./sharing-panel";

export const dynamic = "force-dynamic";

/**
 * Same object-level rule as my-health-record/my-cases: only ever shows
 * consents/share links for a patient the signed-in account holds an active
 * account_patient_links row for, and skips "limited" links entirely --
 * managing who else can see the record is not a "basic details only"
 * action. The mutating half of this page (withdraw/revoke/create) lives in
 * customer-sharing-actions.ts, which re-checks this same rule server-side
 * per request rather than trusting this page's filtering.
 */
export default async function MySharingPage() {
  const t = await getTranslations("MobileProfile.mySharing");
  const accountId = await requireAuthenticatedUserId();
  const links = accountId ? await listPatientAccessForAccount(accountId) : [];

  const patientsWithAccess = await Promise.all(
    links
      .filter((link) => link.accessRole !== "limited")
      .map(async (link) => ({
        patient: link.patient,
        relationshipType: link.relationshipType,
        consents: await listConsentsForPatient(link.patient.id),
        shareGrants: await listShareGrantsForPatient(link.patient.id),
      }))
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="border-b border-gray-200 bg-white px-6 py-8">
        <h1 className="text-xl font-bold text-gray-900">{t("title")}</h1>
        <p className="mt-1 text-sm text-gray-500">{t("subtitle")}</p>
      </div>

      <div className="space-y-6 p-6">
        {patientsWithAccess.length === 0 && (
          <div className="rounded-2xl bg-white p-6 text-center text-sm text-gray-500">{t("empty")}</div>
        )}

        {patientsWithAccess.map(({ patient, relationshipType, consents, shareGrants }) => (
          <div key={patient.id} className="space-y-3">
            {relationshipType !== "self" && (
              <p className="text-xs font-medium text-gray-500">
                {patient.firstName} {patient.lastName} — {t(`relationshipTypes.${relationshipType}`)}
              </p>
            )}
            <SharingPanel patientId={patient.id} consents={consents} shareGrants={shareGrants} />
          </div>
        ))}
      </div>
    </div>
  );
}
