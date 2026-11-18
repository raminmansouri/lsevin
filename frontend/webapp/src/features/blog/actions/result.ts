import type { z } from "zod/v4";

import type { ReadinessIssue } from "../blocks/readiness";

/** Structured failure categories: infrastructure errors are never reported as user-input errors. */
export type BlogActionFailure = {
  ok: false;
  code: "INVALID" | "NOT_READY" | "FORBIDDEN" | "NOT_FOUND" | "CONFLICT" | "FAILED";
  message: string;
  fieldErrors?: Record<string, string>;
  /** Block-level problems from schema validation, so the editor can point at the block. */
  blockIssues?: { index: number; path: string; message: string }[];
  /** Why a publish was refused. */
  readiness?: ReadinessIssue[];
};

export type BlogActionResult<T = undefined> = { ok: true; data: T } | BlogActionFailure;

export const forbidden: BlogActionFailure = { ok: false, code: "FORBIDDEN", message: "Forbidden." };
export const notFound = (message: string): BlogActionFailure => ({ ok: false, code: "NOT_FOUND", message });
export const conflict = (message: string, fieldErrors?: Record<string, string>): BlogActionFailure => ({ ok: false, code: "CONFLICT", message, fieldErrors });
export const failed = (message: string): BlogActionFailure => ({ ok: false, code: "FAILED", message });

export function invalid(error: z.ZodError): BlogActionFailure {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.map(String).join(".") || "form";
    fieldErrors[key] ??= issue.message;
  }
  return { ok: false, code: "INVALID", message: error.issues[0]?.message ?? "Check the highlighted fields.", fieldErrors };
}

type PgError = { code?: string; constraint_name?: string; constraint?: string };
export const pgCode = (error: unknown): string | undefined => (error as PgError | null)?.code;
export const pgConstraint = (error: unknown): string | undefined => (error as PgError | null)?.constraint_name ?? (error as PgError | null)?.constraint;
