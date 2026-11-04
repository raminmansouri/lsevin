import { getTranslations } from "next-intl/server";

import { LexicalRenderer } from "@/components/editor/lexical-renderer";
import { JsonLd } from "@/lib/seo/json-ld";
import { toSeoPlainText } from "@/lib/seo/plain-text";
import { cn } from "@/lib/utils";

import { getFaqs } from "../server/repository";
import type { FaqTarget, PublicFaqItem } from "../types";

/** FAQPage node for a page's JSON-LD; answers as plain text, as Google requires. */
export function faqPageSchema(items: readonly PublicFaqItem[], pageUrl?: string) {
  const mainEntity = items
    .map((item) => ({
      "@type": "Question",
      name: toSeoPlainText(item.question, 300),
      acceptedAnswer: { "@type": "Answer", text: toSeoPlainText(item.answer, 2000) },
    }))
    .filter((entry) => entry.name && entry.acceptedAnswer.text);
  if (!mainEntity.length) return null;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    ...(pageUrl ? { "@id": `${pageUrl}#faq` } : {}),
    mainEntity,
  };
}

export function FaqList({
  items,
  title,
  className,
  pageUrl,
}: {
  items: readonly PublicFaqItem[];
  title: string;
  className?: string;
  pageUrl?: string;
}) {
  if (!items.length) return null;
  const schema = faqPageSchema(items, pageUrl);
  return (
    <section id="faq" aria-labelledby="faq-heading" className={cn("scroll-mt-24", className)}>
      {schema ? <JsonLd data={schema} /> : null}
      <h2 id="faq-heading" className="mb-4 text-xl font-bold text-[#083f30]">
        {title}
      </h2>
      <div className="space-y-3">
        {items.map((item) => (
          <details
            key={item.id}
            className="group rounded-2xl border border-neutral-200 bg-white px-4 py-3 open:border-[#c9a55a]/60"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 py-1 font-semibold text-neutral-900 [&::-webkit-details-marker]:hidden">
              <span>{item.question}</span>
              <span aria-hidden className="text-xl leading-none text-[#083f30] transition group-open:rotate-45">
                +
              </span>
            </summary>
            <LexicalRenderer content={item.answer} className="mt-2 space-y-2 text-sm leading-7 text-neutral-700" />
          </details>
        ))}
      </div>
    </section>
  );
}

/**
 * Editorial FAQ block for any public page (admin → Editorial → FAQs). Renders
 * nothing when the page has no FAQ in this language. Server component: place it
 * in a page's server tree, or pass it to a client page as a slot.
 */
export async function FaqSection({
  target,
  locale,
  className,
  pageUrl,
}: {
  target: FaqTarget;
  locale: string;
  className?: string;
  pageUrl?: string;
}) {
  const items = await getFaqs(target, locale);
  if (!items.length) return null;
  const t = await getTranslations({ locale, namespace: "SitePages" });
  return <FaqList items={items} title={t("faqTitle")} className={className} pageUrl={pageUrl} />;
}

/** First target that has items in this locale. */
async function firstFaqs(targets: readonly FaqTarget[], locale: string) {
  for (const target of targets) {
    const items = await getFaqs(target, locale);
    if (items.length) return items;
  }
  return [];
}

/**
 * FAQ in the standard page container, placed once after both the phone and
 * desktop layouts so each page carries a single FAQPage node. `target` may be a
 * list: the first one with items wins (e.g. a gym's own FAQ, then the gym FAQ).
 */
export async function PageFaq({
  target,
  locale,
  pageUrl,
}: {
  target: FaqTarget | readonly FaqTarget[];
  locale: string;
  pageUrl?: string;
}) {
  const targets = Array.isArray(target) ? target : [target as FaqTarget];
  const items = await firstFaqs(targets, locale);
  if (!items.length) return null;
  const t = await getTranslations({ locale, namespace: "SitePages" });
  return (
    <div className="mx-auto w-full max-w-3xl px-4 pb-10 pt-2 xl:py-14" data-page-faq={targets[0]?.scope}>
      <FaqList items={items} title={t("faqTitle")} pageUrl={pageUrl} />
    </div>
  );
}
