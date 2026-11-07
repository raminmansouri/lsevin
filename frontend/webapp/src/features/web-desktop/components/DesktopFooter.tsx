import Image from "next/image";
import { useTranslations } from "next-intl";

import type { FooterPageLink, SitePageSlug } from "@/features/site-content/types";
import { EnamadSeal } from "@/components/trust/enamad-seal";
import { Link } from "@/i18n/navigation";

import { BackToTop, Reveal } from "./motion";



const COMPANY_PAGES: readonly SitePageSlug[] = ["about-us", "services", "contact-us", "licenses-certifications"];

/**
 * Desktop-only footer (>= 1280px). `pages` are the published editorial pages
 * (admin → Editorial); without them the footer keeps its built-in links.
 */
export function DesktopFooter({ pages = [] }: { pages?: FooterPageLink[] }) {
  const t = useTranslations("Footer");
  const year = new Date().getFullYear();
  const toLink = (page: FooterPageLink) => ({ href: `/${page.slug}`, label: page.title });
  const published = new Set(pages.map((page) => page.slug));
  const companyPages = pages.filter((page) => COMPANY_PAGES.includes(page.slug)).map(toLink);
  const policyPages = pages.filter((page) => !COMPANY_PAGES.includes(page.slug)).map(toLink);

  const columns = [
    {
      title: t("columns.explore.title"),
      links: [
        { href: "/categories", label: t("columns.explore.links.categories") },
        { href: "/map", label: t("columns.explore.links.map") },
        { href: "/packages", label: t("columns.explore.links.packages") },
        { href: "/providers", label: t("columns.explore.links.providers") },
      ],
    },
    {
      title: t("columns.company.title"),
      links: [
        ...companyPages,
        ...(published.has("contact-us") ? [] : [{ href: "/n/app/mobile/support", label: t("columns.company.links.contact") }]),
      ],
    },
    {
      title: t("columns.policies.title"),
      links: published.has("privacy-policy")
        ? policyPages
        : [...policyPages, { href: "/privacy-policy", label: t("columns.company.links.privacy") }],
    },
  ];

  return (
    <footer className="lsd lsd-aurora relative hidden overflow-hidden xl:block">
      {/* Gold horizon with the mark as a seal */}
      <div className="relative flex items-center justify-center">
        <span className="absolute inset-x-0 top-1/2 h-px bg-gradient-to-r from-transparent via-[#eacb7f]/60 to-transparent" />
        <span className="lsd-glass relative grid h-14 w-14 place-items-center rounded-full">
          <Image src="/brand/lsevin-mark-reversed.png" alt="" width={22} height={31} />
        </span>
      </div>

      <div className="lsd-container relative grid grid-cols-[1.5fr_1fr_1fr_1fr] gap-14 pb-14 pt-14">
        <Reveal className="space-y-5">
          <Link href="/n/app/mobile/home" className="flex w-fit items-center gap-3">
            <Image src="/brand/lsevin-mark-reversed.png" alt="" width={30} height={42} />
            <Image src="/brand/lsevin-wordmark.png" alt="L SEVIN" width={104} height={29} />
          </Link>
          <p className="max-w-sm text-base leading-8 text-white/75">{t("tagline")}</p>
          {/* Inside the brand column, not as a fifth grid item: the grid has four columns, and an
              extra item wrapped onto its own row (why the seal was taken out on 10-29). */}
          <EnamadSeal
            alt={t("enamadAlt")}
            className="block w-fit rounded-2xl bg-white p-2 transition hover:-translate-y-0.5"
            imgClassName="h-[96px] w-auto"
          />
        </Reveal>

        {columns.map((column, index) => (
          <Reveal key={column.title} delay={(index + 1) * 100} className="space-y-5">
            <h3 className="text-base font-bold text-[#eacb7f]">{column.title}</h3>
            <nav className="flex flex-col items-start gap-3.5">
              {column.links.map((link) => (
                <Link key={link.href} href={link.href} className="lsd-footer-link text-base text-[#eef3f1]">
                  {link.label}
                </Link>
              ))}
            </nav>
          </Reveal>
        ))}


      </div>

      <div className="relative border-t border-[#eacb7f]/15">
        <div className="lsd-container flex items-center justify-between py-5 text-sm text-white/65">
          <span>{t("copyright", { year })}</span>
          <BackToTop label="↑" />
        </div>
      </div>
    </footer>
  );
}