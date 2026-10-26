'use client';
import { useMemo, useState } from 'react';
import { AlertTriangle, ChevronLeft, Lock, Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { ImageWithFallback } from '@/components/ui/image-with-fallback';
import { resolveHomeMediaUrl } from '@/features/home/components/home-media';
import { getRichTextPlainText } from '@/features/booking/components/rich-text-preview';
import type { BookingDraftState, ChildBookingDraft, ProviderTypeAddonItem } from '../../types';
import type { BookingCalendar } from '../../lib/calendar';
import {
  MAIN_EVENT_ID, addDays, childLineAmount, childTimedEvent, dayOf, findConflicts, isStay, mainTimedEvent, stayForNight, stayNights, tripDays as buildTripDays,
} from '../../lib/itinerary';
import { pickTranslation } from '../../utils/translation';
import { BookingDialog } from '../step-service/BookingDialog';
import { AddonBookingSheet, type ItineraryTotals, type LabeledEvent, type StayOption } from './AddonBookingSheet';
import { addonIcon, dayParts, formatClock, tintFor } from './itinerary-format';

export interface ItineraryMainSummary {
  title: string;
  providerName?: string | null;
  city?: string | null;
  country?: string | null;
  imageUrl?: string | null;
  durationMinutes?: number | null;
}

type Sheet =
  | { kind: 'types'; day: string }
  | { kind: 'book'; addon: ProviderTypeAddonItem; day: string; editing?: ChildBookingDraft; key: number }
  | { kind: 'detail'; id: string }
  | null;

/** Children may still lack an id for a moment after an optimistic update; give each a stable key. */
const childKey = (child: ChildBookingDraft, index: number) => child.id ?? `pending-${index}`;
// Admin descriptions are rich text -- serialized Lexical JSON (or older HTML); show their words only.
const plainText = (value?: string | null) => getRichTextPlainText(value).replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();

/**
 * Step 3 (add-ons) on phones: the main service and every add-on laid out day by day, with
 * stays pinned on top, time-overlap warnings, and bottom sheets to add, change or remove
 * items. Desktop keeps the ChildAddonBookingCard list; both write the same draft rows.
 */
export function MobileItinerary(props: {
  locale: string;
  calendar: BookingCalendar;
  draft: BookingDraftState;
  addonTypes: ProviderTypeAddonItem[];
  main: ItineraryMainSummary;
  formatMoney: (value?: number | null, currency?: string | null) => string;
  onChildSaved: (child: ChildBookingDraft, totals?: ItineraryTotals) => void;
  onChildRemoved: (childId: string, totals?: ItineraryTotals) => void;
}) {
  const { locale, calendar, draft, addonTypes, main, formatMoney, onChildSaved, onChildRemoved } = props;
  const t = useTranslations('BookingItinerary');
  const [filter, setFilter] = useState<string>('all');
  // Days opened with "add a day before/after", as dates (not counts) so they stay put.
  const [openedDays, setOpenedDays] = useState<string[]>([]);
  const [sheet, setSheet] = useState<Sheet>(null);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [removing, setRemoving] = useState(false);

  const children = useMemo(() => draft.childBookings ?? [], [draft.childBookings]);
  const typeIndex = useMemo(() => new Map(addonTypes.map((addon, index) => [addon.providerTypeId, index])), [addonTypes]);
  const typeById = useMemo(() => new Map(addonTypes.map((addon) => [addon.providerTypeId, addon])), [addonTypes]);
  const days = useMemo(() => buildTripDays({ draft, children, include: openedDays }), [draft, children, openedDays]);
  const serviceName = (child: ChildBookingDraft) => pickTranslation(child.serviceNameTranslations, locale) || typeById.get(child.providerTypeId)?.label || t('unnamed');
  const providerName = (child: ChildBookingDraft) => pickTranslation(child.providerNameTranslations, locale);

  const mainEvent = mainTimedEvent(draft, main.durationMinutes);
  // Cheap to rebuild (one entry per item), so no memo: it depends on render-scoped name helpers.
  const events: LabeledEvent[] = (() => {
    const list: LabeledEvent[] = [];
    if (mainEvent) list.push({ ...mainEvent, title: main.title });
    children.forEach((child, index) => {
      const event = childTimedEvent(child, childKey(child, index));
      if (event) list.push({ ...event, title: serviceName(child) });
    });
    return list;
  })();
  const conflicts = findConflicts(events);
  const titleOf = (id: string) => events.find((event) => event.id === id)?.title ?? '';

  const stays = children.filter(isStay);
  const stayOptions: StayOption[] = stays
    .map((stay, index) => ({ id: childKey(stay, index), name: providerName(stay) || serviceName(stay), from: dayOf(stay.selectedDateFrom) ?? '', to: dayOf(stay.selectedDateTo) ?? '' }))
    .filter((stay) => stay.from && stay.to);
  const providerCount = new Set([draft.providerId, ...children.map((child) => child.providerId)].filter(Boolean)).size;
  const conflictCount = Object.keys(conflicts).length;
  const missingRequired = addonTypes.filter((addon) => addon.isRequired && !children.some((child) => child.providerTypeId === addon.providerTypeId));
  const usedTypes = addonTypes.filter((addon) => children.some((child) => child.providerTypeId === addon.providerTypeId));
  const inFilter = (providerTypeId?: string) => filter === 'all' || filter === providerTypeId;

  const firstDay = days[0];
  const lastDay = days[days.length - 1];
  const tripNights = Math.max(0, days.length - 1);
  const place = [main.city, main.country].filter(Boolean).join('، ');
  const heroImage = resolveHomeMediaUrl(main.imageUrl);

  function openAdd(day: string) {
    if (addonTypes.length === 1) {
      setSheet({ kind: 'book', addon: addonTypes[0], day, key: Date.now() });
      return;
    }
    setSheet({ kind: 'types', day });
  }
  function openDetail(id: string) {
    setConfirmRemove(false);
    setSheet({ kind: 'detail', id });
  }

  async function removeChild(child: ChildBookingDraft) {
    if (!child.id || !draft.id) return;
    if (!confirmRemove) { setConfirmRemove(true); return; }
    setRemoving(true);
    try {
      const response = await fetch('/api/booking-pro/child-booking', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ draftId: draft.id, childId: child.id }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        const code = String(data?.error ?? '');
        toast.error(t.has(`errors.${code}`) ? t(`errors.${code}` as any) : t('errors.generic'));
        return;
      }
      onChildRemoved(child.id, data?.totals);
      setSheet(null);
      toast.success(t('removed'));
    } catch {
      toast.error(t('errors.generic'));
    } finally {
      setRemoving(false);
      setConfirmRemove(false);
    }
  }

  const iconTile = (providerTypeId: string | null, className = 'h-10 w-10 rounded-xl') => {
    if (!providerTypeId) {
      return <span className={`${className} flex shrink-0 items-center justify-center bg-[#083f30] text-white`}><Lock className="h-4 w-4" aria-hidden/></span>;
    }
    const addon = typeById.get(providerTypeId);
    const Icon = addonIcon(addon?.icon);
    return <span className={`${className} flex shrink-0 items-center justify-center ${tintFor(typeIndex.get(providerTypeId) ?? 0)}`}><Icon className="h-5 w-5" aria-hidden/></span>;
  };

  const renderChildCard = (child: ChildBookingDraft, index: number) => {
    const key = childKey(child, index);
    const event = events.find((item) => item.id === key);
    const clashWith = conflicts[key];
    const location = (child.metadata as any)?.serviceLocationNote as string | undefined;
    const sub = [providerName(child), location, child.adults && child.adults > 1 ? t('guestsCount', { count: child.adults }) : null].filter(Boolean).join(' · ');
    return (<button key={key} type="button" onClick={() => openDetail(key)} data-testid="itinerary-item" className={`flex w-full flex-col gap-2.5 rounded-[18px] border bg-white p-3 text-start ${clashWith ? 'border-amber-400' : 'border-slate-200'}`}>
      <span className="flex w-full items-start gap-2.5">
        {iconTile(child.providerTypeId)}
        <span className="min-w-0 flex-1">
          {event ? <span className="block text-xs font-bold text-slate-500">{t('timeRange', { from: formatClock(event.start, locale), to: formatClock(event.end, locale) })}</span> : null}
          <span className="block text-sm font-extrabold text-slate-900">{serviceName(child)}</span>
          {sub ? <span className="block text-xs text-slate-500">{sub}</span> : null}
        </span>
        <span className="flex shrink-0 flex-col items-end gap-1.5">
          <span className="text-[13px] font-extrabold text-slate-900">{formatMoney(childLineAmount(child), child.currency)}</span>
          <ChevronLeft className="h-4 w-4 text-slate-500 ltr:rotate-180" aria-hidden/>
        </span>
      </span>
      {clashWith ? (<span className="flex w-full items-center gap-1.5 rounded-lg bg-amber-50 px-2.5 py-1.5 text-xs font-bold text-amber-900"><AlertTriangle className="h-4 w-4 shrink-0" aria-hidden/>{t('overlapWith', { title: titleOf(clashWith) })}</span>) : null}
    </button>);
  };

  const detailId = sheet?.kind === 'detail' ? sheet.id : null;
  const detailChild = detailId && detailId !== MAIN_EVENT_ID ? children.find((child, index) => childKey(child, index) === detailId) : undefined;
  const detailIsMain = detailId === MAIN_EVENT_ID;

  return (<div className="space-y-3" data-testid="mobile-itinerary">
    {/* Trip card: the main provider's photo fills the card; a dark scrim keeps the text legible. */}
    <section className="relative isolate overflow-hidden rounded-[24px] bg-[#083f30] text-white shadow-lg">
      {heroImage ? <ImageWithFallback fill priority sizes="100vw" src={heroImage} alt="" className="-z-10 object-cover" fallbackClassName="absolute inset-0 -z-10 bg-transparent" fallbackIcon={<span/>}/> : null}
      <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-t from-black/80 via-black/45 to-black/10"/>
      <div className="flex min-h-[188px] flex-col justify-end gap-3 p-4">
        <div>
          <h2 className="text-2xl font-extrabold">{place || t('title')}</h2>
          <p className="mt-1 text-sm text-white/90">{t('tripLength', { days: days.length, nights: tripNights })} · {t('dateRange', { from: dayParts(firstDay, locale, calendar).short, to: dayParts(lastDay, locale, calendar).short })}</p>
        </div>
        <dl className="grid grid-cols-3 gap-2">
          <div className="rounded-2xl bg-white/15 p-2.5 backdrop-blur"><dt className="text-[11px] text-white/80">{t('statServices')}</dt><dd className="text-base font-extrabold">{new Intl.NumberFormat(locale).format(children.length + 1)}</dd></div>
          <div className="rounded-2xl bg-white/15 p-2.5 backdrop-blur"><dt className="text-[11px] text-white/80">{t('statProviders')}</dt><dd className="text-base font-extrabold">{new Intl.NumberFormat(locale).format(providerCount)}</dd></div>
          <div className={`rounded-2xl p-2.5 backdrop-blur ${conflictCount ? 'bg-amber-400/90 text-amber-950' : 'bg-white/15'}`}><dt className={`text-[11px] ${conflictCount ? 'text-amber-950' : 'text-white/80'}`}>{t('statConflicts')}</dt><dd className="text-base font-extrabold" data-testid="itinerary-conflicts">{conflictCount ? t('conflictsCount', { count: conflictCount }) : t('noConflicts')}</dd></div>
        </dl>
      </div>
    </section>

    {missingRequired.map((addon) => (<button key={addon.providerTypeId} type="button" onClick={() => setSheet({ kind: 'book', addon, day: firstDay, key: Date.now() })} className="flex w-full items-center gap-2 rounded-2xl bg-amber-50 p-3 text-start text-xs font-bold text-amber-900">
      <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden/><span className="flex-1">{t('requiredMissing', { type: addon.label })}</span><Plus className="h-4 w-4" aria-hidden/>
    </button>))}

    {usedTypes.length ? (<div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1" role="group">
      {[{ id: 'all', label: t('filterAll') }, ...usedTypes.map((addon) => ({ id: addon.providerTypeId, label: addon.label }))].map((item) => (<button key={item.id} type="button" aria-pressed={filter === item.id} onClick={() => setFilter(item.id)} className={`min-h-10 shrink-0 rounded-full border px-4 text-[13px] font-bold ${filter === item.id ? 'border-[#083f30] bg-[#083f30] text-white' : 'border-slate-300 bg-white text-slate-900'}`}>{item.label}</button>))}
    </div>) : null}

    {stays.length && stays.some((stay) => inFilter(stay.providerTypeId)) ? (<section className="space-y-2">
      <h3 className="text-[13px] font-bold text-slate-600">{t('staysTitle')}</h3>
      {children.map((child, index) => {
        if (!isStay(child) || !inFilter(child.providerTypeId)) return null;
        const key = childKey(child, index);
        const image = resolveHomeMediaUrl(child.providerImageUrl);
        const from = dayOf(child.selectedDateFrom);
        const to = dayOf(child.selectedDateTo);
        return (<button key={key} type="button" onClick={() => openDetail(key)} data-testid="itinerary-stay" className="flex w-full items-center gap-3 rounded-[20px] border border-slate-200 bg-white p-3 text-start">
          <span className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-sky-100">{image ? <ImageWithFallback fill sizes="64px" src={image} alt="" className="object-cover"/> : <span className="flex h-full w-full items-center justify-center">{iconTile(child.providerTypeId, 'h-10 w-10 rounded-xl')}</span>}</span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[15px] font-extrabold text-slate-900">{providerName(child) || serviceName(child)}</span>
            <span className="block truncate text-xs text-slate-500">{serviceName(child)}{from && to ? ` · ${t('dateRange', { from: dayParts(from, locale, calendar).short, to: dayParts(to, locale, calendar).short })} · ${t('nights', { count: stayNights(from, to) })}` : ''}</span>
            <span className="block text-[13px] font-bold text-slate-900">{formatMoney(childLineAmount(child), child.currency)}</span>
          </span>
          <ChevronLeft className="h-4 w-4 shrink-0 text-slate-500 ltr:rotate-180" aria-hidden/>
        </button>);
      })}
    </section>) : null}

    <button type="button" onClick={() => setOpenedDays((current) => [...current, addDays(days[0], -1)])} className="min-h-10 w-full rounded-2xl text-xs font-bold text-[#083f30]">+ {t('addDayBefore')}</button>

    <ol className="space-y-0">
      {days.map((day, dayIndex) => {
        const parts = dayParts(day, locale, calendar);
        const night = stayForNight(stays, day);
        const mainHere = (mainEvent ? mainEvent.date === day : dayOf(draft.bookingUiMode === 'date_range' ? draft.selectedDateFrom : draft.selectedDate) === day);
        const dayChildren = children
          .map((child, index) => ({ child, index, event: childTimedEvent(child, childKey(child, index)) }))
          .filter(({ child }) => !isStay(child) && dayOf(child.selectedDate ?? child.selectedDateFrom) === day)
          .sort((a, b) => (a.event?.start ?? 24 * 60) - (b.event?.start ?? 24 * 60));
        const shown = dayChildren.filter(({ child }) => inFilter(child.providerTypeId));
        const showMain = mainHere && filter === 'all';
        const nothing = !dayChildren.length && !mainHere;
        return (<li key={day} className="flex gap-2.5" data-testid="itinerary-day" data-day={day}>
          <div className="flex w-10 shrink-0 flex-col items-center pt-3">
            <span className="text-[10px] text-slate-500">{t('dayShort')}</span>
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#083f30] text-[15px] font-extrabold text-white">{new Intl.NumberFormat(locale).format(dayIndex + 1)}</span>
            <span aria-hidden className="mt-1.5 w-0.5 flex-1 bg-slate-200"/>
          </div>
          <div className="min-w-0 flex-1 space-y-2.5 pb-5 pt-3.5">
            <div className="pt-2">
              <div className="text-[15px] font-extrabold text-slate-900">{parts.long}</div>
              {night ? <div className="text-xs text-slate-500">{t('nightAt', { name: providerName(night) || serviceName(night) })}</div> : null}
            </div>
            {showMain ? (<button type="button" onClick={() => openDetail(MAIN_EVENT_ID)} data-testid="itinerary-main" className={`flex w-full flex-col gap-2.5 rounded-[18px] border bg-white p-3 text-start ${conflicts[MAIN_EVENT_ID] ? 'border-amber-400' : 'border-[#083f30]/30'}`}>
              <span className="flex w-full items-start gap-2.5">
                {iconTile(null)}
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-1.5">
                    {mainEvent ? <span className="text-xs font-bold text-slate-500">{t('timeRange', { from: formatClock(mainEvent.start, locale), to: formatClock(mainEvent.end, locale) })}</span> : null}
                    <span className="rounded-full bg-[#083f30] px-2 py-0.5 text-[11px] font-bold text-white">{t('mainBadge')}</span>
                  </span>
                  <span className="block text-sm font-extrabold text-slate-900">{main.title}</span>
                  {main.providerName ? <span className="block text-xs text-slate-500">{main.providerName}</span> : null}
                </span>
                <span className="shrink-0 text-[13px] font-extrabold text-slate-900">{formatMoney(draft.subtotalAmount ?? 0, draft.currency)}</span>
              </span>
              {conflicts[MAIN_EVENT_ID] ? (<span className="flex w-full items-center gap-1.5 rounded-lg bg-amber-50 px-2.5 py-1.5 text-xs font-bold text-amber-900"><AlertTriangle className="h-4 w-4 shrink-0" aria-hidden/>{t('overlapWith', { title: titleOf(conflicts[MAIN_EVENT_ID]) })}</span>) : null}
            </button>) : null}
            {shown.map(({ child, index }) => renderChildCard(child, index))}
            {nothing ? <p className="px-0.5 text-[13px] text-slate-500">{t('emptyDay')}</p> : (!shown.length && !showMain) ? <p className="px-0.5 text-[13px] text-slate-500">{t('emptyFiltered')}</p> : null}
            {addonTypes.length ? (<button type="button" onClick={() => openAdd(day)} data-testid="itinerary-add" className="flex min-h-12 w-full items-center justify-center gap-1.5 rounded-2xl border-[1.5px] border-dashed border-[#083f30]/40 text-[13px] font-bold text-[#083f30]">
              <Plus className="h-4 w-4" aria-hidden/>{t('addToDay', { number: dayIndex + 1 })}
            </button>) : null}
          </div>
        </li>);
      })}
    </ol>

    <button type="button" onClick={() => setOpenedDays((current) => [...current, addDays(days[days.length - 1], 1)])} className="min-h-10 w-full rounded-2xl text-xs font-bold text-[#083f30]">+ {t('addDayAfter')}</button>
    {!addonTypes.length ? <div className="rounded-2xl border border-dashed border-slate-300 p-4 text-sm text-slate-600">{t('noAddons')}</div> : null}

    {/* Pick a service type: photo tiles, the type's image filling the whole card. */}
    {sheet?.kind === 'types' ? (<BookingDialog open title={t('addTitle', { number: days.indexOf(sheet.day) + 1 })} onClose={() => setSheet(null)}>
      <div className="px-4 pb-6 pt-3" data-testid="itinerary-type-sheet">
        <span aria-hidden className="mx-auto mb-3 block h-1.5 w-11 rounded-full bg-slate-200 sm:hidden"/>
        <div className="text-[17px] font-extrabold text-slate-900">{t('addTitle', { number: days.indexOf(sheet.day) + 1 })} · {dayParts(sheet.day, locale, calendar).long}</div>
        <p className="text-xs text-slate-500">{t('addSubtitle')}</p>
        <div className="mt-4 grid grid-cols-2 gap-2.5">
          {addonTypes.map((addon, index) => {
            const image = resolveHomeMediaUrl(addon.imageUrl);
            const Icon = addonIcon(addon.icon);
            return (<button key={addon.providerTypeId} type="button" onClick={() => setSheet({ kind: 'book', addon, day: sheet.day, key: Date.now() })} className={`relative isolate flex min-h-[132px] flex-col justify-end overflow-hidden rounded-[20px] p-3 text-start ${image ? 'text-white' : tintFor(index)}`}>
              {image ? (<>
                <ImageWithFallback fill sizes="50vw" src={image} alt="" className="-z-10 object-cover" fallbackClassName="absolute inset-0 -z-10 bg-transparent" fallbackIcon={<span/>}/>
                <span aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-t from-black/80 via-black/35 to-transparent"/>
              </>) : (<Icon className="absolute end-3 top-3 h-7 w-7 opacity-70" aria-hidden/>)}
              {addon.isRequired ? <span className="absolute start-3 top-3 rounded-full bg-amber-400 px-2 py-0.5 text-[11px] font-bold text-amber-950">{t('required')}</span> : null}
              <span className="text-[15px] font-extrabold">{addon.label}</span>
              {plainText(addon.description) ? <span className={`line-clamp-2 text-xs ${image ? 'text-white/90' : 'opacity-80'}`}>{plainText(addon.description)}</span> : null}
            </button>);
          })}
        </div>
      </div>
    </BookingDialog>) : null}

    {sheet?.kind === 'book' && draft.id ? (<AddonBookingSheet
      key={sheet.key}
      open
      onClose={() => setSheet(null)}
      locale={locale}
      calendar={calendar}
      draftId={draft.id}
      addon={sheet.addon}
      editing={sheet.editing}
      initialDate={sheet.day}
      tripDays={days}
      events={events}
      stays={stayOptions}
      city={main.city}
      country={main.country}
      onSaved={(child, totals) => {
        const wasEditing = Boolean(sheet.editing);
        onChildSaved(child, totals);
        setSheet(null);
        const day = dayOf(child.selectedDate ?? child.selectedDateFrom);
        toast.success(wasEditing ? t('saved') : isStay(child) ? t('addedStay') : t('added', { number: day ? Math.max(1, days.indexOf(day) + 1) : 1 }));
      }}
    />) : null}

    {sheet?.kind === 'detail' ? (<BookingDialog open title={detailIsMain ? main.title : detailChild ? serviceName(detailChild) : ''} onClose={() => setSheet(null)}>
      <div className="px-4 pb-6 pt-3" data-testid="itinerary-detail-sheet">
        <span aria-hidden className="mx-auto mb-3 block h-1.5 w-11 rounded-full bg-slate-200 sm:hidden"/>
        {detailIsMain ? (<>
          <div className="flex items-center gap-3">{iconTile(null, 'h-11 w-11 rounded-2xl')}<div><div className="text-xs text-slate-500">{t('mainBadge')}</div><div className="text-[17px] font-extrabold text-slate-900">{main.title}</div></div></div>
          <dl className="mt-3 divide-y divide-slate-100 text-[13px]">
            {mainEvent ? <div className="flex justify-between gap-3 py-3"><dt className="text-slate-500">{t('detailWhen')}</dt><dd className="text-end font-bold">{dayParts(mainEvent.date, locale, calendar).long} · {t('timeRange', { from: formatClock(mainEvent.start, locale), to: formatClock(mainEvent.end, locale) })}</dd></div> : null}
            {main.providerName ? <div className="flex justify-between gap-3 py-3"><dt className="text-slate-500">{t('detailProvider')}</dt><dd className="text-end font-bold">{main.providerName}</dd></div> : null}
            <div className="flex justify-between gap-3 py-3"><dt className="text-slate-500">{t('detailAmount')}</dt><dd className="text-end font-bold">{formatMoney(draft.subtotalAmount ?? 0, draft.currency)}</dd></div>
          </dl>
          {conflicts[MAIN_EVENT_ID] ? <p className="mt-3 rounded-2xl bg-amber-50 p-3 text-xs font-bold text-amber-900">{t('conflictDetail', { title: titleOf(conflicts[MAIN_EVENT_ID]) })}</p> : null}
          <p className="mt-3 rounded-2xl bg-slate-100 p-3 text-xs leading-6 text-slate-800">{t('mainLocked')}</p>
          <button type="button" onClick={() => setSheet(null)} className="mt-4 min-h-12 w-full rounded-full bg-slate-100 text-sm font-extrabold text-slate-900">{t('gotIt')}</button>
        </>) : detailChild ? (() => {
          const key = detailId as string;
          const event = events.find((item) => item.id === key);
          const from = dayOf(detailChild.selectedDateFrom);
          const to = dayOf(detailChild.selectedDateTo);
          const addon = typeById.get(detailChild.providerTypeId);
          const location = (detailChild.metadata as any)?.serviceLocationNote as string | undefined;
          return (<>
            <div className="flex items-center gap-3">{iconTile(detailChild.providerTypeId, 'h-11 w-11 rounded-2xl')}<div className="min-w-0"><div className="text-xs text-slate-500">{addon?.label}</div><div className="text-[17px] font-extrabold text-slate-900">{serviceName(detailChild)}</div></div></div>
            <dl className="mt-3 divide-y divide-slate-100 text-[13px]">
              {isStay(detailChild) && from && to ? (<div className="flex justify-between gap-3 py-3"><dt className="text-slate-500">{t('detailDates')}</dt><dd className="text-end font-bold">{t('dateRange', { from: dayParts(from, locale, calendar).long, to: dayParts(to, locale, calendar).long })} · {t('nights', { count: stayNights(from, to) })}</dd></div>) : null}
              {!isStay(detailChild) && event ? (<div className="flex justify-between gap-3 py-3"><dt className="text-slate-500">{t('detailWhen')}</dt><dd className="text-end font-bold">{dayParts(event.date, locale, calendar).long} · {t('timeRange', { from: formatClock(event.start, locale), to: formatClock(event.end, locale) })}</dd></div>) : null}
              {providerName(detailChild) ? <div className="flex justify-between gap-3 py-3"><dt className="text-slate-500">{t('detailProvider')}</dt><dd className="text-end font-bold">{providerName(detailChild)}</dd></div> : null}
              {location ? <div className="flex justify-between gap-3 py-3"><dt className="text-slate-500">{t('detailLocation')}</dt><dd className="text-end font-bold">{location}</dd></div> : null}
              {detailChild.adults ? <div className="flex justify-between gap-3 py-3"><dt className="text-slate-500">{t('detailGuests')}</dt><dd className="text-end font-bold">{t('guestsCount', { count: detailChild.adults })}</dd></div> : null}
              <div className="flex justify-between gap-3 py-3"><dt className="text-slate-500">{t('detailAmount')}</dt><dd className="text-end font-bold">{formatMoney(childLineAmount(detailChild), detailChild.currency)}</dd></div>
            </dl>
            {conflicts[key] ? <p className="mt-3 rounded-2xl bg-amber-50 p-3 text-xs font-bold text-amber-900">{t('conflictDetail', { title: titleOf(conflicts[key]) })}</p> : null}
            <div className="mt-4 flex gap-2.5">
              <button type="button" disabled={removing} onClick={() => removeChild(detailChild)} className={`min-h-12 flex-1 rounded-full border-[1.5px] text-sm font-extrabold ${confirmRemove ? 'border-red-700 bg-red-700 text-white' : 'border-red-200 bg-white text-red-700'}`}>{removing ? t('removing') : confirmRemove ? t('confirmRemove') : t('removeItem')}</button>
              {addon ? <button type="button" onClick={() => setSheet({ kind: 'book', addon, day: dayOf(detailChild.selectedDate ?? detailChild.selectedDateFrom) ?? firstDay, editing: detailChild, key: Date.now() })} className="min-h-12 flex-1 rounded-full bg-[#083f30] text-sm font-extrabold text-white">{t('editItem')}</button> : null}
            </div>
          </>);
        })() : null}
      </div>
    </BookingDialog>) : null}
  </div>);
}
