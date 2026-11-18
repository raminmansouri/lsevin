"use client";

import { useId, useMemo, useRef, useState } from "react";
import { CalendarDays, MapPin, Minus, Plus, Search, Users } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { addDaysIso } from "@/features/tours/domain/calendar";
import { normalizeSearchText } from "@/features/tours/domain/text";
import { useToursPrefs } from "@/features/tours/ui/customer/prefs-context";
import { CalendarPicker } from "@/features/tours/ui/shared/calendar-picker";
import { useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

import { nightsBetween, todayIn, validateStayDates } from "../../domain/dates";
import { toSearchParams, type StaySearch } from "../../domain/search";
import { useShortDate } from "../common";

export type CityOption = { slug: string; name: string; region: string | null };

const MAX_NIGHTS = 30;
const WINDOW_DAYS = 365;

type Party = { adults: number; childAges: (number | null)[]; rooms: number };

/**
 * Stay search (H01): destination, dates and party. The submitted search is the
 * URL (/stays/explore?...), so refresh/back/share reproduce it. Validation is
 * field-specific and shown next to the field; nothing is submitted until valid.
 */
export function StaySearchForm({
  cities,
  initial,
  variant = "hero",
  onSubmitted,
  target = "explore",
  keep,
}: {
  cities: CityOption[];
  initial?: Partial<StaySearch>;
  variant?: "hero" | "compact";
  onSubmitted?: () => void;
  /**
   * Filters, place and sort of the current results, kept when only dates or guests change
   * (changing the city drops the place: "near the shrine" belongs to one city).
   */
  keep?: URLSearchParams;
  /** "explore" → /stays/explore; "here" → stay on the current path (property page). */
  target?: "explore" | { path: string };
}) {
  const t = useTranslations("StayApp.search");
  const router = useRouter();
  const shortDate = useShortDate();
  const initialCity = cities.find((c) => c.slug === initial?.city) ?? null;
  const [query, setQuery] = useState(initialCity?.name ?? initial?.q ?? "");
  const [city, setCity] = useState<CityOption | null>(initialCity);
  const [range, setRange] = useState<{ from: string | null; to: string | null }>({ from: initial?.checkIn ?? null, to: initial?.checkOut ?? null });
  const [party, setParty] = useState<Party>({ adults: initial?.adults ?? 2, childAges: initial?.childAges ?? [], rooms: initial?.rooms ?? 1 });
  const [datesOpen, setDatesOpen] = useState(false);
  const [guestsOpen, setGuestsOpen] = useState(false);
  const [errors, setErrors] = useState<{ dates?: string; guests?: string }>({});
  const nights = range.from && range.to ? nightsBetween(range.from, range.to) : 0;
  const children = party.childAges.length;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const next: typeof errors = {};
    if (range.from || range.to) {
      const err = validateStayDates(range.from, range.to, { today: todayIn(), maxNights: MAX_NIGHTS, windowDays: WINDOW_DAYS });
      if (err) next.dates = err;
    }
    if (party.adults < party.rooms) next.guests = "adult_per_room_required";
    if (party.childAges.some((a) => a == null)) next.guests = "child_age_required";
    setErrors(next);
    if (next.dates || next.guests) return;
    const typed = query.trim();
    const params = toSearchParams({
      city: city?.slug ?? null,
      q: city ? null : typed || null,
      checkIn: range.from,
      checkOut: range.to,
      adults: party.adults,
      childAges: party.childAges as number[],
      rooms: party.rooms,
    });
    if (keep) {
      const cityChanged = (city?.slug ?? null) !== (initial?.city ?? null) || (!city && typed !== (initial?.q ?? ""));
      for (const [k, v] of keep) {
        if (cityChanged && (k === "near" || k === "r" || (k === "sort" && v === "distance"))) continue;
        if (!params.has(k)) params.set(k, v);
      }
    }
    if (typeof target === "object") {
      params.delete("city");
      params.delete("q");
      router.replace(`${target.path}?${params.toString()}`, { scroll: false });
    } else {
      router.push(`/stays/explore${params.size ? `?${params.toString()}` : ""}`);
    }
    onSubmitted?.();
  }

  const datesLabel = range.from && range.to ? `${shortDate(range.from)} – ${shortDate(range.to)}` : t("addDates");
  const guestsLabel = t("summary", { adults: party.adults, children, rooms: party.rooms });
  const box = "flex min-h-14 w-full items-center gap-3 rounded-2xl bg-white px-4 text-start ring-1 ring-slate-200 focus-within:ring-2 focus-within:ring-emerald-600";

  return (
    <form
      onSubmit={submit}
      noValidate
      role="search"
      aria-label={t("title")}
      data-testid="stay-search-form"
      className={cn("grid gap-2", variant === "hero" ? "md:grid-cols-[1.4fr_1.2fr_1fr_auto]" : "md:grid-cols-[1.2fr_1fr_auto]")}
    >
      {target === "explore" ? (
        <DestinationField cities={cities} query={query} setQuery={setQuery} city={city} setCity={setCity} className={box} />
      ) : null}

      <div>
        <button
          type="button"
          onClick={() => setDatesOpen(true)}
          className={cn(box, "focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:outline-none")}
          aria-describedby={errors.dates ? "stay-dates-error" : undefined}
          data-testid="stay-dates-button"
        >
          <CalendarDays className="size-5 shrink-0 text-emerald-700" aria-hidden="true" />
          <span className="min-w-0">
            <span className="block text-xs text-slate-500">{t("dates")}</span>
            <span className="block truncate text-sm font-semibold text-slate-900" data-testid="stay-dates-value">
              {datesLabel}
              {nights > 0 ? <span className="ms-1 font-normal text-slate-500">· {t("nights", { count: nights })}</span> : null}
            </span>
          </span>
        </button>
        {errors.dates ? (
          <p id="stay-dates-error" role="alert" className="mt-1 px-2 text-xs font-medium text-red-700" data-testid="stay-dates-error">
            {t(`errors.${errors.dates}` as "errors.too_many_nights", { max: MAX_NIGHTS })}
          </p>
        ) : null}
      </div>

      <div>
        <button
          type="button"
          onClick={() => setGuestsOpen(true)}
          className={cn(box, "focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:outline-none")}
          aria-describedby={errors.guests ? "stay-guests-error" : undefined}
          data-testid="stay-guests-button"
        >
          <Users className="size-5 shrink-0 text-emerald-700" aria-hidden="true" />
          <span className="min-w-0">
            <span className="block text-xs text-slate-500">{t("guests")}</span>
            <span className="block truncate text-sm font-semibold text-slate-900" data-testid="stay-guests-value">
              {guestsLabel}
            </span>
          </span>
        </button>
        {errors.guests ? (
          <p id="stay-guests-error" role="alert" className="mt-1 px-2 text-xs font-medium text-red-700" data-testid="stay-guests-error">
            {t(`errors.${errors.guests}` as never)}
          </p>
        ) : null}
      </div>

      <button
        type="submit"
        data-testid="stay-search-submit"
        className="inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-orange-500 px-6 text-base font-bold text-white shadow-sm hover:bg-orange-600 focus-visible:ring-4 focus-visible:ring-orange-200 focus-visible:outline-none"
      >
        <Search className="size-5" aria-hidden="true" />
        {t("submit")}
      </button>

      <DatesDialog open={datesOpen} onOpenChange={setDatesOpen} value={range} onChange={(r) => { setRange(r); setErrors((e) => ({ ...e, dates: undefined })); }} />
      <GuestsDialog open={guestsOpen} onOpenChange={setGuestsOpen} value={party} onChange={(p) => { setParty(p); setErrors((e) => ({ ...e, guests: undefined })); }} />
    </form>
  );
}

/** Accessible combobox: cities filter as you type (Persian/Arabic letter variants folded); free text searches names. */
function DestinationField({
  cities,
  query,
  setQuery,
  city,
  setCity,
  className,
}: {
  cities: CityOption[];
  query: string;
  setQuery: (v: string) => void;
  city: CityOption | null;
  setCity: (c: CityOption | null) => void;
  className: string;
}) {
  const t = useTranslations("StayApp.search");
  const id = useId();
  const listId = `${id}-list`;
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const options = useMemo(() => {
    const q = normalizeSearchText(query);
    if (!q || (city && city.name === query)) return cities.slice(0, 8);
    return cities.filter((c) => normalizeSearchText(`${c.name} ${c.slug} ${c.region ?? ""}`).includes(q)).slice(0, 8);
  }, [cities, query, city]);

  function choose(c: CityOption) {
    setCity(c);
    setQuery(c.name);
    setOpen(false);
    setActive(-1);
  }

  return (
    <div className="relative">
      <div className={className}>
        <MapPin className="size-5 shrink-0 text-emerald-700" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <label htmlFor={id} className="block text-xs text-slate-500">
            {t("destination")}
          </label>
          <input
            ref={inputRef}
            id={id}
            role="combobox"
            aria-expanded={open && options.length > 0}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
            autoComplete="off"
            value={query}
            placeholder={t("destinationPlaceholder")}
            data-testid="stay-destination-input"
            onFocus={() => setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 120)}
            onChange={(e) => {
              setQuery(e.target.value);
              setCity(null);
              setOpen(true);
              setActive(-1);
            }}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setOpen(true);
                setActive((a) => Math.min(options.length - 1, a + 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setActive((a) => Math.max(0, a - 1));
              } else if (e.key === "Enter" && open && active >= 0 && options[active]) {
                e.preventDefault();
                choose(options[active]);
              } else if (e.key === "Escape") {
                setOpen(false);
                setActive(-1);
              }
            }}
            className="w-full bg-transparent text-sm font-semibold text-slate-900 placeholder:font-normal placeholder:text-slate-400 focus:outline-none"
          />
        </div>
      </div>
      {open && options.length > 0 ? (
        <ul id={listId} role="listbox" aria-label={t("destination")} className="absolute inset-x-0 top-full z-30 mt-1 max-h-72 overflow-auto rounded-2xl bg-white p-1 shadow-lg ring-1 ring-slate-200" data-testid="stay-destination-options">
          {options.map((c, i) => (
            <li
              key={c.slug}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === active}
              onMouseDown={(e) => {
                e.preventDefault();
                choose(c);
              }}
              className={cn("flex min-h-11 cursor-pointer items-center gap-2 rounded-xl px-3 text-sm", i === active ? "bg-emerald-50 text-emerald-900" : "hover:bg-slate-50")}
            >
              <MapPin className="size-4 text-slate-400" aria-hidden="true" />
              <span className="font-medium">{c.name}</span>
              {c.region ? <span className="text-xs text-slate-500">{c.region}</span> : null}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export function DatesDialog({
  open,
  onOpenChange,
  value,
  onChange,
  dayInfo,
  note,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  value: { from: string | null; to: string | null };
  onChange: (v: { from: string | null; to: string | null }) => void;
  /** Per-day extras, e.g. the property's cheapest nightly price; soldOut days cannot be a check-in. */
  dayInfo?: (iso: string) => { sublabel?: React.ReactNode; srLabel?: string; soldOut?: boolean } | null;
  /** Shown under the calendar (e.g. "prices per night, in thousand toman"). */
  note?: React.ReactNode;
}) {
  const t = useTranslations("StayApp.search");
  const locale = useLocale();
  const { calendar } = useToursPrefs();
  const [draft, setDraft] = useState(value);
  const today = todayIn();
  const nights = draft.from && draft.to ? nightsBetween(draft.from, draft.to) : 0;
  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (v) setDraft(value);
        onOpenChange(v);
      }}
    >
      <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-md" data-testid="stay-dates-dialog">
        <DialogHeader>
          <DialogTitle>{t("dates")}</DialogTitle>
          <DialogDescription className="sr-only">{t("datesHelp")}</DialogDescription>
        </DialogHeader>
        <DateSteps from={draft.from} to={draft.to} nights={nights} />
        <CalendarPicker
          mode="range"
          calendar={calendar}
          locale={locale}
          value={draft}
          minIso={today}
          maxIso={addDaysIso(today, WINDOW_DAYS)}
          getDay={(iso) => {
            // minIso/maxIso only limit navigation; days outside the bookable window must also be unselectable.
            if (iso < today || iso > addDaysIso(today, WINDOW_DAYS)) return { disabled: true, state: "unavailable" };
            if (draft.from && !draft.to && iso > draft.from && nightsBetween(draft.from, iso) > MAX_NIGHTS) return { disabled: true, state: "too_long" };
            const extra = dayInfo?.(iso);
            if (!extra) return {};
            // A sold-out night cannot start a stay, but can be the check-out day of one.
            const pickingCheckOut = Boolean(draft.from && !draft.to && iso > draft.from);
            if (extra.soldOut && !pickingCheckOut) return { disabled: true, state: "sold_out", srLabel: extra.srLabel, sublabel: extra.sublabel };
            return { state: extra.soldOut ? "sold_out" : "available", srLabel: extra.srLabel, sublabel: extra.sublabel };
          }}
          onChange={(r) => setDraft(r.from && r.to && r.from === r.to ? { from: r.from, to: null } : r)}
          labels={{ previousMonth: t("previousMonth"), nextMonth: t("nextMonth"), grid: t("calendarGrid"), rangeStart: t("rangeStart"), rangeEnd: t("rangeEnd") }}
          testId="stay-range-calendar"
        />
        {note ? <div className="text-xs text-slate-500" data-testid="stay-dates-note">{note}</div> : null}
        <DialogFooter className="flex-row items-center justify-between gap-2 sm:justify-between">
          <button
            type="button"
            className="min-h-11 rounded-full px-4 text-sm font-medium text-slate-600 hover:bg-slate-100"
            onClick={() => setDraft({ from: null, to: null })}
            data-testid="stay-dates-clear"
          >
            {t("clearDates")}
          </button>
          <button
            type="button"
            disabled={Boolean(draft.from) && !draft.to}
            onClick={() => {
              onChange(draft);
              onOpenChange(false);
            }}
            data-testid="stay-dates-done"
            className="min-h-11 rounded-full bg-emerald-700 px-6 text-sm font-bold text-white hover:bg-emerald-800 disabled:opacity-50"
          >
            {t("done")}
            {nights > 0 ? ` · ${t("nights", { count: nights })}` : ""}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Which date the next tap sets, made unmistakable: two step chips (check-in /
 * check-out) with the active one highlighted, plus a live sentence that a
 * screen reader also announces ("Now choose your check-out day").
 */
function DateSteps({ from, to, nights }: { from: string | null; to: string | null; nights: number }) {
  const t = useTranslations("StayApp.search");
  const fmt = useShortDate();
  const step: "in" | "out" | "done" = !from ? "in" : !to ? "out" : "done";
  const chip = (key: "in" | "out", label: string, iso: string | null) => {
    const active = step === key;
    return (
      <div
        data-testid={`stay-dates-step-${key}`}
        data-active={active || undefined}
        aria-current={active ? "step" : undefined}
        className={cn(
          "min-w-0 flex-1 rounded-2xl border px-3 py-2 transition",
          active ? "border-emerald-600 bg-emerald-50 ring-2 ring-emerald-600/30" : "border-slate-200 bg-white",
        )}
      >
        <div className={cn("text-xs", active ? "font-semibold text-emerald-800" : "text-slate-500")}>{label}</div>
        <div className={cn("truncate text-sm font-bold", iso ? "text-slate-900" : "text-slate-400")}>{iso ? fmt(iso) : t("notSelected")}</div>
      </div>
    );
  };
  return (
    <div className="space-y-2">
      <div className="flex items-stretch gap-2">
        {chip("in", t("checkIn"), from)}
        {chip("out", t("checkOut"), to)}
      </div>
      <p
        aria-live="polite"
        data-testid="stay-dates-prompt"
        className={cn("rounded-xl px-3 py-2 text-sm font-semibold", step === "done" ? "bg-slate-50 text-slate-700" : "bg-amber-50 text-amber-900")}
      >
        {step === "in" ? t("pickCheckIn") : step === "out" ? t("pickCheckOut") : t("datesChosen", { count: nights })}
      </p>
    </div>
  );
}

function Stepper({ label, hint, value, min, max, onChange, testId }: { label: string; hint?: string; value: number; min: number; max: number; onChange: (v: number) => void; testId: string }) {
  const t = useTranslations("StayApp.search");
  return (
    <div className="flex items-center justify-between gap-3 py-3" data-testid={testId}>
      <div>
        <div className="text-sm font-semibold text-slate-900">{label}</div>
        {hint ? <div className="text-xs text-slate-500">{hint}</div> : null}
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label={t("decrease", { item: label })}
          disabled={value <= min}
          onClick={() => onChange(value - 1)}
          className="flex size-11 items-center justify-center rounded-full ring-1 ring-slate-300 hover:bg-slate-50 disabled:opacity-40"
          data-testid={`${testId}-minus`}
        >
          <Minus className="size-4" aria-hidden="true" />
        </button>
        <output className="w-6 text-center text-base font-semibold" aria-live="polite" data-testid={`${testId}-value`}>
          {value}
        </output>
        <button
          type="button"
          aria-label={t("increase", { item: label })}
          disabled={value >= max}
          onClick={() => onChange(value + 1)}
          className="flex size-11 items-center justify-center rounded-full ring-1 ring-slate-300 hover:bg-slate-50 disabled:opacity-40"
          data-testid={`${testId}-plus`}
        >
          <Plus className="size-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

export function GuestsDialog({ open, onOpenChange, value, onChange }: { open: boolean; onOpenChange: (v: boolean) => void; value: Party; onChange: (v: Party) => void }) {
  const t = useTranslations("StayApp.search");
  const [draft, setDraft] = useState<Party>(value);
  const missingAge = draft.childAges.some((a) => a == null);
  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (v) setDraft(value);
        onOpenChange(v);
      }}
    >
      <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-md" data-testid="stay-guests-dialog">
        <DialogHeader>
          <DialogTitle>{t("guests")}</DialogTitle>
          <DialogDescription className="sr-only">{t("guests")}</DialogDescription>
        </DialogHeader>
        <div className="divide-y divide-slate-100">
          <Stepper label={t("adults")} hint={t("adultsHint")} value={draft.adults} min={1} max={30} onChange={(adults) => setDraft((d) => ({ ...d, adults, rooms: Math.min(d.rooms, adults) }))} testId="stay-adults" />
          <Stepper
            label={t("children")}
            hint={t("childrenHint")}
            value={draft.childAges.length}
            min={0}
            max={10}
            onChange={(n) => setDraft((d) => ({ ...d, childAges: n > d.childAges.length ? [...d.childAges, null] : d.childAges.slice(0, n) }))}
            testId="stay-children"
          />
          {draft.childAges.length ? (
            <div className="grid grid-cols-2 gap-3 py-3">
              {draft.childAges.map((age, i) => (
                <label key={i} className="text-xs font-medium text-slate-700">
                  {t("childAge", { n: i + 1 })}
                  <select
                    value={age ?? ""}
                    required
                    aria-invalid={age == null}
                    data-testid={`stay-child-age-${i}`}
                    onChange={(e) => setDraft((d) => ({ ...d, childAges: d.childAges.map((a, j) => (j === i ? (e.target.value === "" ? null : Number(e.target.value)) : a)) }))}
                    className={cn("mt-1 min-h-11 w-full rounded-xl border bg-white px-2 text-sm", age == null ? "border-amber-400" : "border-slate-300")}
                  >
                    <option value="">—</option>
                    {Array.from({ length: 13 }, (_, a) => (
                      <option key={a} value={a}>
                        {t("childAgeOption", { age: a })}
                      </option>
                    ))}
                  </select>
                </label>
              ))}
            </div>
          ) : null}
          <Stepper label={t("rooms")} value={draft.rooms} min={1} max={Math.min(5, draft.adults)} onChange={(rooms) => setDraft((d) => ({ ...d, rooms }))} testId="stay-rooms" />
        </div>
        {missingAge ? (
          <p role="alert" className="text-xs font-medium text-amber-800">
            {t("errors.child_age_required")}
          </p>
        ) : null}
        <DialogFooter>
          <button
            type="button"
            disabled={missingAge}
            onClick={() => {
              onChange(draft);
              onOpenChange(false);
            }}
            data-testid="stay-guests-done"
            className="min-h-11 w-full rounded-full bg-emerald-700 px-6 text-sm font-bold text-white hover:bg-emerald-800 disabled:opacity-50"
          >
            {t("done")}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
