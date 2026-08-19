import "server-only";
import { randomUUID } from "node:crypto";
import { createReadStream } from "node:fs";
import { Readable } from "node:stream";
import { mkdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { verifyFileSignature } from "./fileSignatures";

const DEFAULT_MAX_RECEIPT_BYTES = 8 * 1024 * 1024;
const ALLOWED_RECEIPT_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
]);

export type StoredPrivateFile = {
  privateUrl: string;
  storagePath: string;
  storedName: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  contentSha256: string;
};

function getStorageRoot() {
  return process.env.PRIVATE_FILE_STORAGE_ROOT || path.join(process.cwd(), ".lsevin-private-files");
}

function extensionFor(file: File) {
  const fromName = file.name.includes(".") ? file.name.split(".").pop()?.toLowerCase() : undefined;
  if (fromName && /^[a-z0-9]{2,8}$/.test(fromName)) return fromName;
  if (file.type === "image/jpeg") return "jpg";
  if (file.type === "image/png") return "png";
  if (file.type === "image/webp") return "webp";
  if (file.type === "application/pdf") return "pdf";
  return "bin";
}

export function isFileLike(value: FormDataEntryValue | null): value is File {
  return Boolean(value && typeof value === "object" && "arrayBuffer" in value && "size" in value && "name" in value);
}

export async function storePrivateReceiptFile(input: {
  file: File;
  moduleCode: string;
  ownerEntityType: string;
  ownerEntityId: string;
}) : Promise<StoredPrivateFile> {
  const maxBytes = Number(process.env.PAYMENT_RECEIPT_MAX_BYTES || DEFAULT_MAX_RECEIPT_BYTES);
  if (!input.file.size) throw new Error("Receipt file is empty.");
  if (input.file.size > maxBytes) throw new Error(`Receipt file exceeds the maximum size of ${maxBytes} bytes.`);
  if (!ALLOWED_RECEIPT_MIME_TYPES.has(input.file.type)) {
    throw new Error("Receipt file type is not allowed. Upload JPG, PNG, WebP, or PDF.");
  }

  const buffer = Buffer.from(await input.file.arrayBuffer());
  const verified = verifyFileSignature(buffer, input.file.type);
  if (!ALLOWED_RECEIPT_MIME_TYPES.has(verified.mimeType)) {
    throw new Error("Receipt file content must be JPG, PNG, WebP, or PDF.");
  }
  const ext = verified.extension || extensionFor(input.file);
  const safeModuleCode = input.moduleCode.replace(/[^a-z0-9_-]/gi, "-").toLowerCase();
  const storedName = `${Date.now()}-${randomUUID()}.${ext}`;
  const relativeDir = path.join(safeModuleCode, "receipts", input.ownerEntityType.replace(/[^a-z0-9_-]/gi, "-"), input.ownerEntityId);
  const absoluteDir = path.join(getStorageRoot(), relativeDir);
  await mkdir(absoluteDir, { recursive: true });

  const storagePath = path.join(absoluteDir, storedName);
  await writeFile(storagePath, buffer, { mode: 0o600 });

  return {
    privateUrl: `private://${relativeDir.replaceAll(path.sep, "/")}/${storedName}`,
    storagePath,
    storedName,
    originalName: input.file.name,
    mimeType: verified.mimeType,
    sizeBytes: input.file.size,
    contentSha256: verified.sha256,
  };
}


export function isPrivateFileUrl(value?: string | null) {
  return String(value || "").startsWith("private://");
}

export async function openPrivateFileUrl(value: string) {
  if (!isPrivateFileUrl(value)) throw new Error("Not a private file URL.");
  const encoded = value.slice("private://".length).replaceAll("\\", "/");
  if (!encoded || encoded.includes("\0")) throw new Error("Private file URL is invalid.");
  const root = path.resolve(getStorageRoot());
  const absolutePath = path.resolve(root, encoded);
  const relative = path.relative(root, absolutePath);
  if (!relative || relative === "." || relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error("Private file URL escapes the configured storage root.");
  }
  const info = await stat(absolutePath);
  if (!info.isFile()) throw new Error("Private file reference does not identify a regular file.");
  const nodeStream = createReadStream(absolutePath);
  return { stream: Readable.toWeb(nodeStream) as ReadableStream<Uint8Array>, sizeBytes: info.size };
}
