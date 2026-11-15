import "server-only";

import { cookies } from "next/headers";

import db from "@/config/database/db";
import type { Actor } from "@/features/tours/server/platform/access";

import { fail } from "./errors";

/**
 * First-visit intro (same contract as tours C-002..C-004): completion is kept
 * per account when signed in and per device by cookie otherwise, so the intro
 * shows once and never traps the visitor.
 */
export const STAYS_INTRO_COOKIE = "stays_intro_done";

export async function isStaysIntroCompleted(actor: Actor): Promise<boolean> {
  const jar = await cookies();
  if (jar.get(STAYS_INTRO_COOKIE)?.value === "1") return true;
  if (!actor.userId) return false;
  const [r] = await db<{ at: Date | null }[]>`select intro_completed_at as at from stay.customer_state where user_id = ${actor.userId}::uuid`;
  return Boolean(r?.at);
}

/** Only callable from a server action / route handler (writes a cookie). */
export async function markStaysIntroCompleted(actor: Actor) {
  if (actor.userId) {
    await db`
      insert into stay.customer_state (user_id, intro_completed_at) values (${actor.userId}::uuid, now())
      on conflict (user_id) do update set intro_completed_at = coalesce(stay.customer_state.intro_completed_at, now()), updated_at = now()`;
  }
  const jar = await cookies();
  jar.set(STAYS_INTRO_COOKIE, "1", { httpOnly: false, sameSite: "lax", maxAge: 60 * 60 * 24 * 365, path: "/" });
}

export async function toggleWishlist(userId: string, propertyId: string, saved: boolean): Promise<boolean> {
  const [p] = await db<{ ok: boolean }[]>`select true as ok from stay.properties where id = ${propertyId}::uuid and status = 'published'`;
  if (!p && saved) throw fail.notFound("property_not_found");
  if (saved) {
    await db`insert into stay.wishlist (user_id, property_id) values (${userId}::uuid, ${propertyId}::uuid) on conflict do nothing`;
  } else {
    await db`delete from stay.wishlist where user_id = ${userId}::uuid and property_id = ${propertyId}::uuid`;
  }
  return saved;
}

export async function clearRecentViews(owner: string) {
  await db`delete from stay.recent_views where owner_key = ${owner}`;
}
