import { putData } from "@/config/http/http-service.server";
import { getSession } from "@/lib/auth/session";
import { createMedia } from "@/components/media/server/repository";
import type { CreateMediaInput, MediaType } from "@/components/media";

import { BugReportAttachment } from "../types";

const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024;
const MAX_FILES_PER_MESSAGE = 8;

const ALLOWED_MIME_PREFIXES = ["image/", "video/"];
const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "text/plain",
  "text/markdown",
  "application/json",
  "application/zip",
  "application/x-zip-compressed",
]);

function mediaTypeFromMime(mimeType: string): MediaType {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  return "file";
}

function extensionFromName(fileName: string): string | null {
  const index = fileName.lastIndexOf(".");
  if (index < 0) return null;
  return fileName.slice(index + 1).toLowerCase() || null;
}

function firstString(value: unknown): string | null {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) {
    const item = value.find((entry) => typeof entry === "string");
    return typeof item === "string" ? item : null;
  }
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return (
      firstString(record.fileUrl) ??
      firstString(record.url) ??
      firstString(record.path) ??
      firstString(record.data) ??
      firstString(record.result)
    );
  }
  return null;
}

function isAllowedFile(file: File) {
  const mimeType = file.type || "application/octet-stream";
  return ALLOWED_MIME_PREFIXES.some((prefix) => mimeType.startsWith(prefix)) || ALLOWED_MIME_TYPES.has(mimeType);
}

export function getBugReportFilesFromFormData(formData: FormData): File[] {
  return formData
    .getAll("files")
    .filter((value): value is File => {
      return Boolean(value) && typeof value === "object" && "arrayBuffer" in value && "size" in value;
    })
    .filter((file) => file.size > 0)
    .slice(0, MAX_FILES_PER_MESSAGE);
}

async function uploadWithExistingMediaStorage(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  // Keep this aligned with your existing media module route:
  // app/api/admin/media/storage/route.ts -> File/UploadAnyFile?path=1
  if (!formData.has("path")) {
    formData.append("path", "1");
  }

  const session = await getSession().catch(() => null);
  const { data, error } = await putData<FormData, unknown>("File/UploadAnyFile?path=1", formData, {
    locale: "en",
    token: session?.user?.accessToken,
  });

  if (error) {
    throw new Error(typeof error === "string" ? error : "File storage upload failed.");
  }

  const fileUrl = firstString(data);
  if (!fileUrl) {
    throw new Error("File storage upload did not return a usable URL.");
  }

  return {
    fileUrl,
    storedName: file.name,
    storagePath: null,
    storageKey: null,
  };
}

export async function storeBugReportFiles(input: {
  files: File[];
  createdByUserId: string | null;
  tx?: any;
}): Promise<BugReportAttachment[]> {
  const attachments: BugReportAttachment[] = [];
  const db = input.tx;

  for (const file of input.files) {
    if (file.size > MAX_FILE_SIZE_BYTES) {
      throw new Error(`File ${file.name || "attachment"} is larger than 15MB.`);
    }
    if (!isAllowedFile(file)) {
      throw new Error(`File ${file.name || "attachment"} type is not allowed.`);
    }

    const mimeType = file.type || "application/octet-stream";
    const mediaType = mediaTypeFromMime(mimeType);
    const upload = await uploadWithExistingMediaStorage(file);

    const mediaPayload: CreateMediaInput = {
      titleTranslations: { "en-US": file.name, en: file.name },
      descriptionTranslations: {},
      altTranslations: { "en-US": file.name, en: file.name },
      originalName: file.name,
      storedName: upload.storedName || file.name,
      fileUrl: upload.fileUrl,
      storagePath: upload.storagePath,
      storageKey: upload.storageKey,
      mimeType,
      extension: extensionFromName(file.name),
      mediaType,
      fileSize: file.size,
      width: null,
      height: null,
      durationSeconds: null,
      createdBy: input.createdByUserId,
      isPublic: true,
    };

    const media = await createMedia(mediaPayload, db);

    attachments.push({
      id: media.id,
      mediaId: media.id,
      fileUrl: media.fileUrl,
      fileName: media.originalName,
      mimeType: media.mimeType,
      mediaType: media.mediaType,
      fileSize: media.fileSize,
      width: media.width,
      height: media.height,
    });
  }

  return attachments;
}
