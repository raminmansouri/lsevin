import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod/v4";

import { requireApiAdmin } from "@/lib/auth/api-guard";
import { CreatePatientSchema } from "@/features/patients/schemas";
import { createPatient } from "@/features/patients/server/repository";
import { recordPatientAuditEvent } from "@/features/patients/server/audit";

/**
 * V0.7: POST /api/v1/patients
 *
 * First `/api/v1/*` route in this codebase -- there is no existing
 * versioned-API precedent to match, so the error shape here (`{ error,
 * code }`) is this feature's own convention, not a repo-wide one yet.
 */
export async function POST(request: NextRequest) {
  const auth = await requireApiAdmin();
  if (auth instanceof NextResponse) return auth;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body.", code: "invalid_json" }, { status: 400 });
  }

  let values;
  try {
    values = CreatePatientSchema.parse(body);
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Validation failed.", code: "invalid_input", issues: error.issues },
        { status: 422 }
      );
    }
    throw error;
  }

  const patient = await createPatient({ ...values, createdBy: auth.userId });
  await recordPatientAuditEvent({
    actorUserId: auth.userId,
    actorRoles: auth.roles,
    action: "patient_created",
    entityType: "patient",
    entityId: patient.id,
    afterState: patient,
    metadata: { createdBySource: values.createdBySource, via: "api" },
  });

  return NextResponse.json({ item: patient }, { status: 201 });
}
