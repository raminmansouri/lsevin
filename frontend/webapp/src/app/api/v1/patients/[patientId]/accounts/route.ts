import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod/v4";

import { requireApiAdmin } from "@/lib/auth/api-guard";
import { LinkAccountToPatientSchema } from "@/features/patients/schemas";
import { findActiveAccountPatientLink, getPatientById, linkAccountToPatient } from "@/features/patients/server/repository";
import { recordPatientAuditEvent } from "@/features/patients/server/audit";

type Context = { params: Promise<{ patientId: string }> };

/** V0.7: POST /api/v1/patients/{id}/accounts -- link a UserAccount to this Patient. */
export async function POST(request: NextRequest, context: Context) {
  const auth = await requireApiAdmin();
  if (auth instanceof NextResponse) return auth;

  const { patientId } = await context.params;
  const patient = await getPatientById(patientId);
  if (!patient) {
    return NextResponse.json({ error: "Not found.", code: "not_found" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body.", code: "invalid_json" }, { status: 400 });
  }

  let values;
  try {
    values = LinkAccountToPatientSchema.parse({ ...(body as Record<string, unknown>), patientId });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Validation failed.", code: "invalid_input", issues: error.issues },
        { status: 422 }
      );
    }
    throw error;
  }

  const existing = await findActiveAccountPatientLink(values.accountId, values.patientId);
  if (existing) {
    return NextResponse.json({ item: existing });
  }

  const link = await linkAccountToPatient({ ...values, createdBy: auth.userId });
  await recordPatientAuditEvent({
    actorUserId: auth.userId,
    actorRoles: auth.roles,
    action: "account_linked",
    entityType: "account_patient_link",
    entityId: link.id,
    afterState: link,
    metadata: { via: "api" },
  });

  return NextResponse.json({ item: link }, { status: 201 });
}
