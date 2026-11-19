import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { PageHeader } from "@/components/page/page-header";
import { Badge } from "@/components/ui/badge";
import { LOCALE_SHORT_NAMES } from "@/config/locales";
import { DeletePostButton, NewPostForm } from "@/features/blog/components/admin/post-list-controls";
import { TaxonomyPanel } from "@/features/blog/components/admin/taxonomy-panel";
import type { MediaInfo } from "@/features/blog/components/admin/media-field";
import { resolveMedia } from "@/features/blog/server/media";
import { listAdminPosts, listAuthors, listCategories } from "@/features/blog/server/repository";
import { POST_STATUSES, type PostStatus } from "@/features/blog/types";
import { Link } from "@/i18n/navigation";
import { assertAdmin } from "@/lib/auth/admin-guard";
import { catalogDataLocale } from "@/lib/pwa/data-locale";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Blog" };
export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string; status?: string }>;
};

export default async function AdminBlogPage({ params, searchParams }: Props) {
  await assertAdmin("blog", "view");
  const [{ locale }, query] = await Promise.all([params, searchParams]);
  const t = await getTranslations({ locale, namespace: "AdminBlog" });
  const localeKey = catalogDataLocale(locale);
  const status = (POST_STATUSES as readonly string[]).includes(query.status ?? "") ? (query.status as PostStatus) : null;
  const [posts, categories, authors] = await Promise.all([listAdminPosts({ q: query.q ?? null, status }, localeKey), listCategories(), listAuthors()]);
  const avatarRefs = authors.map((author) => author.avatarMedia).filter((ref): ref is string => Boolean(ref));
  const resolved = await resolveMedia(avatarRefs);
  const media: Record<string, MediaInfo> = Object.fromEntries(
    Object.values(resolved).map((item) => [item.id, { id: item.id, url: item.url, mimeType: item.mimeType, name: item.url.split("/").pop() ?? item.id, alt: item.alt }]),
  );

  const titleOf = (post: (typeof posts)[number]) => {
    const pick = post.translations.find((tr) => tr.localeKey === localeKey && tr.title) ?? post.translations.find((tr) => tr.localeKey === "en-US" && tr.title) ?? post.translations.find((tr) => tr.title);
    return pick?.title || post.slug;
  };

  return (
    <div className="space-y-6" data-testid="admin-blog">
      <PageHeader title={t("title")} description={t("intro")}>
        <NewPostForm defaultLocaleKey={localeKey} />
      </PageHeader>

      <form method="get" className="flex flex-wrap items-end gap-3" role="search" aria-label={t("filters")}>
        <label className="space-y-1 text-sm">
          <span className="block font-medium">{t("search")}</span>
          <input type="search" name="q" defaultValue={query.q ?? ""} className="h-9 w-56 rounded-md border bg-background px-3 text-sm" data-testid="blog-search" />
        </label>
        <label className="space-y-1 text-sm">
          <span className="block font-medium">{t("statusFilter")}</span>
          <select name="status" defaultValue={status ?? ""} className="h-9 rounded-md border bg-background px-3 text-sm" data-testid="blog-status-filter">
            <option value="">{t("all")}</option>
            {POST_STATUSES.map((value) => (
              <option key={value} value={value}>
                {t(`status.${value}`)}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" className="h-9 rounded-md border px-4 text-sm hover:bg-muted">
          {t("filter")}
        </button>
      </form>

      <div className="overflow-x-auto rounded-2xl border">
        <table className="w-full min-w-[720px] text-sm" data-testid="blog-posts-table">
          <thead className="bg-muted/60 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3 text-start font-semibold">{t("postTitle")}</th>
              <th className="px-4 py-3 text-start font-semibold">{t("languages")}</th>
              <th className="px-4 py-3 text-start font-semibold">{t("settings.category")}</th>
              <th className="px-4 py-3 text-start font-semibold">{t("updated")}</th>
              <th className="px-4 py-3 text-end font-semibold">{t("actions")}</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {posts.map((post) => {
              const title = titleOf(post);
              return (
                <tr key={post.id} className="bg-background align-middle" data-slug={post.slug}>
                  <td className="px-4 py-3">
                    <Link href={`/admin/blog/${post.id}`} className="font-semibold hover:underline">
                      {title}
                    </Link>
                    <div className="font-mono text-xs text-muted-foreground" dir="ltr">
                      /blog/{post.slug}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {post.translations.map((tr) => (
                        <Badge key={tr.localeKey} variant={tr.status === "published" ? "default" : "outline"} className={cn("gap-1", tr.status === "archived" && "opacity-60")} title={t(`status.${tr.status}`)}>
                          {LOCALE_SHORT_NAMES[tr.localeKey as never] ?? tr.localeKey}
                        </Badge>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3">{post.categoryName ?? "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{new Date(post.updatedAt).toLocaleDateString(locale === "fa" ? "fa-IR" : locale)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Link href={`/admin/blog/${post.id}`} className="inline-flex h-8 items-center rounded-md border px-3 text-sm hover:bg-muted" data-testid="edit-post">
                        {t("edit")}
                      </Link>
                      <DeletePostButton id={post.id} title={title} />
                    </div>
                  </td>
                </tr>
              );
            })}
            {!posts.length ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-muted-foreground" data-testid="blog-empty">
                  {t("emptyList")}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <TaxonomyPanel categories={categories} authors={authors} localeKey={localeKey} media={media} />
    </div>
  );
}
