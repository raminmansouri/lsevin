"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  Check,
  Clock,
  Languages,
  MapPin,
  Navigation,
  Share2,
  ShieldCheck,
  Star,
  Users,
  X,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";

import { Link, useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

import { directionOf } from "../../../domain/content";
import type { WeatherView } from "../../../server/ops/contract";
import { recordViewAction } from "../../../server/actions/customer";
import type { DepartureView, TourCard as TourCardData, TourDetail } from "../../../server/platform/catalog";
import { formatClock, formatNumber, languageName, lines } from "../../shared/format";
import { FallbackBadge, LocalizedText, plainText, type LocalizedValue } from "../../shared/localized-text";
import { TourMap } from "../../shared/tour-map";
import { FromPrice, TourPrice, useTourDateFormat } from "../common";
import { TourCard, durationLabel } from "../tour-card";
import { WeatherCard } from "../weather-card";
import { WishlistButton } from "../wishlist-button";

import { Gallery } from "./gallery";
import { InquiryDialog } from "./inquiry-dialog";
import { Itinerary, directionsHref } from "./itinerary";
import { Reviews } from "./reviews";

const SECTIONS = ["overview", "itinerary", "features", "rules", "location", "reviews", "booking"] as const;

function Section({ id, title, children }: { id: (typeof SECTIONS)[number] | string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="scroll-mt-32 border-t border-slate-200 px-4 py-6 sm:px-0" data-testid={`section-${id}`}>
      <h2 id={`${id}-title`} className="mb-3 text-lg font-bold text-slate-900">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Expandable({ text }: { text: LocalizedValue }) {
  const t = useTranslations("TourApp.detail");
  const [open, setOpen] = useState(false);
  if (!text) return null;
  const long = plainText(text.value).length > 280;
  return (
    <div>
      <div className={cn(!open && long && "line-clamp-5")}>
        <LocalizedText text={text} as="p" className="text-sm leading-7 text-slate-700" />
      </div>
      {long ? (
        <button type="button" aria-expanded={open} onClick={() => setOpen((v) => !v)} className="mt-1 min-h-11 text-sm font-semibold text-emerald-700">
          {open ? t("showLess") : t("showMore")}
        </button>
      ) : null}
    </div>
  );
}

function List({ text, icon }: { text: LocalizedValue; icon: "check" | "x" | "dot" }) {
  if (!text) return null;
  const items = lines(text.value);
  return (
    <div>
      <ul className="space-y-1.5" lang={text.locale} dir={text.dir}>
        {items.map((item) => (
          <li key={item} className="flex items-start gap-2 text-sm text-slate-700">
            {icon === "check" ? <Check className="mt-0.5 size-4 shrink-0 text-emerald-600" aria-hidden="true" /> : icon === "x" ? <X className="mt-0.5 size-4 shrink-0 text-red-500" aria-hidden="true" /> : <span className="mt-2 size-1.5 shrink-0 rounded-full bg-slate-400" aria-hidden="true" />}
            {item}
          </li>
        ))}
      </ul>
      {text.isFallback ? <FallbackBadge locale={text.locale} className="mt-1" /> : null}
    </div>
  );
}

export function TourDetailView({
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
  const router = useRouter();
  const fmt = useTourDateFormat();
  const rtl = directionOf(locale) === "rtl";
  const Back = rtl ? ArrowRight : ArrowLeft;
  const title = detail.text.title?.value ?? detail.slug;
  const recorded = useRef(false);
  const relatedSaved = new Set(savedIds);
  const bookable = departures.filter((d) => d.bookable);
  const f = detail.facts;
  const tx = detail.text;

  // Recently Viewed (C-103): recorded through a server action so the guest cookie can be set.
  useEffect(() => {
    if (recorded.current) return;
    recorded.current = true;
    void recordViewAction(detail.id).catch(() => undefined);
  }, [detail.id]);

  async function share() {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      toast.success(td("shareCopied"));
    } catch (e) {
      if ((e as Error)?.name !== "AbortError") toast.error(td("shareFailed"));
    }
  }

  const audience = [
    f.accessibility.family && t("explore.fields.family"),
    f.accessibility.wheelchair && t("explore.fields.accessible"),
    f.accessibility.lowMobility && t("explore.fields.lowMobility"),
    f.accessibility.recovery && t("explore.fields.recovery"),
  ].filter(Boolean) as string[];

  const groupText = f.maxParticipants ? td("facts.groupValue", { min: formatNumber(f.minParticipants, locale), max: formatNumber(f.maxParticipants, locale) }) : td("facts.groupMin", { min: formatNumber(f.minParticipants, locale) });
  const ageText = f.minAge != null && f.maxAge != null ? td("facts.ageRange", { min: formatNumber(f.minAge, locale), max: formatNumber(f.maxAge, locale) }) : f.minAge != null ? td("facts.ageMin", { min: formatNumber(f.minAge, locale) }) : td("facts.anyAge");
  const cutoffText = f.bookingCutoffMinutes >= 60 ? td("facts.cutoffValue", { hours: Math.round(f.bookingCutoffMinutes / 60) }) : td("facts.cutoffMinutes", { minutes: formatNumber(f.bookingCutoffMinutes, locale) });
  const policy = detail.policy;
  const meeting = detail.location.meeting;
  const firstHighlight = tx.highlights ? lines(tx.highlights.value)[0] : null;

  return (
    <article className="pb-36 md:pb-24" data-testid="tour-detail" data-tour-id={detail.id}>
      <div className="flex items-center gap-2 px-3 pt-2 sm:px-6">
        <button type="button" onClick={() => (window.history.length > 1 ? router.back() : router.push("/tours/explore"))} aria-label={t("nav.back")} className="flex size-11 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-slate-200 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:outline-none">
          <Back className="size-5" aria-hidden="true" />
        </button>
        <p className="min-w-0 flex-1 truncate text-center text-sm font-semibold text-slate-700">{detail.destination?.name?.value ?? ""}</p>
        <button type="button" onClick={share} aria-label={td("share")} className="flex size-11 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-slate-200 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:outline-none" data-testid="share-tour">
          <Share2 className="size-5" aria-hidden="true" />
        </button>
        <WishlistButton tourId={detail.id} initialSaved={saved} title={title} className="ring-1 ring-slate-200" />
      </div>

      <div className="mx-auto max-w-4xl sm:px-6">
        <Gallery
          media={detail.media}
          title={title}
          overlay={
            weather.status === "ok" && (weather.current || weather.forecast) ? (
              <span className="pointer-events-none absolute start-7 top-3 rounded-2xl bg-black/45 px-3 py-1.5 text-xs text-white backdrop-blur sm:start-3" aria-hidden="true">
                <bdi>{formatNumber(Math.round(weather.current?.temperatureC ?? weather.forecast!.maxC), locale)}°C</bdi> · {t(`weather.conditions.${weather.current?.condition ?? weather.forecast!.condition}`)}
              </span>
            ) : null
          }
        />

        <header className="px-4 pt-4 sm:px-0">
          <h1 className="text-2xl leading-tight font-extrabold text-slate-900 sm:text-3xl" data-testid="tour-title">
            <LocalizedText text={tx.title} badge={false} />
          </h1>
          {tx.title?.isFallback ? <FallbackBadge locale={tx.title.locale} className="mt-1" /> : null}
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-600">
            {detail.destination?.name ? (
              <span className="inline-flex items-center gap-1" data-testid="tour-location">
                <MapPin className="size-4" aria-hidden="true" />
                <LocalizedText text={detail.destination.name} badge={false} />
                {detail.destination.region ? (
                  <>
                    {rtl ? "، " : ", "}
                    <LocalizedText text={detail.destination.region} badge={false} />
                  </>
                ) : null}
              </span>
            ) : null}
            <span>{td.has(`tourTypes.${f.tourType}`) ? td(`tourTypes.${f.tourType}`) : f.tourType}</span>
            {detail.rating.count > 0 && detail.rating.avg != null ? (
              <a href="#reviews" className="inline-flex items-center gap-1 font-medium text-slate-800">
                <Star className="size-4 fill-amber-400 text-amber-400" aria-hidden="true" />
                {t("card.rating", { rating: formatNumber(detail.rating.avg, locale, { maximumFractionDigits: 1 }), count: detail.rating.count })}
              </a>
            ) : null}
          </div>
          <div className="mt-3 flex items-center gap-3 rounded-2xl bg-white p-3 ring-1 ring-slate-200" data-testid="provider">
            <div className="min-w-0 flex-1">
              <p className="text-xs text-slate-500">{td("provider")}</p>
              <p className="truncate text-sm font-semibold text-slate-900">
                <LocalizedText text={detail.provider.name} badge={false} placeholder="—" />
              </p>
            </div>
            {detail.provider.verified ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800" title={td("verifiedProviderHint")} data-testid="verified-provider">
                <ShieldCheck className="size-4" aria-hidden="true" />
                {td("verifiedProvider")}
              </span>
            ) : null}
          </div>
        </header>

        {/* Quick facts row (3-tour_page_1.png) */}
        <ul className="mx-4 mt-3 grid grid-cols-3 divide-x divide-slate-200 rounded-2xl bg-white py-3 text-center text-xs text-slate-700 ring-1 ring-slate-200 rtl:divide-x-reverse sm:mx-0">
          <li className="flex flex-col items-center gap-1 px-1">
            <Clock className="size-4 text-emerald-700" aria-hidden="true" />
            <span className="sr-only">{td("facts.duration")}:</span>
            {durationLabel((k, v) => t(`card.${k}`, v), f)}
          </li>
          <li className="flex flex-col items-center gap-1 px-1">
            <Users className="size-4 text-emerald-700" aria-hidden="true" />
            <span className="sr-only">{td("facts.groupSize")}:</span>
            {groupText}
          </li>
          <li className="flex flex-col items-center gap-1 px-1">
            <Languages className="size-4 text-emerald-700" aria-hidden="true" />
            <span className="sr-only">{td("facts.languages")}:</span>
            {f.guideLanguages.map((l) => languageName(l, locale)).join(rtl ? "، " : ", ") || "—"}
          </li>
        </ul>

        {firstHighlight ? (
          <blockquote className="mx-4 mt-4 border-s-4 border-slate-900 ps-3 text-sm leading-6 text-slate-700 sm:mx-0" lang={tx.highlights!.locale} dir={tx.highlights!.dir}>
            {firstHighlight}
          </blockquote>
        ) : null}

        <nav aria-label={td("tabs.label")} className="sticky top-14 z-30 mt-4 border-b border-slate-200 bg-slate-50/95 backdrop-blur">
          <ul className="flex gap-1 overflow-x-auto px-4 [scrollbar-width:none] sm:px-0">
            {SECTIONS.map((s) => (
              <li key={s} className="shrink-0">
                <a href={`#${s}`} className="flex min-h-11 items-center border-b-2 border-transparent px-3 text-sm font-medium text-slate-600 hover:border-emerald-600 hover:text-emerald-800 focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:outline-none">
                  {td(`tabs.${s}`)}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <Section id="overview" title={td("tabs.overview")}>
          <div className="space-y-4">
            {tx.summary ? <LocalizedText text={tx.summary} as="p" className="text-[15px] leading-7 font-medium text-slate-800" /> : null}
            {tx.highlights ? (
              <div>
                <h3 className="mb-2 text-sm font-bold text-slate-900">{td("highlights")}</h3>
                <List text={tx.highlights} icon="check" />
              </div>
            ) : null}
            {tx.description ? (
              <div>
                <h3 className="mb-2 text-sm font-bold text-slate-900">{td("description")}</h3>
                <Expandable text={tx.description} />
              </div>
            ) : null}
            <dl className="grid grid-cols-2 gap-3 rounded-2xl bg-white p-4 text-sm ring-1 ring-slate-200 sm:grid-cols-3" data-testid="facts">
              <Fact label={td("facts.duration")} value={durationLabel((k, v) => t(`card.${k}`, v), f)} />
              <Fact label={td("facts.difficulty")} value={f.difficulty ? (td.has(`difficulty.${f.difficulty}`) ? td(`difficulty.${f.difficulty}`) : f.difficulty) : t("common.notProvided")} />
              {f.activityLevel != null ? <Fact label={td("facts.activityLevel")} value={td("facts.activityValue", { level: formatNumber(f.activityLevel, locale) })} /> : null}
              <Fact label={td("facts.groupSize")} value={groupText} />
              <Fact label={td("facts.ages")} value={ageText} />
              <Fact label={td("facts.confirmation")} value={f.confirmationMode === "instant" ? t("card.instant") : t("card.request")} />
              <Fact label={td("facts.cutoff")} value={cutoffText} />
              {f.transportModes.length ? <Fact label={td("facts.transport")} value={f.transportModes.map((m) => (td.has(`transport.${m}`) ? td(`transport.${m}`) : m)).join(", ")} /> : null}
              {audience.length ? <Fact label={td("facts.audience")} value={audience.join(", ") + (f.accessibility.verified ? "" : ` (${td("facts.unverified")})`)} /> : null}
            </dl>
            <WeatherCard view={weather} date={weatherDate} />
          </div>
        </Section>

        <Section id="itinerary" title={td("itinerary.title")}>
          <Itinerary stops={detail.itinerary} timezone={f.timezone} />
        </Section>

        <Section id="features" title={td("tabs.features")}>
          <div className="grid gap-5 sm:grid-cols-2">
            {tx.inclusions ? (
              <div data-testid="inclusions">
                <h3 className="mb-2 text-sm font-bold text-slate-900">{td("included")}</h3>
                <List text={tx.inclusions} icon="check" />
              </div>
            ) : null}
            {tx.exclusions ? (
              <div data-testid="exclusions">
                <h3 className="mb-2 text-sm font-bold text-slate-900">{td("excluded")}</h3>
                <List text={tx.exclusions} icon="x" />
              </div>
            ) : null}
            {tx.what_to_bring ? (
              <div>
                <h3 className="mb-2 text-sm font-bold text-slate-900">{td("whatToBring")}</h3>
                <List text={tx.what_to_bring} icon="dot" />
              </div>
            ) : null}
            {tx.accessibility_notes ? (
              <div>
                <h3 className="mb-2 text-sm font-bold text-slate-900">{td("accessibilityNotes")}</h3>
                <LocalizedText text={tx.accessibility_notes} as="p" className="text-sm leading-6 text-slate-700" />
              </div>
            ) : null}
            {tx.documents_notes ? (
              <div>
                <h3 className="mb-2 text-sm font-bold text-slate-900">{td("documents")}</h3>
                <LocalizedText text={tx.documents_notes} as="p" className="text-sm leading-6 text-slate-700" />
              </div>
            ) : null}
            {tx.age_conditions ? (
              <div>
                <h3 className="mb-2 text-sm font-bold text-slate-900">{td("ageConditions")}</h3>
                <LocalizedText text={tx.age_conditions} as="p" className="text-sm leading-6 text-slate-700" />
              </div>
            ) : null}
          </div>
          {f.pickupAvailable || f.privateAvailable ? (
            <ul className="mt-4 flex flex-wrap gap-2 text-xs">
              {f.pickupAvailable ? <li className="rounded-full bg-white px-3 py-1.5 ring-1 ring-slate-200">{td("facts.pickup")}</li> : null}
              {f.privateAvailable ? <li className="rounded-full bg-white px-3 py-1.5 ring-1 ring-slate-200">{td("facts.private")}</li> : null}
            </ul>
          ) : null}
          {detail.guides.length > 0 ? (
            <div className="mt-6">
              <h3 className="mb-2 text-sm font-bold text-slate-900">{td("guides.title")}</h3>
              <ul className="grid gap-3 sm:grid-cols-2">
                {detail.guides.map((g) => (
                  <li key={g.id} className="rounded-2xl bg-white p-3 ring-1 ring-slate-200" data-testid="guide">
                    <p className="flex items-center gap-1 text-sm font-semibold text-slate-900">
                      <bdi>{g.displayName}</bdi>
                      {g.verified ? <BadgeCheck className="size-4 text-emerald-600" aria-label={td("guides.verified")} /> : null}
                    </p>
                    <p className="text-xs text-slate-500">{td("guides.languages", { languages: g.languages.map((l) => languageName(l.code, locale)).join(", ") })}</p>
                    {g.bio ? <LocalizedText text={g.bio} as="p" className="mt-1 text-sm text-slate-700" clamp /> : null}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </Section>

        <Section id="rules" title={td("policies.title")}>
          <div className="space-y-5" data-testid="policies">
            {policy ? (
              <div>
                <h3 className="mb-2 text-sm font-bold text-slate-900">{td("policies.cancellation")}</h3>
                <table className="w-full overflow-hidden rounded-2xl bg-white text-sm ring-1 ring-slate-200" data-testid="cancellation-rules">
                  <tbody>
                    {[...policy.cancellationRules]
                      .sort((a, b) => b.hoursBefore - a.hoursBefore)
                      .map((r) => (
                        <tr key={r.hoursBefore} className="border-b border-slate-100 last:border-0">
                          <td className="p-3 text-slate-700">{td("policies.rule", { hours: r.hoursBefore })}</td>
                          <td className="p-3 text-end font-semibold text-slate-900">{td("policies.refund", { percent: formatNumber(r.refundPercent, locale) })}</td>
                        </tr>
                      ))}
                    <tr>
                      <td className="p-3 text-slate-500" colSpan={2}>
                        {td("policies.laterNoRefund")}
                      </td>
                    </tr>
                  </tbody>
                </table>
                {policy.text.cancellation ? <LocalizedText text={policy.text.cancellation} as="p" className="mt-2 text-sm leading-6 text-slate-700" /> : null}
                <ul className="mt-2 space-y-1 text-sm text-slate-700">
                  <li>{td("policies.noShow", { percent: formatNumber(policy.noShowRefundPercent, locale) })}</li>
                  {policy.lateArrivalMinutes != null ? <li>{td("policies.lateArrival", { minutes: formatNumber(policy.lateArrivalMinutes, locale) })}</li> : null}
                  {f.minParticipants > 1 ? <li>{td("policies.minParticipants", { count: f.minParticipants })}</li> : null}
                </ul>
              </div>
            ) : (
              <p className="text-sm text-slate-600">{td("policies.none")}</p>
            )}
            {policy ? (
              <div>
                <h3 className="mb-1 text-sm font-bold text-slate-900">{td("policies.weather")}</h3>
                <p className="text-sm text-slate-700">{td.has(`policies.weatherPolicies.${policy.weatherPolicy}`) ? td(`policies.weatherPolicies.${policy.weatherPolicy}`) : policy.weatherPolicy}</p>
              </div>
            ) : null}
            {policy?.text.rules || tx.rules ? (
              <div>
                <h3 className="mb-1 text-sm font-bold text-slate-900">{td("policies.rules")}</h3>
                {policy?.text.rules ? <LocalizedText text={policy.text.rules} as="p" className="text-sm leading-6 text-slate-700" /> : null}
                {tx.rules ? <LocalizedText text={tx.rules} as="p" className="text-sm leading-6 text-slate-700" /> : null}
              </div>
            ) : null}
            {tx.safety_notes ? (
              <div>
                <h3 className="mb-1 text-sm font-bold text-slate-900">{td("policies.safety")}</h3>
                <LocalizedText text={tx.safety_notes} as="p" className="text-sm leading-6 text-slate-700" />
              </div>
            ) : null}
            {tx.booking_instructions ? (
              <div>
                <h3 className="mb-1 text-sm font-bold text-slate-900">{td("bookingInstructions")}</h3>
                <LocalizedText text={tx.booking_instructions} as="p" className="text-sm leading-6 text-slate-700" />
              </div>
            ) : null}
            {tx.faq ? (
              <details className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
                <summary className="min-h-11 cursor-pointer content-center text-sm font-bold text-slate-900">{td("faq")}</summary>
                <LocalizedText text={tx.faq} as="p" className="mt-2 text-sm leading-6 text-slate-700" />
              </details>
            ) : null}
          </div>
        </Section>

        <Section id="location" title={td("meeting.title")}>
          <div className="space-y-3" data-testid="meeting">
            {meeting ? (
              <>
                <TourMap
                  points={[
                    { id: "meeting", lat: meeting.lat, lng: meeting.lng, label: td("meeting.title"), kind: "meeting", exact: meeting.exact, radiusM: meeting.radiusM },
                    ...(detail.location.end ? [{ id: "end", lat: detail.location.end.lat, lng: detail.location.end.lng, label: td("meeting.end"), kind: "finish" as const, exact: true }] : []),
                  ]}
                  labels={{ region: td("meeting.title"), unavailable: td("itinerary.mapUnavailable"), approximate: td("itinerary.approximate") }}
                  height={220}
                />
                {meeting.exact ? (
                  <a href={directionsHref(meeting.lat, meeting.lng)} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-1 text-sm font-medium text-emerald-700">
                    <Navigation className="size-4" aria-hidden="true" />
                    {td("itinerary.openDirections")}
                  </a>
                ) : (
                  <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900" data-testid="approximate-location">
                    {td("meeting.approximate")}
                  </p>
                )}
              </>
            ) : (
              <p className="text-sm text-slate-600">{td("meeting.noLocation")}</p>
            )}
            {tx.meeting_instructions && meeting?.exact ? (
              <div>
                <h3 className="mb-1 text-sm font-bold text-slate-900">{td("meeting.instructions")}</h3>
                <LocalizedText text={tx.meeting_instructions} as="p" className="text-sm leading-6 text-slate-700" />
              </div>
            ) : null}
            {tx.pickup_instructions ? (
              <div>
                <h3 className="mb-1 text-sm font-bold text-slate-900">{td("meeting.pickup")}</h3>
                <LocalizedText text={tx.pickup_instructions} as="p" className="text-sm leading-6 text-slate-700" />
              </div>
            ) : null}
          </div>
        </Section>

        <Section id="reviews" title={td("reviews.title")}>
          <Reviews reviews={detail.reviews} rating={detail.rating} />
        </Section>

        <Section id="booking" title={td("tabs.booking")}>
          {bookable.length === 0 ? (
            <p className="text-sm text-slate-600" data-testid="no-departures">
              {t("booking.noDepartures")}
            </p>
          ) : (
            <ul className="space-y-2" data-testid="upcoming-departures">
              {bookable.slice(0, 5).map((d) => (
                <li key={d.id}>
                  <Link
                    href={`/tours/t/${detail.slug}/book?departure=${d.id}`}
                    className="flex min-h-14 items-center justify-between gap-3 rounded-2xl bg-white px-4 py-2 ring-1 ring-slate-200 hover:ring-emerald-300 focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:outline-none"
                  >
                    <span className="flex items-center gap-2 text-sm">
                      <CalendarDays className="size-4 text-emerald-700" aria-hidden="true" />
                      <span suppressHydrationWarning className="font-medium text-slate-900">
                        {fmt.date(d.localDate, "medium")}
                      </span>
                      {d.localTime ? <span className="text-slate-500">{formatClock(d.localTime, locale)}</span> : null}
                    </span>
                    <span className="text-end text-xs text-slate-500">
                      {d.priceFrom != null ? <TourPrice amount={d.priceFrom} currency={f.currency} className="block text-sm font-semibold text-emerald-800" /> : null}
                      {t("card.seatsLeft", { count: d.remaining })}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-2 text-xs text-slate-500">{t("booking.localTime", { zone: f.timezone })}</p>
          {f.privateAvailable ? (
            <div className="mt-4">
              <InquiryDialog tourId={detail.id} triggerClassName="min-h-11 rounded-xl border border-emerald-700 px-4 text-sm font-semibold text-emerald-800 hover:bg-emerald-50" />
            </div>
          ) : null}
        </Section>

        {related.length > 0 ? (
          <Section id="related" title={td("related")}>
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((c) => (
                <li key={c.id}>
                  <TourCard card={c} saved={relatedSaved.has(c.id)} />
                </li>
              ))}
            </ul>
          </Section>
        ) : null}
      </div>

      {/* Sticky booking bar (tour_info_1.png): "from … per person" + CTA (C-042). */}
      <div className="fixed inset-x-0 bottom-[calc(3.5rem+env(safe-area-inset-bottom))] z-30 border-t border-slate-200 bg-white/95 px-4 py-2.5 backdrop-blur md:bottom-0" data-testid="sticky-book-bar">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-3">
          <FromPrice amount={detail.fromPrice} currency={f.currency} basis={detail.fromPriceBasis} />
          {bookable.length > 0 ? (
            <Link
              href={`/tours/t/${detail.slug}/book`}
              className="inline-flex min-h-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-700 px-6 text-sm font-bold text-white shadow hover:bg-emerald-800 focus-visible:ring-4 focus-visible:ring-emerald-200 focus-visible:outline-none"
              data-testid="book-now"
            >
              {td("sticky.checkAvailability")}
            </Link>
          ) : (
            <span className="inline-flex min-h-12 items-center rounded-2xl bg-slate-200 px-5 text-sm font-semibold text-slate-600">{td("sticky.noDepartures")}</span>
          )}
        </div>
      </div>
    </article>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd className="font-medium text-slate-900">{value}</dd>
    </div>
  );
}
