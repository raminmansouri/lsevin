import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const ALLOWED_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/jpg",
]);

const ALLOWED_EXTENSIONS = new Set([".pdf", ".jpg", ".jpeg", ".png"]);
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

export type StoredMedicalProfileFile = {
  fileName: string;
  fileUrl: string;
  mimeType: string;
  sizeBytes: number;
};

function sanitizeBaseName(input: string): string {
  return input
    .replace(/[^a-zA-Z0-9-_\. ]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 120);
}

export async function storeMedicalProfileFile(
  file: File,
  customerId: string,
): Promise<StoredMedicalProfileFile> {
  if (!(file instanceof File)) {
    throw new Error("A valid file is required.");
  }

  if (!ALLOWED_TYPES.has(file.type)) {
    throw new Error("Only PDF, JPG, and PNG files are supported.");
  }

  if (file.size <= 0 || file.size > MAX_FILE_SIZE_BYTES) {
    throw new Error("File size must be between 1 byte and 10 MB.");
  }

  const originalExt = path.extname(file.name).toLowerCase();
  if (!ALLOWED_EXTENSIONS.has(originalExt)) {
    throw new Error("Unsupported file extension.");
  }

  const safeBase = sanitizeBaseName(path.basename(file.name, originalExt)) || "medical-document";
  const storedName = `${Date.now()}-${randomUUID()}-${safeBase}${originalExt}`;

  const relativeDir = path.posix.join("uploads", "medical-profile", customerId);
  const absoluteDir = path.join(process.cwd(), "public", relativeDir);
  await mkdir(absoluteDir, { recursive: true });

  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(absoluteDir, storedName), buffer);

  return {
    fileName: file.name,
    fileUrl: `/${relativeDir}/${storedName}`,
    mimeType: file.type,
    sizeBytes: file.size,
  };
}
