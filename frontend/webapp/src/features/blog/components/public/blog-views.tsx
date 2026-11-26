import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import { absoluteUrl } from "@/lib/seo/alternates";
import { breadcrumbList, graph, organizationId } from "@/lib/seo/entity-schema";
import { JsonLd } from "@/lib/seo/json-ld";
import { directionFor } from "@/lib/seo/language-tags";
import { seoOrigin } from "@/lib/seo/origin";
import { publicMediaUrl } from "@/lib/seo/media-url";
import { catalogDataLocale } from "@/lib/pwa/data-locale";
import { cn } from "@/lib/utils";

import { blocksPlainText } from "../../blocks/derive";
import { blogPostingNode, faqPageFromBlocks, medicalReviewNode, videoObjectsFromBlocks } from "../../blocks/jsonld";
import type { PublishedList, PublishedPost, PublicCategory } from "../../server/repository";
import type { PublicPostCard } from "../../types";
import { BlockRenderer } from "./block-renderer";

function formatDate(value: string, locale: string): string {
  // An empty or malformed date renders as nothing instead of failing the whole page.
  if (!value || Number.isNaN(new Date(value).getTime())) return "";
  try {
    return new Intl.DateTimeFormat(locale === "fa" ? "fa-IR" : locale, { dateStyle: "long" }).format(new Date(value));
  } catch {
    return new Intl.DateTimeFormat("en", { dateStyle: "long" }).format(new Date(value));
  }
}

export const blogPath = (slug?: string) => (slug ? `/blog/${slug}` : "/blog");

function PostCard({ post, locale, readLabel, minutesLabel }: { post: PublicPostCard; locale: string; readLabel: string; minutesLabel: string }) {
  return (
    <li className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-black/5" data-blog-card={post.slug}>
      <Link href={blogPath(post.slug)} className="group block h-full">
        {post.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={post.imageUrl} alt={post.imageAlt} loading="lazy" decoding="async" className="aspect-[16/9] w-full object-cover" />
        ) : (
          <div aria-hidden className="aspect-[16/9] w-full bg-gradient-to-br from-[#083f30] to-[#c9a55a]/60" />
        )}
        <div className="space-y-2 p-5">
          {post.categoryName ? <p className="text-xs font-bold text-[#083f30]">{post.categoryName}</p> : null}
          <h2 className="text-lg font-extrabold leading-7 text-neutral-900 group-hover:text-[#083f30]">{post.title}</h2>
          {post.excerpt ? <p className="line-clamp-3 text-sm leading-7 text-neutral-600">{post.excerpt}</p> : null}
          <p className="flex flex-wrap items-center gap-x-3 pt-1 text-xs text-neutral-500">
            <time dateTime={post.publishedAt}>{formatDate(post.publishedAt, locale)}</time>
            <span>{minutesLabel}</span>
            <span className="font-semibold text-[#083f30]">{readLabel}</span>
          </p>
        </div>
      </Link>
    </li>
  );
}

export async function BlogIndexView({
  locale,
  list,
  categories,
  activeCategory,
  page,
}: {
  locale: string;
  list: PublishedList;
  categories: PublicCategory[];
  activeCategory?: { slug: string; name: string } | null;
  page: number;
}) {
  const t = await getTranslations({ locale, namespace: "Blog" });
  const pages = Math.max(1, Math.ceil(list.total / list.pageSize));
  const base = activeCategory ? `/blog/category/${activeCategory.slug}` : "/blog";
  const pageHref = (p: number) => (p <= 1 ? base : `${base}?page=${p}`);
  const url = absoluteUrl(locale, base);
  const title = activeCategory ? activeCategory.name : t("blog");

  return (
    <div dir={directionFor(locale)} className="min-h-screen bg-[#f7f5ef]">
      <JsonLd
        data={graph(
          {
            "@type": "CollectionPage",
            "@id": `${url}#webpage`,
            url,
            name: title,
            inLanguage: locale,
            isPartOf: { "@id": `${seoOrigin()}/#website` },
            publisher: { "@id": organizationId() },
          },
          breadcrumbList([
            { name: t("home"), url: absoluteUrl(locale) },
            { name: t("blog"), url: absoluteUrl(locale, "/blog") },
            ...(activeCategory ? [{ name: activeCategory.name, url }] : []),
          ]),
        )}
      />
      <main className="mx-auto max-w-5xl px-4 pb-24 pt-5 xl:pt-10" data-blog-index>
        <nav aria-label="breadcrumb" className="mb-4 text-sm text-neutral-500">
          <ol className="flex flex-wrap items-center gap-1.5">
            <li>
              <Link href="/" className="hover:underline">
                {t("home")}
              </Link>
            </li>
            <li aria-hidden>/</li>
            <li aria-current={activeCategory ? undefined : "page"}>{activeCategory ? <Link href="/blog" className="hover:underline">{t("blog")}</Link> : t("blog")}</li>
            {activeCategory ? (
              <>
                <li aria-hidden>/</li>
                <li aria-current="page">{activeCategory.name}</li>
              </>
            ) : null}
          </ol>
        </nav>

        <header className="mb-6">
          <h1 className="text-3xl font-extrabold text-neutral-900">{title}</h1>
          {!activeCategory ? <p className="mt-2 max-w-2xl text-neutral-600">{t("blogDescription")}</p> : null}
        </header>

        {categories.length ? (
          <nav aria-label={t("categories")} className="mb-6">
            <ul className="flex flex-wrap gap-2">
              <li>
                <Link
                  href="/blog"
                  aria-current={!activeCategory ? "page" : undefined}
                  className={cn("inline-flex rounded-full px-4 py-2 text-sm ring-1", !activeCategory ? "bg-[#083f30] text-white ring-[#083f30]" : "bg-white text-neutral-700 ring-black/10 hover:ring-[#083f30]/40")}
                >
                  {t("allCategories")}
                </Link>
              </li>
              {categories.map((category) => (
                <li key={category.slug}>
                  <Link
                    href={`/blog/category/${category.slug}`}
                    aria-current={activeCategory?.slug === category.slug ? "page" : undefined}
                    className={cn("inline-flex rounded-full px-4 py-2 text-sm ring-1", activeCategory?.slug === category.slug ? "bg-[#083f30] text-white ring-[#083f30]" : "bg-white text-neutral-700 ring-black/10 hover:ring-[#083f30]/40")}
                  >
                    {category.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ) : null}

        {list.items.length ? (
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {list.items.map((post) => (
              <PostCard key={post.slug} post={post} locale={locale} readLabel={t("readMore")} minutesLabel={t("minRead", { count: post.readingMinutes })} />
            ))}
          </ul>
        ) : (
          <p className="rounded-3xl bg-white p-8 text-center text-neutral-600 ring-1 ring-black/5" data-blog-empty>
            {t("noPosts")}
          </p>
        )}

        {pages > 1 ? (
          <nav aria-label={t("pagination")} className="mt-8 flex items-center justify-between gap-3 text-sm">
            {page > 1 ? (
              <Link href={pageHref(page - 1)} rel="prev" className="rounded-full bg-white px-4 py-2 ring-1 ring-black/10 hover:ring-[#083f30]/40">
                {t("previous")}
              </Link>
            ) : (
              <span />
            )}
            <span className="text-neutral-500">{t("pageOf", { page, pages })}</span>
            {page < pages ? (
              <Link href={pageHref(page + 1)} rel="next" className="rounded-full bg-white px-4 py-2 ring-1 ring-black/10 hover:ring-[#083f30]/40">
                {t("next")}
              </Link>
            ) : (
              <span />
            )}
          </nav>
        ) : null}
      </main>
    </div>
  );
}

export async function BlogPostView({
  locale,
  found,
  related,
  preview = false,
}: {
  locale: string;
  found: PublishedPost;
  related: PublicPostCard[];
  /** Admin preview: not indexed, shows a banner. */
  preview?: boolean;
}) {
  const { post } = found;
  const t = await getTranslations({ locale, namespace: "Blog" });
  const localeKey = catalogDataLocale(locale);
  const url = absoluteUrl(locale, blogPath(post.slug));
  const mediaUrl = (id: string | null | undefined) => (id && post.media[id] ? publicMediaUrl(post.media[id].url) : undefined);
  const plain = blocksPlainText(post.blocks);
  const description = post.seoDescription || post.excerpt;
  const images = [post.ogImageUrl, post.imageUrl].map((src) => publicMediaUrl(src)).filter((src): src is string => Boolean(src));
  const label = { toc: t("tocTitle"), faq: t("faqTitle"), video: t("video") };

  const schema = graph(
    blogPostingNode({
      url,
      title: post.title,
      description,
      locale,
      images: [...new Set(images)],
      datePublished: post.publishedAt,
      dateModified: post.updatedAt,
      wordCount: plain.split(/\s+/u).filter(Boolean).length,
      section: post.categoryName,
      author: post.author ? { name: post.author.name } : null,
      publisherId: organizationId(),
      websiteId: `${seoOrigin()}/#website`,
    }),
    breadcrumbList([
      { name: t("home"), url: absoluteUrl(locale) },
      { name: t("blog"), url: absoluteUrl(locale, "/blog") },
      ...(post.categorySlug && post.categoryName ? [{ name: post.categoryName, url: absoluteUrl(locale, `/blog/category/${post.categorySlug}`) }] : []),
      { name: post.title, url },
    ]),
    faqPageFromBlocks(post.blocks, url),
    ...videoObjectsFromBlocks(post.blocks, { url, uploadDate: post.publishedAt, mediaUrl }),
    medicalReviewNode({ url, title: post.title, reviewer: post.reviewer, lastReviewedAt: post.lastReviewedAt }),
  );

  return (
    <div dir={directionFor(locale)} className="min-h-screen bg-[#f7f5ef]">
      {preview ? null : <JsonLd data={schema} />}
      <main className="mx-auto max-w-3xl px-4 pb-24 pt-5 xl:pt-10" data-blog-post={post.slug}>
        {preview ? (
          <p role="status" className="mb-4 rounded-2xl bg-amber-100 px-4 py-2 text-sm font-semibold text-amber-950" data-blog-preview>
            {t("previewBanner")}
          </p>
        ) : null}
        <nav aria-label="breadcrumb" className="mb-4 text-sm text-neutral-500">
          <ol className="flex flex-wrap items-center gap-1.5">
            <li>
              <Link href="/" className="hover:underline">
                {t("home")}
              </Link>
            </li>
            <li aria-hidden>/</li>
            <li>
              <Link href="/blog" className="hover:underline">
                {t("blog")}
              </Link>
            </li>
            {post.categorySlug && post.categoryName ? (
              <>
                <li aria-hidden>/</li>
                <li>
                  <Link href={`/blog/category/${post.categorySlug}`} className="hover:underline">
                    {post.categoryName}
                  </Link>
                </li>
              </>
            ) : null}
          </ol>
        </nav>

        {found.isFallback ? (
          <p role="note" className="mb-4 rounded-2xl bg-white px-4 py-2 text-sm text-neutral-600 ring-1 ring-black/5" data-blog-fallback>
            {t("fallbackNotice")}
          </p>
        ) : null}

        <article className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/5 sm:p-8">
          <header className="mb-6">
            {post.categoryName ? <p className="mb-2 text-xs font-bold text-[#083f30]">{post.categoryName}</p> : null}
            <h1 className="text-2xl font-extrabold leading-tight text-neutral-900 sm:text-3xl">{post.title}</h1>
            <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-neutral-500">
              {post.author ? <span>{t("by", { name: post.author.name })}</span> : null}
              <time dateTime={post.publishedAt}>{formatDate(post.publishedAt, locale)}</time>
              <span>{t("minRead", { count: post.readingMinutes })}</span>
              {post.updatedAt && post.updatedAt.slice(0, 10) !== post.publishedAt.slice(0, 10) ? (
                <span>
                  {t("updated")}: <time dateTime={post.updatedAt}>{formatDate(post.updatedAt, locale)}</time>
                </span>
              ) : null}
            </p>
            {post.reviewer ? (
              <p className="mt-2 text-xs text-neutral-600" data-blog-reviewer>
                {t("reviewedBy", { name: post.reviewer.name })}
                {post.lastReviewedAt ? ` · ${formatDate(post.lastReviewedAt, locale)}` : ""}
              </p>
            ) : null}
          </header>

          {post.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={post.imageUrl} alt={post.imageAlt} className="mb-6 aspect-[16/9] w-full rounded-2xl object-cover" fetchPriority="high" />
          ) : null}
          {post.excerpt ? <p className="mb-6 text-lg leading-8 text-neutral-800">{post.excerpt}</p> : null}

          <BlockRenderer blocks={post.blocks} media={post.media} labels={label} localeKey={localeKey} />

          {post.author ? (
            <aside className="mt-10 flex items-start gap-4 rounded-2xl bg-neutral-50 p-4" data-blog-author>
              {post.author.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={post.author.avatarUrl} alt="" className="size-14 shrink-0 rounded-full object-cover" loading="lazy" />
              ) : null}
              <div>
                <p className="text-xs text-neutral-500">{t("aboutAuthor")}</p>
                <p className="font-bold text-neutral-900">{post.author.name}</p>
                {post.author.credentials ? <p className="text-xs text-neutral-500">{post.author.credentials}</p> : null}
                {post.author.bio ? <p className="mt-1 text-sm leading-7 text-neutral-700">{post.author.bio}</p> : null}
              </div>
            </aside>
          ) : null}
        </article>

        {related.length ? (
          <section aria-labelledby="related-heading" className="mt-10">
            <h2 id="related-heading" className="mb-3 text-lg font-bold text-[#083f30]">
              {t("relatedTitle")}
            </h2>
            <ul className="grid gap-4 sm:grid-cols-3">
              {related.map((item) => (
                <PostCard key={item.slug} post={item} locale={locale} readLabel={t("readMore")} minutesLabel={t("minRead", { count: item.readingMinutes })} />
              ))}
            </ul>
          </section>
        ) : null}
      </main>
    </div>
  );
}
