import { allGuides, guideLocales, guidePath } from "@/features/guides/registry";
import { getPublishedSitePage, getPublishedSitePageIndex } from "@/features/site-content/server/repository";
import { absoluteUrl } from "@/lib/seo/alternates";
import { seoOrigin } from "@/lib/seo/origin";

// A plain-text map for AI assistants and answer engines (llmstxt.org). It lists
// the pages that explain what LSevin is and the editorial guides; entity pages
// are discoverable through /sitemap.xml.
export const dynamic = "force-static";
export const revalidate = 86400;

/** Editorial pages in English where translated, otherwise in their first language. */
async function companyPages() {
  const index = await getPublishedSitePageIndex();
  const lines = await Promise.all(
    index.map(async ({ slug, locales }) => {
      const locale = locales.includes("en") ? "en" : locales[0];
      const found = await getPublishedSitePage(slug, locale);
      if (!found || found.isFallback) return null;
      const summary = found.page.summary ? `: ${found.page.summary}` : "";
      return `- [${found.page.title}](${absoluteUrl(locale, `/${slug}`)}) (${locales.join(", ")})${summary}`;
    })
  );
  return lines.filter((line): line is string => Boolean(line));
}

export async function GET() {
  const company = await companyPages();
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
    `- [Treatment categories](${absoluteUrl("en", "/categories")})`,
    `- [Free consultation request](${absoluteUrl("en", "/consulting")})`,
    `- [Health tours](${absoluteUrl("en", "/tours")})`,
    "",
    ...(company.length ? ["## About LSevin and policies", ...company, ""] : []),
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
