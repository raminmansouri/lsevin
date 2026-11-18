import { hasLocale } from "next-intl";

import { getPublishedPosts } from "@/features/blog/server/repository";
import { routing } from "@/i18n/routing";
import { absoluteUrl } from "@/lib/seo/alternates";
import { contentLanguageFor } from "@/lib/seo/language-tags";

export const revalidate = 300;

const XML_ESCAPES: Record<string, string> = { "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" };
const escapeXml = (value: string) => value.replace(/[<>&'"]/gu, (char) => XML_ESCAPES[char]);

type Context = { params: Promise<{ locale: string }> };

/** RSS 2.0 feed of the newest posts in one language. */
export async function GET(_request: Request, { params }: Context) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return new Response("Not found", { status: 404 });
  const list = await getPublishedPosts(locale, { pageSize: 30 });
  if (list === undefined) return new Response("Temporarily unavailable", { status: 503 });

  const items = list.items
    .map((post) => {
      const link = escapeXml(absoluteUrl(locale, `/blog/${post.slug}`));
      return `    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <pubDate>${new Date(post.publishedAt).toUTCString()}</pubDate>
      <description>${escapeXml(post.excerpt)}</description>
    </item>`;
    })
    .join("\n");
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>LSevin</title>
    <link>${escapeXml(absoluteUrl(locale, "/blog"))}</link>
    <description>LSevin</description>
    <language>${escapeXml(contentLanguageFor(locale))}</language>
${items}
  </channel>
</rss>
`;
  return new Response(xml, {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8", "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" },
  });
}
