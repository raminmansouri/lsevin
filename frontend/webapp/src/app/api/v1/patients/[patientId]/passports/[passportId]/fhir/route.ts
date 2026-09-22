import { NextRequest, NextResponse } from "next/server";

import { isApiAdmin, requireApiUser } from "@/lib/auth/api-guard";
import { getPatientPassport } from "@/features/patients/server/passport-repository";
import { findActiveAccountPatientLink } from "@/features/patients/server/repository";

type Context = { params: Promise<{ patientId: string; passportId: string }> };

/**
 * V7.4: returns the exact FHIR bundle stored on a specific generated
 * passport (not a live re-export) -- so "view this passport" shows what
 * was actually generated at that point in time, consistent with the
 * spec's "store summary snapshot/version" requirement. Same object-level
 * auth as the rest of this feature; not separately audited beyond the
 * generation event itself, since this only re-reads a stored snapshot.
 */
export async function GET(_request: NextRequest, context: Context) {
  const auth = await requireApiUser();
  if (auth instanceof NextResponse) return auth;

  const { patientId, passportId } = await context.params;
  const passport = await getPatientPassport(passportId);
  if (!passport || passport.patientId !== patientId) return new NextResponse(null, { status: 404 });

  if (!isApiAdmin(auth)) {
    const link = await findActiveAccountPatientLink(auth.userId, patientId);
    if (!link) return new NextResponse(null, { status: 404 });
  }

  return NextResponse.json(passport.fhirBundle, { headers: { "Cache-Control": "private, no-store" } });
}
