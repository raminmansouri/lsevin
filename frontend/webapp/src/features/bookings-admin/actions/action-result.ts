import "server-only";

import { z } from "zod/v4";

import { adminMay, getAdminContext, type AdminContext } from "@/lib/auth/admin-guard";

/**
 * Structured outcome of an admin booking action. Server actions that throw lose their
 * message in production builds, and a database outage must never read as a form error,
 * so every failure is categorised here instead.
 */
export type AdminActionErrorCode =
  | "VALIDATION"
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "INFRASTRUCTURE"
  | "UNEXPECTED";

export type AdminActionFailure = { code: AdminActionErrorCode; reason?: string; fields?: Record<string, string[]> };

// A flat shape rather than a discriminated union: this project compiles with
// `strict: false`, where `if (!result.ok)` does not narrow a union.
export type AdminActionResult<T = undefined> = { ok: boolean; data?: T; error?: AdminActionFailure };

export class AdminActionError extends Error {
  constructor(public readonly code: AdminActionErrorCode, public readonly reason?: string) {
    super(reason ?? code);
  }
}

export async function requireBookingAdmin(): Promise<AdminContext> {
  const ctx = await getAdminContext();
  if (!ctx.userId) throw new AdminActionError("UNAUTHENTICATED");
  // `bookings` (manage): unlimited admins, or a limited admin whose role manages bookings.
  // (`ctx.isAdmin` alone would lock every limited admin out of these actions.)
  if (!adminMay(ctx, "bookings", "manage")) throw new AdminActionError("FORBIDDEN");
  return ctx;
}

/** Postgres SQLSTATEs the admin forms can explain to a person; anything else is infrastructure. */
function classifyPostgresError(error: unknown): AdminActionErrorCode | null {
  const code = (error as { code?: unknown } | null)?.code;
  if (typeof code !== "string") return null;
  if (code === "23P01" || code === "23505") return "CONFLICT"; // overlapping specialist slot / duplicate
  if (code === "23503" || code === "23514" || code === "22P02" || code === "22007" || code === "22008") return "VALIDATION";
  return "INFRASTRUCTURE";
}

export async function runAdminAction<T>(
  actionName: string,
  run: () => Promise<T>,
): Promise<AdminActionResult<T>> {
  try {
    return { ok: true, data: await run() };
  } catch (error) {
    if (error instanceof AdminActionError) {
      return { ok: false, error: { code: error.code, reason: error.reason } };
    }
    if (error instanceof z.ZodError) {
      const fields: Record<string, string[]> = {};
      for (const issue of error.issues) {
        const key = issue.path.join(".") || "_";
        (fields[key] ??= []).push(issue.message);
      }
      return { ok: false, error: { code: "VALIDATION", fields } };
    }
    const pgCategory = classifyPostgresError(error);
    const code: AdminActionErrorCode = pgCategory ?? "UNEXPECTED";
    // Log the operational context only: no form values (customer data, notes) end up in logs.
    const err = error as { code?: string; constraint_name?: string; message?: string };
    console.error(`[${actionName}] failed`, {
      category: code,
      sqlState: err?.code,
      constraint: err?.constraint_name,
      message: err?.message,
    });
    return { ok: false, error: { code } };
  }
}
