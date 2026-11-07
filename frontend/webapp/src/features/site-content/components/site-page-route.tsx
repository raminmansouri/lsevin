import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { LexicalRenderer } from "@/components/editor/lexical-renderer";
import { Link } from "@/i18n/navigation";
import { absoluteUrl } from "@/lib/seo/alternates";
import { breadcrumbList, graph, organizationId } from "@/lib/seo/entity-schema";
import { JsonLd } from "@/lib/seo/json-ld";
import { directionFor } from "@/lib/seo/language-tags";
import { buildPublicMetadata } from "@/lib/seo/metadata";
import { seoOrigin } from "@/lib/seo/origin";

import { getFooterPages, getPublishedSitePage, type PublishedSitePage } from "../server/repository";
import type { SitePageSlug } from "../types";
import { FaqSection } from "./faq-section";

type PageProps = { params: Promise<{ locale: string }> };

const SCHEMA_TYPE: Partial<Record<SitePageSlug, string>> = {
  "about-us": "AboutPage",
  "contact-us": "ContactPage",
};

function pageSchema(slug: SitePageSlug, locale: string, found: PublishedSitePage, homeLabel: string) {
  const url = absoluteUrl(locale, `/${slug}`);
  return graph(
    {
      "@type": SCHEMA_TYPE[slug] ?? "WebPage",
      "@id": `${url}#webpage`,
      url,
      name: found.page.title,
      ...(found.page.summary ? { description: found.page.summary } : {}),
      inLanguage: locale,
      dateModified: found.page.updatedAt,
      isPartOf: { "@id": `${seoOrigin()}/#website` },
      publisher: { "@id": organizationId() },
      ...(slug === "about-us" || slug === "contact-us" ? { mainEntity: { "@id": organizationId() } } : {}),
    },
    breadcrumbList([
      { name: homeLabel, url: absoluteUrl(locale, "/n/app/mobile/home") },
      { name: found.page.title, url },
    ]),
  );
}

export function SitePageView({
  slug,
  locale,
  found,
  related,
  homeLabel,
  updatedLabel,
  moreLabel,
}: {
  slug: SitePageSlug;
  locale: string;
  found: PublishedSitePage;
  related: { slug: SitePageSlug; title: string }[];
  homeLabel: string;
  updatedLabel: string;
  moreLabel: string;
}) {
  const { page } = found;
  const updated = new Intl.DateTimeFormat(locale === "fa" ? "fa-IR" : locale, { dateStyle: "long" }).format(
    new Date(page.updatedAt),
  );
  return (
    <div dir={directionFor(locale)} className="min-h-screen bg-[#f7f5ef]">
      <JsonLd data={pageSchema(slug, locale, found, homeLabel)} />
      <main className="mx-auto max-w-3xl px-4 pb-24 pt-5 xl:pt-10" data-site-page={slug}>
        <nav aria-label="breadcrumb" className="mb-4 text-sm text-neutral-500">
          <ol className="flex flex-wrap items-center gap-1.5">
            <li>
              <Link href="/n/app/mobile/home" className="hover:underline">
                {homeLabel}
              </Link>
            </li>
            <li aria-hidden>/</li>
            <li aria-current="page">{page.title}</li>
          </ol>
        </nav>

        <article className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/5 sm:p-8">
          <h1 className="mb-3 text-2xl font-extrabold leading-tight text-neutral-900 sm:text-3xl">{page.title}</h1>
          <p className="mb-6 text-xs text-neutral-500">
            {updatedLabel}: <time dateTime={page.updatedAt}>{updated}</time>
          </p>
          {page.heroImageUrl ? (
            // Editorial media comes from the files host; plain <img> like other CMS blocks.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={page.heroImageUrl}
              alt=""
              className="mb-6 aspect-[16/7] w-full rounded-2xl object-cover"
              fetchPriority="high"
            />
          ) : null}
          {page.summary ? <p className="mb-6 text-lg leading-8 text-neutral-800">{page.summary}</p> : null}
          <LexicalRenderer
            content={page.body}
            className="space-y-4 leading-8 text-neutral-700 [&_blockquote]:my-4 [&_h2]:mt-8 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-[#083f30] [&_h3]:mt-6 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-neutral-900"
          />
          <FaqSection
            target={{ scope: "site_page", entityKey: slug }}
            locale={locale}
            className="mt-10"
            pageUrl={absoluteUrl(locale, `/${slug}`)}
          />
        </article>

        {related.length ? (
          <nav aria-label={moreLabel} className="mt-8">
            <p className="mb-3 text-sm font-bold text-[#083f30]">{moreLabel}</p>
            <ul className="flex flex-wrap gap-2">
              {related.map((link) => (
                <li key={link.slug}>
                  <Link
                    href={`/${link.slug}`}
                    className="inline-flex rounded-full bg-white px-4 py-2 text-sm text-neutral-700 ring-1 ring-black/10 hover:ring-[#083f30]/40"
                  >
                    {link.title}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ) : null}
      </main>
    </div>
  );
}

/** Metadata + page component for one essential page; each route file wires them up. */
export function sitePageRoute(slug: SitePageSlug) {
  async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { locale } = await params;
    const found = await getPublishedSitePage(slug, locale);
    // Database unreachable during an ISR pass: fail it so the last good page stays.
    if (found === undefined) throw new Error(`Site page ${slug} is temporarily unavailable.`);
    if (!found) notFound();
    return buildPublicMetadata({
      locale,
      path: `/${slug}`,
      title: found.page.title,
      descriptions: [found.page.summary, found.page.body],
      image: found.page.heroImageUrl,
      eligibleLocales: found.locales,
    });
  }

  async function Page({ params }: PageProps) {
    const { locale } = await params;
    setRequestLocale(locale);
    const found = await getPublishedSitePage(slug, locale);
    // undefined = database unreachable: fail the regeneration (ISR keeps serving the
    // last good copy) instead of caching a 404 that would drop the page from the index.
    if (found === undefined) throw new Error(`Site page ${slug} is temporarily unavailable.`);
    if (!found) notFound();

    const [t, related] = await Promise.all([
      getTranslations({ locale, namespace: "SitePages" }),
      getFooterPages(locale),
    ]);
    return (
      <SitePageView
        slug={slug}
        locale={locale}
        found={found}
        related={related.filter((link) => link.slug !== slug)}
        homeLabel={t("home")}
        updatedLabel={t("updated")}
        moreLabel={t("more")}
      />
    );
  }

  return { generateMetadata, Page };
}
