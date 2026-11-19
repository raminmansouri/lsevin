import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { z } from "zod/v4";

import { HEADER_TO_LOCALE_MAP } from "@/config/locales";
import { BlogPostView } from "@/features/blog/components/public/blog-views";
import { getPreviewPost } from "@/features/blog/server/repository";
import { assertAdmin } from "@/lib/auth/admin-guard";

// A preview is the saved draft (or a newer autosave) rendered by the public components. It is never
// cached and never indexed.
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Preview", robots: { index: false, follow: false } };

type Props = {
  params: Promise<{ locale: string; id: string }>;
  searchParams: Promise<{ locale?: string }>;
};

export default async function AdminBlogPreviewPage({ params, searchParams }: Props) {
  await assertAdmin("blog", "view");
  const [{ locale, id }, query] = await Promise.all([params, searchParams]);
  if (!z.guid().safeParse(id).success) notFound();
  const localeKey = query.locale ?? "";
  const routeLocale = (HEADER_TO_LOCALE_MAP as Record<string, string>)[localeKey] ?? locale;
  const found = await getPreviewPost(id, routeLocale);
  if (!found) notFound();
  return <BlogPostView locale={routeLocale} found={found} related={[]} preview />;
}
