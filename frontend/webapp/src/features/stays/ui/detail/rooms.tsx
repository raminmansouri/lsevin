"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowDownUp,
  Baby,
  Bath,
  BedDouble,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Coffee,
  DoorOpen,
  Images,
  Maximize2,
  ShieldCheck,
  Star,
  Users,
} from "lucide-react";
import { useTranslations } from "next-intl";

import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

import { checkInInstant, freeCancellationUntil } from "../../domain/cancellation";
import type { StaySearch } from "../../domain/search";
import type { MediaItem, PropertyDetail, RatePlanOffer, ReviewItem, RoomOffer } from "../../types";
import { LinkPending, Money, StayImage, useNumber, useStayDate } from "../common";

import { AmenityIcon } from "./amenity-icon";
import { ReviewCard } from "./reviews";

export type RoomSort = "recommended" | "price_asc" | "price_desc" | "capacity";
type RoomFilter = "breakfast" | "free_cancel" | "fits" | "available";

export function bookHref(slug: string, search: StaySearch, roomTypeId: string, ratePlanId: string) {
  return `/stays/${slug}/book?${new URLSearchParams({
    room: roomTypeId,
    plan: ratePlanId,
    in: search.checkIn ?? "",
    out: search.checkOut ?? "",
    adults: String(search.adults),
    rooms: String(search.rooms),
    ...(search.childAges.length ? { ages: search.childAges.join(",") } : {}),
  }).toString()}`;
}

/** Cheapest bookable plan of a room (with dates), else the cheapest "from" price. */
function bestPlan(room: RoomOffer): RatePlanOffer | null {
  const bookable = room.plans.filter((p) => p.quote && !p.unavailableReason).sort((a, b) => a.quote!.total - b.quote!.total);
  if (bookable[0]) return bookable[0];
  return [...room.plans].sort((a, b) => a.nightlyFrom - b.nightlyFrom)[0] ?? null;
}
const isBookable = (room: RoomOffer) => room.plans.some((p) => p.quote && !p.unavailableReason);
const sortPrice = (room: RoomOffer) => {
  const p = bestPlan(room);
  return p?.quote ? p.quote.total / Math.max(1, p.quote.nights) : (p?.nightlyFrom ?? Number.MAX_SAFE_INTEGER);
};

/**
 * Rooms of a property (H05): sort and filter instantly on the device (every room is already
 * loaded), compact cards, and a sheet per room with its photos, layout, rates and the reviews
 * of guests who stayed in it. Choosing a room before dates opens the date picker and comes
 * back to the same room.
 */
export function RoomsSection({
  property,
  rooms,
  reviews,
  search,
  hasDates,
  preview,
  pending,
  amenityLabels,
  focusRoomId,
  onPickDates,
  onPickGuests,
}: {
  property: PropertyDetail;
  rooms: RoomOffer[];
  reviews: ReviewItem[];
  search: StaySearch;
  hasDates: boolean;
  preview: boolean;
  pending: boolean;
  amenityLabels: Record<string, { label: string; icon: string | null; imageUrl?: string | null }>;
  focusRoomId: string | null;
  onPickDates: (roomTypeId: string | null) => void;
  onPickGuests: () => void;
}) {
  const t = useTranslations("StayApp.detail");
  const tr = useTranslations("StayApp.detail.roomList");
  const [sort, setSort] = useState<RoomSort>("recommended");
  const [filters, setFilters] = useState<Set<RoomFilter>>(new Set());
  const [openId, setOpenId] = useState<string | null>(null);
  const [showFull, setShowFull] = useState(false);
  const focused = useRef<string | null>(null);

  // Back from the date picker with a room in mind: open it.
  useEffect(() => {
    if (focusRoomId && hasDates && focused.current !== focusRoomId && rooms.some((r) => r.roomTypeId === focusRoomId)) {
      focused.current = focusRoomId;
      setOpenId(focusRoomId);
    }
  }, [focusRoomId, hasDates, rooms]);

  const toggle = (f: RoomFilter) =>
    setFilters((s) => {
      const n = new Set(s);
      if (n.has(f)) n.delete(f);
      else n.add(f);
      return n;
    });

  const visible = useMemo(() => {
    let list = rooms.filter((r) => {
      if (filters.has("breakfast") && !r.plans.some((p) => p.mealPlan !== "room_only")) return false;
      if (filters.has("free_cancel") && !r.plans.some((p) => p.refundable)) return false;
      if (filters.has("fits") && !r.fitsParty) return false;
      if (filters.has("available") && hasDates && !isBookable(r)) return false;
      return true;
    });
    if (sort === "price_asc") list = [...list].sort((a, b) => sortPrice(a) - sortPrice(b));
    if (sort === "price_desc") list = [...list].sort((a, b) => sortPrice(b) - sortPrice(a));
    if (sort === "capacity") list = [...list].sort((a, b) => b.maxOccupancy - a.maxOccupancy || sortPrice(a) - sortPrice(b));
    return list;
  }, [rooms, filters, sort, hasDates]);

  const available = hasDates ? visible.filter(isBookable) : visible;
  const full = hasDates ? visible.filter((r) => !isBookable(r)) : [];
  const open = rooms.find((r) => r.roomTypeId === openId) ?? null;
  const party = search.adults + search.childAges.length;
  const filterList: RoomFilter[] = ["breakfast", "free_cancel", "fits", ...(hasDates ? (["available"] as const) : [])];

  return (
    <section id="rooms" aria-labelledby="stay-rooms-title" className="scroll-mt-28" data-testid="stay-rooms-section">
      <div className="flex items-end justify-between gap-3">
        <h2 id="stay-rooms-title" className="text-lg font-extrabold text-slate-900">
          {t("rooms")}
        </h2>
        <span className="text-xs text-slate-500" data-testid="stay-rooms-count">
          {tr("count", { count: visible.length })}
        </span>
      </div>

      {/* Sort + filters wrap onto a second line instead of scrolling sideways. */}
      <div className="mt-3 flex flex-wrap items-center gap-2" role="group" aria-label={tr("toolbar")} data-testid="stay-rooms-toolbar">
        <label className="relative inline-flex min-h-10 items-center gap-1.5 rounded-full bg-white ps-3 pe-8 text-sm font-semibold text-slate-800 ring-1 ring-slate-300 focus-within:ring-2 focus-within:ring-emerald-600">
          <ArrowDownUp className="size-4 text-slate-500" aria-hidden="true" />
          <span className="sr-only">{tr("sortLabel")}</span>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as RoomSort)}
            className="absolute inset-0 cursor-pointer opacity-0"
            aria-label={tr("sortLabel")}
            data-testid="stay-rooms-sort"
          >
            {(["recommended", "price_asc", "price_desc", "capacity"] as const).map((s) => (
              <option key={s} value={s}>
                {tr(`sort.${s}`)}
              </option>
            ))}
          </select>
          <span aria-hidden="true">{tr(`sort.${sort}`)}</span>
          <ChevronDown className="pointer-events-none absolute end-2.5 size-4 text-slate-500" aria-hidden="true" />
        </label>
        {filterList.map((f) => (
          <button
            key={f}
            type="button"
            aria-pressed={filters.has(f)}
            onClick={() => toggle(f)}
            data-testid={`stay-rooms-filter-${f}`}
            className={cn(
              "inline-flex min-h-10 items-center rounded-full px-3.5 text-sm font-medium ring-1 transition",
              filters.has(f) ? "bg-emerald-700 text-white ring-emerald-700" : "bg-white text-slate-700 ring-slate-300 hover:bg-slate-50",
            )}
          >
            {f === "fits" ? tr("filter.fits", { count: party }) : tr(`filter.${f}`)}
          </button>
        ))}
      </div>

      {!hasDates ? (
        <button
          type="button"
          onClick={() => onPickDates(null)}
          className="mt-3 flex w-full items-center gap-3 rounded-2xl bg-amber-50 p-3 text-start ring-1 ring-amber-200 hover:bg-amber-100"
          data-testid="stay-detail-no-dates"
        >
          <CalendarDays className="size-5 shrink-0 text-amber-700" aria-hidden="true" />
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-bold text-amber-900">{t("selectDatesTitle")}</span>
            <span className="block text-xs text-amber-900/80">{tr("noDatesHint")}</span>
          </span>
          <span className="shrink-0 rounded-full bg-amber-600 px-3 py-1.5 text-xs font-bold text-white">{t("selectDates")}</span>
        </button>
      ) : null}

      <div className={cn("transition-opacity", pending && "pointer-events-none opacity-50")} aria-busy={pending}>
        {rooms.length === 0 ? (
          <p className="mt-4 text-sm text-slate-600">{t("noRooms")}</p>
        ) : visible.length === 0 ? (
          <div className="mt-4 rounded-2xl bg-white p-4 text-sm text-slate-700 ring-1 ring-slate-200" data-testid="stay-rooms-filtered-empty">
            <p>{tr("noMatch")}</p>
            <button type="button" onClick={() => setFilters(new Set())} className="mt-2 min-h-10 rounded-full px-4 text-sm font-bold text-emerald-800 ring-1 ring-emerald-300">
              {tr("clearFilters")}
            </button>
          </div>
        ) : hasDates && available.length === 0 ? (
          <p className="mt-4 rounded-2xl bg-white p-4 text-sm font-medium text-slate-700 ring-1 ring-slate-200" data-testid="stay-detail-none-available">
            {t("roomsAvailableNone")}{" "}
            <button type="button" onClick={() => onPickDates(null)} className="font-bold text-emerald-800 underline">
              {tr("changeDates")}
            </button>
          </p>
        ) : null}

        <ul className="mt-3 space-y-3" data-testid="stay-rooms">
          {available.map((room) => (
            <RoomCard key={room.roomTypeId} room={room} property={property} search={search} hasDates={hasDates} preview={preview} onOpen={() => setOpenId(room.roomTypeId)} onPickDates={() => onPickDates(room.roomTypeId)} />
          ))}
        </ul>

        {full.length ? (
          <div className="mt-4">
            <button
              type="button"
              onClick={() => setShowFull((v) => !v)}
              aria-expanded={showFull}
              className="flex min-h-11 w-full items-center justify-between rounded-2xl bg-slate-100 px-4 text-sm font-semibold text-slate-700"
              data-testid="stay-rooms-full-toggle"
            >
              {tr("fullRooms", { count: full.length })}
              <ChevronDown className={cn("size-4 transition", showFull && "rotate-180")} aria-hidden="true" />
            </button>
            {showFull ? (
              <ul className="mt-3 space-y-3 opacity-80" data-testid="stay-rooms-full">
                {full.map((room) => (
                  <RoomCard key={room.roomTypeId} room={room} property={property} search={search} hasDates={hasDates} preview={preview} onOpen={() => setOpenId(room.roomTypeId)} onPickDates={() => onPickDates(room.roomTypeId)} />
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}
      </div>

      <RoomSheet
        room={open}
        property={property}
        search={search}
        hasDates={hasDates}
        preview={preview}
        reviews={reviews}
        amenityLabels={amenityLabels}
        onClose={() => setOpenId(null)}
        onPickDates={(id) => {
          setOpenId(null);
          onPickDates(id);
        }}
        onPickGuests={() => {
          setOpenId(null);
          onPickGuests();
        }}
      />
    </section>
  );
}

function RoomFacts({ room, className }: { room: RoomOffer; className?: string }) {
  const t = useTranslations("StayApp.detail.room");
  const tBeds = useTranslations("StayApp.beds");
  return (
    <ul className={cn("flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-600", className)}>
      <li className="inline-flex items-center gap-1">
        <Users className="size-3.5" aria-hidden="true" />
        {t("sleeps", { count: room.maxOccupancy })}
      </li>
      {room.beds.map((b, i) => (
        <li key={i} className="inline-flex items-center gap-1">
          <BedDouble className="size-3.5" aria-hidden="true" />
          {tBeds(b.type as "double", { count: b.count })}
        </li>
      ))}
      {room.sizeM2 ? (
        <li className="inline-flex items-center gap-1">
          <Maximize2 className="size-3.5" aria-hidden="true" />
          {t("size", { size: room.sizeM2 })}
        </li>
      ) : null}
    </ul>
  );
}

function PlanBadges({ plan, property, search, hasDates }: { plan: RatePlanOffer; property: PropertyDetail; search: StaySearch; hasDates: boolean }) {
  const t = useTranslations("StayApp.detail.room");
  const tMeals = useTranslations("StayApp.meals");
  const fmtDate = useStayDate();
  const freeUntil =
    hasDates && property.policy && search.checkIn && plan.refundable
      ? freeCancellationUntil(property.policy.rules, plan.refundable, checkInInstant(search.checkIn, property.checkInTime, property.timezone))
      : null;
  return (
    <div className="flex flex-wrap gap-1.5 text-xs">
      <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5", plan.mealPlan === "room_only" ? "bg-slate-100 text-slate-700" : "bg-amber-50 font-semibold text-amber-900")}>
        <Coffee className="size-3.5" aria-hidden="true" />
        {tMeals(plan.mealPlan)}
      </span>
      <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5", plan.refundable ? "bg-emerald-50 font-semibold text-emerald-800" : "bg-slate-100 text-slate-700")}>
        <ShieldCheck className="size-3.5" aria-hidden="true" />
        {plan.refundable ? (freeUntil ? t("freeCancelUntil", { date: fmtDate(freeUntil.toISOString().slice(0, 10), "short") }) : t("refundable")) : t("nonRefundable")}
      </span>
    </div>
  );
}

function PlanPrice({ plan, currency, align = "end" }: { plan: RatePlanOffer; currency: string; align?: "start" | "end" }) {
  const t = useTranslations("StayApp.detail");
  if (plan.quote) {
    return (
      <div className={align === "end" ? "text-end" : ""}>
        <Money amount={plan.quote.total} currency={plan.quote.currency} className="text-base font-extrabold text-slate-900" testId="stay-plan-total" />
        <p className="text-[11px] text-slate-500">{t("room.totalFor", { nights: plan.quote.nights })}</p>
      </div>
    );
  }
  return (
    <div className={align === "end" ? "text-end" : ""}>
      <p className="text-[11px] text-slate-500">{t("fromPrice")}</p>
      <Money amount={plan.nightlyFrom} currency={currency} className="text-base font-extrabold text-slate-900" />
      <p className="text-[11px] text-slate-500">{t("perNight")}</p>
    </div>
  );
}

function RoomCard({
  room,
  property,
  search,
  hasDates,
  preview,
  onOpen,
  onPickDates,
}: {
  room: RoomOffer;
  property: PropertyDetail;
  search: StaySearch;
  hasDates: boolean;
  preview: boolean;
  onOpen: () => void;
  onPickDates: () => void;
}) {
  const t = useTranslations("StayApp.detail.room");
  const tr = useTranslations("StayApp.detail.roomList");
  const num = useNumber();
  const plan = bestPlan(room);
  const bookable = room.plans.filter((p) => p.quote && !p.unavailableReason);
  const cover = room.media[0];
  const reason = hasDates && !bookable.length ? (room.plans.find((p) => p.unavailableReason)?.unavailableReason ?? "sold_out") : null;

  return (
    <li className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200" data-testid="stay-room" data-room-code={room.code} data-room-id={room.roomTypeId}>
      <button type="button" onClick={onOpen} className="flex w-full gap-3 p-3 text-start focus-visible:bg-slate-50 focus-visible:outline-none" data-testid="stay-room-open" aria-label={tr("openRoom", { name: room.name })}>
        <span className="relative size-24 shrink-0 overflow-hidden rounded-xl bg-emerald-50">
          {cover ? (
            <StayImage src={cover.url} alt={cover.alt || room.name} className="size-24" sizes="96px" />
          ) : (
            <span className="flex size-full items-center justify-center text-emerald-700" aria-hidden="true">
              <BedDouble className="size-9" />
            </span>
          )}
          {room.media.length > 1 ? (
            <span className="absolute end-1 bottom-1 inline-flex items-center gap-0.5 rounded-md bg-black/60 px-1 text-[10px] font-semibold text-white">
              <Images className="size-3" aria-hidden="true" />
              {num(room.media.length)}
            </span>
          ) : null}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-base leading-6 font-bold text-slate-900" data-testid="stay-room-name">{room.name}</span>
          <RoomFacts room={room} className="mt-1" />
          {plan ? <PlanBadges plan={plan} property={property} search={search} hasDates={hasDates} /> : null}
          {!room.fitsParty ? <span className="mt-1 block text-xs font-semibold text-amber-800">{t("doesNotFit")}</span> : null}
          {hasDates && room.unitsLeft != null && room.unitsLeft > 0 && room.unitsLeft <= 3 && bookable.length ? (
            <span className="mt-1 block text-xs font-semibold text-orange-700" data-testid="stay-room-units-left">
              {t("unitsLeft", { count: room.unitsLeft })}
            </span>
          ) : null}
          <span className="mt-1 block text-xs font-semibold text-emerald-800">{tr("details")}</span>
        </span>
      </button>
      <div className="flex items-center justify-between gap-3 border-t border-slate-100 px-3 py-2.5">
        {reason ? (
          <p className="text-xs font-semibold text-red-700" data-testid="stay-plan-unavailable">
            {t(`unavailable.${reason}` as never)}
          </p>
        ) : plan ? (
          <PlanPrice plan={plan} currency={property.currency} align="start" />
        ) : (
          <span />
        )}
        {preview ? null : !hasDates ? (
          <button type="button" onClick={onPickDates} className="inline-flex min-h-11 shrink-0 items-center rounded-full bg-orange-500 px-5 text-sm font-bold text-white hover:bg-orange-600" data-testid="stay-room-select">
            {tr("select")}
          </button>
        ) : bookable.length === 1 ? (
          <Link
            href={bookHref(property.slug, search, room.roomTypeId, bookable[0].ratePlanId)}
            className="inline-flex min-h-11 shrink-0 items-center rounded-full bg-orange-500 px-5 text-sm font-bold text-white hover:bg-orange-600 focus-visible:ring-4 focus-visible:ring-orange-200 focus-visible:outline-none"
            data-testid="stay-reserve"
          >
            {t("reserve")}
            <LinkPending className="ms-1.5" />
          </Link>
        ) : bookable.length > 1 ? (
          <button type="button" onClick={onOpen} className="inline-flex min-h-11 shrink-0 items-center rounded-full bg-orange-500 px-5 text-sm font-bold text-white hover:bg-orange-600" data-testid="stay-room-select">
            {tr("choosePlan", { count: bookable.length })}
          </button>
        ) : (
          <button type="button" onClick={onPickDates} className="inline-flex min-h-11 shrink-0 items-center rounded-full px-4 text-sm font-bold text-emerald-800 ring-1 ring-emerald-300" data-testid="stay-room-change-dates">
            {tr("changeDates")}
          </button>
        )}
      </div>
    </li>
  );
}

function PhotoStrip({ media, title, fallbackLabel }: { media: MediaItem[]; title: string; fallbackLabel: string | null }) {
  const t = useTranslations("StayApp.detail");
  const num = useNumber();
  const [i, setI] = useState(0);
  if (!media.length) {
    return (
      <div className="flex h-40 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700" aria-hidden="true">
        <BedDouble className="size-12" />
      </div>
    );
  }
  const m = media[Math.min(i, media.length - 1)];
  return (
    <figure className="relative" data-testid="stay-room-photos">
      <StayImage src={m.url} alt={m.alt || title} className="aspect-[16/10] w-full rounded-2xl" sizes="(min-width: 640px) 512px, 100vw" priority />
      {media.length > 1 ? (
        <>
          <button type="button" aria-label={t("prevPhoto")} disabled={i === 0} onClick={() => setI(i - 1)} className="absolute start-2 top-1/2 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 shadow disabled:opacity-0">
            <ChevronLeft className="size-5" aria-hidden="true" />
          </button>
          <button type="button" aria-label={t("nextPhoto")} disabled={i >= media.length - 1} onClick={() => setI(i + 1)} className="absolute end-2 top-1/2 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 shadow disabled:opacity-0">
            <ChevronRight className="size-5" aria-hidden="true" />
          </button>
        </>
      ) : null}
      <figcaption className="absolute end-2 bottom-2 flex items-center gap-1.5">
        {fallbackLabel ? <span className="rounded-full bg-black/60 px-2 py-0.5 text-[11px] text-white">{fallbackLabel}</span> : null}
        <span className="rounded-full bg-black/60 px-2 py-0.5 text-[11px] font-semibold text-white" data-testid="stay-room-photo-count">
          {num(i + 1)}/{num(media.length)}
        </span>
      </figcaption>
    </figure>
  );
}

function RoomSheet({
  room,
  property,
  search,
  hasDates,
  preview,
  reviews,
  amenityLabels,
  onClose,
  onPickDates,
  onPickGuests,
}: {
  room: RoomOffer | null;
  property: PropertyDetail;
  search: StaySearch;
  hasDates: boolean;
  preview: boolean;
  reviews: ReviewItem[];
  amenityLabels: Record<string, { label: string; icon: string | null; imageUrl?: string | null }>;
  onClose: () => void;
  onPickDates: (roomTypeId: string) => void;
  onPickGuests: () => void;
}) {
  const t = useTranslations("StayApp.detail");
  const tRoom = useTranslations("StayApp.detail.room");
  const tr = useTranslations("StayApp.detail.roomList");
  const num = useNumber();
  const roomReviews = room ? reviews.filter((r) => r.roomTypeId === room.roomTypeId) : [];
  const avg = roomReviews.length ? roomReviews.reduce((a, r) => a + r.rating, 0) / roomReviews.length : null;
  const ownPhotos = room?.media.length ? room.media : null;
  const media = ownPhotos ?? property.media.filter((m) => !m.roomTypeId).slice(0, 8);

  return (
    <Sheet open={Boolean(room)} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="bottom" className="mx-auto max-h-[92dvh] max-w-xl gap-0 overflow-y-auto rounded-t-3xl p-0 [&>button:last-child]:z-20 [&>button:last-child]:top-3.5 [&>button:last-child]:p-1" data-testid="stay-room-sheet">
        {room ? (
          <>
            <SheetHeader className="sticky top-0 z-10 border-b border-slate-100 bg-white/95 px-4 py-3 pe-12 backdrop-blur">
              <SheetTitle className="text-base">{room.name}</SheetTitle>
              <SheetDescription className="sr-only">{tr("sheetHelp")}</SheetDescription>
            </SheetHeader>
            <div className="space-y-5 p-4">
              <PhotoStrip media={media} title={room.name} fallbackLabel={ownPhotos ? null : tr("propertyPhotos")} />

              <ul className="grid grid-cols-2 gap-2 text-sm" data-testid="stay-room-facts">
                <Fact icon={Users} text={tRoom("sleeps", { count: room.maxOccupancy })} />
                <Fact icon={Users} text={tRoom("maxAdults", { count: room.maxAdults })} />
                {room.maxChildren ? <Fact icon={Baby} text={tRoom("maxChildren", { count: room.maxChildren })} /> : null}
                {room.beds.map((b, i) => (
                  <BedFact key={i} type={b.type} count={b.count} />
                ))}
                {room.sizeM2 ? <Fact icon={Maximize2} text={tRoom("size", { size: room.sizeM2 })} /> : null}
                {room.bedrooms ? <Fact icon={DoorOpen} text={tRoom("bedrooms", { count: room.bedrooms })} /> : null}
                {room.bathrooms ? <Fact icon={Bath} text={tRoom("bathrooms", { count: room.bathrooms })} /> : null}
              </ul>

              {room.description ? <p className="text-sm leading-7 whitespace-pre-line text-slate-700">{room.description.value}</p> : null}

              {room.amenities.length ? (
                <div>
                  <h3 className="text-sm font-bold">{tr("roomAmenities")}</h3>
                  <ul className="mt-2 grid grid-cols-2 gap-2 text-sm text-slate-700">
                    {room.amenities.map((code) => (
                      <li key={code} className="flex items-center gap-2">
                        <AmenityIcon imageUrl={amenityLabels[code]?.imageUrl} name={amenityLabels[code]?.icon} className="size-4 text-emerald-700" />
                        {amenityLabels[code]?.label ?? code}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <div>
                <h3 className="text-sm font-bold">{tr("rates")}</h3>
                {!hasDates ? <p className="mt-1 text-xs text-slate-500">{tr("noDatesHint")}</p> : null}
                <ul className="mt-2 space-y-2" data-testid="stay-room-plans">
                  {room.plans.map((plan) => (
                    <li key={plan.ratePlanId} className="rounded-2xl p-3 ring-1 ring-slate-200" data-testid="stay-rate-plan" data-plan-code={plan.code}>
                      {plan.name ? <p className="mb-1 text-sm font-semibold">{plan.name}</p> : null}
                      <PlanBadges plan={plan} property={property} search={search} hasDates={hasDates} />
                      {plan.longStay ? <p className="mt-1 text-xs text-emerald-800">{tRoom("longStay", { percent: plan.longStay.percent, nights: plan.longStay.nights })}</p> : null}
                      {plan.minNights > 1 ? <p className="mt-1 text-xs text-slate-500">{tRoom("minNights", { count: plan.minNights })}</p> : null}
                      <div className="mt-2 flex items-end justify-between gap-3">
                        <PlanPrice plan={plan} currency={property.currency} align="start" />
                        {preview ? null : !hasDates ? (
                          <button type="button" onClick={() => onPickDates(room.roomTypeId)} className="inline-flex min-h-11 items-center rounded-full bg-orange-500 px-5 text-sm font-bold text-white" data-testid="stay-room-sheet-dates">
                            {tr("select")}
                          </button>
                        ) : plan.unavailableReason ? (
                          <span className="text-end text-xs font-semibold text-red-700">
                            {tRoom(`unavailable.${plan.unavailableReason}` as never)}
                            {plan.unavailableReason === "does_not_fit" ? (
                              <button type="button" onClick={onPickGuests} className="mt-1 block font-bold text-emerald-800 underline">
                                {tr("changeGuests")}
                              </button>
                            ) : (
                              <button type="button" onClick={() => onPickDates(room.roomTypeId)} className="mt-1 block font-bold text-emerald-800 underline">
                                {tr("changeDates")}
                              </button>
                            )}
                          </span>
                        ) : plan.quote ? (
                          <Link href={bookHref(property.slug, search, room.roomTypeId, plan.ratePlanId)} className="inline-flex min-h-11 items-center rounded-full bg-orange-500 px-5 text-sm font-bold text-white hover:bg-orange-600" data-testid="stay-reserve">
                            {tRoom("reserve")}
                            <LinkPending className="ms-1.5" />
                          </Link>
                        ) : null}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              <div data-testid="stay-room-reviews">
                <h3 className="flex items-center gap-2 text-sm font-bold">
                  {tr("roomReviews")}
                  {avg != null ? (
                    <span className="inline-flex items-center gap-0.5 rounded-md bg-emerald-700 px-1.5 py-0.5 text-xs font-bold text-white">
                      <Star className="size-3 fill-current" aria-hidden="true" />
                      {num(avg, { maximumFractionDigits: 1, minimumFractionDigits: 1 })}
                    </span>
                  ) : null}
                </h3>
                {roomReviews.length ? (
                  <ul className="mt-2 space-y-2">
                    {roomReviews.slice(0, 5).map((r) => (
                      <ReviewCard key={r.id} review={r} compact />
                    ))}
                  </ul>
                ) : (
                  <p className="mt-1 text-sm text-slate-600">{property.reviewCount ? tr("noRoomReviews") : t("noReviews")}</p>
                )}
                {property.reviewCount ? (
                  <a href="#reviews" onClick={onClose} className="mt-2 inline-flex min-h-10 items-center text-sm font-bold text-emerald-800">
                    {tr("allReviews", { count: property.reviewCount })}
                  </a>
                ) : null}
              </div>
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

function Fact({ icon: Icon, text }: { icon: typeof Users; text: string }) {
  return (
    <li className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-slate-700">
      <Icon className="size-4 shrink-0 text-emerald-700" aria-hidden="true" />
      {text}
    </li>
  );
}

function BedFact({ type, count }: { type: string; count: number }) {
  const tBeds = useTranslations("StayApp.beds");
  return <Fact icon={BedDouble} text={tBeds(type as "double", { count })} />;
}
