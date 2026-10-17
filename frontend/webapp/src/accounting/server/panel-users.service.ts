import "server-only";

import { randomInt } from "node:crypto";

import db from "@/config/database/db";

import { assertAccounting } from "./access";
import { hashPassword } from "./panel-auth";
import { canManageRole, MANAGEABLE_ROLES, type PanelRole } from "./permissions";

/**
 * Panel accounts managed from inside the financial panel (/financial/users).
 *
 * The manager adds and removes accounting managers and accountants; an accounting
 * manager adds and removes accountants (see MANAGEABLE_ROLES). Managers themselves are
 * still created with scripts/financial-user.mjs, so the top role is never handed out
 * from a screen.
 *
 * "Remove" deactivates rather than deletes: the person's name stays on every document
 * and audit row they touched, and their sessions are revoked on the spot.
 */

export class PanelUserError extends Error {
  constructor(
    message: string,
    readonly code: "not_allowed" | "invalid_username" | "name_required" | "username_taken" | "not_found" | "self"
  ) {
    super(message);
    this.name = "PanelUserError";
  }
}

export type PanelUserRow = {
  id: string;
  username: string;
  displayName: string;
  role: PanelRole;
  isActive: boolean;
  mustChangePassword: boolean;
  lastLoginAt: string | null;
  createdAt: string;
};

// Same alphabet as the CLI: no look-alike characters, so a password read off a screen
// is typed correctly.
const ALPHABET = "abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const generatePassword = () => Array.from({ length: 16 }, () => ALPHABET[randomInt(ALPHABET.length)]).join("");

const USERNAME = /^[a-zA-Z0-9._-]{3,40}$/;

/** Everyone the viewer may manage, plus the managers, so the list shows the whole team. */
export async function listPanelUsers(): Promise<PanelUserRow[]> {
  await assertAccounting("users.manage");
  const rows = await db<(Omit<PanelUserRow, "role"> & { role: string })[]>`
    select id::text as id, username, display_name as "displayName", role,
           is_active as "isActive", must_change_password as "mustChangePassword",
           last_login_at::text as "lastLoginAt", created_at::text as "createdAt"
      from accounting.panel_users
     order by is_active desc,
              array_position(array['manager', 'finance_admin', 'accounting_manager', 'accountant'], role),
              display_name
  `;
  return rows.map((r) => ({ ...r, role: (r.role === "finance_admin" ? "manager" : r.role) as PanelRole }));
}

async function audit(
  tx: typeof db,
  actorUserId: string,
  action: string,
  username: string,
  before: unknown,
  after: unknown
) {
  await tx`
    insert into accounting.audit_log (actor_user_id, action, entity_type, entity_key, before_state, after_state)
    values (${actorUserId}, ${action}, 'panel_user', ${username},
            ${before === null ? null : tx.json(before as never)}, ${tx.json(after as never)})
  `;
}

/** Adds an account and returns its one-time password, which is shown once and never stored. */
export async function createPanelUser(input: {
  username: string;
  displayName: string;
  role: PanelRole;
}): Promise<{ username: string; password: string }> {
  const { userId, role: actorRole } = await assertAccounting("users.manage");
  if (!canManageRole(actorRole, input.role)) {
    throw new PanelUserError("You may not add this role.", "not_allowed");
  }
  const username = input.username.trim();
  const displayName = input.displayName.trim();
  if (!USERNAME.test(username)) throw new PanelUserError("Invalid username.", "invalid_username");
  if (!displayName) throw new PanelUserError("A name is required.", "name_required");

  const password = generatePassword();
  const hash = await hashPassword(password);

  try {
    await db.begin(async (tx) => {
      await tx`
        insert into accounting.panel_users (username, display_name, password_hash, role, must_change_password, created_by)
        values (${username}, ${displayName}, ${hash}, ${input.role}, true, ${userId})
      `;
      await audit(tx as never, userId, "panel_user.create", username, null, { displayName, role: input.role });
    });
  } catch (error) {
    if ((error as { code?: string })?.code === "23505") {
      throw new PanelUserError("That username is taken.", "username_taken");
    }
    throw error;
  }
  return { username, password };
}

/** Loads a target account and checks the actor may manage it. */
async function lockManageable(tx: typeof db, actor: { userId: string; role: PanelRole }, targetId: string) {
  if (targetId === actor.userId) throw new PanelUserError("You cannot change your own account here.", "self");
  const [target] = await tx<{ username: string; role: string; is_active: boolean }[]>`
    select username, role, is_active from accounting.panel_users where id = ${targetId} for update
  `;
  if (!target) throw new PanelUserError("Account not found.", "not_found");
  if (!canManageRole(actor.role, target.role as PanelRole)) {
    throw new PanelUserError("You may not change this account.", "not_allowed");
  }
  return target;
}

/** Deactivates (remove) or reactivates an account. Deactivating signs the person out at once. */
export async function setPanelUserActive(targetId: string, isActive: boolean): Promise<void> {
  const { userId, role } = await assertAccounting("users.manage");
  await db.begin(async (tx) => {
    const target = await lockManageable(tx as never, { userId, role }, targetId);
    await tx`
      update accounting.panel_users
         set is_active = ${isActive}, failed_attempts = 0, locked_until = null, updated_at = now()
       where id = ${targetId}
    `;
    if (!isActive) {
      await tx`
        update accounting.panel_sessions
           set revoked_at = now(), revoke_reason = 'deactivated'
         where user_id = ${targetId} and revoked_at is null
      `;
    }
    await audit(
      tx as never,
      userId,
      isActive ? "panel_user.reactivate" : "panel_user.deactivate",
      target.username,
      { isActive: target.is_active },
      { isActive }
    );
  });
}

/** A new one-time password for someone who forgot theirs; their sessions end. */
export async function resetPanelUserPassword(targetId: string): Promise<{ username: string; password: string }> {
  const { userId, role } = await assertAccounting("users.manage");
  const password = generatePassword();
  const hash = await hashPassword(password);
  const username = await db.begin(async (tx) => {
    const target = await lockManageable(tx as never, { userId, role }, targetId);
    await tx`
      update accounting.panel_users
         set password_hash = ${hash}, must_change_password = true, failed_attempts = 0,
             locked_until = null, password_changed_at = now(), updated_at = now()
       where id = ${targetId}
    `;
    await tx`
      update accounting.panel_sessions
         set revoked_at = now(), revoke_reason = 'password reset'
       where user_id = ${targetId} and revoked_at is null
    `;
    await audit(tx as never, userId, "panel_user.reset_password", target.username, null, { mustChangePassword: true });
    return target.username;
  });
  return { username, password };
}

export { MANAGEABLE_ROLES };
