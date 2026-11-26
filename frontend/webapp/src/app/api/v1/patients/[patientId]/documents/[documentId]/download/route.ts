import { NextRequest, NextResponse } from "next/server";

import { isApiAdmin, requireApiUser } from "@/lib/auth/api-guard";
import { getClinicalDocument } from "@/features/patients/server/documents-repository";
import { findActiveAccountPatientLink } from "@/features/patients/server/repository";
import { recordPatientAuditEvent } from "@/features/patients/server/audit";
import { proxyStoredFile } from "@/lib/files/private-link";

type Context = { params: Promise<{ patientId: string; documentId: string }> };

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
 * Streaming keeps that link server-side. Documents uploaded since files moved
 * to Private/ are also refused by the files host without a signed link, so a
 * leaked path opens nothing (see lib/files/private-link.ts).
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

  // Private files (Private/...) are fetched through a short-lived signed link; the
  // storage address never reaches the browser either way.
  const response = await proxyStoredFile(document.fileUrl, {
    mimeType: document.mimeType,
    fileName: document.originalName || document.title,
  });
  if (!response.ok) {
    console.error("[patients/documents/download] could not fetch the stored file", { documentId: document.id, status: response.status });
    return new NextResponse(null, { status: response.status });
  }

  await recordPatientAuditEvent({
    actorUserId: auth.userId,
    actorRoles: auth.roles,
    action: "document_downloaded",
    entityType: "clinical_document",
    entityId: document.id,
    metadata: { patientId, isConfidential: document.isConfidential },
  });

  return response;
}
