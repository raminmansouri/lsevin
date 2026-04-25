"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  Check,
  Edit2,
  FileText,
  Lock,
  Phone,
  Pill,
  Plus,
  Save,
  Trash2,
  Upload,
  User,
  X,
} from "lucide-react";

import {
  addAllergyAction,
  addConditionAction,
  addMedicationAction,
  removeAllergyAction,
  removeConditionAction,
  removeMedicationAction,
  saveEmergencyContactAction,
  uploadMedicalDocumentAction,
} from "./actions";
import type {
  MedicalProfileAllergy,
  MedicalProfileCondition,
  MedicalProfileDocument,
  MedicalProfileMedication,
  MedicalProfilePageData,
} from "./types";
import {
  allergyLabel,
  conditionLabel,
  documentViewUrl,
  formatDisplayDate,
  formatFileSize,
  medicationLabel,
} from "./utils";

type ModalType = "allergy" | "medication" | "condition" | "document" | "emergency" | null;

type Props = {
  initialData: MedicalProfilePageData;
};

export default function MedicalProfilePageClient({ initialData }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [allergies, setAllergies] = useState(initialData.allergies);
  const [medications, setMedications] = useState(initialData.medications);
  const [conditions, setConditions] = useState(initialData.conditions);
  const [documents, setDocuments] = useState(initialData.documents);
  const [emergencyContact, setEmergencyContact] = useState(initialData.emergencyContact);
  const [formError, setFormError] = useState<string | null>(null);

  const [allergyForm, setAllergyForm] = useState({ name: "", severity: "moderate" as const, notes: "" });
  const [medicationForm, setMedicationForm] = useState({ name: "", dosage: "", frequency: "", notes: "" });
  const [conditionForm, setConditionForm] = useState({ name: "", diagnosedDate: "", notes: "" });
  const [documentForm, setDocumentForm] = useState({
    file: null as File | null,
    name: "",
    uploadProgress: 0,
    uploadStatus: "idle" as "idle" | "uploading" | "success" | "error",
  });
  const [emergencyForm, setEmergencyForm] = useState(initialData.emergencyContact);

  const documentUploadEnabled = useMemo(() => Boolean(documentForm.file), [documentForm.file]);

  function closeModal() {
    setFormError(null);
    setActiveModal(null);
  }

  function startFakeProgress() {
    setDocumentForm((prev) => ({ ...prev, uploadStatus: "uploading", uploadProgress: 8 }));
    const timer = window.setInterval(() => {
      setDocumentForm((prev) => {
        if (prev.uploadStatus !== "uploading") {
          window.clearInterval(timer);
          return prev;
        }
        const nextProgress = Math.min(prev.uploadProgress + 12, 88);
        return { ...prev, uploadProgress: nextProgress };
      });
    }, 180);
    return timer;
  }

  function handleAddAllergy() {
    setFormError(null);
    startTransition(async () => {
      try {
        const created = await addAllergyAction({
          name: allergyForm.name,
          severity: allergyForm.severity,
          notes: allergyForm.notes || null,
        });
        setAllergies((prev) => [created, ...prev]);
        setAllergyForm({ name: "", severity: "moderate", notes: "" });
        closeModal();
        router.refresh();
      } catch (error) {
        setFormError(error instanceof Error ? error.message : "Failed to add allergy.");
      }
    });
  }

  function handleAddMedication() {
    setFormError(null);
    startTransition(async () => {
      try {
        const created = await addMedicationAction({
          name: medicationForm.name,
          dosage: medicationForm.dosage,
          frequency: medicationForm.frequency,
          notes: medicationForm.notes || null,
        });
        setMedications((prev) => [created, ...prev]);
        setMedicationForm({ name: "", dosage: "", frequency: "", notes: "" });
        closeModal();
        router.refresh();
      } catch (error) {
        setFormError(error instanceof Error ? error.message : "Failed to add medication.");
      }
    });
  }

  function handleAddCondition() {
    setFormError(null);
    startTransition(async () => {
      try {
        const created = await addConditionAction({
          name: conditionForm.name,
          diagnosedDate: conditionForm.diagnosedDate || null,
          notes: conditionForm.notes || null,
        });
        setConditions((prev) => [created, ...prev]);
        setConditionForm({ name: "", diagnosedDate: "", notes: "" });
        closeModal();
        router.refresh();
      } catch (error) {
        setFormError(error instanceof Error ? error.message : "Failed to add condition.");
      }
    });
  }

  function handleUploadDocument() {
    if (!documentForm.file) return;
    setFormError(null);
    const timer = startFakeProgress();
    startTransition(async () => {
      try {
        const payload = new FormData();
        payload.set("file", documentForm.file);
        payload.set("title", documentForm.name);

        const created = await uploadMedicalDocumentAction(payload);
        window.clearInterval(timer);
        setDocumentForm({ file: null, name: "", uploadProgress: 100, uploadStatus: "success" });
        setDocuments((prev) => [created, ...prev]);
        window.setTimeout(() => {
          setDocumentForm({ file: null, name: "", uploadProgress: 0, uploadStatus: "idle" });
          closeModal();
          router.refresh();
        }, 700);
      } catch (error) {
        window.clearInterval(timer);
        setDocumentForm((prev) => ({ ...prev, uploadStatus: "error", uploadProgress: 0 }));
        setFormError(error instanceof Error ? error.message : "Failed to upload document.");
      }
    });
  }

  function handleSaveEmergencyContact() {
    setFormError(null);
    startTransition(async () => {
      try {
        const saved = await saveEmergencyContactAction(emergencyForm);
        setEmergencyContact(saved);
        closeModal();
        router.refresh();
      } catch (error) {
        setFormError(error instanceof Error ? error.message : "Failed to save emergency contact.");
      }
    });
  }

  function removeAllergy(item: MedicalProfileAllergy) {
    startTransition(async () => {
      try {
        await removeAllergyAction(item.id);
        setAllergies((prev) => prev.filter((entry) => entry.id !== item.id));
        router.refresh();
      } catch (error) {
        console.error(error);
      }
    });
  }

  function removeMedication(item: MedicalProfileMedication) {
    startTransition(async () => {
      try {
        await removeMedicationAction(item.id);
        setMedications((prev) => prev.filter((entry) => entry.id !== item.id));
        router.refresh();
      } catch (error) {
        console.error(error);
      }
    });
  }

  function removeCondition(item: MedicalProfileCondition) {
    startTransition(async () => {
      try {
        await removeConditionAction(item.id);
        setConditions((prev) => prev.filter((entry) => entry.id !== item.id));
        router.refresh();
      } catch (error) {
        console.error(error);
      }
    });
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="px-5 py-4 flex items-center">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors active:scale-95"
            type="button"
          >
            <ArrowLeft size={20} className="text-gray-900" />
          </button>
          <h1 className="text-lg font-bold text-gray-900 ml-3">Medical Profile</h1>
        </div>
      </div>

      <div className="px-5 pt-6 pb-4">
        <div className="bg-gradient-to-br from-[#083f30] to-[#0a5a44] rounded-2xl p-5 text-white">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
              <Lock size={20} className="text-white" />
            </div>
            <div>
              <h3 className="font-bold mb-1">Your Privacy is Protected</h3>
              <p className="text-sm text-white/90">
                All medical information is encrypted, HIPAA-compliant, and only shared with your authorized healthcare providers.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-5 pb-8 space-y-4">
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center">
                <AlertCircle size={20} className="text-red-600" />
              </div>
              <h3 className="font-bold text-gray-900">Allergies</h3>
            </div>
            <button
              onClick={() => setActiveModal("allergy")}
              className="w-9 h-9 bg-[#083f30] text-white rounded-full flex items-center justify-center hover:bg-[#0a5a44] transition-colors"
              type="button"
            >
              <Plus size={18} />
            </button>
          </div>
          {allergies.length > 0 ? (
            <div className="space-y-2">
              {allergies.map((allergy) => (
                <div key={allergy.id} className="flex items-center justify-between p-3 bg-red-50 rounded-xl border border-red-100">
                  <span className="text-gray-900 font-medium">{allergyLabel(allergy)}</span>
                  <button
                    onClick={() => removeAllergy(allergy)}
                    className="text-red-600 hover:text-red-700"
                    type="button"
                    disabled={isPending}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-gray-500 text-sm mb-3">No allergies recorded</p>
              <button
                onClick={() => setActiveModal("allergy")}
                className="text-sm font-semibold text-[#083f30] hover:underline"
                type="button"
              >
                Add your first allergy
              </button>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center">
                <Pill size={20} className="text-purple-600" />
              </div>
              <h3 className="font-bold text-gray-900">Current Medications</h3>
            </div>
            <button
              onClick={() => setActiveModal("medication")}
              className="w-9 h-9 bg-[#083f30] text-white rounded-full flex items-center justify-center hover:bg-[#0a5a44] transition-colors"
              type="button"
            >
              <Plus size={18} />
            </button>
          </div>
          {medications.length > 0 ? (
            <div className="space-y-2">
              {medications.map((medication) => (
                <div key={medication.id} className="flex items-center justify-between p-3 bg-purple-50 rounded-xl border border-purple-100">
                  <span className="text-gray-900 text-sm font-medium">{medicationLabel(medication)}</span>
                  <button
                    onClick={() => removeMedication(medication)}
                    className="text-purple-600 hover:text-purple-700"
                    type="button"
                    disabled={isPending}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-gray-500 text-sm mb-3">No medications recorded</p>
              <button
                onClick={() => setActiveModal("medication")}
                className="text-sm font-semibold text-[#083f30] hover:underline"
                type="button"
              >
                Add your first medication
              </button>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                <FileText size={20} className="text-blue-600" />
              </div>
              <h3 className="font-bold text-gray-900">Medical History</h3>
            </div>
            <button
              onClick={() => setActiveModal("condition")}
              className="w-9 h-9 bg-[#083f30] text-white rounded-full flex items-center justify-center hover:bg-[#0a5a44] transition-colors"
              type="button"
            >
              <Plus size={18} />
            </button>
          </div>
          {conditions.length > 0 ? (
            <div className="space-y-2">
              {conditions.map((condition) => (
                <div key={condition.id} className="flex items-center justify-between p-3 bg-blue-50 rounded-xl border border-blue-100">
                  <span className="text-gray-900 font-medium">{conditionLabel(condition)}</span>
                  <button
                    onClick={() => removeCondition(condition)}
                    className="text-blue-600 hover:text-blue-700"
                    type="button"
                    disabled={isPending}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-gray-500 text-sm mb-3">No conditions recorded</p>
              <button
                onClick={() => setActiveModal("condition")}
                className="text-sm font-semibold text-[#083f30] hover:underline"
                type="button"
              >
                Add medical history
              </button>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
                <FileText size={20} className="text-green-600" />
              </div>
              <h3 className="font-bold text-gray-900">Medical Documents</h3>
            </div>
            <button
              onClick={() => setActiveModal("document")}
              className="w-9 h-9 bg-[#083f30] text-white rounded-full flex items-center justify-center hover:bg-[#0a5a44] transition-colors"
              type="button"
            >
              <Plus size={18} />
            </button>
          </div>
          {documents.length > 0 ? (
            <div className="space-y-2">
              {documents.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="flex-1">
                    <p className="text-gray-900 font-medium text-sm">{doc.title}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatDisplayDate(doc.createDate)} • {formatFileSize(doc.sizeBytes)}
                    </p>
                  </div>
                  <a
                    href={documentViewUrl(doc)}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#083f30] text-sm font-semibold hover:underline ml-4"
                  >
                    View
                  </a>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-gray-500 text-sm mb-3">No documents uploaded</p>
              <button
                onClick={() => setActiveModal("document")}
                className="text-sm font-semibold text-[#083f30] hover:underline"
                type="button"
              >
                Upload your first document
              </button>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center">
                <Phone size={20} className="text-orange-600" />
              </div>
              <h3 className="font-bold text-gray-900">Emergency Contact</h3>
            </div>
            <button
              onClick={() => {
                setEmergencyForm(emergencyContact);
                setActiveModal("emergency");
              }}
              className="text-[#083f30] font-semibold text-sm hover:underline"
              type="button"
            >
              <Edit2 size={16} className="inline-block mr-1" />
              Edit
            </button>
          </div>
          <div className="p-4 bg-orange-50 rounded-xl border border-orange-100">
            <div className="flex items-center gap-2 mb-2">
              <User size={16} className="text-gray-600" />
              <span className="text-gray-900 font-semibold">{emergencyContact.name || "No contact saved"}</span>
            </div>
            <div className="flex items-center gap-2 mb-1">
              <Phone size={16} className="text-gray-600" />
              <span className="text-gray-700">{emergencyContact.phone || "—"}</span>
            </div>
            <p className="text-sm text-gray-600 ml-6">{emergencyContact.relationship || "—"}</p>
          </div>
        </div>
      </div>

  {activeModal && (
  <div className="fixed inset-0 z-[120] bg-black/50 backdrop-blur-sm flex items-end justify-center">
    <div className="relative w-full max-w-lg rounded-t-3xl bg-white animate-slide-up max-h-[90dvh] overflow-hidden shadow-2xl">
      {activeModal === "allergy" && (
        <>
          <div className="sticky top-0 z-10 border-b border-gray-200 bg-white p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Add Allergy</h2>
              <button
                onClick={closeModal}
                className="flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-gray-100"
                type="button"
              >
                <X size={24} className="text-gray-500" />
              </button>
            </div>
          </div>

          <div className="overflow-y-auto p-6 pb-28 space-y-4 max-h-[calc(90dvh-88px)]">
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-900">
                Allergy Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={allergyForm.name}
                onChange={(e) =>
                  setAllergyForm({ ...allergyForm, name: e.target.value })
                }
                placeholder="e.g., Penicillin"
                className="h-12 w-full rounded-xl border-2 border-gray-300 px-4 transition-colors focus:border-[#083f30] focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-900">
                Severity Level
              </label>
              <select
                value={allergyForm.severity}
                onChange={(e) =>
                  setAllergyForm({
                    ...allergyForm,
                    severity: e.target.value as typeof allergyForm.severity,
                  })
                }
                className="h-12 w-full rounded-xl border-2 border-gray-300 bg-white px-4 transition-colors focus:border-[#083f30] focus:outline-none"
              >
                <option value="mild">Mild</option>
                <option value="moderate">Moderate</option>
                <option value="severe">Severe</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-900">
                Notes (Optional)
              </label>
              <textarea
                value={allergyForm.notes}
                onChange={(e) =>
                  setAllergyForm({ ...allergyForm, notes: e.target.value })
                }
                placeholder="Additional information about reactions..."
                rows={3}
                className="w-full resize-none rounded-xl border-2 border-gray-300 px-4 py-3 transition-colors focus:border-[#083f30] focus:outline-none"
              />
            </div>

            {formError ? <p className="text-sm text-red-600">{formError}</p> : null}
          </div>

          <div className="sticky bottom-0 border-t border-gray-200 bg-white p-6">
            <button
              onClick={handleAddAllergy}
              disabled={!allergyForm.name.trim() || isPending}
              className="h-14 w-full rounded-xl bg-[#083f30] font-bold text-white transition-all active:scale-95 hover:bg-[#0a5a44] disabled:cursor-not-allowed disabled:bg-gray-300"
              type="button"
            >
              Add Allergy
            </button>
          </div>
        </>
      )}
    </div>
  </div>
)}
    </div>
  );
}
