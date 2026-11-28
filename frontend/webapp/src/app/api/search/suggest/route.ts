import { z } from "zod";

import { allow, clientKey } from "@/features/search/server/rate-limit";
import { suggest } from "@/features/search/server/suggest";

export const dynamic = "force-dynamic";

const querySchema = z.object({ q: z.string().trim().min(1).max(60) });
const NO_STORE = { "cache-control": "no-store" };

export async function GET(request: Request) {
  if (!allow(`suggest:${clientKey(request.headers)}`, Number(process.env.SEARCH_SUGGEST_RATE_LIMIT_PER_MIN ?? 180))) {
    return Response.json({ error: "rate_limited" }, { status: 429, headers: { ...NO_STORE, "retry-after": "10" } });
  }
  const parsed = querySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
  if (!parsed.success) return Response.json({ suggestions: [] }, { headers: NO_STORE });

  try {
    return Response.json({ suggestions: await suggest(parsed.data.q) }, { headers: NO_STORE });
  } catch (error) {
    console.error("[search] suggest failed:", (error as Error).message);
    return Response.json({ error: "search_unavailable" }, { status: 503, headers: NO_STORE });
  }
}
