"use server";

import { revalidatePath } from "next/cache";

import {
  createDetailAccount,
  renameAccount,
  setAccountActive,
} from "@/accounting/server/accounts-admin";
import { SETTING_DEFINITIONS, updateSetting } from "@/accounting/server/settings-admin";
import { assertAccounting } from "@/accounting/server/access";

/**
 * Configuration actions for the accounting panel.
 *
 * assertAccounting("configure") on the first line of each is the authorization boundary —
 * a `"use server"` export is a public POST endpoint reachable by action id, and these
 * change the platform fee and the chart of accounts. Deliberately a higher bar than the
 * approval queues: approving a deposit and rewriting the fee are different jobs.
 */

function revalidateConfig() {
  revalidatePath("/admin/accounting/settings");
  revalidatePath("/admin/accounting/accounts");
  revalidatePath("/admin/accounting");
}

export async function updateSettingAction(formData: FormData) {
  const { userId } = await assertAccounting("configure");

  const key = String(formData.get("key") ?? "").trim();
  const definition = SETTING_DEFINITIONS.find((d) => d.key === key);
  if (!definition) throw new Error(`Unknown setting '${key}'.`);

  // Per-currency and confirmation settings arrive as `entry.<CURRENCY>` fields.
  const entries: Record<string, string> = {};
  for (const [field, value] of formData.entries()) {
    if (field.startsWith("entry.")) entries[field.slice(6)] = String(value);
  }

  await updateSetting({
    key,
    kind: definition.kind,
    value: formData.get("value") ? String(formData.get("value")) : undefined,
    entries,
    limit: formData.get("limit") ? String(formData.get("limit")) : undefined,
    windowSeconds: formData.get("windowSeconds") ? String(formData.get("windowSeconds")) : undefined,
    actorUserId: userId,
  });

  revalidateConfig();
}

export async function createAccountAction(formData: FormData) {
  const { userId } = await assertAccounting("configure");

  await createDetailAccount({
    parentId: String(formData.get("parentId") ?? "").trim(),
    code: String(formData.get("code") ?? "").trim(),
    nameFa: String(formData.get("nameFa") ?? "").trim(),
    nameEn: String(formData.get("nameEn") ?? "").trim(),
    currencyCode: String(formData.get("currencyCode") ?? "").trim() || null,
    actorUserId: userId,
  });

  revalidateConfig();
}

export async function renameAccountAction(formData: FormData) {
  const { userId } = await assertAccounting("configure");

  await renameAccount({
    accountId: String(formData.get("accountId") ?? "").trim(),
    nameFa: String(formData.get("nameFa") ?? "").trim(),
    nameEn: String(formData.get("nameEn") ?? "").trim(),
    actorUserId: userId,
  });

  revalidateConfig();
}

export async function toggleAccountActiveAction(formData: FormData) {
  const { userId } = await assertAccounting("configure");

  await setAccountActive({
    accountId: String(formData.get("accountId") ?? "").trim(),
    isActive: String(formData.get("isActive") ?? "") === "true",
    actorUserId: userId,
  });

  revalidateConfig();
}
