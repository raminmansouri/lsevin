import "server-only";

import { NextRequest, NextResponse } from "next/server";

import type { ShopApiScope } from "../scopes";
import { authenticateShopApi, requireScope, type ShopApiPrincipal } from "./auth";
import { errorResponse, ShopApiError } from "./errors";

/** Largest JSON body the API accepts. */
export const SHOP_API_MAX_BODY_BYTES = 256 * 1024;

type Handler<P> = (context: { request: NextRequest; principal: ShopApiPrincipal; params: P }) => Promise<NextResponse>;

/**
 * Wraps a route handler: authenticates the token, checks the scope, and turns failures into the
 * API's error format. Handlers only see an authenticated principal and never pick the seller
 * themselves -- every data function takes `principal.sellerId`.
 */
export function shopApiRoute<P = Record<string, never>>(scope: ShopApiScope | null, handler: Handler<P>) {
  return async (request: NextRequest, context: { params: Promise<P> }) => {
    let tokenId: string | undefined;
    try {
      const principal = await authenticateShopApi(request.headers);
      tokenId = principal.tokenId;
      if (scope) requireScope(principal, scope);
      const params = (await context?.params) ?? ({} as P);
      const response = await handler({ request, principal, params });
      response.headers.set("Cache-Control", "no-store");
      return response;
    } catch (error) {
      return errorResponse(error, { method: request.method, path: request.nextUrl.pathname, tokenId });
    }
  };
}

/** Reads a JSON object body with a size cap; anything else is a 422/413. */
export async function readJsonBody(request: NextRequest): Promise<unknown> {
  const declared = Number(request.headers.get("content-length") ?? "0");
  if (declared > SHOP_API_MAX_BODY_BYTES) {
    throw new ShopApiError("payload_too_large", `The request body is larger than ${SHOP_API_MAX_BODY_BYTES / 1024} KB.`);
  }
  const text = await request.text();
  if (Buffer.byteLength(text, "utf8") > SHOP_API_MAX_BODY_BYTES) {
    throw new ShopApiError("payload_too_large", `The request body is larger than ${SHOP_API_MAX_BODY_BYTES / 1024} KB.`);
  }
  try {
    const value = JSON.parse(text);
    if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("not an object");
    return value;
  } catch {
    throw new ShopApiError("validation_error", "The request body must be a JSON object.");
  }
}

export function pageParams(request: NextRequest): { page: number; pageSize: number } {
  const page = Math.max(1, Math.trunc(Number(request.nextUrl.searchParams.get("page") ?? 1)) || 1);
  const pageSize = Math.min(100, Math.max(1, Math.trunc(Number(request.nextUrl.searchParams.get("pageSize") ?? 20)) || 20));
  return { page, pageSize };
}
