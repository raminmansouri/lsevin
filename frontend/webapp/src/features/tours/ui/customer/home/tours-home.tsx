"use client";

import { useState, useTransition } from "react";
import { ArrowLeft, ArrowRight, History, Search, SlidersHorizontal, Trash2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";

import { Link, useRouter } from "@/i18n/navigation";

import { directionOf } from "../../../domain/content";
import { clearRecentViewsAction } from "../../../server/actions/customer";
import type { DestinationCard as DestinationData, EditorialModule, TourCard as TourCardData } from "../../../server/platform/catalog";
import type { TaxonomyTerm } from "../../../server/actions/customer/state";
import { ToursErrorAlert, type ToursActionError } from "../../shared/error-alert";
import { LocalizedText } from "../../shared/localized-text";
import { TourImage } from "../common";
import { DestinationCard } from "../destination-card";
import { TourCard } from "../tour-card";

function SectionHeader({ title, href, seeAll, id }: { title: string; href?: string; seeAll?: string; id: string }) {
  const rtl = directionOf(useLocale()) === "rtl";
  const Arrow = rtl ? ArrowLeft : ArrowRight;
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

export function HeroSearch({ defaultValue = "", compact = false }: { defaultValue?: string; compact?: boolean }) {
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
      <div className="flex items-center gap-2 rounded-2xl bg-white p-1.5 shadow-lg ring-1 ring-slate-200">
        <label htmlFor="tours-hero-search" className="sr-only">
          {t("searchLabel")}
        </label>
        <Search className="ms-2 size-5 shrink-0 text-slate-400" aria-hidden="true" />
        <input
          id="tours-hero-search"
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t("searchPlaceholder")}
          className="min-h-11 min-w-0 flex-1 bg-transparent text-[15px] text-slate-900 outline-none placeholder:text-slate-400"
          enterKeyHint="search"
        />
        <button type="submit" className="sr-only">
          {t("search")}
        </button>
        <Link
          href="/tours/explore?filters=1"
          aria-label={t("filters")}
          data-testid="hero-filters"
          className="flex size-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800 hover:bg-emerald-100 focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:outline-none"
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
}: {
  recent: TourCardData[];
  discovery: TourCardData[];
  destinations: DestinationData[];
  offers: TourCardData[];
  modules: EditorialModule[];
  categories: TaxonomyTerm[];
  savedIds: string[];
}) {
  const t = useTranslations("TourApp");
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<ToursActionError | null>(null);
  const saved = new Set(savedIds);
  const hero = modules.find((m) => m.kind === "hero");
  const collections = modules.filter((m) => m.kind === "collection" || m.kind === "offers");
  // Without a published editorial hero, use a fixed licensed photo rather than whatever destination comes first.
  const heroImage = hero?.imageUrl ?? HOME_HERO.src;
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
    <div className="space-y-8 pb-6">
      {/* Hero (C-010): admin hero module when published, otherwise a licensed photo of Naqsh-e Jahan Square. */}
      <section aria-labelledby="tours-hero-title" className="relative overflow-hidden md:mx-6 md:mt-4 md:rounded-3xl">
        <TourImage src={heroImage} alt="" className="absolute inset-0 h-full w-full" eager />
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-950/70 via-emerald-900/40 to-slate-50 md:to-emerald-950/30" />
        <div className="relative px-4 pt-10 pb-6 sm:px-8 md:pb-10">
          <h1 id="tours-hero-title" className="max-w-md text-3xl leading-tight font-extrabold text-white drop-shadow sm:text-4xl">
            {hero?.title ? <LocalizedText text={hero.title} badge={false} /> : t("home.heroTitle")}
          </h1>
          <p className="mt-2 max-w-md text-sm text-white/90">
            {hero?.subtitle ? <LocalizedText text={hero.subtitle} badge={false} /> : t("home.heroSubtitle")}
          </p>
          {hero?.isSponsored ? <span className="mt-2 inline-block rounded-full bg-black/40 px-2 py-0.5 text-[11px] text-white">{t("home.sponsored")}</span> : null}
          <div className="max-w-xl">
            <HeroSearch />
          </div>
          {hero?.imageUrl ? null : (
            <p className="mt-2 text-end text-[10px] text-slate-500" data-testid="tours-hero-credit">
              {t("home.heroPhotoPlace")} ·{" "}
              <a href={HOME_HERO.source} target="_blank" rel="noopener noreferrer" className="hover:underline">
                {HOME_HERO.credit}
              </a>
            </p>
          )}
        </div>
      </section>

      {categories.length > 0 ? (
        <nav aria-label={t("home.categories")} className="-mt-4">
          <ul className="flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:px-6">
            {categories.map((c) => (
              <li key={c.code} className="shrink-0">
                <Link
                  href={`/tours/explore?category=${c.code}`}
                  className="flex min-h-11 items-center rounded-full border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 shadow-sm hover:border-emerald-300 hover:text-emerald-800 focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:outline-none"
                >
                  {c.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}

      <ToursErrorAlert error={error} className="mx-4 sm:mx-6" />

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
      ) : discovery.length > 0 ? (
        <section aria-labelledby="discover-title" data-testid="discovery" data-section-order="1">
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
  );
}
