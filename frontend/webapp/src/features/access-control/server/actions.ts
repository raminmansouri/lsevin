"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod/v4";

import { assertAdmin } from "@/lib/auth/admin-guard";

import {
  AccessControlError,
  type AccessControlErrorCode,
  addMember,
  createRole,
  deleteRole,
  manageAdmin,
  releaseStaff,
  removeMember,
  searchUsers,
  setRolePermissions,
  setStaffStatus,
  updateRole,
  type UserHit,
} from "./repository";

/**
 * Server actions behind the access-control screens.
 *
 * Every one starts with `assertAdmin()` — *no resource argument* — which admits unlimited admins
 * only. `access-control` can never be granted to a custom role: a limited admin who could edit
 * roles could grant themselves everything.
 *
 * Results are structured. A refused or invalid request carries a stable `code` the screen can
 * translate; an unexpected failure (database down, bug) is logged here and reported as
 * `server_error` — it is never dressed up as a validation message.
 */
export type ActionError = {
  code: AccessControlErrorCode | "unauthorized" | "server_error";
  message: string;
};
export type ActionResult<T = void> = { ok: true; data: T } | { ok: false; error: ActionError };

const guid = z.guid();

async function run<T>(work: (actorId: string) => Promise<T>): Promise<ActionResult<T>> {
  let actorId: string;
  try {
    const ctx = await assertAdmin();
    if (!ctx.userId) throw new Error("no user");
    actorId = ctx.userId;
  } catch {
    return { ok: false, error: { code: "unauthorized", message: "Only unlimited admins can manage access." } };
  }
  try {
    const data = await work(actorId);
    revalidatePath("/admin/access-control", "layout");
    return { ok: true, data };
  } catch (error) {
    if (error instanceof AccessControlError) {
      return { ok: false, error: { code: error.code, message: error.message } };
    }
    if (error instanceof z.ZodError) {
      return { ok: false, error: { code: "validation", message: "Invalid input." } };
    }
    console.error("[access-control] unexpected failure", {
      actorId,
      message: error instanceof Error ? error.message : String(error),
    });
    return { ok: false, error: { code: "server_error", message: "Something went wrong. Nothing was changed." } };
  }
}

const roleInput = z.object({
  name: z.string(),
  description: z.string().optional().nullable(),
});

export async function createRoleAction(input: unknown) {
  return run(async (actor) => createRole(actor, roleInput.parse(input)));
}

export async function updateRoleAction(roleId: unknown, input: unknown) {
  return run(async (actor) => updateRole(actor, guid.parse(roleId), roleInput.parse(input)));
}

export async function deleteRoleAction(roleId: unknown) {
  return run(async (actor) => deleteRole(actor, guid.parse(roleId)));
}

const permissionsInput = z.array(z.object({ resourceKey: z.string().max(200), level: z.string().max(20) })).max(1000);

export async function setRolePermissionsAction(roleId: unknown, entries: unknown) {
  return run(async (actor) => setRolePermissions(actor, guid.parse(roleId), permissionsInput.parse(entries)));
}

export async function addMemberAction(roleId: unknown, userId: unknown) {
  return run(async (actor) => addMember(actor, guid.parse(roleId), guid.parse(userId)));
}

export async function removeMemberAction(roleId: unknown, userId: unknown) {
  return run(async (actor) => removeMember(actor, guid.parse(roleId), guid.parse(userId)));
}

export async function searchUsersAction(query: unknown): Promise<ActionResult<UserHit[]>> {
  return run(async () => searchUsers(z.string().max(100).parse(query)));
}

export async function manageAdminAction(userId: unknown) {
  return run(async (actor) => manageAdmin(actor, guid.parse(userId)));
}

export async function setStaffStatusAction(userId: unknown, status: unknown) {
  return run(async (actor) =>
    setStaffStatus(actor, guid.parse(userId), z.enum(["active", "disabled"]).parse(status))
  );
}

export async function releaseStaffAction(userId: unknown, mode: unknown) {
  return run(async (actor) =>
    releaseStaff(actor, guid.parse(userId), z.enum(["unlimited", "revoke"]).parse(mode))
  );
}
