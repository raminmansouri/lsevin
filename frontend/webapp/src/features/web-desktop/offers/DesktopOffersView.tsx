"use client";

import { ArrowLeft, BadgeCheck, Check, Clock, Copy, MapPin, Search } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState, useTransition } from "react";

import { Link, useRouter } from "@/i18n/navigation";
import {
  bookingHref,
  buildOffersQuery,
  formatPrice,
  navigateSmooth,
  offerImageUrl,
  PendingOverlay,
  serviceHref,
} from "@/app/[locale]/n/app/mobile/offers/OffersClient";
import type { OfferCard, OffersFiltersInput, OfferTab } from "@/app/[locale]/n/app/mobile/offers/offers.data";

import { Reveal } from "../components/motion";

type Props = {
  tabs: OfferTab[];
  offers: OfferCard[];
  featuredOffer: OfferCard | null;
  availableLanguages: string[];
  filters: OffersFiltersInput;
};



/** Live time left until the offer ends; rendered after mount so server and client agree. */
function Countdown({ iso, locale }: { iso: string; locale: string }) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const timer = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(timer);
  }, []);
  if (now == null || !iso) return null;
  const left = new Date(iso).getTime() - now;
  if (!(left > 0)) return null;
  const two = (n: number) => new Intl.NumberFormat(locale, { minimumIntegerDigits: 2 }).format(n);
  const days = Math.floor(left / 86_400_000);
  const hours = Math.floor(left / 3_600_000) % 24;
  const minutes = Math.floor(left / 60_000) % 60;
  return (
    <span className="inline-flex items-center gap-1.5 font-mono text-xs font-bold tracking-wider text-[#8c6b2c]" dir="ltr">
      <Clock size={12} />
      {two(days)}:{two(hours)}:{two(minutes)}
    </span>
  );
}

function CopyCode({ code, label }: { code: string; label: string }) {
  const [copied, setCopied] = useState(false);
  if (!code) return null;
  return (
    <button
      type="button"
      onClick={async (event) => {
        event.preventDefault();
        event.stopPropagation();
        try {
          await navigator.clipboard.writeText(code);
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1800);
        } catch {
          // Clipboard blocked; the code is still visible to copy by hand.
        }
      }}
      className="group/code inline-flex items-center gap-2 rounded-xl border border-dashed border-[#c9a55a] px-3 py-1.5 font-mono text-sm font-bold tracking-[0.2em] text-[#083f30] transition hover:bg-[#fbf3de]"
      aria-label={label}
      title={label}
    >
      {code}
      {copied ? <Check size={14} className="text-[#0f5a45]" /> : <Copy size={14} className="text-[#c9a55a]" />}
    </button>
  );
}

/** Desktop offers (>= 1280px): same data and URL filters as mobile, styled as a private sale. */
export function DesktopOffersView({ tabs, offers, featuredOffer, filters }: Props) {
  const t = useTranslations("MobileOffers");
  const locale = useLocale();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [query, setQuery] = useState(filters.q);
  const [activeTab, setActiveTab] = useState(filters.categoryId ?? "all");

  const apply = (changes: Partial<OffersFiltersInput>) =>
    navigateSmooth(startTransition, router, buildOffersQuery({ ...filters, minPrice: 0, ...changes }));

  const number = (value: number) => new Intl.NumberFormat(locale).format(value);
  const list = featuredOffer ? offers.filter((offer) => offer.id !== featuredOffer.id) : offers;
  const allTabs = tabs.some((tab) => tab.id === "all") ? tabs : [{ id: "all", label: t("tabs.allOffers"), count: offers.length }, ...tabs];

  return (
    <div className="lsd lsd-shop-bg hidden pb-20 xl:block">
      {isPending ? <PendingOverlay /> : null}

      {/* Header */}
      <section className="lsd-container pt-16">
        <Reveal className="space-y-6">
          <span className="text-[11px] font-bold tracking-[0.45em] text-[#c9a55a]">PRIVATE SALE</span>
          <div role="heading" aria-level={1} className="text-[56px] font-black leading-[1.1] text-[#0e1a16]">{t("title")}</div>
          <p className="max-w-lg text-lg leading-8 text-[#6b6150]">{t("subtitle")}</p>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              apply({ q: query.trim() });
            }}
            className="lsd-line-input flex max-w-lg items-center gap-3 pb-3"
          >
            <Search size={19} className="shrink-0 text-[#c9a55a]" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t("search.placeholder")}
              className="min-w-0 flex-1 bg-transparent text-lg outline-none placeholder:text-[#a8a08e]"
            />
          </form>
        </Reveal>
      </section>

      {/* Categories as words */}
      <nav className="lsd-container mt-14 flex flex-wrap gap-x-9 gap-y-3 border-b border-[#e3dccb] pb-4">
        {allTabs.map((tab) => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setActiveTab(tab.id);
                apply({ categoryId: tab.id === "all" ? null : tab.id });
              }}
              className={`relative pb-2 text-[15px] font-bold transition ${active ? "text-[#0e1a16]" : "text-[#8a8170] hover:text-[#0e1a16]"}`}
            >
              {tab.label}
              <sup className="ms-1 text-[10px] text-[#c9a55a]">{number(tab.count)}</sup>
              <span className={`absolute inset-x-0 -bottom-[17px] h-[2px] bg-[#c9a55a] transition-transform duration-500 ${active ? "scale-x-100" : "scale-x-0"}`} />
            </button>
          );
        })}
      </nav>

      {/* Featured: the invitation */}
      {featuredOffer ? (
        <section className="lsd-container mt-14">
          <Reveal>
            <Link href={serviceHref(featuredOffer.providerServiceId)} className="group block">
              <div className="lsd-certificate relative grid grid-cols-[260px_1fr_200px] items-center gap-10 rounded-[30px] p-10">
                <div className="h-[300px] overflow-hidden rounded-t-full rounded-b-[22px] bg-[#efe6d2]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={offerImageUrl(featuredOffer.image)} alt="" className="h-full w-full object-cover transition-transform duration-[1.4s] group-hover:scale-105" />
                </div>
                <div className="min-w-0 space-y-4">
                  <span className="text-[11px] font-bold tracking-[0.35em] text-[#c9a55a]">{t("featured.badge")}</span>
                  <h2 className="text-[34px] font-black leading-snug text-[#0e1a16]">{featuredOffer.title}</h2>
                  {featuredOffer.subtitle ? <p className="line-clamp-2 text-base leading-8 text-[#6b6150]">{featuredOffer.subtitle}</p> : null}
                  <p className="flex items-center gap-2 text-sm text-[#56675f]">
                    <span className="font-bold text-[#0e1a16]">{featuredOffer.provider}</span>
                    {featuredOffer.verified ? <BadgeCheck size={15} className="text-[#0f5a45]" /> : null}
                    {featuredOffer.location ? (
                      <>
                        <span className="text-[#c9a55a]">·</span>
                        <MapPin size={14} className="text-[#c9a55a]" />
                        {featuredOffer.location}
                      </>
                    ) : null}
                  </p>
                  <div className="flex flex-wrap items-center gap-4 pt-2">
                    {featuredOffer.code ? (
                      <span className="flex items-center gap-2 text-xs text-[#8a8170]">
                        {t("featured.useCode")}
                        <CopyCode code={featuredOffer.code} label={t("code.copy")} />
                      </span>
                    ) : null}
                    <Countdown iso={featuredOffer.validUntilIso} locale={locale} />
                  </div>
                </div>
                <div className="flex flex-col items-center gap-5">
                  <span className="lsd-wax grid h-36 w-36 place-items-center rounded-full text-[#eacb7f]">
                    <span className="text-[40px] font-black leading-none">٪{number(featuredOffer.discountPercent)}</span>
                  </span>
                  <span className="lsd-btn lsd-btn-green h-12 px-6 text-sm">
                    {t("cta.bookNow")}
                    <ArrowLeft size={16} className="ltr:rotate-180" />
                  </span>
                </div>
              </div>
            </Link>
          </Reveal>
        </section>
      ) : null}

      {/* The rest: slim coupons */}
      <section className="lsd-container mt-12">
        {list.length ? (
          <div className="space-y-5">
            {list.map((offer, index) => {
              return (
                <Reveal key={offer.id} delay={Math.min(index, 6) * 60}>
                  <div className="lsd-ticket-shadow group">
                    <div className="lsd-ticket grid grid-cols-[78fr_22fr] overflow-hidden rounded-[24px] bg-white" style={{ ["--notch" as string]: "22%" }}>
                      <Link href={serviceHref(offer.providerServiceId)} className="flex items-center gap-6 p-5">
                        <span className="h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-[#efe6d2]">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={offerImageUrl(offer.image)} alt="" className="h-full w-full object-cover transition-transform duration-[1.2s] group-hover:scale-110" />
                        </span>
                        <span className="min-w-0 flex-1 space-y-1.5">
                          {offer.categoryLabel ? (
                            <span className="block text-[10px] font-bold uppercase tracking-[0.25em] text-[#c9a55a]">{offer.categoryLabel}</span>
                          ) : null}
                          <span className="block truncate text-lg font-black text-[#0e1a16]">{offer.title}</span>
                          <span className="flex items-center gap-2 truncate text-sm text-[#56675f]">
                            {offer.provider}
                            {offer.verified ? <BadgeCheck size={14} className="shrink-0 text-[#0f5a45]" /> : null}
                          </span>
                          <Countdown iso={offer.validUntilIso} locale={locale} />
                        </span>
                      </Link>

                      <div className="my-4 flex flex-col items-center justify-center gap-2 border-s-2 border-dashed border-[#e3dccb] px-5 text-center">
                        <span className="lsd-outline-num text-[48px] font-black leading-none">٪{number(offer.discountPercent)}</span>
                        <span className="text-xs text-[#a8a08e] line-through">{formatPrice(offer.originalPrice, offer.currency, locale)}</span>
                        <span className="text-base font-black text-[#083f30]">{formatPrice(offer.discountedPrice, offer.currency, locale)}</span>
                        <div className="mt-1 flex items-center gap-2">
                          <CopyCode code={offer.code} label={t("code.copy")} />
                          <Link
                            href={bookingHref(offer.providerServiceId)}
                            aria-label={t("cta.bookNow")}
                            className="grid h-9 w-9 place-items-center rounded-full bg-[#083f30] text-[#eacb7f] transition hover:bg-[#0f5a45]"
                          >
                            <ArrowLeft size={16} className="ltr:rotate-180" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>
        ) : !featuredOffer ? (
          <div className="mx-auto max-w-md py-20 text-center">
            <h3 className="text-2xl font-black text-[#0e1a16]">{t("empty.title")}</h3>
            <p className="mt-3 text-[#6b6150]">{t("empty.description")}</p>
            <Link href="/n/app/mobile/offers" className="mt-6 inline-block text-sm font-bold text-[#8c6b2c] underline underline-offset-8">
              {t("empty.clearFilters")}
            </Link>
          </div>
        ) : null}
      </section>
    </div>
  );
}