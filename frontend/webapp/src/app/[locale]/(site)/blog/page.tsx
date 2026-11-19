import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { BlogIndexView } from "@/features/blog/components/public/blog-views";
import { getPublicCategories, getPublishedPostIndex, getPublishedPosts } from "@/features/blog/server/repository";
import { absoluteUrl, type SeoLocale } from "@/lib/seo/alternates";
import { buildPublicMetadata } from "@/lib/seo/metadata";

// Cached reads (tag global:blog); the page itself reads ?page, so it renders per request.
export const revalidate = 300;

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ page?: string }>;
};

const pageNumber = (value?: string) => {
  const parsed = Number.parseInt(value ?? "1", 10);
  return Number.isFinite(parsed) && parsed >= 1 && parsed <= 1000 ? parsed : 1;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Blog" });
  // Only languages with at least one published post are indexable.
  const index = await getPublishedPostIndex();
  const eligible = [...new Set(index.flatMap((post) => post.locales))] as SeoLocale[];
  const meta = await buildPublicMetadata({
    locale,
    path: "/blog",
    title: t("blog"),
    descriptions: [t("blogDescription")],
    eligibleLocales: eligible.length ? eligible : undefined,
  });
  return { ...meta, alternates: { ...meta.alternates, types: { "application/rss+xml": absoluteUrl(locale, "/blog/feed.xml") } } };
}

export default async function BlogIndexPage({ params, searchParams }: Props) {
  const [{ locale }, query] = await Promise.all([params, searchParams]);
  setRequestLocale(locale);
  const page = pageNumber(query.page);
  const [list, categories] = await Promise.all([getPublishedPosts(locale, { page }), getPublicCategories(locale)]);
  // undefined = database unreachable: fail the request rather than present "no posts".
  if (list === undefined) throw new Error("Blog is temporarily unavailable.");
  return <BlogIndexView locale={locale} list={list} categories={categories} page={page} />;
}
