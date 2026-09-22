import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getTranslations } from "next-intl/server";

import LocaleBoundary from "@/components/locale/locale-boundary";
import { PageHeader } from "@/components/page/page-header";
import { PatientDashboard } from "@/features/patients/components/admin/patient-dashboard";
import {
  getPatientById,
  getPatientTimeline,
  listAccountLinksForPatient,
  listAddressesForPatient,
  listContactsForPatient,
  listIdentifiersForPatient,
  listNotesForPatient,
} from "@/features/patients/server/repository";
import {
  getPatientClinicalSummary,
  listAllergiesForPatient,
  listConditionsForPatient,
  listMedicationsForPatient,
  listProceduresForPatient,
  listProductUsageForPatient,
  listSymptomsForPatient,
} from "@/features/patients/server/clinical-repository";
import {
  listDiagnosticReportsForPatient,
  listDocumentsForPatient,
  listImagingStudiesForPatient,
  listLabOrdersForPatient,
  listObservationsForPatient,
} from "@/features/patients/server/documents-repository";
import { PATIENTS_TRANSLATION_KEY } from "@/features/patients/types";
import { assertAdmin } from "@/lib/auth/admin-guard";
import type { LocaleParams } from "@/types/next";

type Props = {
  params: Promise<LocaleParams & { patientId: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { locale, patientId } = await params;
  const t = await getTranslations({ locale, namespace: PATIENTS_TRANSLATION_KEY });
  const patient = await getPatientById(patientId);
  return {
    title: patient ? `${patient.firstName} ${patient.lastName}` : t("admin.title"),
  };
}

export default function AdminPatientDetailPage({ params }: Props) {
  return (
    <Suspense fallback={null}>
      <LocaleBoundary params={params} tanslationNameSpace={PATIENTS_TRANSLATION_KEY}>
        {(t) => (
          <div className="space-y-5">
            <PageHeader title={t("admin.detail.title")} />
            <Suspense fallback={null}>
              <SuspenseBoundary params={params} />
            </Suspense>
          </div>
        )}
      </LocaleBoundary>
    </Suspense>
  );
}

async function SuspenseBoundary({ params }: { params: Props["params"] }) {
  // The (admin) layout and the middleware both gate this URL, but the guard is
  // repeated here so the page cannot become readable by a routing change alone.
  const ctx = await assertAdmin();
  const { patientId } = await params;

  const patient = await getPatientById(patientId);
  if (!patient) notFound();

  const [
    identifiers,
    contacts,
    addresses,
    accountLinks,
    timeline,
    notes,
    clinicalSummary,
    conditions,
    procedures,
    allergies,
    medications,
    productUsage,
    symptoms,
    documents,
    labOrders,
    diagnosticReports,
    observations,
    imagingStudies,
  ] = await Promise.all([
    listIdentifiersForPatient(patientId),
    listContactsForPatient(patientId),
    listAddressesForPatient(patientId),
    listAccountLinksForPatient(patientId),
    getPatientTimeline(patientId, { order: "newest_first", limit: 50 }),
    listNotesForPatient(patientId, ctx.isSuperAdmin),
    getPatientClinicalSummary(patientId),
    listConditionsForPatient(patientId),
    listProceduresForPatient(patientId),
    listAllergiesForPatient(patientId),
    listMedicationsForPatient(patientId),
    listProductUsageForPatient(patientId),
    listSymptomsForPatient(patientId),
    listDocumentsForPatient(patientId),
    listLabOrdersForPatient(patientId),
    listDiagnosticReportsForPatient(patientId),
    listObservationsForPatient(patientId),
    listImagingStudiesForPatient(patientId),
  ]);

  return (
    <PatientDashboard
      patient={patient}
      identifiers={identifiers}
      contacts={contacts}
      addresses={addresses}
      accountLinks={accountLinks}
      timeline={timeline}
      notes={notes}
      canSeeSuperadminNotes={ctx.isSuperAdmin}
      clinicalSummary={clinicalSummary}
      conditions={conditions}
      procedures={procedures}
      allergies={allergies}
      medications={medications}
      productUsage={productUsage}
      symptoms={symptoms}
      documents={documents}
      labOrders={labOrders}
      diagnosticReports={diagnosticReports}
      observations={observations}
      imagingStudies={imagingStudies}
    />
  );
}
