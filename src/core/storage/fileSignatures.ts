import "server-only";
import { createHash } from "node:crypto";

export type VerifiedFileSignature = {
  mimeType: string;
  extension: string;
  mediaType: "image" | "video" | "file";
  sha256: string;
};

function startsWith(bytes: Buffer, signature: number[], offset = 0) {
  return signature.every((value, index) => bytes[offset + index] === value);
}

function ascii(bytes: Buffer, start: number, length: number) {
  return bytes.subarray(start, start + length).toString("ascii");
}

export function detectFileSignature(bytes: Buffer): Omit<VerifiedFileSignature, "sha256"> | null {
  if (startsWith(bytes, [0xff, 0xd8, 0xff])) return { mimeType: "image/jpeg", extension: "jpg", mediaType: "image" };
  if (startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return { mimeType: "image/png", extension: "png", mediaType: "image" };
  if (ascii(bytes, 0, 6) === "GIF87a" || ascii(bytes, 0, 6) === "GIF89a") return { mimeType: "image/gif", extension: "gif", mediaType: "image" };
  if (ascii(bytes, 0, 4) === "RIFF" && ascii(bytes, 8, 4) === "WEBP") return { mimeType: "image/webp", extension: "webp", mediaType: "image" };
  if (ascii(bytes, 0, 5) === "%PDF-") return { mimeType: "application/pdf", extension: "pdf", mediaType: "file" };
  if (startsWith(bytes, [0x1a, 0x45, 0xdf, 0xa3])) return { mimeType: "video/webm", extension: "webm", mediaType: "video" };
  if (ascii(bytes, 4, 4) === "ftyp") {
    const brand = ascii(bytes, 8, 4).toLowerCase();
    if (["avif", "avis"].includes(brand)) return { mimeType: "image/avif", extension: "avif", mediaType: "image" };
    return { mimeType: "video/mp4", extension: "mp4", mediaType: "video" };
  }
  return null;
}

export function verifyFileSignature(bytes: Buffer, claimedMimeType?: string | null): VerifiedFileSignature {
  const detected = detectFileSignature(bytes);
  if (!detected) throw new Error("The uploaded file signature is not an allowed image, video, or PDF type.");
  const claimed = String(claimedMimeType || "").trim().toLowerCase();
  if (claimed && claimed !== "application/octet-stream" && claimed !== detected.mimeType) {
    throw new Error(`The uploaded file content (${detected.mimeType}) does not match its declared type (${claimed}).`);
  }
  return { ...detected, sha256: createHash("sha256").update(bytes).digest("hex") };
}
