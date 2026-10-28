import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";

import { GUIDE_LABELS } from "@/features/guides/labels";
import { allGuides, findGuide, guideLocales, guidePath, GUIDE_BASE_PATH } from "@/features/guides/registry";
import type { Guide, GuideCopy, GuideLocale, GuideSection } from "@/features/guides/types";
import { Link } from "@/i18n/navigation";
import { absoluteUrl } from "@/lib/seo/alternates";
import { breadcrumbList, graph, organizationId } from "@/lib/seo/entity-schema";
import { JsonLd } from "@/lib/seo/json-ld";
import { directionFor } from "@/lib/seo/language-tags";
import { buildPublicMetadata } from "@/lib/seo/metadata";
import { seoOrigin } from "@/lib/seo/origin";

type PageProps = { params: Promise<{ locale: string; slug?: string[] }> };

// Editorial pages: fully static, no request data. Only locales with a written
// version exist; everything else is a real 404 (no machine-translated filler).
export const dynamic = "force-static";
export const revalidate = 86400;

export function generateStaticParams({ params }: { params: { locale: string } }) {
  return allGuides()
    .filter((guide) => guideLocales(guide).includes(params.locale as GuideLocale))
    .map((guide) => ({ slug: guide.slug ? [guide.slug] : [] }));
}

function resolve(locale: string, slug?: string[]) {
  if (slug && slug.length > 1) return null;
  return findGuide(locale, slug?.[0] ?? "");
}

export async function generateMetadata({ params }: PageProps) {
  const { locale, slug } = await params;
  const found = resolve(locale, slug);
  if (!found) notFound();
  return buildPublicMetadata({
    locale,
    path: guidePath(found.guide.slug),
    title: found.copy.title,
    descriptions: [found.copy.description],
    eligibleLocales: guideLocales(found.guide),
  });
}

function guideSchema(guide: Guide, copy: GuideCopy, locale: GuideLocale, brand: string, sectionName: string) {
  const url = absoluteUrl(locale, guidePath(guide.slug));
  const hub = findGuide(locale, "");
  const crumbs = [
    { name: brand, url: absoluteUrl(locale, "/n/app/mobile/home") },
    { name: hub?.copy.navLabel ?? sectionName, url: absoluteUrl(locale, GUIDE_BASE_PATH) },
    ...(guide.slug ? [{ name: copy.navLabel, url }] : []),
  ];
  const howToSteps = guide.howTo ? copy.sections.flatMap((section) => section.steps ?? []) : [];
  return graph(
    {
      "@type": "MedicalWebPage",
      "@id": `${url}#webpage`,
      url,
      name: copy.title,
      headline: copy.h1,
      description: copy.description,
      inLanguage: locale,
      datePublished: guide.reviewedAt,
      dateModified: guide.reviewedAt,
      lastReviewed: guide.reviewedAt,
      isPartOf: { "@id": `${seoOrigin()}/#website` },
      publisher: { "@id": organizationId() },
      citation: copy.sources.map((source) => ({ "@type": "CreativeWork", name: source.label, url: source.url })),
    },
    breadcrumbList(crumbs),
    copy.faq.length
      ? {
          "@type": "FAQPage",
          "@id": `${url}#faq`,
          mainEntity: copy.faq.map((item) => ({
            "@type": "Question",
            name: item.question,
            acceptedAnswer: { "@type": "Answer", text: item.answer },
          })),
        }
      : null,
    howToSteps.length
      ? {
          "@type": "HowTo",
          "@id": `${url}#howto`,
          name: copy.h1,
          step: howToSteps.map((text, index) => ({ "@type": "HowToStep", position: index + 1, text })),
        }
      : null
  );
}

function Section({ section }: { section: GuideSection }) {
  return (
    <section id={section.id} className="scroll-mt-20">
      <h2 className="mb-3 text-xl font-bold text-[#083f30]">{section.heading}</h2>
      {section.paragraphs?.map((paragraph, index) => (
        <p key={index} className="mb-3 leading-8 text-neutral-700">
          {paragraph}
        </p>
      ))}
      {section.bullets?.length ? (
        <ul className="mb-3 list-disc space-y-1.5 ps-6 leading-7 text-neutral-700">
          {section.bullets.map((bullet, index) => (
            <li key={index}>{bullet}</li>
          ))}
        </ul>
      ) : null}
      {section.steps?.length ? (
        <ol className="mb-3 list-decimal space-y-2 ps-6 leading-7 text-neutral-700">
          {section.steps.map((step, index) => (
            <li key={index}>{step}</li>
          ))}
        </ol>
      ) : null}
      {section.table ? (
        <div className="mb-3 overflow-x-auto rounded-xl border border-neutral-200">
          <table className="w-full min-w-[480px] text-start text-sm">
            <caption className="bg-neutral-50 px-4 py-2 text-start font-semibold text-neutral-800">
              {section.table.caption}
            </caption>
            <thead className="bg-[#083f30] text-white">
              <tr>
                {section.table.columns.map((column) => (
                  <th key={column} scope="col" className="px-4 py-2 text-start font-semibold">
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {section.table.rows.map((row, rowIndex) => (
                <tr key={rowIndex} className="border-t border-neutral-200 align-top">
                  {row.map((cell, cellIndex) => (
                    <td key={cellIndex} className="px-4 py-2 text-neutral-700">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  );
}

export default async function GuidePage({ params }: PageProps) {
  const { locale, slug } = await params;
  const found = resolve(locale, slug);
  if (!found) notFound();
  setRequestLocale(locale);

  const { guide, copy } = found;
  const labels = GUIDE_LABELS[found.locale];
  const hub = findGuide(locale, "");
  const reviewed = new Intl.DateTimeFormat(found.locale === "fa" ? "fa-IR" : found.locale, {
    dateStyle: "long",
  }).format(new Date(`${guide.reviewedAt}T12:00:00Z`));
  const related = guide.related
    .map((relatedSlug) => findGuide(locale, relatedSlug))
    .filter((item): item is NonNullable<typeof item> => Boolean(item));

  return (
    <div dir={directionFor(locale)} lang={locale} className="min-h-screen bg-[#f7f5ef]">
      <JsonLd data={guideSchema(guide, copy, found.locale, labels.brand, labels.section)} />

      <header className="sticky top-0 z-20 bg-[#083f30] text-white shadow">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3">
          <Link href="/n/app/mobile/home" className="text-lg font-extrabold tracking-tight">
            {labels.brand}
          </Link>
          <Link
            href="/consulting"
            className="rounded-full bg-[#eacb7f] px-4 py-2 text-sm font-bold text-[#083f30] hover:bg-[#f0d795]"
          >
            {labels.consult}
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 pb-24 pt-5">
        <nav aria-label="breadcrumb" className="mb-4 text-sm text-neutral-500">
          <ol className="flex flex-wrap items-center gap-1.5">
            <li>
              <Link href="/n/app/mobile/home" className="hover:underline">
                {labels.home}
              </Link>
            </li>
            <li aria-hidden>/</li>
            <li>
              {guide.slug ? (
                <Link href={GUIDE_BASE_PATH} className="hover:underline">
                  {hub?.copy.navLabel ?? labels.section}
                </Link>
              ) : (
                <span aria-current="page">{copy.navLabel}</span>
              )}
            </li>
            {guide.slug ? (
              <>
                <li aria-hidden>/</li>
                <li aria-current="page">{copy.navLabel}</li>
              </>
            ) : null}
          </ol>
        </nav>

        <article className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/5 sm:p-8">
          <h1 className="mb-3 text-2xl font-extrabold leading-tight text-neutral-900 sm:text-3xl">{copy.h1}</h1>
          <p className="mb-4 text-xs text-neutral-500">
            {labels.reviewed}: <time dateTime={guide.reviewedAt}>{reviewed}</time>
          </p>
          <p className="mb-6 text-lg leading-8 text-neutral-800">{copy.intro}</p>

          <nav aria-label={labels.onThisPage} className="mb-8 rounded-2xl bg-[#083f30]/[0.05] p-4">
            <p className="mb-2 text-sm font-bold text-[#083f30]">{labels.onThisPage}</p>
            <ol className="list-decimal space-y-1 ps-5 text-sm text-neutral-700">
              {copy.sections.map((section) => (
                <li key={section.id}>
                  <a href={`#${section.id}`} className="hover:underline">
                    {section.heading}
                  </a>
                </li>
              ))}
              {copy.faq.length ? (
                <li>
                  <a href="#faq" className="hover:underline">
                    {labels.faq}
                  </a>
                </li>
              ) : null}
            </ol>
          </nav>

          <div className="space-y-8">
            {copy.sections.map((section) => (
              <Section key={section.id} section={section} />
            ))}
          </div>

          <section className="my-10 rounded-2xl bg-gradient-to-br from-[#083f30] to-[#0a5a44] p-6 text-white">
            <h2 className="mb-2 text-xl font-bold">{copy.cta.heading}</h2>
            <p className="mb-4 leading-7 text-white/90">{copy.cta.body}</p>
            <Link
              href="/consulting"
              className="inline-flex rounded-xl bg-[#eacb7f] px-6 py-3 text-sm font-bold text-[#083f30] hover:bg-[#f0d795]"
            >
              {copy.cta.button}
            </Link>
          </section>

          {copy.faq.length ? (
            <section id="faq" className="scroll-mt-20">
              <h2 className="mb-4 text-xl font-bold text-[#083f30]">{labels.faq}</h2>
              <div className="space-y-4">
                {copy.faq.map((item) => (
                  <div key={item.question} className="rounded-2xl border border-neutral-200 p-4">
                    <h3 className="mb-2 font-bold text-neutral-900">{item.question}</h3>
                    <p className="leading-7 text-neutral-700">{item.answer}</p>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          <p className="mt-8 rounded-xl bg-amber-50 p-4 text-sm leading-6 text-amber-900">{labels.disclaimer}</p>

          {copy.sources.length ? (
            <section className="mt-8">
              <h2 className="mb-3 text-lg font-bold text-neutral-900">{labels.sources}</h2>
              <ol className="list-decimal space-y-1.5 ps-5 text-sm text-neutral-600">
                {copy.sources.map((source) => (
                  <li key={source.url}>
                    <a href={source.url} target="_blank" rel="noopener" className="break-words hover:underline">
                      {source.label}
                    </a>
                  </li>
                ))}
              </ol>
            </section>
          ) : null}
        </article>

        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          {related.length ? (
            <nav aria-label={labels.related}>
              <h2 className="mb-3 font-bold text-neutral-900">{labels.related}</h2>
              <ul className="space-y-2">
                {related.map((item) => (
                  <li key={item.guide.slug}>
                    <Link href={guidePath(item.guide.slug)} className="text-[#083f30] hover:underline">
                      {item.copy.h1}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ) : null}
          <nav aria-label={labels.explore}>
            <h2 className="mb-3 font-bold text-neutral-900">{labels.explore}</h2>
            <ul className="space-y-2">
              <li>
                <Link href="/n/app/mobile/categories" className="text-[#083f30] hover:underline">
                  {labels.categories}
                </Link>
              </li>
              <li>
                <Link href="/n/app/mobile/search" className="text-[#083f30] hover:underline">
                  {labels.search}
                </Link>
              </li>
              <li>
                <Link href="/tours" className="text-[#083f30] hover:underline">
                  {labels.tours}
                </Link>
              </li>
              <li>
                <Link href="/consulting" className="text-[#083f30] hover:underline">
                  {labels.consult}
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </main>
    </div>
  );
}
