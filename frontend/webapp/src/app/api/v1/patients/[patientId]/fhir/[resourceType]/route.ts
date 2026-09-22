import { NextRequest, NextResponse } from "next/server";

import { isApiAdmin, requireApiUser } from "@/lib/auth/api-guard";
import { buildPatientBundle } from "@/features/patients/fhir-mapping";
import { getFhirResourcesForPatient, isFhirResourceType } from "@/features/patients/server/fhir-repository";
import { findActiveAccountPatientLink, getPatientById } from "@/features/patients/server/repository";
import { recordPatientAuditEvent } from "@/features/patients/server/audit";

type Context = { params: Promise<{ patientId: string; resourceType: string }> };

/**
 * V7.3: single-resource-type FHIR export, following the real FHIR REST
 * convention (GET /Patient/{id}/{type} returns a searchset Bundle, not a
 * bare array) -- see the full-bundle route's header comment for the
 * authorization/audit shape and known gaps (rate limiting, integration
 * auth), both identical here.
 */
export async function GET(_request: NextRequest, context: Context) {
  const auth = await requireApiUser();
  if (auth instanceof NextResponse) return auth;

  const { patientId, resourceType } = await context.params;
  if (!isFhirResourceType(resourceType)) {
    return NextResponse.json({ error: "Unsupported FHIR resource type.", code: "unsupported_resource_type" }, { status: 400 });
  }

  const patient = await getPatientById(patientId);
  if (!patient) return new NextResponse(null, { status: 404 });

  if (!isApiAdmin(auth)) {
    const link = await findActiveAccountPatientLink(auth.userId, patientId);
    if (!link) return new NextResponse(null, { status: 404 });
  }

  const resources = await getFhirResourcesForPatient(patientId, resourceType);
  const bundle = buildPatientBundle(resources, "searchset");

  await recordPatientAuditEvent({
    actorUserId: auth.userId,
    actorRoles: auth.roles,
    action: "fhir_resource_exported",
    entityType: "patient",
    entityId: patientId,
    metadata: { patientId, resourceType, resourceCount: bundle.total },
  });

  return NextResponse.json(bundle, { headers: { "Cache-Control": "private, no-store" } });
}
