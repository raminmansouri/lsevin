"use server";

import { revalidateTag } from "next/cache";
import { z } from "zod/v4";

import { normalizeHost } from "@/lib/http/host";
import { getAdminContext } from "@/lib/auth/admin-guard";

import { parseEnamadInput } from "./enamad";
import { removeDomainTrustSeal, TRUST_SEALS_TAG, upsertDomainTrustSeal } from "./server/repository";

export type TrustSealActionResult =
  | { ok: true; host: string }
  | { ok: false; code: "INVALID" | "FORBIDDEN" | "NOT_FOUND" | "FAILED"; field?: "host" | "seal"; message: string };

const forbidden = { ok: false as const, code: "FORBIDDEN" as const, message: "Forbidden." };

// Audit column only: a session id that is not a GUID must not fail the save.
const auditUser = (userId?: string) => (userId && z.guid().safeParse(userId).success ? userId : null);

/** Saves (or replaces) the Enamad seal of one domain. Admin only. */
export async function saveDomainTrustSealAction(input: { host: string; seal: string }): Promise<TrustSealActionResult> {
  const { isAdmin, userId } = await getAdminContext();
  if (!isAdmin) return forbidden;

  const host = normalizeHost(input?.host);
  if (!host) return { ok: false, code: "INVALID", field: "host", message: "Enter a domain like lsevincare.com." };
  if (String(input?.seal ?? "").length > 5000) {
    return { ok: false, code: "INVALID", field: "seal", message: "The pasted code is too long." };
  }
  const seal = parseEnamadInput(String(input?.seal ?? ""));
  if (!seal) {
    return {
      ok: false,
      code: "INVALID",
      field: "seal",
      message: "No Enamad id and code found. Paste the code from the Enamad panel.",
    };
  }

  try {
    await upsertDomainTrustSeal({ host, ...seal, updatedBy: auditUser(userId) });
  } catch (error) {
    console.error("[trust-seal] save failed", { host, error: error instanceof Error ? error.message : String(error) });
    return { ok: false, code: "FAILED", message: "The seal could not be saved. Please try again." };
  }
  revalidateTag(TRUST_SEALS_TAG);
  return { ok: true, host };
}

/** Removes the Enamad seal of one domain. Admin only. */
export async function removeDomainTrustSealAction(input: { host: string }): Promise<TrustSealActionResult> {
  const { isAdmin, userId } = await getAdminContext();
  if (!isAdmin) return forbidden;

  const host = normalizeHost(input?.host);
  if (!host) return { ok: false, code: "INVALID", field: "host", message: "Enter a domain like lsevincare.com." };

  try {
    const removed = await removeDomainTrustSeal(host, auditUser(userId));
    if (!removed) return { ok: false, code: "NOT_FOUND", message: "This domain has no seal." };
  } catch (error) {
    console.error("[trust-seal] remove failed", { host, error: error instanceof Error ? error.message : String(error) });
    return { ok: false, code: "FAILED", message: "The seal could not be removed. Please try again." };
  }
  revalidateTag(TRUST_SEALS_TAG);
  return { ok: true, host };
}
