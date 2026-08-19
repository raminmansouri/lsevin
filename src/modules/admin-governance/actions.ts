"use server";
import { revalidatePath } from "next/cache";
import { requireAdminUser } from "@core/auth/permissions";
import { booleanFromForm, stringFromForm } from "@core/lib/forms";
import { assignAdministrativeRole, revokeAdministrativeRole } from "./repository";
import { setModuleEnabled } from "@core/modules/state";
import { assignableAdminRoles, type AssignableAdminRole } from "./types";

function roleFromForm(formData: FormData): AssignableAdminRole {
  const role = stringFromForm(formData, "role").toUpperCase() as AssignableAdminRole;
  if (!assignableAdminRoles.includes(role)) throw new Error("Unsupported administrative role.");
  return role;
}

function reasonFromForm(formData: FormData) {
  const reason = stringFromForm(formData, "reason");
  if (reason.length < 5) throw new Error("A reason of at least five characters is required.");
  return reason;
}

export async function assignAdministrativeRoleAction(formData: FormData) {
  const actor = await requireAdminUser("SUPERADMIN");
  const targetUserId = stringFromForm(formData, "targetUserId");
  const role = roleFromForm(formData);
  const reason = reasonFromForm(formData);
  await assignAdministrativeRole({ actorUserId: actor.id, targetUserId, role, reason });
  revalidatePath("/admin/governance");
  revalidatePath("/admin/governance/users");
  revalidatePath(`/admin/governance/users/${targetUserId}`);
  revalidatePath("/admin/audit");
}

export async function revokeAdministrativeRoleAction(formData: FormData) {
  const actor = await requireAdminUser("SUPERADMIN");
  const targetUserId = stringFromForm(formData, "targetUserId");
  const role = roleFromForm(formData);
  const reason = reasonFromForm(formData);
  await revokeAdministrativeRole({ actorUserId: actor.id, targetUserId, role, reason });
  revalidatePath("/admin/governance");
  revalidatePath("/admin/governance/users");
  revalidatePath(`/admin/governance/users/${targetUserId}`);
  revalidatePath("/admin/audit");
}


export async function setModuleStateAction(formData: FormData) {
  const actor = await requireAdminUser("SUPERADMIN");
  const moduleId = stringFromForm(formData, "moduleId");
  const enabled = booleanFromForm(formData, "enabled");
  await setModuleEnabled({
    moduleId,
    enabled,
    reason: stringFromForm(formData, "reason") || undefined,
    actorUserId: actor.id,
  });
  revalidatePath("/admin/modules");
  revalidatePath("/admin/governance");
  revalidatePath("/dashboard");
}
