import { ArrowLeft } from "lucide-react";
import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";

import { Reveal } from "../components/motion";

function Bullets({ items }: { items: string }) {
  return (
    <ul className="space-y-2.5">
      {items
        .split("\n")
        .filter(Boolean)
        .map((item) => (
          <li key={item} className="flex gap-3 text-[15px] leading-8 text-[#3d4b45]">
            <span className="mt-3.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#c9a55a]" />
            {item}
          </li>
        ))}
    </ul>
  );
}

function Section({ id, number, title, children }: { id: string; number: string; title: string; children: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-32 border-b border-[#efe7d5] pb-10 last:border-0">
      <div className="mb-5 flex items-baseline gap-4">
        <span className="font-mono text-sm font-bold tracking-widest text-[#c9a55a]">{number}</span>
        <h2 className="text-2xl font-black text-[#083f30]">{title}</h2>
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

const Paragraph = ({ children }: { children: ReactNode }) => <p className="text-[15px] leading-8 text-[#3d4b45]">{children}</p>;

/** Desktop privacy policy (>= 1280px): a readable column with a sticky table of contents. */
export async function DesktopPrivacyPolicy({ backHref }: { backHref: string }) {
  const t = await getTranslations("MobileProfile.privacyPolicy");
  const sections = [1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => ({
    id: `pp-${n}`,
    number: String(n).padStart(2, "0"),
    title: t(`section${n}Title` as never),
  }));
  const [s1, s2, s3, s4, s5, s6, s7, s8, s9] = sections;

  return (
    <div className="lsd lsd-shop-bg hidden pb-20 xl:block">
      <section className="lsd-container pt-6">
        <div className="lsd-hero-bg overflow-hidden rounded-[36px] px-12 py-12 text-white">
          <Reveal className="max-w-3xl space-y-4">
            <a href={backHref} className="inline-flex items-center gap-2 text-sm text-white/60 transition hover:text-[#eacb7f]">
              <ArrowLeft size={15} className="rotate-180 ltr:rotate-0" />
              {t("title")}
            </a>
            <span className="block text-[10px] font-bold tracking-[0.5em] text-[#eacb7f]">PRIVACY</span>
            <div role="heading" aria-level={1} className="lsd-gold-text text-[40px] font-black leading-tight">{t("title")}</div>
            <p className="text-base leading-8 text-white/75">{t("intro")}</p>
          </Reveal>
        </div>
      </section>

      <div className="lsd-container mt-12 grid grid-cols-[280px_1fr] items-start gap-14">
        {/* Table of contents */}
        <nav className="sticky top-28 rounded-[24px] bg-white p-4 ring-1 ring-[#e7dcc4]">
          <ol className="space-y-0.5">
            {sections.map((section) => (
              <li key={section.id}>
                <a
                  href={`#${section.id}`}
                  className="flex items-baseline gap-3 rounded-full px-4 py-2.5 text-sm text-[#3d4b45] transition hover:bg-[#f6f1e6] hover:text-[#083f30]"
                >
                  <span className="font-mono text-xs font-bold text-[#c9a55a]">{section.number}</span>
                  <span className="leading-6">{section.title}</span>
                </a>
              </li>
            ))}
          </ol>
        </nav>

        {/* The document */}
        <article className="max-w-[780px] space-y-10 rounded-[30px] bg-white px-12 py-12 ring-1 ring-[#e7dcc4]">
          <Section {...s1}>
            <h3 className="text-base font-bold text-[#0e1a16]">{t("section1aTitle")}</h3>
            <Bullets items={t("section1aItems")} />
            <h3 className="pt-2 text-base font-bold text-[#0e1a16]">{t("section1bTitle")}</h3>
            <Bullets items={t("section1bItems")} />
          </Section>

          <Section {...s2}>
            <Bullets items={t("section2Items")} />
            <Paragraph>{t("section2Note")}</Paragraph>
          </Section>

          <Section {...s3}>
            <Bullets items={t("section3Items")} />
          </Section>

          <Section {...s4}>
            <Paragraph>{t("section4Body")}</Paragraph>
          </Section>

          <Section {...s5}>
            <Paragraph>{t("section5Body")}</Paragraph>
          </Section>

          <Section {...s6}>
            <Paragraph>{t("section6HowToRequest")}</Paragraph>
            <div className="divide-y divide-[#efe7d5] overflow-hidden rounded-[18px] ring-1 ring-[#eadfc6]">
              {(
                [
                  ["section6WhatHappensLabel", "section6WhatHappensValue"],
                  ["section6WhatMayBeKeptLabel", "section6WhatMayBeKeptValue"],
                  ["section6TimeframeLabel", "section6TimeframeValue"],
                ] as const
              ).map(([label, value]) => (
                <div key={label} className="grid grid-cols-[200px_1fr] gap-6 bg-[#fbf8f1] px-6 py-4 text-sm leading-7">
                  <span className="font-bold text-[#083f30]">{t(label)}</span>
                  <span className="text-[#3d4b45]">{t(value)}</span>
                </div>
              ))}
            </div>
            <Paragraph>{t("section6RightsNote")}</Paragraph>
          </Section>

          <Section {...s7}>
            <Paragraph>{t("section7Body")}</Paragraph>
          </Section>

          <Section {...s8}>
            <Paragraph>{t("section8Body")}</Paragraph>
          </Section>

          <Section {...s9}>
            <Paragraph>{t("section9Body")}</Paragraph>
          </Section>

          <p className="rounded-[18px] bg-[#fbf6ea] px-6 py-4 text-center text-sm text-[#6b6150] ring-1 ring-[#eadfc6]">{t("contact")}</p>
        </article>
      </div>
    </div>
  );
}