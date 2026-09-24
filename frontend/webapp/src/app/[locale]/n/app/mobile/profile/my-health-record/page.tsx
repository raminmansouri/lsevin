import { HeartPulse, FileText, ShieldAlert } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { getPatientClinicalSummary } from "@/features/patients/server/clinical-repository";
import { listDocumentsForPatient } from "@/features/patients/server/documents-repository";
import { listPatientAccessForAccount } from "@/features/patients/server/repository";
import { listRequestsForAccount } from "@/features/patients/server/link-request-repository";
import type { TranslationType } from "@/types/next";

import { requireAuthenticatedUserId } from "./auth";
import { LinkFamilySection } from "./link-family-section";
import { SelfDeclareSection } from "./self-declare-section";

export const dynamic = "force-dynamic";

/**
 * V5.5 object-level authorization, customer side: this page never accepts a
 * patientId from the caller -- it only ever shows patients the signed-in
 * account holds an active patient.account_patient_links row for (the same
 * table the admin "linked accounts" UI writes to). There is no separate
 * coordinator/provider role in this app to design around here -- per
 * project owner: staff/providers authenticate through a different "portal"
 * project entirely, so within this webapp everything non-admin is a
 * customer, and object-level access is exactly "do you hold a link to this
 * patient."
 */
export default async function MyHealthRecordPage() {
  const t = await getTranslations("MobileProfile.myHealthRecord");
  const accountId = await requireAuthenticatedUserId();
  const links = accountId ? await listPatientAccessForAccount(accountId) : [];
  const linkRequests = accountId ? await listRequestsForAccount(accountId) : [];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="border-b border-gray-200 bg-white px-6 py-8">
        <h1 className="text-xl font-bold text-gray-900">{t("title")}</h1>
        <p className="mt-1 text-sm text-gray-500">{t("subtitle")}</p>
      </div>

      <div className="space-y-4 p-6">
        {links.length === 0 && (
          <div className="rounded-2xl bg-white p-6 text-center text-sm text-gray-500">{t("empty")}</div>
        )}

        {links.map(({ patient, relationshipType, accessRole }) => (
          <PatientCard
            key={patient.id}
            patient={patient}
            relationshipType={relationshipType}
            accessRole={accessRole}
            t={t}
          />
        ))}

        <LinkFamilySection requests={linkRequests} />
      </div>
    </div>
  );
}

async function PatientCard({
  patient,
  relationshipType,
  accessRole,
  t,
}: {
  patient: Awaited<ReturnType<typeof listPatientAccessForAccount>>[number]["patient"];
  relationshipType: string;
  accessRole: string;
  t: TranslationType;
}) {
  // "limited" access shows identity only, never clinical detail -- the
  // distinction spec V5.5/V5.2 asks authorization to respect.
  const showClinicalDetail = accessRole !== "limited";

  const [summary, documents] = showClinicalDetail
    ? await Promise.all([getPatientClinicalSummary(patient.id), listDocumentsForPatient(patient.id)])
    : [null, []];

  return (
    <div className="rounded-2xl bg-white p-4">
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-full bg-blue-50 text-blue-600">
          <HeartPulse size={20} />
        </div>
        <div>
          <p className="font-medium text-gray-900">
            {patient.firstName} {patient.lastName}
          </p>
          {relationshipType !== "self" && (
            <p className="text-xs text-gray-500">{t(`relationshipTypes.${relationshipType}`)}</p>
          )}
        </div>
      </div>

      {!showClinicalDetail && <p className="mt-3 text-xs text-gray-400">{t("limitedAccessNotice")}</p>}

      {summary && summary.criticalAllergies.length > 0 && (
        <div className="mt-4 flex gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-red-800">
          <ShieldAlert size={16} className="mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold">{t("criticalAllergies")}</p>
            <p className="text-xs">{summary.criticalAllergies.map((a) => a.substance).filter(Boolean).join("، ")}</p>
          </div>
        </div>
      )}

      {summary && summary.activeConditions.length > 0 && (
        <div className="mt-3">
          <p className="text-xs font-medium text-gray-500">{t("conditions")}</p>
          {summary.activeConditions.map((c) => (
            <p key={c.id} className="text-sm text-gray-800">
              {c.displayName}
            </p>
          ))}
        </div>
      )}

      {summary && summary.currentMedications.length > 0 && (
        <div className="mt-3">
          <p className="text-xs font-medium text-gray-500">{t("medications")}</p>
          {summary.currentMedications.map((m) => (
            <p key={m.id} className="text-sm text-gray-800">
              {m.name}
            </p>
          ))}
        </div>
      )}

      {documents.length > 0 && (
        <div className="mt-4 border-t border-gray-100 pt-3">
          <p className="text-xs font-medium text-gray-500">{t("documents")}</p>
          <div className="mt-1 space-y-1.5">
            {documents.map((d) => (
              <a
                key={d.id}
                href={`/api/v1/patients/${patient.id}/documents/${d.id}/download`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
              >
                <FileText size={14} />
                {d.title}
              </a>
            ))}
          </div>
        </div>
      )}

      {showClinicalDetail && <SelfDeclareSection patientId={patient.id} />}
    </div>
  );
}
