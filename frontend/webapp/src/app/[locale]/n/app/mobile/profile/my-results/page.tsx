import { getTranslations } from "next-intl/server";

import {
  listDiagnosticReportsForPatient,
  listImagingStudiesForPatient,
  listLabOrdersForPatient,
  listObservationsForPatient,
} from "@/features/patients/server/documents-repository";
import { listPatientAccessForAccount } from "@/features/patients/server/repository";
import type {
  ClinicalObservationRow,
  DiagnosticReportRow,
  ImagingStudyRow,
  LabOrderRow,
} from "@/features/patients/documents-types";

import { requireAuthenticatedUserId } from "./auth";

export const dynamic = "force-dynamic";

function formatDate(value?: string | null) {
  if (!value) return "-";
  try {
    return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(value));
  } catch {
    return value;
  }
}

const INTERPRETATION_COLOR: Record<string, string> = {
  normal: "bg-green-50 text-green-700",
  high: "bg-amber-50 text-amber-700",
  low: "bg-amber-50 text-amber-700",
  critical_high: "bg-red-50 text-red-700",
  critical_low: "bg-red-50 text-red-700",
  abnormal: "bg-amber-50 text-amber-700",
};

/**
 * Read-only, no interactivity, entirely server-rendered -- same reasoning
 * as my-passport for reusing Patients.admin.documents.* translations
 * directly rather than duplicating them under MobileProfile.
 *
 * Scope decision (confirmed with the project owner before building this):
 * show exactly what's in the record, with each item's own status/
 * interpretation flag as reported (never re-interpreted or summarized by
 * this app), plus a visible disclaimer. Nothing is filtered by status --
 * including "preliminary" reports -- since hiding data that later appears
 * is more confusing than showing it labeled as preliminary; spec V8's own
 * rule ("AI-derived data MUST NOT become verified medical facts
 * automatically") is the same principle applied here at the display layer.
 */
export default async function MyResultsPage() {
  const t = await getTranslations("MobileProfile.myResults");
  const tDocs = await getTranslations("Patients.admin.documents");
  const accountId = await requireAuthenticatedUserId();
  const links = accountId ? await listPatientAccessForAccount(accountId) : [];

  const patientsWithResults = await Promise.all(
    links
      .filter((link) => link.accessRole !== "limited")
      .map(async (link) => ({
        patient: link.patient,
        relationshipType: link.relationshipType,
        labOrders: await listLabOrdersForPatient(link.patient.id),
        diagnosticReports: await listDiagnosticReportsForPatient(link.patient.id),
        observations: await listObservationsForPatient(link.patient.id),
        imagingStudies: await listImagingStudiesForPatient(link.patient.id),
      }))
  );

  const hasAnyResult = patientsWithResults.some(
    (entry) =>
      entry.labOrders.length > 0 ||
      entry.diagnosticReports.length > 0 ||
      entry.observations.length > 0 ||
      entry.imagingStudies.length > 0
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="border-b border-gray-200 bg-white px-6 py-8">
        <h1 className="text-xl font-bold text-gray-900">{t("title")}</h1>
        <p className="mt-1 text-sm text-gray-500">{t("subtitle")}</p>
      </div>

      <div className="space-y-6 p-6">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">{t("disclaimer")}</div>

        {!hasAnyResult && <div className="rounded-2xl bg-white p-6 text-center text-sm text-gray-500">{t("empty")}</div>}

        {patientsWithResults.map(({ patient, relationshipType, labOrders, diagnosticReports, observations, imagingStudies }) =>
          labOrders.length === 0 && diagnosticReports.length === 0 && observations.length === 0 && imagingStudies.length === 0 ? null : (
            <div key={patient.id} className="space-y-3">
              {relationshipType !== "self" && (
                <p className="text-xs font-medium text-gray-500">
                  {patient.firstName} {patient.lastName} — {t(`relationshipTypes.${relationshipType}`)}
                </p>
              )}

              {diagnosticReports.length > 0 && (
                <ReportsCard title={t("diagnosticReports")} reports={diagnosticReports} tDocs={tDocs} />
              )}
              {observations.length > 0 && <ObservationsCard title={t("observations")} observations={observations} tDocs={tDocs} />}
              {labOrders.length > 0 && <LabOrdersCard title={t("labOrders")} labOrders={labOrders} tDocs={tDocs} />}
              {imagingStudies.length > 0 && <ImagingCard title={t("imaging")} studies={imagingStudies} tDocs={tDocs} />}
            </div>
          )
        )}
      </div>
    </div>
  );
}

function ReportsCard({ title, reports, tDocs }: { title: string; reports: DiagnosticReportRow[]; tDocs: (key: string) => string }) {
  return (
    <div className="rounded-2xl bg-white p-4">
      <p className="text-xs font-medium text-gray-500">{title}</p>
      {reports.map((report) => (
        <div key={report.id} className="mt-3 border-t border-gray-100 pt-3 first:mt-2 first:border-0 first:pt-0">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-medium text-gray-900">{report.title}</p>
            <span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
              {tDocs(`reportStatuses.${report.reportStatus}`)}
            </span>
          </div>
          {report.summary && <p className="mt-1 text-xs text-gray-600">{report.summary}</p>}
          <p dir="ltr" className="mt-1 text-xs text-gray-400">
            {formatDate(report.issuedAt ?? report.effectiveAt)}
          </p>
        </div>
      ))}
    </div>
  );
}

function ObservationsCard({
  title,
  observations,
  tDocs,
}: {
  title: string;
  observations: ClinicalObservationRow[];
  tDocs: (key: string) => string;
}) {
  return (
    <div className="rounded-2xl bg-white p-4">
      <p className="text-xs font-medium text-gray-500">{title}</p>
      {observations.map((observation) => (
        <div
          key={observation.id}
          className="mt-3 flex items-start justify-between gap-2 border-t border-gray-100 pt-3 first:mt-2 first:border-0 first:pt-0"
        >
          <div>
            <p className="text-sm font-medium text-gray-900">
              {observation.displayName}
              {observation.valueNumber !== null && (
                <span dir="ltr" className="ms-1 font-normal text-gray-700">
                  {observation.valueNumber} {observation.unit}
                </span>
              )}
              {observation.valueText && !observation.valueNumber && (
                <span className="ms-1 font-normal text-gray-700">{observation.valueText}</span>
              )}
            </p>
            <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-gray-400">
              <span dir="ltr">{formatDate(observation.effectiveAt)}</span>
              {(observation.referenceLow !== null || observation.referenceHigh !== null) && (
                <span dir="ltr">
                  ({observation.referenceLow ?? "?"}-{observation.referenceHigh ?? "?"})
                </span>
              )}
            </div>
          </div>
          {observation.interpretation && (
            <span
              className={`shrink-0 rounded-full px-2 py-0.5 text-xs ${INTERPRETATION_COLOR[observation.interpretation] ?? "bg-gray-100 text-gray-600"}`}
            >
              {tDocs(`interpretations.${observation.interpretation}`)}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

function LabOrdersCard({ title, labOrders, tDocs }: { title: string; labOrders: LabOrderRow[]; tDocs: (key: string) => string }) {
  return (
    <div className="rounded-2xl bg-white p-4">
      <p className="text-xs font-medium text-gray-500">{title}</p>
      {labOrders.map((order) => (
        <div key={order.id} className="mt-3 flex items-center justify-between gap-2 border-t border-gray-100 pt-3 first:mt-2 first:border-0 first:pt-0">
          <p className="text-sm text-gray-900">{order.requestedTests.join("، ")}</p>
          <span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
            {tDocs(`labOrderStatuses.${order.orderStatus}`)}
          </span>
        </div>
      ))}
    </div>
  );
}

function ImagingCard({ title, studies, tDocs }: { title: string; studies: ImagingStudyRow[]; tDocs: (key: string) => string }) {
  return (
    <div className="rounded-2xl bg-white p-4">
      <p className="text-xs font-medium text-gray-500">{title}</p>
      {studies.map((study) => (
        <div key={study.id} className="mt-3 border-t border-gray-100 pt-3 first:mt-2 first:border-0 first:pt-0">
          <p className="text-sm text-gray-900">
            {tDocs(`modalities.${study.modality}`)}
            {study.bodyPart ? ` · ${study.bodyPart}` : ""}
          </p>
          <p dir="ltr" className="mt-0.5 text-xs text-gray-400">
            {formatDate(study.studyDate)}
          </p>
        </div>
      ))}
    </div>
  );
}
