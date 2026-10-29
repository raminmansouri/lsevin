"use client";

import { BadgeCheck, CalendarDays, Check, Clock, Gauge, Languages, MapPin, Navigation, Quote, Share2, ShieldCheck, Star, Timer, Users, X, Zap } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";

import { directionOf } from "@/features/tours/domain/content";
import type { WeatherView } from "@/features/tours/server/ops/contract";
import type { DepartureView, TourCard as TourCardData, TourDetail } from "@/features/tours/server/platform/catalog";
import { FromPrice, TourImage, TourPrice, useTourDateFormat } from "@/features/tours/ui/customer/common";
import { InquiryDialog } from "@/features/tours/ui/customer/detail/inquiry-dialog";
import { Itinerary, directionsHref } from "@/features/tours/ui/customer/detail/itinerary";
import { Reviews } from "@/features/tours/ui/customer/detail/reviews";
import { TourCard, durationLabel } from "@/features/tours/ui/customer/tour-card";
import { WeatherCard } from "@/features/tours/ui/customer/weather-card";
import { WishlistButton } from "@/features/tours/ui/customer/wishlist-button";
import { formatClock, formatNumber, languageName, lines } from "@/features/tours/ui/shared/format";
import { LocalizedText, type LocalizedValue } from "@/features/tours/ui/shared/localized-text";
import { TourMap } from "@/features/tours/ui/shared/tour-map";
import { Link } from "@/i18n/navigation";

import { Reveal } from "../components/motion";

const SECTIONS = ["overview", "itinerary", "features", "rules", "location", "reviews"] as const;
type SectionId = (typeof SECTIONS)[number];

function Block({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={`tour-${id}`} className="scroll-mt-40">
      <h2 className="mb-6 flex items-center gap-4 text-[26px] font-black text-[#083f30]">
        {title}
        <span className="lsd-hairline flex-1" />
      </h2>
      {children}
    </section>
  );
}

function Checklist({ text, tone }: { text: LocalizedValue; tone: "gold" | "green" | "coral" | "dot" }) {
  if (!text) return null;
  return (
    <ul className="space-y-3" lang={text.locale} dir={text.dir}>
      {lines(text.value).map((item) => (
        <li key={item} className="flex items-start gap-3 text-[15px] leading-7 text-[#3d4b45]">
          {tone === "coral" ? (
            <span className="mt-1 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[#fdf1ef] text-[#b2453a]">
              <X size={12} />
            </span>
          ) : tone === "dot" ? (
            <span className="mt-3 h-1.5 w-1.5 shrink-0 rounded-full bg-[#c9a55a]" />
          ) : (
            <span className={`mt-1 grid h-5 w-5 shrink-0 place-items-center rounded-full ${tone === "gold" ? "bg-[#fbf3de] text-[#8c6b2c]" : "bg-[#e7f4ee] text-[#0f5a45]"}`}>
              <Check size={12} />
            </span>
          )}
          {item}
        </li>
      ))}
    </ul>
  );
}

const Para = ({ text }: { text: LocalizedValue }) => (text ? <LocalizedText text={text} as="p" className="text-[15px] leading-8 text-[#3d4b45]" /> : null);

/** Desktop tour detail (>= 1280px): same data and shared tour components, in cream, green and gold. */
export function DesktopTourDetail({
  detail,
  departures,
  weather,
  weatherDate,
  related,
  saved,
  savedIds,
}: {
  detail: TourDetail;
  departures: DepartureView[];
  weather: WeatherView;
  weatherDate: string | null;
  related: TourCardData[];
  saved: boolean;
  savedIds: string[];
}) {
  const t = useTranslations("TourApp");
  const td = useTranslations("TourApp.detail");
  const locale = useLocale();
  const fmt = useTourDateFormat();
  const rtl = directionOf(locale) === "rtl";
  const title = detail.text.title?.value ?? detail.slug;
  const f = detail.facts;
  const tx = detail.text;
  const policy = detail.policy;
  const meeting = detail.location.meeting;
  const bookable = departures.filter((d) => d.bookable);
  const relatedSaved = new Set(savedIds);
  const images = detail.media.filter((m) => m.kind === "image" || m.kind === "photo" || !m.kind);
  const mosaic = images.slice(0, 5);
  const firstHighlight = tx.highlights ? lines(tx.highlights.value)[0] : null;

  const groupText = f.maxParticipants
    ? td("facts.groupValue", { min: formatNumber(f.minParticipants, locale), max: formatNumber(f.maxParticipants, locale) })
    : td("facts.groupMin", { min: formatNumber(f.minParticipants, locale) });
  const ageText =
    f.minAge != null && f.maxAge != null
      ? td("facts.ageRange", { min: formatNumber(f.minAge, locale), max: formatNumber(f.maxAge, locale) })
      : f.minAge != null
        ? td("facts.ageMin", { min: formatNumber(f.minAge, locale) })
        : td("facts.anyAge");
  const cutoffText =
    f.bookingCutoffMinutes >= 60
      ? td("facts.cutoffValue", { hours: Math.round(f.bookingCutoffMinutes / 60) })
      : td("facts.cutoffMinutes", { minutes: formatNumber(f.bookingCutoffMinutes, locale) });
  const difficultyText = f.difficulty ? (td.has(`difficulty.${f.difficulty}`) ? td(`difficulty.${f.difficulty}`) : f.difficulty) : t("common.notProvided");
  const audience = [
    f.accessibility.family && t("explore.fields.family"),
    f.accessibility.wheelchair && t("explore.fields.accessible"),
    f.accessibility.lowMobility && t("explore.fields.lowMobility"),
    f.accessibility.recovery && t("explore.fields.recovery"),
  ].filter(Boolean) as string[];

  const facts = [
    { icon: Clock, label: td("facts.duration"), value: durationLabel((k, v) => t(`card.${k}`, v), f) },
    { icon: Users, label: td("facts.groupSize"), value: groupText },
    { icon: Languages, label: td("facts.languages"), value: f.guideLanguages.map((l) => languageName(l, locale)).join(rtl ? "، " : ", ") || "—" },
    { icon: Gauge, label: td("facts.difficulty"), value: difficultyText },
    { icon: Zap, label: td("facts.confirmation"), value: f.confirmationMode === "instant" ? t("card.instant") : t("card.request") },
    { icon: Timer, label: td("facts.cutoff"), value: cutoffText },
  ];

  async function share() {
    try {
      if (navigator.share) {
        await navigator.share({ title, url: window.location.href });
        return;
      }
      await navigator.clipboard.writeText(window.location.href);
      toast.success(td("shareCopied"));
    } catch (e) {
      if ((e as Error)?.name !== "AbortError") toast.error(td("shareFailed"));
    }
  }

  // Sticky section nav: highlight the section under it.
  const navRef = useRef<HTMLElement>(null);
  const [active, setActive] = useState<SectionId>("overview");
  useEffect(() => {
    let frame = 0;
    const update = () => {
      const nav = navRef.current;
      if (!nav) return;
      const rect = nav.getBoundingClientRect();
      const hit = document.elementFromPoint(rect.left + 30, rect.bottom + 80)?.closest<HTMLElement>('[id^="tour-"]');
      const id = hit?.id.replace("tour-", "") as SectionId | undefined;
      if (id && (SECTIONS as readonly string[]).includes(id)) setActive(id);
    };
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true, capture: true });
    return () => {
      window.removeEventListener("scroll", onScroll, { capture: true });
      cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div className="lsd hidden bg-[#fbf7ee] pb-24 xl:block">
      <div className="mx-auto max-w-[1320px] px-6 pt-6">
        {/* Gallery mosaic */}
        <div className={`relative grid h-[500px] gap-3 ${mosaic.length > 1 ? "grid-cols-4 grid-rows-2" : "grid-cols-1"}`}>
          {mosaic.map((image, index) => (
            <div key={image.id} className={`group relative overflow-hidden rounded-[28px] bg-[#062a20] ${index === 0 && mosaic.length > 1 ? "col-span-2 row-span-2" : ""}`}>
              <div className="absolute inset-0 transition-transform duration-[1.4s] group-hover:scale-105">
                <TourImage src={image.url} alt={image.alt ?? title} className="h-full w-full" eager={index === 0} />
              </div>
              {index === mosaic.length - 1 && images.length > mosaic.length ? (
                <span className="absolute inset-0 grid place-items-center bg-[#062a20]/55 text-2xl font-black text-white">+{formatNumber(images.length - mosaic.length, locale)}</span>
              ) : null}
            </div>
          ))}
          {weather.status === "ok" && (weather.current || weather.forecast) ? (
            <span className="absolute start-5 top-5 rounded-full bg-[#062a20]/70 px-4 py-2 text-sm font-bold text-white backdrop-blur-md">
              <bdi>{formatNumber(Math.round(weather.current?.temperatureC ?? weather.forecast!.maxC), locale)}°C</bdi> ·{" "}
              {t(`weather.conditions.${weather.current?.condition ?? weather.forecast!.condition}`)}
            </span>
          ) : null}
        </div>

        {/* Title row */}
        <div className="mt-8 flex items-start justify-between gap-10">
          <Reveal className="min-w-0 space-y-3">
            {detail.destination?.name ? (
              <p className="flex items-center gap-2 text-sm font-bold text-[#8c6b2c]">
                <MapPin size={15} />
                <LocalizedText text={detail.destination.name} badge={false} />
                {detail.destination.region ? (
                  <>
                    {rtl ? "، " : ", "}
                    <LocalizedText text={detail.destination.region} badge={false} />
                  </>
                ) : null}
              </p>
            ) : null}
            <h1 className="text-[44px] font-black leading-[1.2] text-[#0e1a16]">
              <LocalizedText text={tx.title} badge={false} />
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-sm text-[#56675f]">
              <span className="rounded-full bg-[#e7f4ee] px-3 py-1 font-bold text-[#0f5a45]">{td.has(`tourTypes.${f.tourType}`) ? td(`tourTypes.${f.tourType}`) : f.tourType}</span>
              {detail.rating.count > 0 && detail.rating.avg != null ? (
                <a href="#tour-reviews" className="flex items-center gap-1.5 font-bold text-[#0e1a16]">
                  <Star size={16} className="fill-[#c9a55a] text-[#c9a55a]" />
                  {t("card.rating", { rating: formatNumber(detail.rating.avg, locale, { maximumFractionDigits: 1 }), count: detail.rating.count })}
                </a>
              ) : null}
              <span className="flex items-center gap-2">
                <LocalizedText text={detail.provider.name} badge={false} placeholder="—" />
                {detail.provider.verified ? (
                  <span className="flex items-center gap-1 rounded-full bg-[#083f30] px-2.5 py-0.5 text-xs font-bold text-[#eacb7f]" title={td("verifiedProviderHint")}>
                    <ShieldCheck size={13} />
                    {td("verifiedProvider")}
                  </span>
                ) : null}
              </span>
            </div>
          </Reveal>
          <div className="flex shrink-0 gap-2">
            <button type="button" onClick={share} aria-label={td("share")} className="grid h-12 w-12 place-items-center rounded-full bg-white text-[#083f30] ring-1 ring-[#e7dcc4] transition hover:ring-[#c9a55a]">
              <Share2 size={19} />
            </button>
            <WishlistButton tourId={detail.id} initialSaved={saved} title={title} className="!size-12 bg-white ring-1 ring-[#e7dcc4]" />
          </div>
        </div>

        {/* Green facts band */}
        <div className="lsd-hero-bg mt-8 grid grid-cols-6 gap-px overflow-hidden rounded-[28px] text-white">
          {facts.map((fact) => (
            <div key={fact.label} className="space-y-2 px-6 py-6">
              <fact.icon size={20} className="text-[#eacb7f]" />
              <p className="text-xs text-white/55">{fact.label}</p>
              <p className="text-[15px] font-bold leading-6">{fact.value}</p>
            </div>
          ))}
        </div>

        {/* Body */}
        <div className="mt-12 grid grid-cols-[1fr_380px] items-start gap-12">
          <div className="min-w-0 space-y-16">
            <nav ref={navRef} className="sticky top-24 z-20 flex w-fit gap-1 rounded-full bg-white/90 p-1.5 shadow-sm ring-1 ring-[#e7dcc4] backdrop-blur-md">
              {SECTIONS.map((id) => (
                <a
                  key={id}
                  href={`#tour-${id}`}
                  className={`rounded-full px-5 py-2.5 text-sm font-bold transition ${active === id ? "bg-[#083f30] text-[#eacb7f]" : "text-[#56675f] hover:text-[#083f30]"}`}
                >
                  {td(`tabs.${id}`)}
                </a>
              ))}
            </nav>

            {/* Overview */}
            <Block id="overview" title={td("tabs.overview")}>
              <div className="space-y-8">
                {firstHighlight ? (
                  <blockquote className="relative rounded-[24px] bg-white px-10 py-8 ring-1 ring-[#e7dcc4]" lang={tx.highlights!.locale} dir={tx.highlights!.dir}>
                    <Quote className="absolute -top-4 start-8 h-9 w-9 rounded-full bg-[#eacb7f] p-2 text-[#062a20]" />
                    <p className="text-xl font-bold leading-9 text-[#083f30]">{firstHighlight}</p>
                  </blockquote>
                ) : null}
                {tx.summary ? <LocalizedText text={tx.summary} as="p" className="text-lg leading-9 font-medium text-[#0e1a16]" /> : null}
                {tx.highlights ? (
                  <div>
                    <h3 className="mb-4 text-base font-black text-[#0e1a16]">{td("highlights")}</h3>
                    <Checklist text={tx.highlights} tone="gold" />
                  </div>
                ) : null}
                {tx.description ? (
                  <div>
                    <h3 className="mb-3 text-base font-black text-[#0e1a16]">{td("description")}</h3>
                    <Para text={tx.description} />
                  </div>
                ) : null}
                <dl className="grid grid-cols-3 gap-px overflow-hidden rounded-[22px] bg-[#efe7d5] ring-1 ring-[#e7dcc4]">
                  {[
                    { label: td("facts.ages"), value: ageText },
                    ...(f.activityLevel != null ? [{ label: td("facts.activityLevel"), value: td("facts.activityValue", { level: formatNumber(f.activityLevel, locale) }) }] : []),
                    ...(f.transportModes.length ? [{ label: td("facts.transport"), value: f.transportModes.map((m) => (td.has(`transport.${m}`) ? td(`transport.${m}`) : m)).join(", ") }] : []),
                    ...(audience.length ? [{ label: td("facts.audience"), value: audience.join(", ") + (f.accessibility.verified ? "" : ` (${td("facts.unverified")})`) }] : []),
                  ].map((item) => (
                    <div key={item.label} className="bg-white px-6 py-5">
                      <dt className="text-xs text-[#8a8170]">{item.label}</dt>
                      <dd className="mt-1 font-bold text-[#0e1a16]">{item.value}</dd>
                    </div>
                  ))}
                </dl>
                <div className="overflow-hidden rounded-[22px] ring-1 ring-[#e7dcc4]">
                  <WeatherCard view={weather} date={weatherDate} />
                </div>
              </div>
            </Block>

            {/* Itinerary */}
            <Block id="itinerary" title={td("itinerary.title")}>
              <div className="rounded-[26px] bg-white p-8 ring-1 ring-[#e7dcc4]">
                <Itinerary stops={detail.itinerary} timezone={f.timezone} />
              </div>
            </Block>

            {/* Features */}
            <Block id="features" title={td("tabs.features")}>
              <div className="grid grid-cols-2 gap-5">
                {tx.inclusions ? (
                  <div className="rounded-[24px] bg-white p-7 ring-1 ring-[#e7dcc4]">
                    <h3 className="mb-4 font-black text-[#0f5a45]">{td("included")}</h3>
                    <Checklist text={tx.inclusions} tone="green" />
                  </div>
                ) : null}
                {tx.exclusions ? (
                  <div className="rounded-[24px] bg-white p-7 ring-1 ring-[#e7dcc4]">
                    <h3 className="mb-4 font-black text-[#b2453a]">{td("excluded")}</h3>
                    <Checklist text={tx.exclusions} tone="coral" />
                  </div>
                ) : null}
                {tx.what_to_bring ? (
                  <div className="rounded-[24px] bg-[#fbf6ea] p-7 ring-1 ring-[#eadfc6]">
                    <h3 className="mb-4 font-black text-[#8c6b2c]">{td("whatToBring")}</h3>
                    <Checklist text={tx.what_to_bring} tone="dot" />
                  </div>
                ) : null}
                {[
                  { key: "accessibilityNotes", text: tx.accessibility_notes },
                  { key: "documents", text: tx.documents_notes },
                  { key: "ageConditions", text: tx.age_conditions },
                ].map((note) =>
                  note.text ? (
                    <div key={note.key} className="rounded-[24px] bg-white p-7 ring-1 ring-[#e7dcc4]">
                      <h3 className="mb-3 font-black text-[#0e1a16]">{td(note.key as never)}</h3>
                      <Para text={note.text} />
                    </div>
                  ) : null
                )}
              </div>
              {f.pickupAvailable || f.privateAvailable ? (
                <div className="mt-5 flex flex-wrap gap-2">
                  {f.pickupAvailable ? <span className="rounded-full bg-[#083f30] px-4 py-2 text-sm font-bold text-[#eacb7f]">{td("facts.pickup")}</span> : null}
                  {f.privateAvailable ? <span className="rounded-full bg-[#083f30] px-4 py-2 text-sm font-bold text-[#eacb7f]">{td("facts.private")}</span> : null}
                </div>
              ) : null}
              {detail.guides.length ? (
                <div className="mt-8">
                  <h3 className="mb-4 font-black text-[#0e1a16]">{td("guides.title")}</h3>
                  <div className="grid grid-cols-2 gap-5">
                    {detail.guides.map((guide) => (
                      <div key={guide.id} className="flex gap-4 rounded-[24px] bg-white p-6 ring-1 ring-[#e7dcc4]">
                        <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-[#083f30] text-xl font-black text-[#eacb7f] ring-4 ring-[#fbf3de]">
                          {guide.displayName?.[0] ?? "•"}
                        </span>
                        <div className="min-w-0">
                          <p className="flex items-center gap-1.5 font-black text-[#0e1a16]">
                            <bdi>{guide.displayName}</bdi>
                            {guide.verified ? <BadgeCheck size={16} className="text-[#0f5a45]" aria-label={td("guides.verified")} /> : null}
                          </p>
                          <p className="text-xs text-[#8c6b2c]">{td("guides.languages", { languages: guide.languages.map((l) => languageName(l.code, locale)).join(", ") })}</p>
                          {guide.bio ? <LocalizedText text={guide.bio} as="p" className="mt-2 text-sm leading-6 text-[#56675f]" clamp /> : null}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </Block>

            {/* Rules */}
            <Block id="rules" title={td("policies.title")}>
              {policy ? (
                <div className="space-y-6">
                  <div className="overflow-hidden rounded-[24px] bg-white ring-1 ring-[#e7dcc4]">
                    <p className="border-b border-[#efe7d5] px-7 py-4 font-black text-[#0e1a16]">{td("policies.cancellation")}</p>
                    <ul className="divide-y divide-[#f1ead9]">
                      {[...policy.cancellationRules]
                        .sort((a, b) => b.hoursBefore - a.hoursBefore)
                        .map((rule) => (
                          <li key={rule.hoursBefore} className="flex items-center justify-between gap-6 px-7 py-4">
                            <span className="text-[#3d4b45]">{td("policies.rule", { hours: rule.hoursBefore })}</span>
                            <span className="rounded-full bg-[#e7f4ee] px-3 py-1 text-sm font-black text-[#0f5a45]">
                              {td("policies.refund", { percent: formatNumber(rule.refundPercent, locale) })}
                            </span>
                          </li>
                        ))}
                      <li className="bg-[#fbf8f1] px-7 py-4 text-sm text-[#8a8170]">{td("policies.laterNoRefund")}</li>
                    </ul>
                  </div>
                  {policy.text.cancellation ? <Para text={policy.text.cancellation} /> : null}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {[
                      td("policies.noShow", { percent: formatNumber(policy.noShowRefundPercent, locale) }),
                      ...(policy.lateArrivalMinutes != null ? [td("policies.lateArrival", { minutes: formatNumber(policy.lateArrivalMinutes, locale) })] : []),
                      ...(f.minParticipants > 1 ? [td("policies.minParticipants", { count: f.minParticipants })] : []),
                      `${td("policies.weather")}: ${td.has(`policies.weatherPolicies.${policy.weatherPolicy}`) ? td(`policies.weatherPolicies.${policy.weatherPolicy}`) : policy.weatherPolicy}`,
                    ].map((line) => (
                      <p key={line} className="rounded-[18px] bg-[#fbf6ea] px-5 py-4 leading-6 text-[#5c5242] ring-1 ring-[#eadfc6]">
                        {line}
                      </p>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-[#6b6150]">{td("policies.none")}</p>
              )}
              <div className="mt-6 space-y-5">
                {policy?.text.rules || tx.rules ? (
                  <div>
                    <h3 className="mb-2 font-black text-[#0e1a16]">{td("policies.rules")}</h3>
                    {policy?.text.rules ? <Para text={policy.text.rules} /> : null}
                    {tx.rules ? <Para text={tx.rules} /> : null}
                  </div>
                ) : null}
                {tx.safety_notes ? (
                  <div>
                    <h3 className="mb-2 font-black text-[#0e1a16]">{td("policies.safety")}</h3>
                    <Para text={tx.safety_notes} />
                  </div>
                ) : null}
                {tx.booking_instructions ? (
                  <div>
                    <h3 className="mb-2 font-black text-[#0e1a16]">{td("bookingInstructions")}</h3>
                    <Para text={tx.booking_instructions} />
                  </div>
                ) : null}
                {tx.faq ? (
                  <details className="group rounded-[22px] bg-white px-7 py-5 ring-1 ring-[#e7dcc4] open:ring-[#c9a55a]">
                    <summary className="flex cursor-pointer list-none items-center justify-between font-black text-[#0e1a16]">
                      {td("faq")}
                      <span className="text-xl text-[#c9a55a] transition-transform group-open:rotate-45">+</span>
                    </summary>
                    <div className="mt-3">
                      <Para text={tx.faq} />
                    </div>
                  </details>
                ) : null}
              </div>
            </Block>

            {/* Location */}
            <Block id="location" title={td("meeting.title")}>
              {meeting ? (
                <div className="space-y-4">
                  <div className="overflow-hidden rounded-[26px] ring-1 ring-[#e7dcc4]">
                    <TourMap
                      points={[
                        { id: "meeting", lat: meeting.lat, lng: meeting.lng, label: td("meeting.title"), kind: "meeting", exact: meeting.exact, radiusM: meeting.radiusM },
                        ...(detail.location.end ? [{ id: "end", lat: detail.location.end.lat, lng: detail.location.end.lng, label: td("meeting.end"), kind: "finish" as const, exact: true }] : []),
                      ]}
                      labels={{ region: td("meeting.title"), unavailable: td("itinerary.mapUnavailable"), approximate: td("itinerary.approximate") }}
                      height={340}
                    />
                  </div>
                  {meeting.exact ? (
                    <a
                      href={directionsHref(meeting.lat, meeting.lng)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-full bg-[#083f30] px-5 py-2.5 text-sm font-bold text-[#eacb7f] transition hover:bg-[#0f5a45]"
                    >
                      <Navigation size={15} />
                      {td("itinerary.openDirections")}
                    </a>
                  ) : (
                    <p className="rounded-[18px] bg-[#fdf7e8] px-5 py-4 text-sm text-[#7a5d22] ring-1 ring-[#f0dcae]">{td("meeting.approximate")}</p>
                  )}
                </div>
              ) : (
                <p className="text-[#6b6150]">{td("meeting.noLocation")}</p>
              )}
              <div className="mt-6 grid grid-cols-2 gap-5">
                {tx.meeting_instructions && meeting?.exact ? (
                  <div className="rounded-[22px] bg-white p-6 ring-1 ring-[#e7dcc4]">
                    <h3 className="mb-2 font-black text-[#0e1a16]">{td("meeting.instructions")}</h3>
                    <Para text={tx.meeting_instructions} />
                  </div>
                ) : null}
                {tx.pickup_instructions ? (
                  <div className="rounded-[22px] bg-white p-6 ring-1 ring-[#e7dcc4]">
                    <h3 className="mb-2 font-black text-[#0e1a16]">{td("meeting.pickup")}</h3>
                    <Para text={tx.pickup_instructions} />
                  </div>
                ) : null}
              </div>
            </Block>

            {/* Reviews */}
            <Block id="reviews" title={td("reviews.title")}>
              <div className="rounded-[26px] bg-white p-8 ring-1 ring-[#e7dcc4]">
                <Reviews reviews={detail.reviews} rating={detail.rating} />
              </div>
            </Block>
          </div>

          {/* Sticky booking card */}
          <aside className="sticky top-24">
            <div className="overflow-hidden rounded-[30px] bg-white ring-1 ring-[#e7dcc4] shadow-[0_40px_70px_-40px_rgba(6,42,32,0.45)]">
              <div className="lsd-hero-bg px-7 py-6 text-white [&_*]:!text-white/80">
                <FromPrice amount={detail.fromPrice} currency={f.currency} basis={detail.fromPriceBasis} />
              </div>
              <div className="space-y-3 p-6">
                {bookable.length ? (
                  <ul className="space-y-2.5">
                    {bookable.slice(0, 5).map((departure) => (
                      <li key={departure.id}>
                        <Link
                          href={`/tours/t/${detail.slug}/book?departure=${departure.id}`}
                          className="group grid grid-cols-[1fr_auto] overflow-hidden rounded-[18px] bg-[#fbf8f1] ring-1 ring-[#efe7d5] transition hover:ring-[#c9a55a]"
                        >
                          <span className="flex items-center gap-3 px-4 py-3">
                            <CalendarDays size={17} className="shrink-0 text-[#c9a55a]" />
                            <span>
                              <span suppressHydrationWarning className="block text-sm font-black text-[#0e1a16]">
                                {fmt.date(departure.localDate, "medium")}
                              </span>
                              {departure.localTime ? <span className="block text-xs text-[#8a8170]">{formatClock(departure.localTime, locale)}</span> : null}
                            </span>
                          </span>
                          <span className="flex flex-col items-end justify-center border-s-2 border-dashed border-[#e7dcc4] px-4 py-3 text-end">
                            {departure.priceFrom != null ? <TourPrice amount={departure.priceFrom} currency={f.currency} className="text-sm font-black text-[#083f30]" /> : null}
                            <span className="text-[11px] text-[#8c6b2c]">{t("card.seatsLeft", { count: departure.remaining })}</span>
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="rounded-[18px] bg-[#fbf8f1] px-4 py-4 text-sm text-[#6b6150]">{t("booking.noDepartures")}</p>
                )}

                {bookable.length ? (
                  <Link
                    href={`/tours/t/${detail.slug}/book`}
                    className="lsd-champagne-bg mt-2 flex h-14 w-full items-center justify-center rounded-full border border-[#eacb7f] text-base font-black text-[#062a20] shadow-[0_18px_36px_-18px_rgba(234,203,127,0.75)] transition hover:-translate-y-0.5"
                  >
                    {td("sticky.checkAvailability")}
                  </Link>
                ) : (
                  <span className="mt-2 flex h-14 w-full items-center justify-center rounded-full bg-[#efe7d5] text-sm font-bold text-[#8a8170]">{td("sticky.noDepartures")}</span>
                )}
                <p className="text-center text-xs text-[#8a8170]">{t("booking.localTime", { zone: f.timezone })}</p>
                {f.privateAvailable ? (
                  <InquiryDialog
                    tourId={detail.id}
                    triggerClassName="w-full rounded-full px-4 py-3 text-sm font-bold text-[#083f30] ring-1 ring-[#083f30]/25 transition hover:bg-[#e7f4ee]"
                  />
                ) : null}
              </div>
            </div>
          </aside>
        </div>

        {/* Related */}
        {related.length ? (
          <section className="mt-20">
            <h2 className="mb-6 flex items-center gap-4 text-[26px] font-black text-[#083f30]">
              {td("related")}
              <span className="lsd-hairline flex-1" />
            </h2>
            <div className="grid grid-cols-3 gap-6">
              {related.map((card) => (
                <TourCard key={card.id} card={card} saved={relatedSaved.has(card.id)} className="h-full" />
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
}