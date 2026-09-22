"use server";

import { headers } from "next/headers";

import { recordPatientAuditEvent } from "./audit";
import { buildPatientRecordSnapshot } from "./snapshot";
import { consumeShareGrantAccess, lookupShareGrant, type ShareGrantLookupResult } from "./sharing-repository";

type DeniedLookup = Extract<ShareGrantLookupResult, { ok: false }>;

/**
 * The one deliberately UNAUTHENTICATED read path in this whole feature
 * (spec V5.3: an external recipient holds a token, not a login). Kept in
 * its own file, separate from sharing-actions.ts's assertAdmin()-gated
 * mutations, so nothing here can be mistaken for (or accidentally copied
 * into) an admin-only action -- every branch below is safe to expose to an
 * anonymous caller precisely because it never trusts anything but the
 * token/PIN match.
 */
export type ShareViewResult =
  | { ok: true; snapshot: Record<string, unknown>; scope: string[]; expiresAt: string }
  | { ok: false; reason: "not_found" | "expired" | "revoked" | "max_reached" | "pin_required" | "pin_invalid" };

export async function viewShareGrantAction(token: string, pin?: string): Promise<ShareViewResult> {
  const result = await lookupShareGrant(token, pin);
  const requestHeaders = await headers();
  const ipAddress = requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
  const userAgent = requestHeaders.get("user-agent");

  if (result.ok) {
    const snapshot = await buildPatientRecordSnapshot(result.grant.patientId, result.grant.scope);
    await consumeShareGrantAccess(result.grant.id);
    await recordPatientAuditEvent({
      action: "share_grant_viewed",
      entityType: "share_grant",
      entityId: result.grant.id,
      metadata: { patientId: result.grant.patientId },
      result: "success",
      ipAddress,
      userAgent,
    });

    return { ok: true, snapshot, scope: result.grant.scope, expiresAt: result.grant.expiresAt };
  }

  const reason = (result as DeniedLookup).reason;
  // A PIN-protected link's normal first load reports pin_required -- that's
  // not a failed attempt, so it isn't audited as a denial. An actually
  // wrong PIN, an expired/revoked/exhausted token, or an unknown token all are.
  if (reason !== "pin_required") {
    await recordPatientAuditEvent({
      action: "share_grant_denied",
      entityType: "share_grant",
      entityId: null,
      metadata: { reason },
      result: "denied",
      ipAddress,
      userAgent,
    });
  }
  return { ok: false, reason };
}
