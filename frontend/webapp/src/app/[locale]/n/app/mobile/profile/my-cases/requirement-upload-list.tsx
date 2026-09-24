"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { useRouter } from "@/i18n/navigation";
import SingleMediaPickerInput from "@/features/media-picker-addon/components/SingleMediaPickerInput";
import type { MediaItem } from "@/features/media-picker-addon/types";
import { uploadMyDocumentAction } from "@/features/patients/server/customer-documents-actions";
import type { TranslationType } from "@/types/next";

type RequirementWithLabels = {
  id: string;
  title: string;
  requirementStatus: string;
  requirementType: string;
  maxAgeHours: number | null;
  isMandatory: boolean;
  statusLabel: string;
  typeLabel: string;
};

const FULFILLABLE_STATUSES = ["missing", "requested", "rejected", "expired"];

function documentTypeForRequirement(requirementType: string) {
  if (requirementType === "lab_test") return "lab_report";
  if (requirementType === "imaging") return "imaging_report";
  return "other";
}

/**
 * Server-resolved status/type labels are passed in as plain strings
 * (statusLabel/typeLabel) rather than the tCases translation function --
 * functions can't cross the server/client boundary, and this route's
 * client bundle doesn't ship the "Patients" namespace those labels come
 * from anyway (only "MobileProfile" does, per
 * src/i18n/client-messages.ts's mobileApp segment).
 */
export function RequirementUploadList({
  requirements,
  patientId,
  medicalCaseId,
}: {
  requirements: RequirementWithLabels[];
  patientId: string;
  medicalCaseId: string;
}) {
  const t = useTranslations("MobileProfile.myCases") as TranslationType;
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  const fulfill = (requirementId: string, requirementType: string, file: MediaItem) => {
    setUploadingId(null);
    startTransition(async () => {
      const result = await uploadMyDocumentAction({
        patientId,
        medicalCaseId,
        requirementId,
        documentType: documentTypeForRequirement(requirementType) as never,
        title: file.originalName,
        mediaLibraryId: file.id,
        fileUrl: file.fileUrl,
        mimeType: file.mimeType,
        fileSize: file.fileSize,
        originalName: file.originalName,
      });
      if (result.ok) {
        toast.success(t("requirementFulfilled"));
        router.refresh();
        return;
      }
      toast.error(result.error || t("shareCase.errorGeneric"));
    });
  };

  return (
    <div className="mt-1.5 space-y-2">
      {requirements.map((requirement) => (
        <div key={requirement.id} className="text-sm">
          <div className="flex items-center justify-between gap-2">
            <span className="text-gray-800">
              {requirement.title}
              {!requirement.isMandatory && <span className="text-gray-400"> ({t("optional")})</span>}
            </span>
            <span className="shrink-0 text-xs text-gray-400">{requirement.statusLabel}</span>
          </div>
          {requirement.maxAgeHours && (
            <p className="text-xs text-gray-400">{t("maxAgeHoursNotice", { hours: requirement.maxAgeHours })}</p>
          )}
          {FULFILLABLE_STATUSES.includes(requirement.requirementStatus) && (
            <div className="mt-1">
              {uploadingId === requirement.id ? (
                <SingleMediaPickerInput
                  name={`requirement-${requirement.id}`}
                  mediaType="all"
                  valueField="id"
                  placeholder={t("uploadFile")}
                  onItemsChange={(items) => {
                    const file = items[0];
                    if (file) fulfill(requirement.id, requirement.requirementType, file);
                  }}
                />
              ) : (
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => setUploadingId(requirement.id)}
                  className="text-xs font-medium text-blue-600 disabled:opacity-50"
                >
                  {t("uploadFile")}
                </button>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
