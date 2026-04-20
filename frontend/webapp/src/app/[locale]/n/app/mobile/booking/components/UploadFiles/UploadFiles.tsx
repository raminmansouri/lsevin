// UploadFiles.tsx
"use client";

import {
  CheckCircle2,
  FileText,
  Info,
  PlusCircleIcon,
  ChevronRight,
  Trash2,
  AlertCircle,
  Clock3,
} from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useBooking } from "../../hooks/use-booking";
import { useFetchUploadFiles } from "@/features/booking/api/client/fetch-upload-files";

interface DocumentFromServer {
  id: string;
  name: string;
  required: boolean;
  description?: string;
}

interface UploadFilesProps {
  documentsFromServer: DocumentFromServer[];
}

interface NormalizedDocument {
  clientId: string; // always unique for UI state
  serverId: string; // original backend id if available
  name: string;
  required: boolean;
  description?: string;
}

interface FileUpload {
  docClientId: string;
  docServerId: string;
  file: File;
  name: string;
  size: number;
  type: string;
}

const ACCEPTED_FILE_TYPES = [".png", ".jpg", ".jpeg", ".pdf"];
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

export default function UploadFiles({
  documentsFromServer,
}: UploadFilesProps) {
  const translate = useTranslations("UploadFiles");

  const t = (key: string, fallback: string) => {
    try {
      const value = translate(key);
      return value && value !== key ? value : fallback;
    } catch {
      return fallback;
    }
  };

  const {
    providerId,
    serviceId,
    specialistId,
    locale,
    handleNext,
    // if later you add a booking context method for persisting files,
    // you can wire it here, for example:
    // setUploadedFiles,
  } = useBooking();

  const { data } = useFetchUploadFiles(
    providerId,
    serviceId,
    specialistId,
    locale
  );

  const documents = useMemo<NormalizedDocument[]>(() => {
    const source =
      Array.isArray(data?.documents) && data.documents.length > 0
        ? data.documents
        : documentsFromServer ?? [];

    return source.map((doc: any, index: number) => {
      const rawId =
        doc?.id !== undefined && doc?.id !== null ? String(doc.id) : "";
      const safeName =
        typeof doc?.name === "string" && doc.name.trim().length > 0
          ? doc.name
          : "Document";

      return {
        clientId: rawId
          ? `doc-${rawId}-${index}`
          : `doc-fallback-${safeName.replace(/\s+/g, "-").toLowerCase()}-${index}`,
        serverId: rawId,
        name: safeName,
        required: !!doc?.required,
        description: doc?.description || "",
      };
    });
  }, [data?.documents, documentsFromServer]);

  const [fileUploads, setFileUploads] = useState<FileUpload[]>([]);
  const [showValidation, setShowValidation] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);

  const documentRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const uploadedMap = useMemo(() => {
    return Object.fromEntries(fileUploads.map((u) => [u.docClientId, u]));
  }, [fileUploads]);

  const requiredDocuments = useMemo(() => {
    return documents.filter((doc) => doc.required);
  }, [documents]);

  const missingRequiredDocs = useMemo(() => {
    return requiredDocuments.filter((doc) => !uploadedMap[doc.clientId]);
  }, [requiredDocuments, uploadedMap]);

  const allRequiredUploaded = missingRequiredDocs.length === 0;
  const uploadedCount = fileUploads.length;
  const pendingCount = documents.length - uploadedCount;

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const removeFile = (docClientId: string) => {
    setFileUploads((prev) => prev.filter((u) => u.docClientId !== docClientId));
    setGlobalError(null);
  };

  const handleFileSelect = (
    doc: NormalizedDocument,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];

    if (!file) {
      e.target.value = "";
      return;
    }

    const lowerName = file.name.toLowerCase();
    const isValidType = ACCEPTED_FILE_TYPES.some((ext) =>
      lowerName.endsWith(ext)
    );

    if (!isValidType) {
      setGlobalError(
        t(
          "invalidFileType",
          "Invalid file type. Only PNG, JPG, JPEG, and PDF are allowed."
        )
      );
      e.target.value = "";
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setGlobalError(
        t(
          "fileTooLarge",
          "File is too large. Maximum allowed size is 10 MB."
        )
      );
      e.target.value = "";
      return;
    }

    setGlobalError(null);
    setShowValidation(false);

    setFileUploads((prev) => {
      const next = prev.filter((u) => u.docClientId !== doc.clientId);

      return [
        ...next,
        {
          docClientId: doc.clientId,
          docServerId: doc.serverId,
          file,
          name: file.name,
          size: file.size,
          type: file.type,
        },
      ];
    });

    // allow selecting same file again later
    e.target.value = "";
  };

  const handleContinue = () => {
    setShowValidation(true);
    setGlobalError(null);

    if (!allRequiredUploaded) {
      const firstMissing = missingRequiredDocs[0];
      if (firstMissing?.clientId) {
        documentRefs.current[firstMissing.clientId]?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }
      return;
    }

    // If you later need to persist files in booking context, do it here:
    // setUploadedFiles(fileUploads);

    handleNext();
  };

  const getDocStatus = (doc: NormalizedDocument) => {
    const uploaded = !!uploadedMap[doc.clientId];
    const missing = showValidation && doc.required && !uploaded;

    if (uploaded) return "uploaded";
    if (missing) return "missing";
    if (doc.required) return "pending-required";
    return "pending-optional";
  };

  return (
    <div className="space-y-6">
      <div className="relative flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="rounded-xl bg-blue-50 p-2">
          <PlusCircleIcon className="h-8 w-8 text-blue-600" />
        </div>

        <div className="flex-1">
          <h3 className="font-medium text-gray-900">
            {t("uploadCardTitle", "Upload Documents")}
          </h3>
          <p className="text-sm text-gray-500">
            {t(
              "uploadCardDesc",
              "Attach the required documents for this booking."
            )}
          </p>
        </div>

        {documents.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <div className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
              {uploadedCount} {t("uploadedBadge", "Uploaded")}
            </div>
            <div className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700">
              {pendingCount} {t("pendingBadge", "Pending")}
            </div>
            <div className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
              {uploadedCount}/{documents.length} {t("filesUploaded", "uploaded")}
            </div>
          </div>
        )}
      </div>

      {globalError && (
        <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{globalError}</span>
        </div>
      )}

      {documents.length > 0 && !allRequiredUploaded && !showValidation && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          {t(
            "requiredFilesPending",
            "Some required files still need to be uploaded before you continue."
          )}
        </div>
      )}

      {showValidation && missingRequiredDocs.length > 0 && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3">
          <p className="text-sm font-medium text-red-700">
            {t(
              "missingRequiredTitle",
              "Some required files are still missing:"
            )}
          </p>

          <ul className="mt-2 list-disc pl-5 text-sm text-red-700">
            {missingRequiredDocs.map((doc) => (
              <li key={doc.clientId}>{doc.name}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="space-y-4">
        {documents.length > 0 ? (
          documents.map((doc) => {
            const upload = uploadedMap[doc.clientId];
            const status = getDocStatus(doc);
            const isUploaded = status === "uploaded";
            const isMissing = status === "missing";
            const isPendingRequired = status === "pending-required";
            const inputId = `upload-file-${doc.clientId}`;

            return (
              <div
                key={doc.clientId}
                ref={(el) => {
                  documentRefs.current[doc.clientId] = el;
                }}
                className={[
                  "rounded-xl border p-4 transition-colors",
                  isUploaded
                    ? "border-green-200 bg-green-50/40"
                    : isMissing
                    ? "border-red-300 bg-red-50"
                    : isPendingRequired
                    ? "border-amber-200 bg-amber-50/40"
                    : "border-gray-200 bg-white",
                ].join(" ")}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex min-w-0 flex-1 items-start gap-4">
                    <div
                      className={[
                        "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                        isUploaded
                          ? "bg-green-100"
                          : isMissing
                          ? "bg-red-100"
                          : isPendingRequired
                          ? "bg-amber-100"
                          : "bg-gray-100",
                      ].join(" ")}
                    >
                      <FileText
                        className={[
                          "h-5 w-5",
                          isUploaded
                            ? "text-green-600"
                            : isMissing
                            ? "text-red-600"
                            : isPendingRequired
                            ? "text-amber-600"
                            : "text-gray-600",
                        ].join(" ")}
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium text-gray-900">{doc.name}</p>

                        {doc.required ? (
                          <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                            {t("requiredBadge", "Required")}
                          </span>
                        ) : (
                          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                            {t("optionalBadge", "Optional")}
                          </span>
                        )}

                        {isUploaded ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            {t("uploadedBadge", "Uploaded")}
                          </span>
                        ) : isMissing ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                            <AlertCircle className="h-3.5 w-3.5" />
                            {t("missingRequiredFile", "This file is required.")}
                          </span>
                        ) : (
                          <span
                            className={[
                              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
                              doc.required
                                ? "bg-amber-100 text-amber-700"
                                : "bg-gray-100 text-gray-600",
                            ].join(" ")}
                          >
                            <Clock3 className="h-3.5 w-3.5" />
                            {doc.required
                              ? t("pendingBadge", "Pending")
                              : t("notUploadedBadge", "Not uploaded")}
                          </span>
                        )}
                      </div>

                      {doc.description ? (
                        <p className="mt-1 text-sm text-gray-500">
                          {doc.description}
                        </p>
                      ) : (
                        <p className="mt-1 text-sm text-gray-500">
                          {t(
                            "defaultDescription",
                            "Please upload the requested document."
                          )}
                        </p>
                      )}

                      {isMissing && (
                        <p className="mt-2 text-sm text-red-600">
                          {t("missingRequiredFile", "This file is required.")}
                        </p>
                      )}

                      {upload && (
                        <div className="mt-3 rounded-lg border border-green-200 bg-white p-3">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="break-all text-sm font-medium text-gray-800">
                                {upload.name}
                              </p>
                              <p className="mt-1 text-xs text-gray-500">
                                {formatFileSize(upload.size)}
                              </p>
                            </div>

                            <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              {t("uploadedBadge", "Uploaded")}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <input
                      id={inputId}
                      type="file"
                      accept={ACCEPTED_FILE_TYPES.join(",")}
                      onChange={(e) => handleFileSelect(doc, e)}
                      className="hidden"
                    />

                    {upload && (
                      <button
                        type="button"
                        onClick={() => removeFile(doc.clientId)}
                        className="inline-flex items-center gap-2 rounded-md border border-red-200 bg-white px-3 py-2 text-sm text-red-600 transition-colors hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                        {t("removeBtn", "Remove")}
                      </button>
                    )}

                    <label
                      htmlFor={inputId}
                      className={[
                        "inline-flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
                        isUploaded
                          ? "bg-blue-50 text-blue-600 hover:bg-blue-100"
                          : isMissing
                          ? "bg-red-50 text-red-600 hover:bg-red-100"
                          : isPendingRequired
                          ? "bg-amber-50 text-amber-700 hover:bg-amber-100"
                          : "bg-gray-50 text-gray-700 hover:bg-gray-100",
                      ].join(" ")}
                    >
                      <PlusCircleIcon className="h-4 w-4" />
                      {upload
                        ? t("reuploadBtn", "Replace")
                        : t("uploadBtn", "Upload")}
                    </label>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="rounded-xl border border-dashed border-gray-300 p-4 text-sm text-gray-500">
            {t("noDocuments", "No documents are required for this booking.")}
          </div>
        )}
      </div>

      {documents.length > 0 && (
        <div className="rounded-xl border border-dashed border-gray-300 p-4">
          <div className="flex items-start gap-2">
            <Info className="mt-0.5 h-5 w-5 text-blue-600" />
            <div>
              <p className="text-sm font-medium text-blue-700">
                {t("acceptedFilesTitle", "Accepted files")}
              </p>
              <p className="mt-1 text-sm text-gray-600">
                {t(
                  "acceptedFilesDesc",
                  "PNG, JPG, JPEG, PDF — maximum file size: 10 MB."
                )}
              </p>
              <p className="mt-2 text-sm text-gray-600">
                {requiredDocuments.length > 0
                  ? t(
                      "uploadRequiredHint",
                      "Required files must be uploaded before continuing."
                    )
                  : t(
                      "uploadOptionalHint",
                      "All files are optional. You may continue without uploading."
                    )}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="mt-8 flex justify-end">
        <button
          type="button"
          onClick={handleContinue}
          className={[
            "inline-flex items-center gap-2 rounded-md px-4 py-2 transition-colors",
            allRequiredUploaded
              ? "bg-blue-600 text-white hover:bg-blue-700"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200",
          ].join(" ")}
        >
          {t("continueBtn", "Continue")}
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}