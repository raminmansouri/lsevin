"use client";

import { useState, useTransition } from "react";
import { ArrowRight, History, Search, SlidersHorizontal, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { Link, useRouter } from "@/i18n/navigation";

import { clearRecentViewsAction } from "../../../server/actions/customer";
import type { DestinationCard as DestinationData, EditorialModule, TourCard as TourCardData } from "../../../server/platform/catalog";
import type { TaxonomyTerm } from "../../../server/actions/customer/state";
import { ToursErrorAlert, type ToursActionError } from "../../shared/error-alert";
import { LocalizedText } from "../../shared/localized-text";
import { TourImage } from "../common";
import { DestinationCard } from "../destination-card";
import { TourCard } from "../tour-card";
import { RankedTours, type TourRankings } from "./ranked-tours";
import { DesktopToursHome } from "@/features/web-desktop/tours/DesktopToursHome";

function SectionHeader({ title, href, seeAll, id }: { title: string; href?: string; seeAll?: string; id: string }) {
  const Arrow = ArrowRight; // mirrored in RTL by globals.css
  return (
    <div className="mb-3 flex items-center justify-between gap-3 px-4 sm:px-6">
      <h2 id={id} className="text-lg font-bold text-slate-900">
        {title}
      </h2>
      {href && seeAll ? (
        <Link href={href} className="inline-flex min-h-11 items-center gap-1 rounded-full px-2 text-sm font-medium text-emerald-700 hover:bg-emerald-50 focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:outline-none">
          {seeAll}
          <Arrow className="size-4" aria-hidden="true" />
        </Link>
      ) : null}
    </div>
  );
}

function Rail({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <div role="list" aria-label={label} className="flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:none] sm:px-6">
      {children}
    </div>
  );
}

/** CC BY-SA requires the visible credit (public/images/tours/CREDITS.json). */
const HOME_HERO = {
  src: "/images/tours/isfahan-naqsh-e-jahan.webp",
  credit: "Amir Pashaei · CC BY-SA 4.0",
  source: "https://commons.wikimedia.org/wiki/File:Naqsh-e_Jahan_Square_from_the_gheisariye_Vault.jpg",
};

export function HeroSearch({ defaultValue = "", compact = false, luxe = false }: { defaultValue?: string; compact?: boolean; luxe?: boolean }) {
  const t = useTranslations("TourApp.home");
  const router = useRouter();
  const [q, setQ] = useState(defaultValue);
  return (
    <form
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        router.push(q.trim() ? `/tours/explore?q=${encodeURIComponent(q.trim())}` : "/tours/explore");
      }}
      className={compact ? "" : "mt-5"}
    >
      <div
        className={
          luxe
            ? "flex items-center gap-2 rounded-full bg-white p-1.5 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.6)] ring-1 ring-[#eacb7f]/50"
            : "flex items-center gap-2 rounded-2xl bg-white p-1.5 shadow-lg ring-1 ring-slate-200"
        }
      >
        <label htmlFor="tours-hero-search" className="sr-only">
          {t("searchLabel")}
        </label>
        <Search className={luxe ? "ms-3 size-5 shrink-0 text-[#b08a3c]" : "ms-2 size-5 shrink-0 text-slate-400"} aria-hidden="true" />
        <input
          id="tours-hero-search"
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t("searchPlaceholder")}
          className="min-h-11 min-w-0 flex-1 bg-transparent text-[15px] text-slate-900 outline-none placeholder:text-slate-400"
          enterKeyHint="search"
        />
        <button
          type="submit"
          aria-label={t("search")}
          data-testid="hero-search-submit"
          className={
            luxe
              ? "inline-flex size-11 shrink-0 items-center justify-center gap-2 rounded-full bg-[#083f30] text-sm font-bold text-[#eacb7f] shadow-[0_10px_30px_-10px_rgba(8,63,48,0.8)] transition hover:bg-[#0a5a44] focus-visible:ring-2 focus-visible:ring-[#eacb7f] focus-visible:outline-none sm:w-auto sm:px-5"
              : "sr-only"
          }
        >
          {luxe ? <Search className="size-4" aria-hidden="true" /> : null}
          <span className={luxe ? "hidden sm:inline" : undefined}>{t("search")}</span>
        </button>
        <Link
          href="/tours/explore?filters=1"
          aria-label={t("filters")}
          data-testid="hero-filters"
          className={
            luxe
              ? "flex size-11 shrink-0 items-center justify-center rounded-full bg-[#fbf6ea] text-[#083f30] ring-1 ring-[#eacb7f]/50 transition hover:bg-[#f4ead0] focus-visible:ring-2 focus-visible:ring-[#eacb7f] focus-visible:outline-none"
              : "flex size-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800 hover:bg-emerald-100 focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:outline-none"
          }
        >
          <SlidersHorizontal className="size-5" aria-hidden="true" />
        </Link>
      </div>
    </form>
  );
}

export function ToursHome({
  recent,
  discovery,
  destinations,
  offers,
  modules,
  categories,
  savedIds,
  rankings,
}: {
  recent: TourCardData[];
  discovery: TourCardData[];
  destinations: DestinationData[];
  offers: TourCardData[];
  modules: EditorialModule[];
  categories: TaxonomyTerm[];
  savedIds: string[];
  rankings: TourRankings;
}) {
  const t = useTranslations("TourApp");
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<ToursActionError | null>(null);
  const saved = new Set(savedIds);
  const hero = modules.find((m) => m.kind === "hero");
  const collections = modules.filter((m) => m.kind === "collection" || m.kind === "offers");
  const heroImage = hero?.imageUrl ?? HOME_HERO.src;
  const titleWords = t("home.heroTitle").split(" ");
  const nothing = recent.length === 0 && discovery.length === 0 && destinations.length === 0 && offers.length === 0 && collections.length === 0;

  function clearHistory() {
    setError(null);
    start(async () => {
      const res = await clearRecentViewsAction().catch(() => null);
      if (!res || !res.ok) {
        setError(res && !res.ok ? res.error : { kind: "infrastructure", code: "service_unavailable" });
        return;
      }
      toast.success(t("home.recent.cleared"));
      router.refresh();
    });
  }

  return (
    <>
    <div className="space-y-8 pb-6 xl:hidden">
      <section
        aria-labelledby="tours-hero-title"
        className="relative isolate overflow-hidden px-4 pt-6 pb-8 text-white sm:px-8 md:mx-6 md:mt-4 md:rounded-[2rem] md:pb-12"
      >
        <TourImage src={heroImage} alt="" className="absolute inset-0 -z-20 h-full w-full" eager />
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(4,33,26,0.5)_0%,rgba(4,33,26,0.7)_45%,rgba(4,33,26,0.96)_100%)]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-8 top-14 bottom-0 -z-10 hidden rounded-t-[999px] border border-b-0 border-[#eacb7f]/35 md:block"
        />

        <span className="block text-[11px] font-semibold tracking-[0.35em] text-[#eacb7f]" dir="ltr">
          L SEVIN TOURS
        </span>

        <div className="mt-8 text-center md:mt-12">
          <h1 id="tours-hero-title" className="font-display text-[44px] leading-[1.05] text-balance drop-shadow md:text-[60px]">
            {hero?.title ? (
              <LocalizedText text={hero.title} badge={false} />
            ) : (
              <>
                {titleWords[0]} <span className="text-[#eacb7f]">{titleWords.slice(1).join(" ")}</span>
              </>
            )}
          </h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-[#d9e4df]">
            {hero?.subtitle ? <LocalizedText text={hero.subtitle} badge={false} /> : t("home.heroSubtitle")}
          </p>
          {hero?.isSponsored ? <span className="mt-2 inline-block rounded-full bg-black/40 px-2 py-0.5 text-[11px] text-white">{t("home.sponsored")}</span> : null}
        </div>

        <div className="mx-auto mt-6 max-w-xl">
          <HeroSearch compact luxe />
        </div>

        {categories.length > 0 ? (
          <nav aria-label={t("home.categories")} className="mt-5">
            <ul className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:justify-center sm:px-0">
              {categories.map((c) => (
                <li key={c.code} className="shrink-0">
                  <Link
                    href={`/tours/explore?category=${c.code}`}
                    className="flex min-h-10 items-center rounded-full border border-white/20 bg-white/10 px-4 text-sm text-[#f4ead0] backdrop-blur-md transition hover:border-[#eacb7f]/60 hover:text-[#eacb7f] focus-visible:ring-2 focus-visible:ring-[#eacb7f] focus-visible:outline-none"
                  >
                    {c.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ) : null}

        {hero?.imageUrl ? null : (
          <p className="mt-5 text-center text-[10px] text-white/50" data-testid="tours-hero-credit">
            {t("home.heroPhotoPlace")} ·{" "}
            <a href={HOME_HERO.source} target="_blank" rel="noopener noreferrer" className="hover:underline">
              {HOME_HERO.credit}
            </a>
          </p>
        )}
      </section>

      <ToursErrorAlert error={error} className="mx-4 sm:mx-6" />

      <RankedTours rankings={rankings} categories={categories} saved={saved} variant="mobile" />

      {recent.length > 0 ? (
        <section aria-labelledby="recent-title" data-testid="recently-viewed" data-section-order="1">
          <div className="mb-3 flex items-center justify-between gap-3 px-4 sm:px-6">
            <h2 id="recent-title" className="flex items-center gap-2 text-lg font-bold text-slate-900">
              <History className="size-5 text-emerald-700" aria-hidden="true" />
              {t("home.recent.title")}
            </h2>
            <button
              type="button"
              onClick={clearHistory}
              disabled={pending}
              data-testid="clear-recent"
              className="inline-flex min-h-11 items-center gap-1 rounded-full px-3 text-sm font-medium text-slate-600 hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:outline-none disabled:opacity-50"
            >
              <Trash2 className="size-4" aria-hidden="true" />
              {t("home.recent.clear")}
            </button>
          </div>
          <Rail label={t("home.recent.title")}>
            {recent.map((card) => (
              <div role="listitem" key={card.id} className="w-[78%] max-w-xs shrink-0 snap-start sm:w-72">
                <TourCard card={card} saved={saved.has(card.id)} testId="recent-card" />
              </div>
            ))}
          </Rail>
        </section>
      ) : null}

      {discovery.length > 0 ? (
        <section aria-labelledby="discover-title" data-testid="discovery" data-section-order={recent.length > 0 ? "2" : "1"}>
          <div className="mb-3 px-4 sm:px-6">
            <h2 id="discover-title" className="text-lg font-bold text-slate-900">
              {t("home.discover.title")}
            </h2>
            <p className="text-sm text-slate-500">{t("home.discover.subtitle")}</p>
          </div>
          <Rail label={t("home.discover.title")}>
            {discovery.map((card) => (
              <div role="listitem" key={card.id} className="w-[78%] max-w-xs shrink-0 snap-start sm:w-72">
                <TourCard card={card} saved={saved.has(card.id)} />
              </div>
            ))}
          </Rail>
        </section>
      ) : null}

      {destinations.length > 0 ? (
        <section aria-labelledby="popular-title" data-testid="popular-destinations">
          <SectionHeader id="popular-title" title={t("home.popular.title")} href="/tours/destinations" seeAll={t("home.popular.seeAll")} />
          <Rail label={t("home.popular.title")}>
            {destinations.map((d) => (
              <div role="listitem" key={d.id} className="w-40 shrink-0 snap-start sm:w-48">
                <DestinationCard destination={d} />
              </div>
            ))}
          </Rail>
        </section>
      ) : null}

      {offers.length > 0 ? (
        <section aria-labelledby="offers-title" data-testid="best-offers">
          <SectionHeader id="offers-title" title={t("home.offers.title")} />
          <div className="grid gap-3 px-4 sm:grid-cols-2 sm:px-6 lg:grid-cols-3">
            {offers.slice(0, 6).map((card) => (
              <TourCard key={card.id} card={card} saved={saved.has(card.id)} layout="wide" testId="offer-card" />
            ))}
          </div>
        </section>
      ) : null}

      {collections.map((m) => (
        <section key={m.id} aria-labelledby={`module-${m.id}`} data-testid="editorial-module">
          <div className="mb-3 px-4 sm:px-6">
            <h2 id={`module-${m.id}`} className="text-lg font-bold text-slate-900">
              <LocalizedText text={m.title} badge={false} placeholder={m.code} />
            </h2>
            {m.subtitle ? <LocalizedText text={m.subtitle} as="p" className="text-sm text-slate-500" badge={false} /> : null}
            {m.isSponsored ? <span className="text-[11px] text-slate-500">{t("home.sponsored")}</span> : null}
          </div>
          <Rail label={m.title?.value ?? m.code}>
            {m.tours.map((card) => (
              <div role="listitem" key={card.id} className="w-[78%] max-w-xs shrink-0 snap-start sm:w-72">
                <TourCard card={card} saved={saved.has(card.id)} />
              </div>
            ))}
          </Rail>
        </section>
      ))}

      {nothing ? (
        <div className="mx-4 rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center sm:mx-6" data-testid="home-empty">
          <h2 className="text-lg font-bold text-slate-900">{t("home.empty.title")}</h2>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-600">{t("home.empty.body")}</p>
        </div>
      ) : null}
    </div>

    <DesktopToursHome
      recent={recent}
      discovery={discovery}
      destinations={destinations}
      offers={offers}
      collections={collections}
      categories={categories}
      saved={saved}
      rankings={rankings}
      hero={hero}
      heroImage={heroImage}
      heroCredit={hero?.imageUrl ? null : { credit: HOME_HERO.credit, source: HOME_HERO.source }}
      nothing={nothing}
      error={error}
      pending={pending}
      onClearHistory={clearHistory}
    />
    </>
  );
}
