import "server-only";

import { NextResponse } from "next/server";
import { ZodError } from "zod";

export type ShopApiErrorCode =
  | "unauthorized"
  | "forbidden"
  | "not_found"
  | "validation_error"
  | "conflict"
  | "payload_too_large"
  | "rate_limited"
  | "internal_error";

const STATUS: Record<ShopApiErrorCode, number> = {
  unauthorized: 401,
  forbidden: 403,
  not_found: 404,
  validation_error: 422,
  conflict: 409,
  payload_too_large: 413,
  rate_limited: 429,
  internal_error: 500,
};

/** An expected, client-facing failure. Anything else is an unexpected 500. */
export class ShopApiError extends Error {
  constructor(
    public readonly code: ShopApiErrorCode,
    message: string,
    public readonly details?: unknown,
    public readonly headers?: Record<string, string>,
  ) {
    super(message);
    this.name = "ShopApiError";
  }
}

export const notFound = (what = "Resource") => new ShopApiError("not_found", `${what} not found.`);

export function errorResponse(error: unknown, context: { method: string; path: string; tokenId?: string }) {
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        error: {
          code: "validation_error",
          message: "The request body or query is not valid.",
          details: error.issues.map((issue) => ({ field: issue.path.join("."), message: issue.message })),
        },
      },
      { status: 422 },
    );
  }
  if (error instanceof ShopApiError) {
    return NextResponse.json(
      { error: { code: error.code, message: error.message, ...(error.details ? { details: error.details } : {}) } },
      { status: STATUS[error.code], headers: error.headers },
    );
  }
  // Unexpected: log with context (never the token or the body), answer generically.
  console.error("[shop-api] unexpected error", { method: context.method, path: context.path, tokenId: context.tokenId, error });
  return NextResponse.json(
    { error: { code: "internal_error", message: "Something went wrong on our side. Please try again later." } },
    { status: 500 },
  );
}
