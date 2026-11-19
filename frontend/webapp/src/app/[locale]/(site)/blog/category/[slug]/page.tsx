import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";

import { BlogIndexView } from "@/features/blog/components/public/blog-views";
import { getPublicCategories, getPublishedPosts } from "@/features/blog/server/repository";
import { SLUG_PATTERN } from "@/features/blog/types";
import { buildPublicMetadata } from "@/lib/seo/metadata";

export const revalidate = 300;

type Props = {
  params: Promise<{ locale: string; slug: string }>;
  searchParams: Promise<{ page?: string }>;
};

const pageNumber = (value?: string) => {
  const parsed = Number.parseInt(value ?? "1", 10);
  return Number.isFinite(parsed) && parsed >= 1 && parsed <= 1000 ? parsed : 1;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!SLUG_PATTERN.test(slug)) notFound();
  const category = (await getPublicCategories(locale)).find((entry) => entry.slug === slug);
  if (!category) notFound();
  return buildPublicMetadata({ locale, path: `/blog/category/${slug}`, title: category.name, descriptions: [category.name] });
}

export default async function BlogCategoryPage({ params, searchParams }: Props) {
  const [{ locale, slug }, query] = await Promise.all([params, searchParams]);
  setRequestLocale(locale);
  if (!SLUG_PATTERN.test(slug)) notFound();
  const page = pageNumber(query.page);
  const [categories, list] = await Promise.all([getPublicCategories(locale), getPublishedPosts(locale, { categorySlug: slug, page })]);
  if (list === undefined) throw new Error("Blog is temporarily unavailable.");
  const category = categories.find((entry) => entry.slug === slug);
  if (!category) notFound();
  return <BlogIndexView locale={locale} list={list} categories={categories} activeCategory={{ slug, name: category.name }} page={page} />;
}
