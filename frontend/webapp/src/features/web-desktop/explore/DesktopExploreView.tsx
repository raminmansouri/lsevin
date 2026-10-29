"use client";

import Image from "next/image";
import { ArrowLeft, BadgeCheck, Clock, Map, MapPin, Search, Sparkles, Star, TrendingUp } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";

import { FavoriteButton } from "@/features/favorites/components/favorite-button";
import { Link, useRouter } from "@/i18n/navigation";
import {
  buildExploreQuery,
  buildMapDiscoveryQuery,
  buildMobilePath,
  buildSearchQuery,
  ExplorePendingOverlay,
  formatPrice,
  mediaUrl,
  navigateSmooth,
} from "@/app/[locale]/n/app/mobile/explore/ExploreClient";
import ExploreFilters from "@/app/[locale]/n/app/mobile/explore/ExploreFilters";
import type {
  ExploreCategory,
  ExploreCurrencyOption,
  ExploreFeaturedProvider,
  ExploreFiltersInput,
  ExploreLanguageOption,
  ExploreProviderType,
  ExploreSponsoredProvider,
  ExploreTrendingService,
} from "@/app/[locale]/n/app/mobile/explore/explore.data";

import { AnimatedWords, Magnetic, Reveal, Tilt } from "../components/motion";

type Props = {
  customerId: string | null;
  categories: ExploreCategory[];
  providerTypes: ExploreProviderType[];
  featuredProviders: ExploreFeaturedProvider[];
  trendingServices: ExploreTrendingService[];
  sponsoredProviders: ExploreSponsoredProvider[];
  availableLanguages: ExploreLanguageOption[];
  availableCurrencies: ExploreCurrencyOption[];
  locale: string;
  filters: ExploreFiltersInput;
};


function plainText(value?: string | null): string {
  const raw = (value ?? "").trim();
  if (!raw.startsWith("{")) return raw;
  try {
    const walk = (node: any): string => node?.text ?? (Array.isArray(node?.children) ? node.children.map(walk).join(" ") : "");
    return walk(JSON.parse(raw)?.root).replace(/\s+/g, " ").trim();
  } catch {
    return "";
  }
}

function SectionTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <Reveal className="mb-10">
      <h2 className="lsd-heading text-4xl font-black text-[#0e1a16]">{title}</h2>
      {subtitle ? <p className="mt-6 text-lg text-[#56675f]">{subtitle}</p> : null}
    </Reveal>
  );
}

/** Desktop explore (>= 1280px): same data and URL filters as the mobile page, new layout. */
export function DesktopExploreView({
  categories,
  providerTypes,
  featuredProviders,
  trendingServices,
  sponsoredProviders,
  availableLanguages,
  locale,
  filters,
}: Props) {
  const t = useTranslations("Explore");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  // Optimistic selection, so the chosen chip lights up before the server answers.
  const [categoryId, setCategoryId] = useState(filters.categoryId ?? "all");
  const [providerTypeId, setProviderTypeId] = useState(filters.providerTypeId ?? "all");
  const number = (value: number, digits = 0) => new Intl.NumberFormat(locale, { maximumFractionDigits: digits }).format(value);

  const applyCategory = (id: string) => {
    setCategoryId(id);
    navigateSmooth(startTransition, router, buildExploreQuery({ ...filters, categoryId: id === "all" ? null : id }));
  };
  const applyProviderType = (id: string) => {
    const next = providerTypeId === id ? "all" : id;
    setProviderTypeId(next);
    navigateSmooth(startTransition, router, buildExploreQuery({ ...filters, providerTypeId: next === "all" ? null : next }));
  };

  const hasFilters =
    Boolean(filters.categoryId || filters.providerTypeId || filters.countryCode || filters.cityCode || filters.currencyCode) ||
    filters.verifiedOnly ||
    filters.minRating > 0 ||
    filters.languages.length > 0 ||
    filters.responseTime !== "any";

  return (
    <div className="lsd hidden pb-16 xl:block">
      {isPending ? <ExplorePendingOverlay /> : null}

      {/* Editorial header */}
      <section className="lsd-container pt-6">
        <div className="lsd-hero-bg relative overflow-hidden rounded-[44px] px-16 py-16 text-white">
          <Image
            src="/brand/lsevin-mark-reversed.png"
            alt=""
            aria-hidden="true"
            width={320}
            height={452}
            className="lsd-mark-bg -end-10 -top-16"
          />
          <div className="relative max-w-3xl space-y-6">
            <div role="heading" aria-level={1} className="text-[56px] font-black leading-[1.2]">
              <AnimatedWords text={t("header.title")} />
            </div>
            <Reveal delay={300}>
              <p className="text-lg leading-8 text-white/75">{t("header.subtitle")}</p>
            </Reveal>
            <Reveal delay={450} className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => router.push(buildSearchQuery(filters))}
                className="group flex h-16 flex-1 items-center gap-4 rounded-full bg-white/95 pe-2 ps-6 text-start text-[#56675f] shadow-[0_30px_70px_-25px_rgba(0,0,0,0.6)] transition hover:bg-white"
              >
                <Search size={21} className="shrink-0 text-[#083f30]" />
                <span className="flex-1 truncate">{filters.q || t("search.placeholder")}</span>
                <span className="lsd-btn lsd-btn-green h-12 w-12 !px-0">
                  <ArrowLeft size={18} className="ltr:rotate-180" />
                </span>
              </button>
              <Magnetic>
                <button
                  type="button"
                  onClick={() => router.push(buildMapDiscoveryQuery(filters))}
                  aria-label={t("filters.location")}
                  className="lsd-btn lsd-btn-gold h-16 w-16 !px-0"
                >
                  <Map size={22} />
                </button>
              </Magnetic>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Sticky toolbar: categories + filters */}
      <div className="sticky top-24 z-20 mt-8">
        <div className="lsd-container">
          <div className="flex items-center gap-4 rounded-full bg-white/90 p-2 shadow-[0_18px_40px_-28px_rgba(6,42,32,0.5)] ring-1 ring-[#dce4e0] backdrop-blur-md">
            <div className="hide-scrollbar flex min-w-0 flex-1 gap-1 overflow-x-auto">
              {[
                ...(categories.some((category) => category.id === "all") ? [] : [{ id: "all", label: t("filters.any"), count: 0 }]),
                ...categories,
              ].map((category) => {
                const active = categoryId === category.id;
                return (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => applyCategory(category.id)}
                    className={`flex shrink-0 items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold transition ${
                      active ? "bg-[#083f30] text-[#eacb7f]" : "text-[#56675f] hover:bg-[#f2f5f3] hover:text-[#083f30]"
                    }`}
                  >
                    {category.label}
                    {category.count ? <span className={`text-xs ${active ? "text-white/60" : "text-[#8fa79d]"}`}>{number(category.count)}</span> : null}
                  </button>
                );
              })}
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {hasFilters ? (
                <Link href="/n/app/mobile/explore" className="rounded-full px-4 py-2 text-sm font-semibold text-[#8c6b2c] hover:text-[#083f30]">
                  {t("actions.clearAll")}
                </Link>
              ) : null}
              <ExploreFilters filters={filters} availableLanguages={availableLanguages} />
            </div>
          </div>
        </div>
      </div>

      {/* Provider types as a bento grid */}
      {providerTypes.length ? (
        <section className="lsd-container mt-16">
          <SectionTitle title={t("providerTypes.title")} subtitle={t("providerTypes.subtitle")} />
          <div className="grid auto-rows-[190px] grid-cols-4 gap-5">
            {providerTypes.map((type, index) => {
              const active = providerTypeId === type.id;
              return (
                <Reveal key={type.id} delay={(index % 4) * 80} className={index === 0 ? "col-span-2 row-span-2" : ""}>
                  <button
                    type="button"
                    onClick={() => applyProviderType(type.id)}
                    className={`group relative block h-full w-full overflow-hidden rounded-[28px] bg-[#062a20] text-start ring-2 transition duration-500 hover:-translate-y-1 ${
                      active ? "ring-[#eacb7f]" : "ring-transparent"
                    }`}
                  >
                    {type.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={mediaUrl(type.image)} alt={type.label} className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1.4s] group-hover:scale-110" />
                    ) : null}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#062a20] via-[#062a20]/35 to-transparent" />
                    <div className="absolute inset-x-6 bottom-5 text-white">
                      <p className={`${index === 0 ? "text-3xl" : "text-lg"} font-black leading-tight`}>{type.label}</p>
                      {index === 0 && plainText(type.description) ? (
                        <p className="mt-2 line-clamp-2 max-w-md text-sm text-white/70">{plainText(type.description)}</p>
                      ) : null}
                      <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-xs backdrop-blur-sm">
                        {number(type.count)}
                      </span>
                    </div>
                    {active ? (
                      <span className="absolute end-4 top-4 grid h-9 w-9 place-items-center rounded-full bg-[#eacb7f] text-[#062a20]">
                        <BadgeCheck size={18} />
                      </span>
                    ) : null}
                  </button>
                </Reveal>
              );
            })}
          </div>
        </section>
      ) : (
        <p className="lsd-container mt-16 text-[#56675f]">{t("providerTypes.empty")}</p>
      )}

      {/* Featured providers */}
      {featuredProviders.length ? (
        <section className="lsd-container mt-20">
          <SectionTitle title={t("featured.title")} subtitle={t("featured.subtitle")} />
          <div className="grid grid-cols-4 gap-6">
            {featuredProviders.map((provider, index) => (
              <Reveal key={provider.id} delay={(index % 4) * 80}>
                <Link href={buildMobilePath(`/provider/${provider.id}`)} className="group block h-full">
                  <Tilt className="flex h-full flex-col">
                    <div className="relative h-48 overflow-hidden bg-[#0f5a45]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={mediaUrl(provider.image)} alt={provider.name} className="lsd-zoom h-full w-full object-cover" />
                      {provider.badge ? (
                        <span className="absolute start-4 top-4 rounded-full bg-[#eacb7f] px-3 py-1 text-xs font-black text-[#062a20]">{provider.badge}</span>
                      ) : null}
                      <div className="absolute end-4 top-4">
                        <FavoriteButton
                          entityId={provider.id}
                          entityType="provider"
                          initialIsFavorite={provider.isFavorited}
                          className="!h-10 !w-10 bg-white/90 text-gray-700 shadow-sm"
                          iconClassName="h-[18px] w-[18px]"
                        />
                      </div>
                    </div>
                    <div className="flex flex-1 flex-col gap-2 p-5">
                      <h3 className="flex items-center gap-1.5 text-lg font-black leading-snug text-[#0e1a16]">
                        <span className="line-clamp-1">{provider.name}</span>
                        {provider.verified ? <BadgeCheck size={17} className="shrink-0 text-[#0f5a45]" /> : null}
                      </h3>
                      {provider.location ? (
                        <p className="flex items-center gap-1.5 text-sm text-[#56675f]">
                          <MapPin size={14} className="text-[#c9a55a]" />
                          <span className="truncate">{provider.location}</span>
                        </p>
                      ) : null}
                      <div className="mt-auto flex items-center justify-between gap-3 pt-3 text-sm">
                        <span className="flex items-center gap-1.5">
                          <Star size={15} className="fill-[#c9a55a] text-[#c9a55a]" />
                          <span className="font-bold text-[#0e1a16]">{number(provider.rating || 0, 1)}</span>
                          {provider.reviews ? <span className="text-[#8fa79d]">({number(provider.reviews)})</span> : null}
                        </span>
                        {provider.responseTime ? (
                          <span className="flex items-center gap-1 text-xs text-[#56675f]">
                            <Clock size={13} />
                            {provider.responseTime}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </Tilt>
                </Link>
              </Reveal>
            ))}
          </div>
        </section>
      ) : null}

      {/* Sponsored provider */}
      {sponsoredProviders[0] ? (
        <section className="lsd-container mt-20">
          <Reveal>
            <Link
              href={buildMobilePath(`/provider/${sponsoredProviders[0].id}`)}
              className="lsd-champagne-bg group grid grid-cols-[1.1fr_0.9fr] items-center overflow-hidden rounded-[36px] ring-1 ring-[#eacb7f]/50"
            >
              <div className="space-y-4 p-12">
                <span className="inline-flex items-center gap-2 rounded-full bg-[#062a20] px-4 py-1.5 text-xs font-bold text-[#eacb7f]">
                  <Sparkles size={13} />
                  {sponsoredProviders[0].tag}
                </span>
                <h3 className="text-[34px] font-black leading-tight text-[#0e1a16]">{sponsoredProviders[0].name}</h3>
                {sponsoredProviders[0].subtitle ? <p className="max-w-lg text-base leading-7 text-[#5c5242]">{sponsoredProviders[0].subtitle}</p> : null}
                <span className="lsd-btn lsd-btn-green mt-2 h-12 px-6 text-sm">
                  {t("actions.learnMore")}
                  <ArrowLeft size={16} className="ltr:rotate-180" />
                </span>
              </div>
              <div className="relative h-full min-h-[300px] overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={mediaUrl(sponsoredProviders[0].image)}
                  alt={t("sponsored.alt")}
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1.4s] group-hover:scale-105"
                />
              </div>
            </Link>
          </Reveal>
        </section>
      ) : null}

      {/* Trending services */}
      {trendingServices.length ? (
        <section className="lsd-container mt-20">
          <SectionTitle title={t("trending.title")} subtitle={t("trending.subtitle")} />
          <div className="grid grid-cols-4 gap-6">
            {trendingServices.map((service, index) => (
              <Reveal key={service.id} delay={(index % 4) * 80}>
                <Link href={buildMobilePath(`/service/${service.id}`)} className="group block h-full">
                  <Tilt className="flex h-full flex-col">
                    <div className="relative h-48 overflow-hidden bg-[#0f5a45]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={mediaUrl(service.image)} alt={service.name} className="lsd-zoom h-full w-full object-cover" />
                      {service.growth ? (
                        <span className="absolute start-4 top-4 inline-flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-xs font-bold text-[#0f5a45]">
                          <TrendingUp size={13} />
                          {service.growth}
                        </span>
                      ) : null}
                      <div className="absolute end-4 top-4">
                        <FavoriteButton
                          entityId={service.id}
                          entityType="service"
                          initialIsFavorite={service.isFavorited}
                          className="!h-10 !w-10 bg-white/90 text-gray-700 shadow-sm"
                          iconClassName="h-[18px] w-[18px]"
                        />
                      </div>
                    </div>
                    <div className="flex flex-1 flex-col gap-1.5 p-5">
                      <h3 className="line-clamp-1 text-lg font-black text-[#0e1a16]">{service.name}</h3>
                      <p className="truncate text-sm text-[#56675f]">{service.provider}</p>
                      <div className="mt-auto flex items-end justify-between gap-3 pt-3">
                        <div>
                          {service.originalPrice && service.originalPrice > service.price ? (
                            <span className="block text-xs text-[#8fa79d] line-through">{formatPrice(service.originalPrice, service.currency)}</span>
                          ) : null}
                          <span className="text-lg font-black text-[#083f30]">{formatPrice(service.price, service.currency)}</span>
                        </div>
                        <span className="flex items-center gap-1 text-sm">
                          <Star size={14} className="fill-[#c9a55a] text-[#c9a55a]" />
                          <span className="font-bold">{number(service.rating || 0, 1)}</span>
                        </span>
                      </div>
                    </div>
                  </Tilt>
                </Link>
              </Reveal>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}