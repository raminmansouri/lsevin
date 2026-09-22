import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod/v4";

import { requireApiAdmin } from "@/lib/auth/api-guard";
import { AddPatientIdentifierSchema } from "@/features/patients/schemas";
import {
  addPatientIdentifier,
  getPatientById,
  isUniqueViolation,
  listIdentifiersForPatient,
} from "@/features/patients/server/repository";
import { recordPatientAuditEvent } from "@/features/patients/server/audit";

type Context = { params: Promise<{ patientId: string }> };

/** V0.7: GET /api/v1/patients/{id}/identifiers (paginated). */
export async function GET(request: NextRequest, context: Context) {
  const auth = await requireApiAdmin();
  if (auth instanceof NextResponse) return auth;

  const { patientId } = await context.params;
  const patient = await getPatientById(patientId);
  if (!patient) {
    return NextResponse.json({ error: "Not found.", code: "not_found" }, { status: 404 });
  }

  const { searchParams } = request.nextUrl;
  const limit = Number(searchParams.get("limit") ?? 50);
  const offset = Number(searchParams.get("offset") ?? 0);
  const items = await listIdentifiersForPatient(patientId, { limit, offset });
  return NextResponse.json({ items, limit, offset });
}

/**
 * V0.7: POST /api/v1/patients/{id}/identifiers
 *
 * Value is only ever accepted here to be encrypted+hashed immediately (see
 * features/patients/server/crypto.ts) -- the plaintext is never persisted or
 * echoed back; the response carries the masked value only.
 */
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
    values = AddPatientIdentifierSchema.parse({ ...(body as Record<string, unknown>), patientId });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Validation failed.", code: "invalid_input", issues: error.issues },
        { status: 422 }
      );
    }
    throw error;
  }

  let identifier;
  try {
    identifier = await addPatientIdentifier(values);
  } catch (error) {
    if (isUniqueViolation(error)) {
      return NextResponse.json(
        { error: "This identifier is already attached to a patient.", code: "duplicate_identifier" },
        { status: 409 }
      );
    }
    throw error;
  }

  await recordPatientAuditEvent({
    actorUserId: auth.userId,
    actorRoles: auth.roles,
    action: "identifier_added",
    entityType: "patient_identifier",
    entityId: identifier.id,
    afterState: identifier,
    metadata: { patientId, via: "api" },
  });

  return NextResponse.json({ item: identifier }, { status: 201 });
}
