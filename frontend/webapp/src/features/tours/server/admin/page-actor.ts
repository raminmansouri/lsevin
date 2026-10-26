import "server-only";

import { assertAdmin } from "@/lib/auth/admin-guard";

import { requireAdmin } from "../platform/access";

/**
 * For admin pages: the (admin) layout and the middleware gate the URL, but the
 * guard is repeated in every page so a routing change alone can never expose
 * one. Returns the admin actor the server queries require.
 */
export async function adminPageActor() {
  await assertAdmin();
  return requireAdmin();
}

/** Search params as plain strings (first value wins). */
export function sp(params: Record<string, string | string[] | undefined>, key: string): string | undefined {
  const v = params[key];
  const s = Array.isArray(v) ? v[0] : v;
  return s && s.trim() !== "" ? s : undefined;
}

/** The error of a failed ActionResult (the project compiles without strictNullChecks, so `ok` does not narrow). */
export function actionError<T>(r: { ok: true; data: T } | { ok: false; error: { kind: string; code: string; details?: Record<string, unknown> } }) {
  return r.ok === true ? null : (r as { error: { kind: string; code: string; details?: Record<string, unknown> } }).error;
}
