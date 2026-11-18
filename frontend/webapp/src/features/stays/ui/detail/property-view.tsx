"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import {
  Accessibility,
  BadgeCheck,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  HeartPulse,
  Images,
  Landmark as LandmarkIcon,
  Loader2,
  LogIn,
  LogOut,
  MapPin,
  Share2,
  ShieldCheck,
  Users,
  X,
  Zap,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { todayIn } from "@/features/stays/domain/dates";
import { directionOf } from "@/features/tours/domain/content";
import { LocalizedText } from "@/features/tours/ui/shared/localized-text";
import { Link, useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

import { stayQueryOnly, toSearchParams, type StaySearch } from "../../domain/search";
import { recordStayViewAction, stayPriceCalendarAction } from "../../server/actions/customer";
import type { Landmark, MediaItem, PropertyCard, PropertyDetail, ReviewItem, RoomOffer } from "../../types";
import { LinkPending, Money, RatingBadge, StarRating, StayImage, useClock, useDistance, useNumber, useShortDate } from "../common";
import { WishlistButton } from "../property-card";
import { DatesDialog, GuestsDialog } from "../search/search-form";

import { AmenityIcon } from "./amenity-icon";
import { StayLocation } from "./location";
import { ReviewsSection } from "./reviews";
import { RoomsSection } from "./rooms";

type ReviewStats = { histogram: number[]; recommendPercent: number | null };
const SECTIONS = ["rooms", "amenities", "location", "policies", "reviews"] as const;

/**
 * Property page (H04/H05), mobile first. No search form here: the stay (dates + party) is a
 * one-line bar that opens the date picker (with each night's price) or the guest picker in
 * place. Rooms sort and filter on the device; each room opens a sheet with its photos, rates
 * and reviews. Heavy parts (interactive map, full gallery) load only when asked for.
 */
export function PropertyView({
  property,
  rooms,
  reviews,
  reviewStats,
  similar = [],
  landmarks = [],
  amenityLabels = {},
  search,
  dateError,
  saved,
  focusRoomId = null,
  preview = false,
}: {
  property: PropertyDetail;
  rooms: RoomOffer[];
  reviews: ReviewItem[];
  reviewStats?: ReviewStats;
  similar?: PropertyCard[];
  landmarks?: Landmark[];
  amenityLabels?: Record<string, { label: string; icon: string | null }>;
  search: StaySearch;
  dateError: string | null;
  saved: boolean;
  focusRoomId?: string | null;
  preview?: boolean;
}) {
  const t = useTranslations("StayApp.detail");
  const tKinds = useTranslations("StayApp.kinds");
  const tSearch = useTranslations("StayApp.search");
  const router = useRouter();
  const [pending, start] = useTransition();
  const name = property.name?.value ?? property.slug;
  const hasDates = Boolean(search.checkIn && search.checkOut) && !dateError;
  const [datesOpen, setDatesOpen] = useState(false);
  const [guestsOpen, setGuestsOpen] = useState(false);
  const pendingRoom = useRef<string | null>(null);
  const calendar = usePriceCalendar(property.id, search, datesOpen);

  useEffect(() => {
    if (!preview) void recordStayViewAction({ propertyId: property.id }).catch(() => undefined);
  }, [property.id, preview]);

  const go = useCallback(
    (next: Partial<StaySearch>, room: string | null = null) => {
      const p = stayQueryOnly({ ...search, ...next });
      if (room) p.set("room", room);
      const qs = p.toString();
      start(() => router.replace(`/stays/${property.slug}${qs ? `?${qs}` : ""}`, { scroll: false }));
    },
    [search, property.slug, router],
  );

  const pickDates = (roomTypeId: string | null) => {
    pendingRoom.current = roomTypeId;
    setDatesOpen(true);
  };

  const cheapest = rooms
    .flatMap((r) => r.plans)
    .filter((p) => p.quote && !p.unavailableReason)
    .sort((a, b) => a.quote!.total - b.quote!.total)[0];
  const hotelMedia = property.media.filter((m) => !m.roomTypeId);

  return (
    <div className="pb-28 md:pb-8" data-testid="stay-detail">
      <Gallery media={hotelMedia.length ? hotelMedia : property.media} title={name} saved={saved} propertyId={property.id} />

      <div className="mx-auto grid max-w-6xl gap-8 px-4 pt-4 sm:px-6 lg:grid-cols-[1fr_340px]">
        <div className="min-w-0 space-y-7">
          <header>
            <nav aria-label={t("breadcrumbs")} className="text-xs text-slate-500" data-testid="stay-breadcrumbs">
              <ol className="flex flex-wrap items-center gap-1">
                <li>
                  <Link href="/stays" className="hover:underline">
                    {t("breadcrumbStays")}
                  </Link>
                </li>
                <li aria-hidden="true">/</li>
                <li>
                  <Link href={`/stays/city/${property.city.slug}`} className="hover:underline">
                    {property.city.name}
                  </Link>
                </li>
              </ol>
            </nav>
            <h1 className="mt-1.5 text-2xl leading-tight font-extrabold text-slate-900 md:text-3xl" data-testid="stay-title">
              {name}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-slate-600">
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-800">{tKinds(property.kind)}</span>
              <StarRating count={property.starRating} />
              <a href="#reviews" className="hover:underline">
                <RatingBadge value={property.ratingAvg} count={property.reviewCount} />
              </a>
            </div>
            <p className="mt-2 flex items-start gap-1 text-sm text-slate-600">
              <MapPin className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <span>
                {property.city.name}
                {property.address && property.location && !property.location.approximate ? `، ${property.address.value}` : ""}
              </span>
            </p>
            <Highlights property={property} />
          </header>

          <SectionTabs />

          <StayBar
            search={search}
            hasDates={hasDates}
            pending={pending}
            onDates={() => pickDates(null)}
            onGuests={() => setGuestsOpen(true)}
          />
          {dateError ? (
            <p role="alert" className="-mt-4 text-sm font-medium text-red-700" data-testid="stay-detail-date-error">
              {tSearch(`errors.${dateError}` as "errors.too_many_nights", { max: 30 })}
            </p>
          ) : null}

          <RoomsSection
            property={property}
            rooms={rooms}
            reviews={reviews}
            search={search}
            hasDates={hasDates}
            preview={preview}
            pending={pending}
            amenityLabels={amenityLabels}
            focusRoomId={focusRoomId}
            onPickDates={pickDates}
            onPickGuests={() => setGuestsOpen(true)}
          />

          {property.description || property.summary ? <About property={property} /> : null}

          <Amenities property={property} />

          <StayLocation property={property} name={name} />

          <Policies property={property} />

          <ReviewsSection property={property} reviews={reviews} stats={reviewStats ?? { histogram: [0, 0, 0, 0, 0], recommendPercent: null }} />

          <Faq property={property} name={name} />

          {similar.length ? <Similar cards={similar} city={property.city.name} query={stayQueryOnly(search).toString()} /> : null}

          <RelatedSearches property={property} landmarks={landmarks} />
        </div>

        <aside className="hidden lg:block">
          <div className="sticky top-20 space-y-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
            <PriceSummary property={property} total={cheapest?.quote?.total ?? null} nights={cheapest?.quote?.nights ?? null} />
            <PrimaryCta hasDates={hasDates} onDates={() => pickDates(null)} />
            {property.provider.name ? <p className="text-xs text-slate-500">{t("provider", { name: property.provider.name })}</p> : null}
          </div>
        </aside>
      </div>

      <div className="fixed inset-x-0 bottom-[calc(3.5rem+env(safe-area-inset-bottom))] z-30 border-t border-slate-200 bg-white/95 px-4 py-2 shadow-[0_-4px_16px_rgba(15,23,42,0.06)] backdrop-blur md:bottom-0 lg:hidden" data-testid="stay-sticky-bar">
        <div className="mx-auto flex max-w-xl items-center justify-between gap-3">
          <div className="min-w-0">
            <PriceSummary property={property} total={cheapest?.quote?.total ?? null} nights={cheapest?.quote?.nights ?? null} compact />
          </div>
          <PrimaryCta hasDates={hasDates} onDates={() => pickDates(null)} compact />
        </div>
      </div>

      <DatesDialog
        open={datesOpen}
        onOpenChange={(v) => {
          setDatesOpen(v);
          if (!v) setTimeout(() => (pendingRoom.current = null), 0);
        }}
        value={{ from: search.checkIn, to: search.checkOut }}
        onChange={(v) => go({ checkIn: v.from, checkOut: v.to }, v.from && v.to ? pendingRoom.current : null)}
        dayInfo={calendar.dayInfo}
        note={calendar.note}
      />
      <GuestsDialog
        open={guestsOpen}
        onOpenChange={setGuestsOpen}
        value={{ adults: search.adults, childAges: search.childAges, rooms: search.rooms }}
        onChange={(v) => go({ adults: v.adults, childAges: v.childAges.filter((a): a is number => a != null), rooms: v.rooms })}
      />
    </div>
  );
}

/** Cheapest nightly price per day, fetched once when the date picker first opens. */
function usePriceCalendar(propertyId: string, search: StaySearch, open: boolean) {
  const t = useTranslations("StayApp.detail");
  const num = useNumber();
  const [data, setData] = useState<{ key: string; currency: string; days: Map<string, number | null> } | null>(null);
  const key = `${propertyId}:${search.adults}:${search.rooms}:${search.childAges.join(".")}`;
  useEffect(() => {
    if (!open || data?.key === key) return;
    let alive = true;
    void stayPriceCalendarAction({
      propertyId,
      from: todayIn("Asia/Tehran"),
      days: 120,
      occupancy: { rooms: search.rooms, adults: Math.max(search.adults, search.rooms), childAges: search.childAges },
    })
      .then((res) => {
        if (alive && res.ok) setData({ key, currency: res.data.currency, days: new Map(res.data.days.map((d) => [d.date, d.price])) });
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [open, key, data?.key, propertyId, search.adults, search.rooms, search.childAges]);

  const toman = data?.currency === "IRR";
  const dayInfo = useCallback(
    (iso: string) => {
      if (!data || data.key !== key || !data.days.has(iso)) return null;
      const price = data.days.get(iso) ?? null;
      if (price == null) return { soldOut: true, sublabel: "—", srLabel: t("calendarSoldOut") };
      const label = toman ? num(Math.round(price / 10_000)) : num(price, { notation: "compact", maximumFractionDigits: 1 });
      return { sublabel: label, srLabel: t("calendarPrice", { price: label }) };
    },
    [data, key, toman, num, t],
  );
  return { dayInfo, note: data && data.key === key ? (toman ? t("calendarNoteToman") : t("calendarNote")) : null };
}

function PriceSummary({ property, total, nights, compact = false }: { property: PropertyDetail; total: number | null; nights: number | null; compact?: boolean }) {
  const t = useTranslations("StayApp.detail");
  if (total != null && nights) {
    return (
      <div>
        <p className="text-[11px] text-slate-500">{t("room.totalFor", { nights })}</p>
        <Money amount={total} currency={property.currency} className={compact ? "text-lg font-extrabold" : "text-2xl font-extrabold"} />
      </div>
    );
  }
  if (property.fromNightly == null) return null;
  return (
    <div>
      <p className="text-[11px] text-slate-500">{t("fromPerNightLabel")}</p>
      <Money amount={property.fromNightly} currency={property.currency} className={compact ? "text-lg font-extrabold" : "text-2xl font-extrabold"} />
    </div>
  );
}

function PrimaryCta({ hasDates, onDates, compact = false }: { hasDates: boolean; onDates: () => void; compact?: boolean }) {
  const t = useTranslations("StayApp.detail");
  const cls = cn("inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-orange-500 font-bold text-white hover:bg-orange-600", compact ? "min-h-11 px-5 text-sm" : "min-h-12 w-full text-base");
  return hasDates ? (
    <a href="#rooms" className={cls} data-testid="stay-sticky-cta">
      {t("chooseRoom")}
    </a>
  ) : (
    <button type="button" onClick={onDates} className={cls} data-testid="stay-sticky-cta">
      <CalendarDays className="size-4" aria-hidden="true" />
      {t("selectDates")}
    </button>
  );
}

/** The stay being priced, as one tappable line (dates · party) — no search form on a property page. */
function StayBar({ search, hasDates, pending, onDates, onGuests }: { search: StaySearch; hasDates: boolean; pending: boolean; onDates: () => void; onGuests: () => void }) {
  const t = useTranslations("StayApp.detail");
  const tSearch = useTranslations("StayApp.search");
  const short = useShortDate();
  const children = search.childAges.length;
  return (
    <div className="grid grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] gap-2" data-testid="stay-bar">
      <button
        type="button"
        onClick={onDates}
        className={cn("flex min-h-14 min-w-0 items-center gap-2.5 rounded-2xl bg-white px-3 text-start ring-1 hover:ring-emerald-400", hasDates ? "ring-slate-200" : "ring-amber-300")}
        data-testid="stay-dates-button"
      >
        <CalendarDays className="size-5 shrink-0 text-emerald-700" aria-hidden="true" />
        <span className="min-w-0">
          <span className="block text-[11px] text-slate-500">{t("yourDates")}</span>
          <span className={cn("block truncate text-sm font-bold", hasDates ? "text-slate-900" : "text-amber-800")} data-testid="stay-bar-dates">
            {hasDates ? `${short(search.checkIn!)} – ${short(search.checkOut!)}` : t("selectDates")}
          </span>
        </span>
      </button>
      <button type="button" onClick={onGuests} className="flex min-h-14 min-w-0 items-center gap-2.5 rounded-2xl bg-white px-3 text-start ring-1 ring-slate-200 hover:ring-emerald-400" data-testid="stay-guests-button">
        <Users className="size-5 shrink-0 text-emerald-700" aria-hidden="true" />
        <span className="min-w-0">
          <span className="block text-[11px] text-slate-500">{tSearch("guests")}</span>
          <span className="block truncate text-sm font-bold text-slate-900" data-testid="stay-bar-guests">
            {t("partyShort", { adults: search.adults, children, rooms: search.rooms })}
          </span>
        </span>
        {pending ? <Loader2 className="ms-auto size-4 shrink-0 animate-spin text-emerald-700" aria-label={t("updatingRooms")} /> : null}
      </button>
    </div>
  );
}

function Highlights({ property }: { property: PropertyDetail }) {
  const t = useTranslations("StayApp.detail");
  const { length, travel } = useDistance();
  const free = property.policy?.rules.find((r) => r.refundPercent >= 100);
  const place = property.nearby.find((n) => n.kind === "shrine") ?? property.nearby.find((n) => n.kind === "attraction" || n.kind === "shopping") ?? null;
  const items: { icon: typeof Zap; title: string; text: string; key: string }[] = [];
  items.push(
    property.confirmationMode === "instant"
      ? { key: "instant", icon: Zap, title: t("hl.instant"), text: t("hl.instantText") }
      : { key: "request", icon: BadgeCheck, title: t("hl.request"), text: t("hl.requestText") },
  );
  if (free) items.push({ key: "cancel", icon: ShieldCheck, title: t("hl.freeCancel"), text: t("hl.freeCancelText", { hours: free.hoursBefore }) });
  if (place) items.push({ key: "near", icon: LandmarkIcon, title: length(place.distanceM), text: t("hl.toPlace", { place: place.name, travel: travel(place.distanceM) }) });
  if (property.medicalFriendly && items.length < 3) items.push({ key: "medical", icon: HeartPulse, title: t("medicalFriendly"), text: t("hl.medicalText") });
  return (
    <ul className="mt-4 grid grid-cols-3 gap-2 [&>li]:min-w-0" data-testid="stay-highlights">
      {items.slice(0, 3).map((it) => (
        <li key={it.key} className="rounded-2xl bg-white p-2.5 text-center ring-1 ring-slate-200" data-testid={`stay-highlight-${it.key}`}>
          <it.icon className="mx-auto size-5 text-emerald-700" aria-hidden="true" />
          <p className="mt-1 text-xs font-bold text-slate-900">{it.title}</p>
          <p className="mt-0.5 text-[11px] leading-4 text-slate-500">{it.text}</p>
        </li>
      ))}
    </ul>
  );
}

/** Jump links that stay under the header; the current section is highlighted. Five equal columns, never a sideways scroll. */
function SectionTabs() {
  const t = useTranslations("StayApp.detail");
  const [active, setActive] = useState<(typeof SECTIONS)[number]>("rooms");
  useEffect(() => {
    const els = SECTIONS.map((id) => document.getElementById(id)).filter((e): e is HTMLElement => Boolean(e));
    if (!els.length || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      (entries) => {
        const top = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (top) setActive(top.target.id as (typeof SECTIONS)[number]);
      },
      { rootMargin: "-120px 0px -60% 0px" },
    );
    els.forEach((e) => io.observe(e));
    return () => io.disconnect();
  }, []);
  return (
    <nav aria-label={t("sections")} className="sticky top-14 z-20 -mx-4 border-b border-slate-200 bg-slate-50/95 px-2 backdrop-blur sm:-mx-6 sm:px-4" data-testid="stay-section-tabs">
      <ul className="grid grid-cols-5 [&>li]:min-w-0">
        {SECTIONS.map((id) => (
          <li key={id} className="min-w-0">
            <a
              href={`#${id}`}
              aria-current={active === id ? "location" : undefined}
              className={cn(
                "flex min-h-11 items-center justify-center border-b-2 px-0.5 text-center text-[12px] leading-tight font-semibold [overflow-wrap:anywhere] sm:text-[13px]",
                active === id ? "border-emerald-700 text-emerald-800" : "border-transparent text-slate-600 hover:text-slate-900",
              )}
            >
              {t(`tabs.${id}`)}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function About({ property }: { property: PropertyDetail }) {
  const t = useTranslations("StayApp.detail");
  const [open, setOpen] = useState(false);
  const text = property.description ?? property.summary!;
  return (
    <section aria-labelledby="stay-about" data-testid="stay-about">
      <h2 id="stay-about" className="text-lg font-extrabold text-slate-900">
        {t("about")}
      </h2>
      <div className={cn("relative mt-2 overflow-hidden", !open && "max-h-40")}>
        <LocalizedText text={{ ...text, dir: directionOf(text.locale) }} className="text-sm leading-7 text-slate-700" />
        {!open ? <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-slate-50 to-transparent" /> : null}
      </div>
      <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} className="mt-1 min-h-10 text-sm font-bold text-emerald-800" data-testid="stay-about-toggle">
        {open ? t("readLess") : t("readMoreAbout")}
      </button>
    </section>
  );
}

function Amenities({ property }: { property: PropertyDetail }) {
  const t = useTranslations("StayApp.detail");
  const tGroups = useTranslations("StayApp.explore.amenityGroups");
  const [all, setAll] = useState(false);
  const groups = useMemo(() => {
    const m = new Map<string, PropertyDetail["amenities"]>();
    for (const a of property.amenities) m.set(a.group, [...(m.get(a.group) ?? []), a]);
    return [...m.entries()];
  }, [property.amenities]);
  return (
    <section id="amenities" aria-labelledby="stay-amenities" className="scroll-mt-28" data-testid="stay-amenities-section">
      <h2 id="stay-amenities" className="text-lg font-extrabold text-slate-900">
        {t("amenities")}
      </h2>
      {property.amenities.length === 0 ? (
        <p className="mt-2 text-sm text-slate-600">{t("noAmenities")}</p>
      ) : (
        <>
          <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3" data-testid="stay-amenities">
            {property.amenities.slice(0, 8).map((a) => (
              <li key={a.code} className="flex items-center gap-2.5 text-sm text-slate-700">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-emerald-50">
                  <AmenityIcon name={a.icon} className="size-4 text-emerald-700" />
                </span>
                {a.label}
              </li>
            ))}
          </ul>
          {property.amenities.length > 8 ? (
            <button type="button" onClick={() => setAll(true)} className="mt-3 min-h-11 w-full rounded-full text-sm font-bold text-emerald-800 ring-1 ring-emerald-300" data-testid="stay-amenities-all">
              {t("allAmenities", { count: property.amenities.length })}
            </button>
          ) : null}
          <Sheet open={all} onOpenChange={setAll}>
            <SheetContent side="bottom" className="mx-auto max-h-[85dvh] max-w-xl overflow-y-auto rounded-t-3xl" data-testid="stay-amenities-sheet">
              <SheetHeader className="pe-12">
                <SheetTitle>{t("amenities")}</SheetTitle>
                <SheetDescription className="sr-only">{t("amenities")}</SheetDescription>
              </SheetHeader>
              <div className="space-y-4 px-4 pb-6">
                {groups.map(([g, items]) => (
                  <div key={g}>
                    <h3 className="text-sm font-bold text-slate-900">{tGroups.has(g as never) ? tGroups(g as never) : g}</h3>
                    <ul className="mt-2 grid grid-cols-2 gap-2">
                      {items.map((a) => (
                        <li key={a.code} className="flex items-center gap-2 text-sm text-slate-700">
                          <AmenityIcon name={a.icon} className="size-4 text-emerald-700" />
                          {a.label}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </SheetContent>
          </Sheet>
        </>
      )}
    </section>
  );
}

function Policies({ property }: { property: PropertyDetail }) {
  const t = useTranslations("StayApp.detail");
  const clock = useClock();
  const r = property.rules;
  const rules: { ok: boolean; text: string }[] = [
    { ok: r.pets, text: r.pets ? t("rules.pets") : t("rules.noPets") },
    { ok: r.smoking, text: r.smoking ? t("rules.smoking") : t("rules.noSmoking") },
    { ok: r.parties, text: r.parties ? t("rules.parties") : t("rules.noParties") },
    ...(r.familiesOnly ? [{ ok: true, text: t("rules.familiesOnly") }] : []),
    ...(r.idRequired ? [{ ok: true, text: t("rules.idRequired") }] : []),
    ...(r.childFreeUnderAge > 0 ? [{ ok: true, text: t("rules.childrenFree", { age: r.childFreeUnderAge }) }] : []),
  ];
  return (
    <section id="policies" aria-labelledby="stay-policies" className="scroll-mt-28 space-y-3" data-testid="stay-policies">
      <h2 id="stay-policies" className="text-lg font-extrabold text-slate-900">
        {t("policies")}
      </h2>
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-2xl bg-white p-3 ring-1 ring-slate-200">
          <LogIn className="size-5 text-emerald-700" aria-hidden="true" />
          <p className="mt-1 text-xs text-slate-500">{t("checkIn")}</p>
          <p className="text-base font-extrabold text-slate-900">{t("checkInFrom", { time: clock(property.checkInTime) })}</p>
        </div>
        <div className="rounded-2xl bg-white p-3 ring-1 ring-slate-200">
          <LogOut className="size-5 text-emerald-700" aria-hidden="true" />
          <p className="mt-1 text-xs text-slate-500">{t("checkOut")}</p>
          <p className="text-base font-extrabold text-slate-900">{t("checkOutUntil", { time: clock(property.checkOutTime) })}</p>
        </div>
      </div>
      <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
        <h3 className="font-bold">{t("cancellation")}</h3>
        {property.policy && property.policy.rules.length ? (
          <ol className="mt-3 space-y-2" data-testid="stay-cancellation-rules">
            {property.policy.rules.map((rule) => (
              <li key={rule.hoursBefore} className="flex items-start gap-2 text-sm text-slate-700">
                <span className={cn("mt-0.5 inline-flex min-w-12 justify-center rounded-full px-2 py-0.5 text-xs font-bold", rule.refundPercent >= 100 ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-900")}>
                  {t("refundBadge", { percent: rule.refundPercent })}
                </span>
                <span>{t("cancellationRule", { percent: rule.refundPercent, hours: rule.hoursBefore })}</span>
              </li>
            ))}
            <li className="flex items-start gap-2 text-sm text-slate-500">
              <span className="mt-0.5 inline-flex min-w-12 justify-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold">{t("refundBadge", { percent: 0 })}</span>
              <span>{t("cancellationLate")}</span>
            </li>
          </ol>
        ) : (
          <p className="mt-2 text-sm text-slate-700">{t("cancellationNone")}</p>
        )}
        {property.policy?.noShowRefundPercent ? <p className="mt-2 text-sm text-slate-700">{t("noShow", { percent: property.policy.noShowRefundPercent })}</p> : null}
        <p className="mt-2 text-xs text-slate-500">{t("nonRefundableNote")}</p>
        {property.policy?.text ? <LocalizedText text={{ ...property.policy.text, dir: directionOf(property.policy.text.locale) }} className="mt-2 text-sm text-slate-700" /> : null}
        <p className="mt-3 flex items-start gap-2 rounded-xl bg-sky-50 p-3 text-sm text-sky-900">
          <Clock className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {property.confirmationMode === "instant" ? t("instantText") : t("requestText", { hours: property.requestTimeoutHours })}
        </p>
      </div>
      <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
        <h3 className="font-bold">{t("rules.title")}</h3>
        <ul className="mt-2 space-y-2 text-sm text-slate-700">
          {rules.map((x) => (
            <li key={x.text} className="flex items-start gap-2">
              {x.ok ? <Check className="mt-0.5 size-4 shrink-0 text-emerald-700" aria-hidden="true" /> : <X className="mt-0.5 size-4 shrink-0 text-red-600" aria-hidden="true" />}
              {x.text}
            </li>
          ))}
        </ul>
        {property.houseRules ? <LocalizedText text={{ ...property.houseRules, dir: directionOf(property.houseRules.locale) }} className="mt-2 text-sm text-slate-700" /> : null}
      </div>
      {property.accessibility.stepFree || property.accessibility.accessibleBathroom ? (
        <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200" data-testid="stay-accessibility">
          <h3 className="flex items-center gap-2 font-bold">
            <Accessibility className="size-5 text-emerald-700" aria-hidden="true" />
            {t("accessibility")}
          </h3>
          <ul className="mt-2 space-y-1 text-sm text-slate-700">
            {property.accessibility.stepFree ? <li>{t("stepFree")}</li> : null}
            {property.accessibility.accessibleBathroom ? <li>{t("accessibleBathroom")}</li> : null}
          </ul>
          <p className={cn("mt-2 text-xs", property.accessibility.verified ? "text-emerald-800" : "text-amber-800")}>
            {property.accessibility.verified ? t("accessibilityVerified") : t("accessibilityUnverified")}
          </p>
        </div>
      ) : null}
    </section>
  );
}

/** Answers built from the property's own data (check-in times, distances, cancellation) — never invented. */
export function useStayFaq(property: PropertyDetail, name: string) {
  const t = useTranslations("StayApp.detail.faq");
  const clock = useClock();
  const { length, travel } = useDistance();
  const tMeals = useTranslations("StayApp.meals");
  const items: { q: string; a: string }[] = [];
  items.push({ q: t("checkInQ", { name }), a: t("checkInA", { in: clock(property.checkInTime), out: clock(property.checkOutTime) }) });
  const shrine = property.nearby.find((n) => n.kind === "shrine");
  if (shrine) items.push({ q: t("distanceQ", { name, place: shrine.name }), a: t("distanceA", { distance: length(shrine.distanceM), travel: travel(shrine.distanceM) }) });
  const free = property.policy?.rules.find((r) => r.refundPercent >= 100);
  items.push({ q: t("cancelQ", { name }), a: free ? t("cancelFreeA", { hours: free.hoursBefore }) : t("cancelA") });
  items.push({ q: t("confirmQ"), a: property.confirmationMode === "instant" ? t("confirmInstantA") : t("confirmRequestA", { hours: property.requestTimeoutHours }) });
  if (property.amenities.some((a) => a.code === "breakfast")) items.push({ q: t("breakfastQ", { name }), a: t("breakfastA", { meal: tMeals("breakfast") }) });
  if (property.amenities.some((a) => a.code === "parking")) items.push({ q: t("parkingQ", { name }), a: t("parkingA") });
  return items;
}

function Faq({ property, name }: { property: PropertyDetail; name: string }) {
  const t = useTranslations("StayApp.detail");
  const items = useStayFaq(property, name);
  return (
    <section aria-labelledby="stay-faq" data-testid="stay-faq">
      <h2 id="stay-faq" className="text-lg font-extrabold text-slate-900">
        {t("faqTitle", { name })}
      </h2>
      <div className="mt-3 divide-y divide-slate-100 rounded-2xl bg-white ring-1 ring-slate-200">
        {items.map((it) => (
          <details key={it.q} className="group px-4">
            <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 py-3 text-sm font-semibold text-slate-900">
              {it.q}
              <span className="text-lg leading-none text-emerald-700 transition group-open:rotate-45" aria-hidden="true">
                +
              </span>
            </summary>
            <p className="pb-3 text-sm leading-7 text-slate-700">{it.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

function Similar({ cards, city, query }: { cards: PropertyCard[]; city: string; query: string }) {
  const t = useTranslations("StayApp.detail");
  const { length } = useDistance();
  return (
    <section aria-labelledby="stay-similar" data-testid="stay-similar">
      <h2 id="stay-similar" className="text-lg font-extrabold text-slate-900">
        {t("similar", { city })}
      </h2>
      <ul className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cards.map((c) => (
          <li key={c.id}>
            <Link href={`/stays/${c.slug}${query ? `?${query}` : ""}`} className="relative block overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200 hover:ring-emerald-400" data-testid="stay-similar-card">
              <LinkPending overlay />
              <StayImage src={c.coverUrl} alt={c.coverAlt} className="aspect-[4/3] w-full" sizes="(min-width: 1024px) 200px, 50vw" />
              <span className="block p-2.5">
                <span className="line-clamp-2 block text-sm leading-5 font-bold text-slate-900">{c.name}</span>
                <span className="mt-1 flex items-center gap-1">
                  <StarRating count={c.starRating} />
                </span>
                {c.distanceM != null ? <span className="mt-0.5 block text-[11px] text-slate-500">{t("fromHere", { distance: length(c.distanceM) })}</span> : null}
                {c.total != null || c.fromNightly != null ? (
                  <span className="mt-1 block">
                    <span className="text-[11px] text-slate-500">{c.total != null ? t("room.totalFor", { nights: c.nights ?? 1 }) : t("fromPerNightLabel")}</span>
                    <Money amount={c.total ?? c.fromNightly} currency={c.currency} className="block text-sm font-extrabold text-slate-900" />
                  </span>
                ) : null}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Internal links people actually search for ("hotels near the shrine in Mashhad", "3-star hotels in Mashhad"). Wraps, never scrolls. */
function RelatedSearches({ property, landmarks }: { property: PropertyDetail; landmarks: Landmark[] }) {
  const t = useTranslations("StayApp.detail");
  const tKinds = useTranslations("StayApp.kinds");
  const city = property.city.slug;
  const links: { href: string; label: string }[] = [];
  for (const l of landmarks.filter((x) => x.quick).slice(0, 3)) {
    links.push({ href: `/stays/city/${city}?${toSearchParams({ near: { type: "lm", city, slug: l.slug }, radius: 1000, sort: "distance" })}`, label: t("related.near", { place: l.name, city: property.city.name }) });
  }
  if (property.starRating) links.push({ href: `/stays/city/${city}?stars=${property.starRating}`, label: t("related.stars", { count: property.starRating, city: property.city.name }) });
  links.push({ href: `/stays/city/${city}?type=${property.kind}`, label: t("related.kind", { kind: tKinds(property.kind), city: property.city.name }) });
  links.push({ href: `/stays/city/${city}?bf=1`, label: t("related.breakfast", { city: property.city.name }) });
  links.push({ href: `/stays/city/${city}?free=1`, label: t("related.freeCancel", { city: property.city.name }) });
  return (
    <section aria-labelledby="stay-related" data-testid="stay-related">
      <h2 id="stay-related" className="text-lg font-extrabold text-slate-900">
        {t("relatedTitle")}
      </h2>
      <ul className="mt-3 flex flex-wrap gap-2">
        {links.map((l) => (
          <li key={l.href}>
            <Link href={l.href} className="inline-flex min-h-10 items-center rounded-full bg-white px-3.5 text-sm text-slate-700 ring-1 ring-slate-300 hover:ring-emerald-500">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Gallery({ media, title, saved, propertyId }: { media: MediaItem[]; title: string; saved: boolean; propertyId: string }) {
  const t = useTranslations("StayApp.detail");
  const locale = useLocale();
  const num = useNumber();
  const [open, setOpen] = useState<number | null>(null);
  const [current, setCurrent] = useState(0);
  const [copied, setCopied] = useState(false);
  const strip = useRef<HTMLDivElement>(null);
  const rtl = directionOf(locale) === "rtl";
  const share = async () => {
    const url = window.location.href.split("?")[0];
    try {
      if (navigator.share) await navigator.share({ title, url });
      else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      /* user cancelled */
    }
  };
  const onScroll = () => {
    const el = strip.current;
    if (!el) return;
    setCurrent(Math.round(Math.abs(el.scrollLeft) / Math.max(1, el.clientWidth)));
  };
  return (
    <div className="relative mx-auto max-w-6xl sm:px-6 sm:pt-4" data-testid="stay-gallery">
      {/* Phone: swipe through photos (no visible scrollbar); larger screens: a mosaic. */}
      <div
        ref={strip}
        onScroll={onScroll}
        className="flex snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] sm:hidden [&::-webkit-scrollbar]:hidden"
        aria-roledescription="carousel"
        aria-label={t("photos")}
      >
        {(media.length ? media.slice(0, 12) : [null]).map((m, i) => (
          <button key={m?.id ?? "empty"} type="button" disabled={!m} onClick={() => setOpen(i)} className="w-full shrink-0 snap-center" aria-label={t("gallery", { n: i + 1, count: media.length })}>
            <StayImage src={m?.url} alt={m?.alt ?? title} className="aspect-[4/3] w-full" priority={i === 0} sizes="100vw" />
          </button>
        ))}
      </div>
      <div className="hidden gap-1.5 overflow-hidden rounded-3xl sm:grid sm:aspect-[21/9] sm:grid-cols-4 sm:grid-rows-2">
        {(media.length ? media.slice(0, 5) : [null]).map((m, i) => (
          <button
            key={m?.id ?? "empty"}
            type="button"
            disabled={!m}
            onClick={() => setOpen(i)}
            className={cn("relative block overflow-hidden focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:outline-none", i === 0 && "col-span-2 row-span-2")}
            aria-label={t("gallery", { n: i + 1, count: media.length })}
          >
            <StayImage src={m?.url} alt={m?.alt ?? title} className="h-full w-full" priority={i === 0} sizes={i === 0 ? "50vw" : "25vw"} />
          </button>
        ))}
      </div>
      <div className="absolute end-3 top-3 flex gap-2 sm:end-9 sm:top-7">
        <button type="button" onClick={share} aria-label={t("share")} className="flex size-10 items-center justify-center rounded-full bg-white/90 text-slate-700 shadow hover:bg-white">
          {copied ? <Check className="size-5 text-emerald-700" aria-hidden="true" /> : <Share2 className="size-5" aria-hidden="true" />}
        </button>
        <WishlistButton propertyId={propertyId} initialSaved={saved} />
      </div>
      {copied ? (
        <span role="status" className="sr-only">
          {t("copied")}
        </span>
      ) : null}
      {media.length > 1 ? (
        <button
          type="button"
          onClick={() => setOpen(current)}
          className="absolute end-3 bottom-3 inline-flex min-h-8 items-center gap-1.5 rounded-full bg-black/60 px-3 text-xs font-semibold text-white sm:end-9 sm:bg-white/95 sm:text-slate-900 sm:shadow"
          data-testid="stay-gallery-all"
        >
          <Images className="size-4" aria-hidden="true" />
          <span className="sm:hidden">
            {num(current + 1)}/{num(media.length)}
          </span>
          <span className="hidden sm:inline">{t("showAllPhotos", { count: media.length })}</span>
        </button>
      ) : null}
      <Dialog open={open != null} onOpenChange={(v) => !v && setOpen(null)}>
        <DialogContent className="max-w-4xl bg-black p-0 text-white sm:rounded-2xl" data-testid="stay-lightbox">
          <DialogTitle className="sr-only">{title}</DialogTitle>
          <DialogDescription className="sr-only">{open != null ? t("gallery", { n: open + 1, count: media.length }) : ""}</DialogDescription>
          {open != null && media[open] ? (
            <figure
              className="relative"
              onKeyDown={(e) => {
                if (e.key === "ArrowRight") setOpen((o) => (o == null ? o : rtl ? Math.max(0, o - 1) : Math.min(media.length - 1, o + 1)));
                if (e.key === "ArrowLeft") setOpen((o) => (o == null ? o : rtl ? Math.min(media.length - 1, o + 1) : Math.max(0, o - 1)));
              }}
            >
              <StayImage src={media[open].url} alt={media[open].alt} className="h-[80dvh] w-full" fit="contain" sizes="100vw" priority />
              <figcaption className="flex items-center justify-between gap-2 p-3 text-xs text-white/80">
                <span>{t("gallery", { n: open + 1, count: media.length })}</span>
                {media[open].credit ? <span>{media[open].credit}</span> : null}
              </figcaption>
              {/* Chevrons are mirrored in RTL by globals.css: never swap them by direction. */}
              <button type="button" aria-label={t("prevPhoto")} disabled={open === 0} onClick={() => setOpen(open - 1)} className="absolute start-2 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 disabled:opacity-30">
                <ChevronLeft className="size-6" aria-hidden="true" />
              </button>
              <button type="button" aria-label={t("nextPhoto")} disabled={open >= media.length - 1} onClick={() => setOpen(open + 1)} className="absolute end-2 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 disabled:opacity-30">
                <ChevronRight className="size-6" aria-hidden="true" />
              </button>
              <button type="button" aria-label={t("closeGallery")} onClick={() => setOpen(null)} className="absolute end-2 top-2 flex size-10 items-center justify-center rounded-full bg-black/50">
                <X className="size-5" aria-hidden="true" />
              </button>
            </figure>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
