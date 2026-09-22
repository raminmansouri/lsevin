import { NextRequest, NextResponse } from "next/server";

import { isApiAdmin, requireApiUser } from "@/lib/auth/api-guard";
import { getClinicalDocument } from "@/features/patients/server/documents-repository";
import { findActiveAccountPatientLink } from "@/features/patients/server/repository";
import { recordPatientAuditEvent } from "@/features/patients/server/audit";

type Context = { params: Promise<{ patientId: string; documentId: string }> };

/**
 * V3.1 + V5.5: authorized + audited document download.
 *
 * Object-level authorization: an admin/superadmin may access any patient's
 * documents; anyone else (this app has no separate coordinator/provider
 * role -- staff and providers authenticate through a different "portal"
 * project entirely) may only access documents for a patient they hold an
 * active account_patient_links row for (spec V5.4's family/proxy access,
 * reused here as the actual object-level check spec V5.5 asks for). No
 * distinction by relationship_type/access_role yet -- any active link
 * grants document access, same breadth V0/V1 already grant for the rest of
 * the record; narrowing that further is a product decision, not made here.
 *
 * The underlying bytes are served from MinIO via a public URL (this
 * deployment's existing media pipeline has no presigned/short-lived URL
 * mechanism -- see db/migrations/0051's header comment). This route is the
 * access-control and audit layer on top of that, mirroring the accounting
 * attachment download route's shape (permission check first, 404 not 403 so
 * a probe can't distinguish "forbidden" from "doesn't exist", private/
 * no-store caching on the redirect itself) -- that route has no audit log;
 * this one adds it, since view/download logging is explicitly required
 * here (spec V3.1) and wasn't for accounting evidence attachments.
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
