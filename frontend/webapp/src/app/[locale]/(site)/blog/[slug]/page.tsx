import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";

import { BlogPostView } from "@/features/blog/components/public/blog-views";
import { getPublishedPost, getRelatedPosts, getSlugRedirect } from "@/features/blog/server/repository";
import { SLUG_PATTERN } from "@/features/blog/types";
import { buildPublicMetadata } from "@/lib/seo/metadata";

// Rendered on first request, then cached; saves revalidate the tag and the cache also expires in 5 min
// (that is also how a scheduled post appears). A database outage fails the pass and keeps the last copy.
export const revalidate = 300;
export const dynamicParams = true;
export function generateStaticParams() {
  return [];
}

type Props = { params: Promise<{ locale: string; slug: string }> };

async function resolve(locale: string, slug: string) {
  if (!SLUG_PATTERN.test(slug)) notFound();
  const found = await getPublishedPost(slug, locale);
  if (found === undefined) throw new Error(`Blog post ${slug} is temporarily unavailable.`);
  if (found) return found;
  // A retired slug redirects (308) to the current one.
  const current = await getSlugRedirect(slug);
  if (current === undefined) throw new Error(`Blog post ${slug} is temporarily unavailable.`);
  if (current) permanentRedirect(`/${locale}/blog/${current}`);
  notFound();
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const found = await resolve(locale, slug);
  const { post } = found;
  return buildPublicMetadata({
    locale,
    path: `/blog/${post.slug}`,
    title: post.seoTitle || post.title,
    descriptions: [post.seoDescription, post.excerpt],
    image: post.ogImageUrl,
    eligibleLocales: found.locales,
  });
}

export default async function BlogPostPage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const found = await resolve(locale, slug);
  const related = await getRelatedPosts(found.post.id, locale, 3);
  return <BlogPostView locale={locale} found={found} related={related} />;
}
