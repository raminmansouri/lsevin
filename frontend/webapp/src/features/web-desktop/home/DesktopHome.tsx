import { ArrowLeft } from "lucide-react";
import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";

import type { HomeCategory } from "@/features/home/api/server/get-home-page";
import { Link } from "@/i18n/navigation";

import { Reveal } from "../components/motion";
import { DesktopCategories } from "./DesktopCategories";
import { DesktopHero } from "./DesktopHero";

/** The home page's existing sections, passed in so nothing is lost while each gets its desktop design. */
export type DesktopHomeSlots = {
  sponsoredTop: ReactNode;
  heroBanner: ReactNode;
  featured: ReactNode;
  nativeAd: ReactNode;
  trending: ReactNode;
  nearby: ReactNode;
  trusted: ReactNode;
  packages: ReactNode;
  loyalty: ReactNode;
  sponsoredBottom: ReactNode;
};

/** Desktop home (>= 1280px). The mobile home renders below 1280px and is untouched. */
export async function DesktopHome({
  locale,
  categories,
  specialPackagesCount,
  slots,
}: {
  locale: string;
  categories: HomeCategory[];
  specialPackagesCount: number;
  slots: DesktopHomeSlots;
}) {
  const t = await getTranslations({ locale, namespace: "Home" });

  return (
    <div className="lsd hidden xl:block">
      <DesktopHero locale={locale} categories={categories} specialPackagesCount={specialPackagesCount} />

      <Block>{slots.sponsoredTop}</Block>
      <Block>{slots.heroBanner}</Block>

      <DesktopCategories locale={locale} categories={categories} />

      <Rail title={t("featured.title")} subtitle={t("featured.subtitle")} href="/n/app/mobile/featured" seeAll={t("common.seeAll")}>
        {slots.featured}
      </Rail>

      <Block>{slots.nativeAd}</Block>

      <Rail title={t("trending.title")} subtitle={t("trending.subtitle")}>
        {slots.trending}
      </Rail>

      <Block>{slots.nearby}</Block>

      <Rail title={t("trusted.title")} subtitle={t("trusted.subtitle")} href="/n/app/mobile/providers" seeAll={t("common.seeAll")}>
        {slots.trusted}
      </Rail>

      <Block>{slots.packages}</Block>
      <Block>{slots.loyalty}</Block>
      <Block>{slots.sponsoredBottom}</Block>
    </div>
  );
}

/** A full-width section that fades in; the mobile section's own side padding is removed. */
function Block({ children }: { children: ReactNode }) {
  return (
    <Reveal className="lsd-container py-8 [&>section]:px-0 [&>section]:pb-0">
      {children}
    </Reveal>
  );
}

/** A titled row of cards that scrolls sideways, with the luxury section heading. */
function Rail({
  title,
  subtitle,
  href,
  seeAll,
  children,
}: {
  title: string;
  subtitle?: string;
  href?: string;
  seeAll?: string;
  children: ReactNode;
}) {
  return (
    <section className="lsd-container py-20">
      <Reveal className="mb-10 flex items-end justify-between gap-8">
        <div>
          <h2 className="lsd-heading text-5xl font-black text-[#0e1a16]">{title}</h2>
          {subtitle ? <p className="mt-6 text-lg text-[#56675f]">{subtitle}</p> : null}
        </div>
        {href && seeAll ? (
          <Link
            href={href}
            className="group inline-flex shrink-0 items-center gap-2 text-[15px] font-bold text-[#083f30] transition hover:text-[#8c6b2c]"
          >
            {seeAll}
            <ArrowLeft size={18} className="transition-transform duration-500 group-hover:-translate-x-1.5 ltr:rotate-180" />
          </Link>
        ) : null}
      </Reveal>
      <Reveal delay={150} className="hide-scrollbar -mx-2 flex gap-6 overflow-x-auto px-2 pb-6 [&>*]:shrink-0">
        {children}
      </Reveal>
    </section>
  );
}