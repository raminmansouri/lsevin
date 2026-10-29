"use client";

import { ArrowLeft, History, MapPin, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

import type { TaxonomyTerm } from "@/features/tours/server/actions/customer/state";
import type { DestinationCard as DestinationData, EditorialModule, TourCard as TourCardData } from "@/features/tours/server/platform/catalog";
import { TourImage } from "@/features/tours/ui/customer/common";
import { HeroSearch } from "@/features/tours/ui/customer/home/tours-home";
import { ToursErrorAlert, type ToursActionError } from "@/features/tours/ui/shared/error-alert";
import { LocalizedText } from "@/features/tours/ui/shared/localized-text";
import { TourCard } from "@/features/tours/ui/customer/tour-card";
import { Link } from "@/i18n/navigation";

import { Reveal } from "../components/motion";

const TILTS = ["-3deg", "2deg", "-1.5deg", "3deg", "-2.5deg", "1.5deg"];

function Heading({ title, subtitle, action }: { title: ReactNode; subtitle?: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-7 flex items-end justify-between gap-6">
      <div>
        <h2 className="text-[28px] font-black text-[#0e1a16]">{title}</h2>
        {subtitle ? <div className="mt-1 text-sm text-[#6b6150]">{subtitle}</div> : null}
      </div>
      {action}
    </div>
  );
}

function SeeAll({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="group inline-flex shrink-0 items-center gap-1.5 text-sm font-bold text-[#083f30] transition hover:text-[#8c6b2c]">
      {label}
      <ArrowLeft size={15} className="transition-transform group-hover:-translate-x-1 ltr:rotate-180" />
    </Link>
  );
}

/** Desktop Tours home (>= 1280px). Data and the clear-history action come from ToursHome. */
export function DesktopToursHome({
  recent,
  discovery,
  destinations,
  offers,
  collections,
  categories,
  saved,
  hero,
  heroImage,
  heroCredit,
  nothing,
  error,
  pending,
  onClearHistory,
}: {
  recent: TourCardData[];
  discovery: TourCardData[];
  destinations: DestinationData[];
  offers: TourCardData[];
  collections: EditorialModule[];
  categories: TaxonomyTerm[];
  saved: Set<string>;
  hero: EditorialModule | undefined;
  heroImage: string;
  heroCredit: { credit: string; source: string } | null;
  nothing: boolean;
  error: ToursActionError | null;
  pending: boolean;
  onClearHistory: () => void;
}) {
  const t = useTranslations("TourApp");
  const firstRail = recent.length ? recent : discovery;

  return (
    <div className="lsd hidden bg-[#fbf7ee] pb-20 xl:block">
      {/* Hero */}
      <section className="mx-auto max-w-[1360px] px-6 pt-6">
        <div className="relative h-[560px] overflow-hidden rounded-[40px] bg-[#062a20]">
          <div className="lsd-kenburns absolute inset-0">
            <TourImage src={heroImage} alt="" className="h-full w-full" eager />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-[#04130e] via-[#062a20]/55 to-[#062a20]/10" />
          <div className="absolute inset-x-0 bottom-0 px-14 pb-24">
            <Reveal className="max-w-3xl space-y-4">
              <span className="text-[10px] font-bold tracking-[0.5em] text-[#eacb7f]">L SEVIN JOURNEYS</span>
              <h1 className="lsd-gold-text text-[56px] font-black leading-[1.1]">
                {hero?.title ? <LocalizedText text={hero.title} badge={false} /> : t("home.heroTitle")}
              </h1>
              <p className="max-w-xl text-lg leading-8 text-white/80">
                {hero?.subtitle ? <LocalizedText text={hero.subtitle} badge={false} /> : t("home.heroSubtitle")}
              </p>
              {hero?.isSponsored ? <span className="inline-block rounded-full bg-black/40 px-3 py-1 text-xs text-white">{t("home.sponsored")}</span> : null}
              <div className="max-w-2xl">
                <HeroSearch />
              </div>
            </Reveal>
          </div>
          {heroCredit ? (
            <p className="absolute bottom-4 end-6 text-[10px] text-white/50" data-testid="tours-hero-credit">
              {t("home.heroPhotoPlace")} ·{" "}
              <a href={heroCredit.source} target="_blank" rel="noopener noreferrer" className="hover:underline">
                {heroCredit.credit}
              </a>
            </p>
          ) : null}
        </div>
      </section>

      {/* Categories as stamps, overlapping the hero */}
      {categories.length ? (
        <nav aria-label={t("home.categories")} className="relative z-10 mx-auto -mt-12 max-w-[1360px] px-14">
          <ul className="flex flex-wrap gap-4">
            {categories.map((category, index) => (
              <li key={category.code}>
                <Link href={`/tours/explore?category=${category.code}`} className="group block">
                  <span className="lsd-stamp block" style={{ rotate: index % 2 ? "1.5deg" : "-1.5deg" }}>
                    <span className="flex min-w-[120px] flex-col items-center gap-1 border border-[#eadfc6] bg-[#fbf6ea] px-5 py-3 text-center">
                      <span className="text-[9px] font-bold tracking-[0.3em] text-[#c9a55a]">L SEVIN</span>
                      <span className="text-sm font-black text-[#083f30]">{category.label}</span>
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}

      <div className="mx-auto max-w-[1360px] space-y-20 px-14 pt-14">
        <ToursErrorAlert error={error} />

        {/* Recently viewed, or popular tours */}
        {firstRail.length ? (
          <section data-testid={recent.length ? "recently-viewed" : "discovery"}>
            <Heading
              title={
                recent.length ? (
                  <span className="flex items-center gap-3">
                    <History className="h-6 w-6 text-[#c9a55a]" />
                    {t("home.recent.title")}
                  </span>
                ) : (
                  t("home.discover.title")
                )
              }
              subtitle={recent.length ? null : t("home.discover.subtitle")}
              action={
                recent.length ? (
                  <button
                    type="button"
                    onClick={onClearHistory}
                    disabled={pending}
                    data-testid="clear-recent"
                    className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold text-[#6b6150] ring-1 ring-[#e7dcc4] transition hover:text-[#083f30] disabled:opacity-50"
                  >
                    <Trash2 size={15} />
                    {t("home.recent.clear")}
                  </button>
                ) : null
              }
            />
            <div className="grid grid-cols-4 gap-6">
              {firstRail.slice(0, 8).map((card, index) => (
                <Reveal key={card.id} delay={(index % 4) * 70} className="h-full">
                  <TourCard card={card} saved={saved.has(card.id)} testId={recent.length ? "recent-card" : "tour-card"} className="h-full" />
                </Reveal>
              ))}
            </div>
          </section>
        ) : null}

        {/* Destinations as postcards */}
        {destinations.length ? (
          <section data-testid="popular-destinations">
            <Heading title={t("home.popular.title")} action={<SeeAll href="/tours/destinations" label={t("home.popular.seeAll")} />} />
            <div className="grid grid-cols-6 gap-x-6 gap-y-10 px-2">
              {destinations.map((destination, index) => {
                const name = destination.name?.value ?? destination.slug;
                return (
                  <Reveal key={destination.id} delay={(index % 6) * 60}>
                    <Link href={`/tours/destinations/${destination.slug}`} className="group block" data-testid="destination-card">
                      <span className="lsd-postcard relative block bg-white p-2.5 pb-4" style={{ ["--tilt" as string]: TILTS[index % TILTS.length] }}>
                        <span className="block aspect-[4/5] overflow-hidden bg-[#efe7d5]">
                          {destination.coverUrl ? <TourImage src={destination.coverUrl} alt={destination.coverAlt ?? name} className="h-full w-full" /> : null}
                        </span>
                        <span className="mt-3 block px-1">
                          <span className="block truncate text-base font-black text-[#0e1a16]">{name}</span>
                          <span className="mt-0.5 flex items-center gap-1 text-xs text-[#8a8170]">
                            <MapPin size={11} className="shrink-0 text-[#c9a55a]" />
                            <span className="truncate">{destination.region?.value ?? ""}</span>
                          </span>
                        </span>
                        {/* Push-pin holding the postcard */}
                        <span className="absolute -end-2 -top-2.5 z-10" aria-hidden="true">
                          <span className="block h-5 w-5 rounded-full bg-[radial-gradient(circle_at_35%_30%,#fbeec4,#d6b25e_45%,#8c6b2c)] shadow-[0_5px_7px_-1px_rgba(0,0,0,0.4)] ring-1 ring-black/10" />
                          <span className="absolute left-1/2 top-[17px] h-2 w-2 -translate-x-1/2 rounded-full bg-black/15 blur-[2px]" />
                        </span>
                      </span>
                    </Link>
                  </Reveal>
                );
              })}
            </div>
          </section>
        ) : null}

        {/* Best offers, on a warm champagne band */}
        {offers.length ? (
          <section data-testid="best-offers" className="lsd-champagne-bg rounded-[36px] px-10 py-12 ring-1 ring-[#eacb7f]/60">
            <Heading title={t("home.offers.title")} />
            <div className="grid grid-cols-3 gap-6">
              {offers.slice(0, 6).map((card, index) => (
                <Reveal key={card.id} delay={(index % 3) * 80} className="h-full">
                  <TourCard card={card} saved={saved.has(card.id)} layout="wide" testId="offer-card" className="h-full" />
                </Reveal>
              ))}
            </div>
          </section>
        ) : null}

        {/* Editorial collections */}
        {collections.map((module) => (
          <section key={module.id} data-testid="editorial-module">
            <Heading
              title={<LocalizedText text={module.title} badge={false} placeholder={module.code} />}
              subtitle={
                <>
                  {module.subtitle ? <LocalizedText text={module.subtitle} badge={false} /> : null}
                  {module.isSponsored ? <span className="ms-2 text-[11px]">{t("home.sponsored")}</span> : null}
                </>
              }
            />
            <div className="grid grid-cols-4 gap-6">
              {module.tours.slice(0, 8).map((card, index) => (
                <Reveal key={card.id} delay={(index % 4) * 70} className="h-full">
                  <TourCard card={card} saved={saved.has(card.id)} className="h-full" />
                </Reveal>
              ))}
            </div>
          </section>
        ))}

        {nothing ? (
          <div className="mx-auto max-w-lg rounded-[28px] bg-white px-10 py-14 text-center ring-1 ring-[#e7dcc4]" data-testid="home-empty">
            <h2 className="text-xl font-black text-[#0e1a16]">{t("home.empty.title")}</h2>
            <p className="mt-2 text-sm leading-7 text-[#6b6150]">{t("home.empty.body")}</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}