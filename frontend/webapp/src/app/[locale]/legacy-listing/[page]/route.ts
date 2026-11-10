import { type NextRequest } from "next/server";

import { routing } from "@/i18n/routing";
import { directoryHref, mapHref, requestedView, setListingParams } from "@/lib/routes/filter-paths";
import { otherFilters, resolveListingParams, resolvedSlugs, type RawSearchParams } from "@/lib/seo/listing-params";

/**
 * Old listing links with database ids (?categoryId=, ?providerTypeId=) on
 * /explore, /map and /offers. A beforeFiles rewrite in next.config.ts sends them
 * here, so they get one real 308 to the slug address (src/lib/routes/filter-paths.ts).
 * Those pages stream behind a loading state, and a redirect raised inside a
 * streamed page reaches the browser as a 200 with a meta refresh instead.
 */
export const dynamic = "force-dynamic";

function rawParams(searchParams: URLSearchParams): RawSearchParams {
  const raw: RawSearchParams = {};
  for (const key of new Set(searchParams.keys())) {
    const values = searchParams.getAll(key);
    raw[key] = values.length > 1 ? values : values[0];
  }
  return raw;
}

function withQuery(path: string, params: URLSearchParams) {
  const query = params.toString();
  return query ? `${path}?${query}` : path;
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ locale: string; page: string }> }) {
  const { locale, page } = await params;
  if (!(routing.locales as readonly string[]).includes(locale)) return new Response(null, { status: 404 });

  const raw = rawParams(request.nextUrl.searchParams);
  const listing = await resolveListingParams(raw);
  const slugs = resolvedSlugs(listing);

  let target: string;
  switch (page) {
    case "explore":
      target = directoryHref(listing, slugs, otherFilters(raw));
      break;
    case "map":
      target = mapHref(listing, slugs, otherFilters(raw, ["view"]), requestedView(raw.view, "map"));
      break;
    case "offers":
      target = withQuery("/offers", setListingParams(otherFilters(raw), { categoryId: listing.categoryId }, slugs));
      break;
    default:
      return new Response(null, { status: 404 });
  }

  return new Response(null, {
    status: 308,
    headers: { Location: `/${locale}${target}`, "Cache-Control": "public, max-age=300" },
  });
}
