import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod/v4";

import { requireApiAdmin } from "@/lib/auth/api-guard";
import { UpdatePatientSchema } from "@/features/patients/schemas";
import { getPatientById, updatePatient } from "@/features/patients/server/repository";
import { recordPatientAuditEvent } from "@/features/patients/server/audit";

type Context = { params: Promise<{ patientId: string }> };

/** V0.7: GET /api/v1/patients/{id} */
export async function GET(_request: NextRequest, context: Context) {
  const auth = await requireApiAdmin();
  if (auth instanceof NextResponse) return auth;

  const { patientId } = await context.params;
  const patient = await getPatientById(patientId);
  if (!patient) {
    return NextResponse.json({ error: "Not found.", code: "not_found" }, { status: 404 });
  }
  return NextResponse.json({ item: patient });
}

/**
 * V0.7: PATCH /api/v1/patients/{id}
 *
 * Requires `version` in the body (optimistic concurrency, spec V0.1/V7 §7) --
 * a stale write returns 409 rather than silently overwriting a concurrent edit.
 */
export async function PATCH(request: NextRequest, context: Context) {
  const auth = await requireApiAdmin();
  if (auth instanceof NextResponse) return auth;

  const { patientId } = await context.params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body.", code: "invalid_json" }, { status: 400 });
  }

  let values;
  try {
    values = UpdatePatientSchema.parse({ ...(body as Record<string, unknown>), patientId });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Validation failed.", code: "invalid_input", issues: error.issues },
        { status: 422 }
      );
    }
    throw error;
  }

  const before = await getPatientById(patientId);
  if (!before) {
    return NextResponse.json({ error: "Not found.", code: "not_found" }, { status: 404 });
  }

  const { version, ...rest } = values;
  const patch: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(rest)) {
    if (key !== "patientId" && value !== undefined) patch[key] = value;
  }

  const updated = await updatePatient(patientId, version, patch, auth.userId);
  if (!updated) {
    return NextResponse.json(
      { error: "The patient was modified by someone else. Reload and retry.", code: "version_conflict" },
      { status: 409 }
    );
  }

  await recordPatientAuditEvent({
    actorUserId: auth.userId,
    actorRoles: auth.roles,
    action: "patient_updated",
    entityType: "patient",
    entityId: updated.id,
    beforeState: before,
    afterState: updated,
    metadata: { via: "api" },
  });

  return NextResponse.json({ item: updated });
}
