import "server-only";

/**
 * Structured error categories (CLAUDE.md §4). A database outage must surface as
 * an infrastructure error, never as "invalid input"; only codes we raise on
 * purpose are mapped to validation/conflict/not-found.
 */
export type ToursErrorKind =
  | "validation"
  | "authentication"
  | "authorization"
  | "not_found"
  | "conflict"
  | "infrastructure"
  | "unexpected";

export class ToursError extends Error {
  constructor(
    public readonly kind: ToursErrorKind,
    public readonly code: string,
    message?: string,
    public readonly details?: Record<string, unknown>,
  ) {
    super(message ?? code);
    this.name = "ToursError";
  }
}

export const httpStatusFor: Record<ToursErrorKind, number> = {
  validation: 400,
  authentication: 401,
  authorization: 403,
  not_found: 404,
  conflict: 409,
  infrastructure: 503,
  unexpected: 500,
};

/** Codes raised by the tour.* SQL functions (0079) and what they mean. */
const DB_RAISED: Record<string, ToursErrorKind> = {
  DEPARTURE_NOT_FOUND: "not_found",
  TOUR_NOT_FOUND: "not_found",
  HOLD_NOT_FOUND: "not_found",
  DEPARTURE_UNAVAILABLE: "conflict",
  BOOKING_CUTOFF_PASSED: "conflict",
  INSUFFICIENT_CAPACITY: "conflict",
  HOLD_EXPIRED: "conflict",
  GROUP_SIZE_INVALID: "validation",
  IDEMPOTENCY_KEY_CONFLICT: "conflict",
  INVALID_TERMINAL_STATUS: "validation",
};

type PgLikeError = { code?: string; message?: string; constraint_name?: string; constraint?: string };

export function mapDbError(error: unknown, context: string): ToursError {
  if (error instanceof ToursError) return error;
  const e = (error ?? {}) as PgLikeError;
  const message = String(e.message ?? "");
  const raised = Object.keys(DB_RAISED).find((code) => message === code || message.startsWith(`${code}`));
  if (raised) return new ToursError(DB_RAISED[raised], raised.toLowerCase());
  const constraint = e.constraint_name ?? e.constraint;
  if (e.code === "23505") return new ToursError("conflict", "duplicate", undefined, { constraint });
  if (e.code === "23P01") return new ToursError("conflict", "overlapping_assignment", undefined, { constraint });
  if (e.code === "23514" && constraint === "ck_tour_departures_inventory") return new ToursError("conflict", "insufficient_capacity");
  if (e.code === "23514" || e.code === "22P02" || e.code === "22007" || e.code === "22008") {
    return new ToursError("validation", "invalid_value", undefined, { constraint });
  }
  if (e.code === "23503") return new ToursError("validation", "invalid_reference", undefined, { constraint });
  const infra =
    /ECONNREFUSED|ECONNRESET|ETIMEDOUT|ENOTFOUND|CONNECT_TIMEOUT|connection|terminating/i.test(message) ||
    (e.code && /^(08|53|57P|58)/.test(e.code));
  logUnexpected(context, error);
  return new ToursError(infra ? "infrastructure" : "unexpected", infra ? "service_unavailable" : "unexpected_error");
}

/** Logs operational context only — never request bodies, tokens or personal data. */
export function logUnexpected(context: string, error: unknown) {
  const e = (error ?? {}) as PgLikeError & { name?: string };
  console.error(`[tours] ${context} failed`, {
    name: e.name,
    code: e.code,
    constraint: e.constraint_name ?? e.constraint,
    message: String(e.message ?? "").slice(0, 300),
  });
}

export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: { kind: ToursErrorKind; code: string; details?: Record<string, unknown> } };

export async function runAction<T>(context: string, fn: () => Promise<T>): Promise<ActionResult<T>> {
  try {
    return { ok: true, data: await fn() };
  } catch (error) {
    const mapped = error instanceof ToursError ? error : mapDbError(error, context);
    return { ok: false, error: { kind: mapped.kind, code: mapped.code, details: mapped.details } };
  }
}

export const fail = {
  validation: (code: string, details?: Record<string, unknown>) => new ToursError("validation", code, undefined, details),
  auth: () => new ToursError("authentication", "sign_in_required"),
  forbidden: (code = "forbidden") => new ToursError("authorization", code),
  notFound: (code = "not_found") => new ToursError("not_found", code),
  conflict: (code: string, details?: Record<string, unknown>) => new ToursError("conflict", code, undefined, details),
};
