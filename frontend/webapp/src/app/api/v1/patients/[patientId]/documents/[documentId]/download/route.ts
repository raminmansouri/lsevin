import { NextRequest, NextResponse } from "next/server";

import { requireApiAdmin } from "@/lib/auth/api-guard";
import { getClinicalDocument } from "@/features/patients/server/documents-repository";
import { recordPatientAuditEvent } from "@/features/patients/server/audit";

type Context = { params: Promise<{ patientId: string; documentId: string }> };

/**
 * V3.1: authorized + audited document download.
 *
 * The underlying bytes are served from MinIO via a public URL (this
 * deployment's existing media pipeline has no presigned/short-lived URL
 * mechanism -- see db/migrations/0051's header comment). This route is the
 * access-control and audit layer on top of that: every fetch requires an
 * authenticated admin and is logged, mirroring the accounting attachment
 * download route's shape (permission check first, 404 not 403 so a probe
 * can't distinguish "forbidden" from "doesn't exist", private/no-store
 * caching on the redirect itself) -- that route has no audit log; this one
 * adds it, since view/download logging is explicitly required here
 * (spec V3.1) and wasn't for accounting evidence attachments.
 */
export async function GET(_request: NextRequest, context: Context) {
  const auth = await requireApiAdmin();
  if (auth instanceof NextResponse) return auth;

  const { patientId, documentId } = await context.params;
  const document = await getClinicalDocument(documentId);
  if (!document || document.patientId !== patientId) {
    return new NextResponse(null, { status: 404 });
  }

  await recordPatientAuditEvent({
    actorUserId: auth.userId,
    actorRoles: auth.roles,
    action: "document_downloaded",
    entityType: "clinical_document",
    entityId: document.id,
    metadata: { patientId, isConfidential: document.isConfidential },
  });

  return NextResponse.redirect(document.fileUrl, {
    status: 307,
    headers: { "Cache-Control": "private, no-store" },
  });
}
