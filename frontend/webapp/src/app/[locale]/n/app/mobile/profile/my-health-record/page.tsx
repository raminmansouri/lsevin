import { BookOpenCheck, FileText, FolderHeart, HeartPulse, ListChecks, ShieldAlert } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { getPatientClinicalSummary } from "@/features/patients/server/clinical-repository";
import { listDocumentsForPatient } from "@/features/patients/server/documents-repository";
import { listPatientAccessForAccount } from "@/features/patients/server/repository";
import { listRequestsForAccount } from "@/features/patients/server/link-request-repository";
import type { TranslationType } from "@/types/next";
import { Link } from "@/i18n/navigation";

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
        {links.length === 0 && <HealthRecordOnboarding t={t} />}

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

function HealthRecordOnboarding({ t }: { t: TranslationType }) {
  const steps = [
    { icon: BookOpenCheck, title: t("onboarding.steps.create.title"), body: t("onboarding.steps.create.body") },
    { icon: ListChecks, title: t("onboarding.steps.complete.title"), body: t("onboarding.steps.complete.body") },
    { icon: FolderHeart, title: t("onboarding.steps.follow.title"), body: t("onboarding.steps.follow.body") },
  ];

  return (
    <section className="rounded-2xl border border-blue-100 bg-gradient-to-b from-blue-50 to-white p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white">
          <HeartPulse size={22} />
        </div>
        <div>
          <h2 className="font-bold text-gray-900">{t("onboarding.title")}</h2>
          <p className="mt-1 text-sm leading-6 text-gray-600">{t("onboarding.body")}</p>
        </div>
      </div>

      <ol className="mt-5 space-y-3">
        {steps.map(({ icon: Icon, title, body }, index) => (
          <li key={title} className="flex gap-3 rounded-xl bg-white p-3 ring-1 ring-blue-100">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-700">
              <Icon size={16} aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">
                {index + 1}. {title}
              </p>
              <p className="mt-0.5 text-xs leading-5 text-gray-500">{body}</p>
            </div>
          </li>
        ))}
      </ol>

      <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
        <a href="#link-health-record" className="rounded-xl bg-blue-600 px-4 py-2.5 text-center text-sm font-semibold text-white">
          {t("onboarding.start")}
        </a>
        <Link href="/n/app/mobile/profile/my-cases" className="rounded-xl border border-blue-200 bg-white px-4 py-2.5 text-center text-sm font-semibold text-blue-700">
          {t("onboarding.viewCases")}
        </Link>
      </div>
    </section>
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
