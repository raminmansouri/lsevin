"use client";

import { useState, useTransition, type ReactNode } from "react";
import { FileText, Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import DatePicker from "@/components/form/date-picker";
import SingleMediaPickerInput from "@/features/media-picker-addon/components/SingleMediaPickerInput";
import type { MediaItem } from "@/features/media-picker-addon/types";
import {
  addMyAllergyAction,
  addMyMedicationAction,
  addMyProcedureAction,
} from "@/features/patients/server/customer-clinical-actions";
import { uploadMyDocumentAction } from "@/features/patients/server/customer-documents-actions";
import { removeMyRecordAction } from "@/features/patients/server/customer-intake-actions";
import type { SelfEditableRecords } from "@/features/patients/server/intake-repository";
import { useRouter } from "@/i18n/navigation";
import type { TranslationType } from "@/types/next";

import type { QuestionnaireDocument } from "./health-questionnaire";
import { Choice, Field, inputClass } from "./ui";

type RemovableKind = "allergy" | "medication" | "procedure";

/** What the patient may pick on the documents step; plain names, not the full clinical list. */
const PATIENT_DOCUMENT_TYPES = [
  "lab_report",
  "imaging_report",
  "mri_image",
  "ct_image",
  "x_ray",
  "ultrasound",
  "prescription",
  "discharge_summary",
  "pathology",
  "doctor_note",
  "other",
] as const;

/** Allergy categories a patient picks between; "no known allergies" has its own button. */
const PATIENT_ALLERGY_CATEGORIES = ["medication", "food", "environmental", "other"] as const;

function useRecordMutations() {
  const t = useTranslations("MobileProfile.myHealthRecord.intake") as TranslationType;
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const run = (work: () => Promise<{ ok: boolean; error?: string }>, onDone?: () => void) => {
    startTransition(async () => {
      const result = await work();
      if (!result.ok) {
        toast.error(result.error || t("errors.generic"));
        return;
      }
      onDone?.();
      router.refresh();
    });
  };

  const remove = (patientId: string, kind: RemovableKind, id: string) =>
    run(() => removeMyRecordAction({ patientId, kind, id }));

  return { t, isPending, run, remove };
}

function ItemList({
  items,
  empty,
  onRemove,
  disabled,
  t,
}: {
  items: { id: string; primary: string; secondary?: string | null; removable: boolean }[];
  empty: string;
  onRemove: (id: string) => void;
  disabled: boolean;
  t: TranslationType;
}) {
  if (!items.length) return <p className="rounded-2xl bg-[#f6f1e6] px-4 py-3 text-sm text-[#8a806d]">{empty}</p>;
  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li key={item.id} className="flex items-center justify-between gap-3 rounded-2xl bg-white px-4 py-3 ring-1 ring-[#e7dcc4]">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-[#0e1a16]">{item.primary}</p>
            {item.secondary ? <p className="truncate text-xs text-[#8a806d]">{item.secondary}</p> : null}
            {!item.removable ? <p className="text-[11px] text-[#0f5a45]">{t("lists.fromCareTeam")}</p> : null}
          </div>
          {item.removable ? (
            <button
              type="button"
              disabled={disabled}
              onClick={() => onRemove(item.id)}
              aria-label={t("lists.remove")}
              className="grid size-9 shrink-0 place-items-center rounded-full text-[#a8a08e] transition hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
            >
              <Trash2 size={16} />
            </button>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

function AddPanel({ label, children }: { label: string; children: (close: () => void) => ReactNode }) {
  const [open, setOpen] = useState(false);
  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-bold text-[#0f5a45] ring-1 ring-dashed ring-[#c9a55a] hover:bg-white"
      >
        <Plus size={16} />
        {label}
      </button>
    );
  }
  return <div className="space-y-3 rounded-[22px] bg-[#f6f1e6] p-4">{children(() => setOpen(false))}</div>;
}

function FormButtons({ onCancel, onSave, disabled, t }: { onCancel: () => void; onSave: () => void; disabled: boolean; t: TranslationType }) {
  return (
    <div className="flex justify-end gap-2 pt-1">
      <button type="button" onClick={onCancel} className="rounded-full px-4 py-2 text-sm font-semibold text-[#6b6150]">
        {t("lists.cancel")}
      </button>
      <button
        type="button"
        disabled={disabled}
        onClick={onSave}
        className="rounded-full bg-[#083f30] px-5 py-2 text-sm font-bold text-white disabled:opacity-50"
      >
        {t("lists.add")}
      </button>
    </div>
  );
}

// --- Surgeries ------------------------------------------------------------

export function SurgeriesStep({ patientId, procedures }: { patientId: string; procedures: SelfEditableRecords["procedures"] }) {
  const { t, isPending, run, remove } = useRecordMutations();
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [notes, setNotes] = useState("");

  return (
    <div className="space-y-3">
      <p className="text-sm font-bold text-[#0e1a16]">{t("surgeries.listTitle")}</p>
      <ItemList
        t={t}
        disabled={isPending}
        empty={t("surgeries.empty")}
        items={procedures.map((procedure) => ({
          id: procedure.id,
          primary: procedure.name,
          secondary: [procedure.performedFrom, procedure.notes].filter(Boolean).join(" · "),
          removable: procedure.sourceType === "patient",
        }))}
        onRemove={(id) => remove(patientId, "procedure", id)}
      />
      <AddPanel label={t("surgeries.add")}>
        {(close) => (
          <>
            <Field label={t("surgeries.name")}>
              <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} placeholder={t("surgeries.namePlaceholder")} />
            </Field>
            <Field label={t("surgeries.date")} hint={t("surgeries.dateHint")}>
              <DatePicker value={date || undefined} onChange={setDate} disableFuture enableMonthYearSelect placeholder={t("pickDate")} />
            </Field>
            <Field label={t("surgeries.notes")}>
              <input className={inputClass} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={t("surgeries.notesPlaceholder")} />
            </Field>
            <FormButtons
              t={t}
              onCancel={close}
              disabled={isPending || !name.trim() || !date}
              onSave={() =>
                run(
                  () =>
                    addMyProcedureAction({
                      patientId,
                      procedureName: name.trim(),
                      performedFrom: date,
                      procedureStatus: "completed",
                      notes: notes.trim() || undefined,
                    }),
                  () => {
                    setName("");
                    setDate("");
                    setNotes("");
                    close();
                  }
                )
              }
            />
          </>
        )}
      </AddPanel>
    </div>
  );
}

// --- Medicines & allergies ------------------------------------------------

export function MedicinesStep({
  patientId,
  medications,
  allergies,
  bloodThinnersSlot,
}: {
  patientId: string;
  medications: SelfEditableRecords["medications"];
  allergies: SelfEditableRecords["allergies"];
  bloodThinnersSlot: ReactNode;
}) {
  const { t, isPending, run, remove } = useRecordMutations();
  const [medName, setMedName] = useState("");
  const [medDose, setMedDose] = useState("");
  const [medFrequency, setMedFrequency] = useState("");
  const [allergyName, setAllergyName] = useState("");
  const [allergyCategory, setAllergyCategory] = useState<(typeof PATIENT_ALLERGY_CATEGORIES)[number] | undefined>("medication");
  const [allergyReaction, setAllergyReaction] = useState("");

  const hasNoKnownAllergies = allergies.some((allergy) => allergy.category === "no_known_allergies");
  const realAllergies = allergies.filter((allergy) => allergy.category !== "no_known_allergies");

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <p className="text-sm font-bold text-[#0e1a16]">{t("medicines.listTitle")}</p>
        <p className="text-xs leading-5 text-[#8a806d]">{t("medicines.listHint")}</p>
        <ItemList
          t={t}
          disabled={isPending}
          empty={t("medicines.empty")}
          items={medications.map((medication) => ({
            id: medication.id,
            primary: medication.name,
            secondary: [medication.dose, medication.frequency].filter(Boolean).join(" · "),
            removable: medication.sourceType === "patient",
          }))}
          onRemove={(id) => remove(patientId, "medication", id)}
        />
        <AddPanel label={t("medicines.add")}>
          {(close) => (
            <>
              <Field label={t("medicines.name")}>
                <input className={inputClass} value={medName} onChange={(e) => setMedName(e.target.value)} placeholder={t("medicines.namePlaceholder")} />
              </Field>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label={t("medicines.dose")}>
                  <input className={inputClass} value={medDose} onChange={(e) => setMedDose(e.target.value)} placeholder={t("medicines.dosePlaceholder")} />
                </Field>
                <Field label={t("medicines.frequency")}>
                  <input className={inputClass} value={medFrequency} onChange={(e) => setMedFrequency(e.target.value)} placeholder={t("medicines.frequencyPlaceholder")} />
                </Field>
              </div>
              <FormButtons
                t={t}
                onCancel={close}
                disabled={isPending || !medName.trim()}
                onSave={() =>
                  run(
                    () =>
                      addMyMedicationAction({
                        patientId,
                        name: medName.trim(),
                        dose: medDose.trim() || undefined,
                        frequency: medFrequency.trim() || undefined,
                        medicationStatus: "active",
                      }),
                    () => {
                      setMedName("");
                      setMedDose("");
                      setMedFrequency("");
                      close();
                    }
                  )
                }
              />
            </>
          )}
        </AddPanel>
      </section>

      {bloodThinnersSlot}

      <section className="space-y-3">
        <p className="text-sm font-bold text-[#0e1a16]">{t("medicines.allergiesTitle")}</p>
        <p className="text-xs leading-5 text-[#8a806d]">{t("medicines.allergiesHint")}</p>
        <ItemList
          t={t}
          disabled={isPending}
          empty={hasNoKnownAllergies ? t("medicines.noKnownAllergies") : t("medicines.allergiesEmpty")}
          items={realAllergies.map((allergy) => ({
            id: allergy.id,
            primary: allergy.name ?? t(`medicines.allergyCategories.${allergy.category}`),
            secondary: [t(`medicines.allergyCategories.${allergy.category}`), allergy.reaction].filter(Boolean).join(" · "),
            removable: allergy.sourceType === "patient",
          }))}
          onRemove={(id) => remove(patientId, "allergy", id)}
        />
        <div className="flex flex-wrap items-center gap-2">
          <AddPanel label={t("medicines.addAllergy")}>
            {(close) => (
              <>
                <Field label={t("medicines.allergyName")}>
                  <input
                    className={inputClass}
                    value={allergyName}
                    onChange={(e) => setAllergyName(e.target.value)}
                    placeholder={t("medicines.allergyNamePlaceholder")}
                  />
                </Field>
                <Field label={t("medicines.allergyCategory")}>
                  <Choice
                    value={allergyCategory}
                    onChange={setAllergyCategory}
                    options={PATIENT_ALLERGY_CATEGORIES.map((value) => ({ value, label: t(`medicines.allergyCategories.${value}`) }))}
                  />
                </Field>
                <Field label={t("medicines.allergyReaction")}>
                  <input
                    className={inputClass}
                    value={allergyReaction}
                    onChange={(e) => setAllergyReaction(e.target.value)}
                    placeholder={t("medicines.allergyReactionPlaceholder")}
                  />
                </Field>
                <FormButtons
                  t={t}
                  onCancel={close}
                  disabled={isPending || !allergyName.trim() || !allergyCategory}
                  onSave={() =>
                    run(
                      () =>
                        addMyAllergyAction({
                          patientId,
                          substance: allergyName.trim(),
                          category: allergyCategory ?? "other",
                          reaction: allergyReaction.trim() || undefined,
                          // Patient-reported allergies always surface in the red banner; a
                          // clinician can downgrade later. Missing one is the worse failure.
                          criticality: "high",
                        }),
                      () => {
                        setAllergyName("");
                        setAllergyReaction("");
                        close();
                      }
                    )
                  }
                />
              </>
            )}
          </AddPanel>
          {!hasNoKnownAllergies && realAllergies.length === 0 && (
            <button
              type="button"
              disabled={isPending}
              onClick={() => run(() => addMyAllergyAction({ patientId, category: "no_known_allergies" }))}
              className="rounded-full px-4 py-2 text-sm font-semibold text-[#6b6150] ring-1 ring-[#e7dcc4] hover:ring-[#c9a55a] disabled:opacity-50"
            >
              {t("medicines.iHaveNoAllergies")}
            </button>
          )}
        </div>
      </section>
    </div>
  );
}

// --- Documents ------------------------------------------------------------

export function DocumentsStep({ patientId, documents }: { patientId: string; documents: QuestionnaireDocument[] }) {
  const { t, isPending, run } = useRecordMutations();
  const [documentType, setDocumentType] = useState<(typeof PATIENT_DOCUMENT_TYPES)[number] | undefined>("lab_report");
  const [title, setTitle] = useState("");
  const [pickerKey, setPickerKey] = useState(0);

  const upload = (file: MediaItem) =>
    run(
      () =>
        uploadMyDocumentAction({
          patientId,
          documentType: documentType ?? "other",
          title: title.trim() || file.originalName || t("documents.untitled"),
          mediaLibraryId: file.id,
          fileUrl: file.fileUrl,
          mimeType: file.mimeType,
          fileSize: file.fileSize,
          originalName: file.originalName,
          isConfidential: true,
        }),
      () => {
        setTitle("");
        setPickerKey((key) => key + 1);
        toast.success(t("documents.uploaded"));
      }
    );

  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <p className="text-sm font-bold text-[#0e1a16]">{t("documents.listTitle")}</p>
        {documents.length ? (
          <ul className="space-y-2">
            {documents.map((document) => (
              <li key={document.id}>
                <a
                  href={`/api/v1/patients/${patientId}/documents/${document.id}/download`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3 ring-1 ring-[#e7dcc4] transition hover:ring-[#c9a55a]"
                >
                  <FileText size={18} className="shrink-0 text-[#0f5a45]" />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-[#0e1a16]">{document.title}</span>
                    <span className="block text-xs text-[#8a806d]">
                      {(PATIENT_DOCUMENT_TYPES as readonly string[]).includes(document.documentType)
                        ? t(`documents.types.${document.documentType}`)
                        : t("documents.types.other")}
                    </span>
                  </span>
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <p className="rounded-2xl bg-[#f6f1e6] px-4 py-3 text-sm text-[#8a806d]">{t("documents.empty")}</p>
        )}
      </section>

      <section className="space-y-4 rounded-[22px] bg-[#f6f1e6] p-4">
        <p className="text-sm font-bold text-[#0e1a16]">{t("documents.addTitle")}</p>
        <Field label={t("documents.type")}>
          <Choice
            value={documentType}
            onChange={setDocumentType}
            options={PATIENT_DOCUMENT_TYPES.map((value) => ({ value, label: t(`documents.types.${value}`) }))}
          />
        </Field>
        <Field label={t("documents.title")} hint={t("documents.titleHint")}>
          <input className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t("documents.titlePlaceholder")} />
        </Field>
        <div className={isPending ? "pointer-events-none opacity-50" : undefined}>
          <SingleMediaPickerInput
            key={pickerKey}
            name="health-document"
            mediaType="all"
            valueField="id"
            placeholder={t("documents.choose")}
            onItemsChange={(items) => {
              const file = items[0];
              if (file) upload(file);
            }}
          />
        </div>
        <p className="text-xs leading-5 text-[#8a806d]">{t("documents.privacy")}</p>
      </section>
    </div>
  );
}
