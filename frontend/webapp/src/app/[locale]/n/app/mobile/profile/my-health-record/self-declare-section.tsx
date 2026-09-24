"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { useRouter } from "@/i18n/navigation";
import {
  ALLERGY_CATEGORIES,
  CONDITION_CLINICAL_STATUSES,
  MEDICATION_STATUSES,
} from "@/features/patients/clinical-schemas";
import {
  addMyAllergyAction,
  addMyConditionAction,
  addMyMedicationAction,
  addMyProcedureAction,
} from "@/features/patients/server/customer-clinical-actions";
import type { TranslationType } from "@/types/next";

type RecordType = "condition" | "allergy" | "medication" | "procedure";

/**
 * خوداظهاری (self-declaration): every record created here is stamped
 * sourceType "patient" / verificationStatus "patient_reported" server-side
 * (customer-clinical-actions.ts) -- it is never shown as clinician-verified,
 * by design, regardless of what this form submits.
 */
export function SelfDeclareSection({ patientId }: { patientId: string }) {
  const t = useTranslations("MobileProfile.myHealthRecord") as TranslationType;
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [formOpen, setFormOpen] = useState(false);
  const [recordType, setRecordType] = useState<RecordType>("condition");

  const [name, setName] = useState("");
  const [notes, setNotes] = useState("");
  const [conditionStatus, setConditionStatus] = useState<(typeof CONDITION_CLINICAL_STATUSES)[number]>("active");
  const [allergyCategory, setAllergyCategory] = useState<(typeof ALLERGY_CATEGORIES)[number]>("food");
  const [medicationStatus, setMedicationStatus] = useState<(typeof MEDICATION_STATUSES)[number]>("active");
  const [dose, setDose] = useState("");
  const [performedFrom, setPerformedFrom] = useState("");

  const reset = () => {
    setName("");
    setNotes("");
    setDose("");
    setPerformedFrom("");
  };

  const submit = () => {
    if (!name.trim()) return;
    if (recordType === "procedure" && !performedFrom) return;

    startTransition(async () => {
      const result =
        recordType === "condition"
          ? await addMyConditionAction({ patientId, displayName: name.trim(), clinicalStatus: conditionStatus, notes: notes.trim() || undefined })
          : recordType === "allergy"
            ? await addMyAllergyAction({ patientId, substance: name.trim(), category: allergyCategory, notes: notes.trim() || undefined })
            : recordType === "medication"
              ? await addMyMedicationAction({
                  patientId,
                  name: name.trim(),
                  dose: dose.trim() || undefined,
                  medicationStatus,
                  notes: notes.trim() || undefined,
                })
              : await addMyProcedureAction({
                  patientId,
                  procedureName: name.trim(),
                  performedFrom,
                  notes: notes.trim() || undefined,
                });

      if (result.ok) {
        toast.success(t("selfDeclare.saved"));
        setFormOpen(false);
        reset();
        router.refresh();
        return;
      }
      toast.error(result.error || t("selfDeclare.errorGeneric"));
    });
  };

  return (
    <div className="mt-4 border-t border-gray-100 pt-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-gray-500">{t("selfDeclare.title")}</p>
        <button type="button" onClick={() => setFormOpen((v) => !v)} className="text-xs font-medium text-blue-600">
          {formOpen ? t("selfDeclare.cancel") : t("selfDeclare.add")}
        </button>
      </div>

      {!formOpen && <p className="mt-1 text-xs text-gray-400">{t("selfDeclare.notice")}</p>}

      {formOpen && (
        <div className="mt-3 space-y-3 rounded-xl bg-gray-50 p-3">
          <div>
            <label className="text-xs text-gray-500">{t("selfDeclare.recordType")}</label>
            <select
              value={recordType}
              onChange={(event) => setRecordType(event.target.value as RecordType)}
              className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-sm"
            >
              <option value="condition">{t("selfDeclare.types.condition")}</option>
              <option value="allergy">{t("selfDeclare.types.allergy")}</option>
              <option value="medication">{t("selfDeclare.types.medication")}</option>
              <option value="procedure">{t("selfDeclare.types.procedure")}</option>
            </select>
          </div>

          <div>
            <label className="text-xs text-gray-500">{t(`selfDeclare.nameLabels.${recordType}`)}</label>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-sm"
            />
          </div>

          {recordType === "condition" && (
            <div>
              <label className="text-xs text-gray-500">{t("selfDeclare.status")}</label>
              <select
                value={conditionStatus}
                onChange={(event) => setConditionStatus(event.target.value as typeof conditionStatus)}
                className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-sm"
              >
                {CONDITION_CLINICAL_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {t(`selfDeclare.conditionStatuses.${status}`)}
                  </option>
                ))}
              </select>
            </div>
          )}

          {recordType === "allergy" && (
            <div>
              <label className="text-xs text-gray-500">{t("selfDeclare.category")}</label>
              <select
                value={allergyCategory}
                onChange={(event) => setAllergyCategory(event.target.value as typeof allergyCategory)}
                className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-sm"
              >
                {ALLERGY_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {t(`selfDeclare.allergyCategories.${category}`)}
                  </option>
                ))}
              </select>
            </div>
          )}

          {recordType === "medication" && (
            <>
              <div>
                <label className="text-xs text-gray-500">{t("selfDeclare.dose")}</label>
                <input
                  value={dose}
                  onChange={(event) => setDose(event.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500">{t("selfDeclare.status")}</label>
                <select
                  value={medicationStatus}
                  onChange={(event) => setMedicationStatus(event.target.value as typeof medicationStatus)}
                  className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-sm"
                >
                  {MEDICATION_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {t(`selfDeclare.medicationStatuses.${status}`)}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

          {recordType === "procedure" && (
            <div>
              <label className="text-xs text-gray-500">{t("selfDeclare.performedFrom")}</label>
              <input
                dir="ltr"
                type="date"
                value={performedFrom}
                onChange={(event) => setPerformedFrom(event.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-sm"
              />
            </div>
          )}

          <div>
            <label className="text-xs text-gray-500">{t("selfDeclare.notes")}</label>
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={2}
              className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-sm"
            />
          </div>

          <button
            type="button"
            onClick={submit}
            disabled={isPending || !name.trim() || (recordType === "procedure" && !performedFrom)}
            className="w-full rounded-lg bg-blue-600 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {t("selfDeclare.save")}
          </button>
        </div>
      )}
    </div>
  );
}
