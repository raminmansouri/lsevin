import type { Metadata } from "next";

/**
 * A service's /gallery page repeats the service page's photos under one shared
 * title ("گالری خدمت"), so search engines saw thousands of thin near-duplicates.
 * It is never indexable, whatever the locale:
 *
 * - noindex, follow: out of the index, but its links (back to the service) still count.
 * - canonical points at the service page that owns the photos.
 * - no hreflang: alternates only make sense between indexable pages.
 *
 * Keep /gallery crawlable (not in robots.txt) and out of the sitemap, or search
 * engines cannot see the noindex and already-indexed galleries stay indexed.
 */
export function galleryMetadata(service: Metadata, title: string): Metadata {
  const canonical = service.alternates?.canonical ?? null;
  return {
    ...service,
    title: { absolute: title },
    alternates: { canonical },
    robots: { index: false, follow: true },
    // og:url is already the service's canonical URL (buildPublicMetadata).
    openGraph: { ...service.openGraph, title },
    twitter: { ...service.twitter, title },
  };
}
