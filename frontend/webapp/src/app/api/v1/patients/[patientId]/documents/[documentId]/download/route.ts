import { NextRequest, NextResponse } from "next/server";

import { isApiAdmin, requireApiUser } from "@/lib/auth/api-guard";
import { getClinicalDocument } from "@/features/patients/server/documents-repository";
import { findActiveAccountPatientLink } from "@/features/patients/server/repository";
import { recordPatientAuditEvent } from "@/features/patients/server/audit";

type Context = { params: Promise<{ patientId: string; documentId: string }> };

/**
 * Where a stored document's bytes are fetched from. Relative paths (what the upload
 * pipeline normally stores) resolve against the files host; an absolute URL is only
 * followed when it is on that same host. file_url can come from a customer-submitted
 * form (uploadMyDocumentAction), so following any other host would let a customer make
 * this server fetch arbitrary URLs.
 */
function resolveStoredFileUrl(fileUrl: string): URL | null {
  const base = process.env.NEXT_PUBLIC_FILES_URL?.replace(/\/+$/, "");
  if (!base) return null;
  let filesBase: URL;
  try {
    filesBase = new URL(`${base}/`);
  } catch {
    return null;
  }

  const trimmed = fileUrl.trim();
  if (!trimmed) return null;

  if (/^https?:\/\//i.test(trimmed)) {
    try {
      const absolute = new URL(trimmed);
      return absolute.origin === filesBase.origin ? absolute : null;
    } catch {
      return null;
    }
  }

  const relative = trimmed.replace(/\\/g, "/").replace(/^\/+/, "");
  if (relative.split("/").some((segment) => segment === "..")) return null;
  try {
    const resolved = new URL(relative, filesBase);
    return resolved.origin === filesBase.origin ? resolved : null;
  } catch {
    return null;
  }
}

function contentDispositionFor(name: string | null | undefined): string {
  const fallback = (name || "document").replace(/[^\x20-\x7e]|["\\]/g, "_");
  const encoded = encodeURIComponent(name || "document");
  return `inline; filename="${fallback}"; filename*=UTF-8''${encoded}`;
}

/**
 * V3.1 + V5.5: authorized + audited document download.
 *
 * Object-level authorization: an admin/superadmin may access any patient's
 * documents; anyone else may only access documents for a patient they hold an
 * active account_patient_links row for. 404 rather than 403 so a probe can't
 * tell "forbidden" from "doesn't exist".
 *
 * The bytes are streamed through this route instead of redirecting to the
 * stored file URL. A redirect handed the browser the storage link itself:
 * public and permanent, so anyone it was forwarded to (or who found it in
 * history or logs) could open the document with no check and no audit entry.
 * Streaming keeps that link server-side. It does not make the object private
 * in storage -- the files host still serves it to anyone who already knows
 * the path; closing that needs a private bucket or signed URLs in the .NET
 * file service.
 */
export async function GET(_request: NextRequest, context: Context) {
  const auth = await requireApiUser();
  if (auth instanceof NextResponse) return auth;

  const { patientId, documentId } = await context.params;
  const document = await getClinicalDocument(documentId);
  if (!document || document.patientId !== patientId) {
    return new NextResponse(null, { status: 404 });
  }

  if (!isApiAdmin(auth)) {
    const link = await findActiveAccountPatientLink(auth.userId, patientId);
    if (!link) return new NextResponse(null, { status: 404 });
  }

  const source = resolveStoredFileUrl(document.fileUrl);
  if (!source) {
    console.error("[patients/documents/download] stored file URL is not on the files host", { documentId: document.id });
    return new NextResponse(null, { status: 404 });
  }

  let upstream: Response;
  try {
    upstream = await fetch(source, { cache: "no-store", redirect: "error" });
  } catch (error) {
    console.error("[patients/documents/download] fetching the stored file failed", { documentId: document.id, error });
    return new NextResponse(null, { status: 502 });
  }
  if (!upstream.ok || !upstream.body) {
    return new NextResponse(null, { status: upstream.status === 404 ? 404 : 502 });
  }

  await recordPatientAuditEvent({
    actorUserId: auth.userId,
    actorRoles: auth.roles,
    action: "document_downloaded",
    entityType: "clinical_document",
    entityId: document.id,
    metadata: { patientId, isConfidential: document.isConfidential },
  });

  const headers = new Headers({
    "Content-Type": document.mimeType || upstream.headers.get("content-type") || "application/octet-stream",
    "Content-Disposition": contentDispositionFor(document.originalName || document.title),
    "Cache-Control": "private, no-store",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "no-referrer",
  });
  const length = upstream.headers.get("content-length");
  if (length) headers.set("Content-Length", length);

  return new NextResponse(upstream.body, { status: 200, headers });
}
