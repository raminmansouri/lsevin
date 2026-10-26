import "server-only";

import { cookies } from "next/headers";

import { getAdminContext } from "@/lib/auth/admin-guard";
import { getSession } from "@/lib/auth/session";

import { fail } from "./errors";
import type { Actor } from "./roles";

export {
  PROVIDER_ROLE_RANK,
  canSeeDepartureLocation,
  providerRoleOf,
  requireProviderRole,
  translatorLocales,
  type Actor,
  type ProviderRole,
} from "./roles";

/**
 * Who is acting. Every tours server action resolves its actor here from the
 * session and authorizes against the object it touches (object-level
 * authorization, S-027 / AT-14) — never against an id the client claims.
 */
export async function currentActor(): Promise<Actor> {
  const session = await getSession().catch(() => null);
  const ctx = await getAdminContext();
  return { userId: session?.user?.id ?? null, roles: ctx.roles, isAdmin: ctx.isAdmin };
}

export async function requireUser(): Promise<Actor & { userId: string }> {
  const actor = await currentActor();
  if (!actor.userId) throw fail.auth();
  return actor as Actor & { userId: string };
}

export async function requireAdmin(): Promise<Actor & { userId: string }> {
  const actor = await currentActor();
  if (!actor.userId) throw fail.auth();
  if (!actor.isAdmin) throw fail.forbidden("admin_required");
  return actor as Actor & { userId: string };
}

export const GUEST_COOKIE = "lsevin_tours_guest";

/** Recent views / searches owner key: the user, or an opaque per-device guest id. */
export async function ownerKey(actor: Actor, opts: { create?: boolean } = {}): Promise<string | null> {
  if (actor.userId) return `u:${actor.userId}`;
  const jar = await cookies();
  let guest = jar.get(GUEST_COOKIE)?.value ?? null;
  if (!guest && opts.create) {
    guest = crypto.randomUUID();
    try {
      jar.set(GUEST_COOKIE, guest, { httpOnly: true, sameSite: "lax", maxAge: 60 * 60 * 24 * 180, path: "/" });
    } catch {
      // Cookies cannot be written during a server-component render; the next
      // server action or route handler creates it.
      return null;
    }
  }
  return guest && /^[0-9a-f-]{36}$/i.test(guest) ? `g:${guest}` : null;
}
