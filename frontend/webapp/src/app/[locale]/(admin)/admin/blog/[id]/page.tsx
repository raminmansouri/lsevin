import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PostEditor } from "@/features/blog/components/admin/post-editor";
import type { MediaInfo } from "@/features/blog/components/admin/media-field";
import { mediaIdsOf } from "@/features/blog/blocks/derive";
import { resolveMedia } from "@/features/blog/server/media";
import { getAdminPost, listAuthors, listCategories } from "@/features/blog/server/repository";
import { assertAdmin } from "@/lib/auth/admin-guard";
import { catalogDataLocale } from "@/lib/pwa/data-locale";
import { z } from "zod/v4";

export const metadata: Metadata = { title: "Edit post" };
export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ locale: string; id: string }>;
  searchParams: Promise<{ locale?: string }>;
};

export default async function AdminEditBlogPostPage({ params, searchParams }: Props) {
  await assertAdmin("blog", "view");
  const [{ locale, id }, query] = await Promise.all([params, searchParams]);
  if (!z.guid().safeParse(id).success) notFound();
  const post = await getAdminPost(id);
  if (!post) notFound();

  const [categories, authors] = await Promise.all([listCategories(), listAuthors()]);

  const refs = new Set<string>();
  if (post.featuredMedia) refs.add(post.featuredMedia);
  for (const translation of Object.values(post.translations)) {
    mediaIdsOf(translation.blocks).forEach((ref) => refs.add(ref));
    if (translation.autosave) mediaIdsOf(translation.autosave.blocks).forEach((ref) => refs.add(ref));
    if (translation.ogMedia) refs.add(translation.ogMedia);
  }
  const resolved = await resolveMedia([...refs]);
  const media: Record<string, MediaInfo> = Object.fromEntries(
    Object.values(resolved).map((item) => [item.id, { id: item.id, url: item.url, mimeType: item.mimeType, name: item.url.split("/").pop() ?? item.id, alt: item.alt }]),
  );

  const requested = query.locale && /^[a-z]{2,3}-[A-Z]{2}$/u.test(query.locale) ? query.locale : null;
  const keys = Object.keys(post.translations);
  const adminKey = catalogDataLocale(locale);
  const initialLocaleKey = requested ?? (keys.includes(adminKey) ? adminKey : (keys[0] ?? adminKey));

  return <PostEditor post={post} categories={categories} authors={authors} media={media} initialLocaleKey={initialLocaleKey} adminLocale={locale} />;
}
