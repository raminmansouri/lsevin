import { createHash } from "node:crypto";
import { z } from "zod";

import { allow, clientKey } from "@/features/search/server/rate-limit";
import { search } from "@/features/search/server/search";
import { DOC_TYPES } from "@/features/search/types";
import { routing } from "@/i18n/routing";

export const dynamic = "force-dynamic";

const querySchema = z.object({
  q: z.string().trim().min(1).max(160),
  type: z.enum(["all", ...DOC_TYPES]).default("all"),
  locale: z.enum(routing.locales).default(routing.defaultLocale),
  limit: z.coerce.number().int().min(1).max(40).default(12),
  lat: z.coerce.number().min(-90).max(90).optional(),
  lng: z.coerce.number().min(-180).max(180).optional(),
});

const NO_STORE = { "cache-control": "no-store" };

/** Salted, day-scoped hash: counts distinct visitors per day without being able to identify anyone. */
function sessionHash(request: Request): string {
  const day = new Date().toISOString().slice(0, 10);
  const material = [
    clientKey(request.headers),
    request.headers.get("user-agent") ?? "",
    day,
    process.env.SEARCH_LOG_SALT ?? "lsevin-search",
  ].join("|");
  return createHash("sha256").update(material).digest("hex").slice(0, 24);
}

export async function GET(request: Request) {
  const key = clientKey(request.headers);
  if (
    !allow(`search:${key}`, Number(process.env.SEARCH_RATE_LIMIT_PER_MIN ?? 60))
  ) {
    return Response.json(
      { error: "rate_limited" },
      { status: 429, headers: { ...NO_STORE, "retry-after": "30" } }
    );
  }

  const parsed = querySchema.safeParse(
    Object.fromEntries(new URL(request.url).searchParams)
  );
  if (!parsed.success) {
    return Response.json(
      { error: "invalid_query" },
      { status: 400, headers: NO_STORE }
    );
  }
  const { q, type, locale, limit, lat, lng } = parsed.data;

  try {
    const response = await search({
      q,
      type,
      locale,
      limit,
      near: lat !== undefined && lng !== undefined ? { lat, lng } : undefined,
      sessionHash: sessionHash(request),
    });
    return Response.json(response, { headers: NO_STORE });
  } catch (error) {
    // Infrastructure failure: say so, never present it as a bad query.
    console.error("[search] search failed:", (error as Error).message);
    return Response.json(
      { error: "search_unavailable" },
      { status: 503, headers: NO_STORE }
    );
  }
}
