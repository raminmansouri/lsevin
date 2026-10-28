import { allGuides, guideLocales, guidePath } from "@/features/guides/registry";
import { absoluteUrl } from "@/lib/seo/alternates";
import { seoOrigin } from "@/lib/seo/origin";

/** A small, factual map of public guides. Search engines use the sitemap. */
export function GET(): Response {
  const lines = [
    "# LSevin",
    "",
    "Public healthcare and medical travel information from LSevin.",
    "",
    `- [Sitemap](${seoOrigin()}/sitemap.xml)`,
    "",
    "## Medical travel guides",
  ];

  for (const guide of allGuides()) {
    for (const locale of guideLocales(guide)) {
      const copy = guide.copy[locale];
      if (copy) lines.push(`- [${copy.navLabel}](${absoluteUrl(locale, guidePath(guide.slug))})`);
    }
  }

  return new Response(`${lines.join("\n")}\n`, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=300, s-maxage=300",
    },
  });
}
