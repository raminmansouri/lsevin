import { NextRequest, NextResponse } from "next/server";

import { isApiAdmin, requireApiUser } from "@/lib/auth/api-guard";
import { exportFhirPatientBundle } from "@/features/patients/server/fhir-repository";
import { findActiveAccountPatientLink } from "@/features/patients/server/repository";
import { recordPatientAuditEvent } from "@/features/patients/server/audit";

type Context = { params: Promise<{ patientId: string }> };

/**
 * V7.3: full-patient FHIR Bundle export. Same object-level authorization as
 * the document download route (V5.5) -- an admin, or an account with an
 * active account_patient_links row for this patient, may export; anyone
 * else gets a 404 (never 403, so a probe can't distinguish "forbidden"
 * from "doesn't exist"). Every export is audited.
 *
 * Known gaps, both flagged rather than silently skipped: no API rate
 * limiting (no reusable limiter exists outside accounting's own, which is
 * accounting-specific -- see the V3 investigation notes) and no separate
 * integration/API-key authentication for external FHIR clients -- this
 * reuses the same session-cookie auth as the rest of the app rather than
 * a client-credentials/OAuth flow, which is what a real external EHR
 * integration would actually need.
 */
export async function GET(_request: NextRequest, context: Context) {
  const auth = await requireApiUser();
  if (auth instanceof NextResponse) return auth;

  const { patientId } = await context.params;

  if (!isApiAdmin(auth)) {
    const link = await findActiveAccountPatientLink(auth.userId, patientId);
    if (!link) return new NextResponse(null, { status: 404 });
  }

  const bundle = await exportFhirPatientBundle(patientId);
  if (!bundle) return new NextResponse(null, { status: 404 });

  await recordPatientAuditEvent({
    actorUserId: auth.userId,
    actorRoles: auth.roles,
    action: "fhir_bundle_exported",
    entityType: "patient",
    entityId: patientId,
    metadata: { patientId, resourceCount: bundle.total },
  });

  return NextResponse.json(bundle, { headers: { "Cache-Control": "private, no-store" } });
}
