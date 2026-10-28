import { allGuides, guideLocales, guidePath } from "@/features/guides/registry";
import { absoluteUrl } from "@/lib/seo/alternates";
import { seoOrigin } from "@/lib/seo/origin";

// A plain-text map for AI assistants and answer engines (llmstxt.org). It lists
// the pages that explain what LSevin is and the editorial guides; entity pages
// are discoverable through /sitemap.xml.
export const dynamic = "force-static";
export const revalidate = 86400;

export function GET() {
  const guides = allGuides().flatMap((guide) =>
    guideLocales(guide).map((locale) => {
      const copy = guide.copy[locale]!;
      return `- [${copy.h1}](${absoluteUrl(locale, guidePath(guide.slug))}) (${locale}, reviewed ${guide.reviewedAt}): ${copy.description}`;
    })
  );

  const body = [
    "# LSevin (السوین)",
    "",
    "> LSevin is a health-travel booking platform for Iran. Patients from Iran and neighbouring countries find clinics, hospitals and specialists, book treatments, hotels near hospitals with in-hotel care, and tours, and can request a free consultation. Persian is the primary language; English and Arabic guides are available.",
    "",
    "LSevin coordinates bookings with licensed providers. It does not give medical advice, issue visas or guarantee outcomes; treatment suitability is decided by the treating physician.",
    "",
    "## Start here",
    `- [Home (Persian)](${absoluteUrl("fa", "/n/app/mobile/home")})`,
    `- [Home (English)](${absoluteUrl("en", "/n/app/mobile/home")})`,
    `- [Home (Arabic)](${absoluteUrl("ar", "/n/app/mobile/home")})`,
    `- [Treatment categories](${absoluteUrl("en", "/n/app/mobile/categories")})`,
    `- [Free consultation request](${absoluteUrl("en", "/consulting")})`,
    `- [Health tours](${absoluteUrl("en", "/tours")})`,
    "",
    "## Medical travel guides",
    ...guides,
    "",
    "## Optional",
    `- [Sitemap](${seoOrigin()}/sitemap.xml)`,
    `- [Privacy policy](${absoluteUrl("en", "/privacy-policy")})`,
    "",
  ].join("\n");

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    },
  });
}
