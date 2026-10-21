'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, ArrowLeft, Check, Loader2, MapPin, Search, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { ImageWithFallback } from '@/components/ui/image-with-fallback';
import { DynamicServiceForm } from '@/features/form-builder/components/DynamicServiceForm';
import { formatCurrencyAmount } from '@/features/finance/lib/money';
import { resolveHomeMediaUrl } from '@/features/home/components/home-media';
import type { ChildBookingDraft, ProviderCardItem, ProviderTypeAddonItem, ServiceCardItem, SpecialistCardItem } from '../../types';
import type { BookingCalendar } from '../../lib/calendar';
import { ITINERARY_START_TIMES, addDays, clockToMinutes, dayOf, firstClash, minutesToClock, stayNights, type TimedEvent } from '../../lib/itinerary';
import { pickTranslation } from '../../utils/translation';
import { BookingDialog } from '../step-service/BookingDialog';
import { BookingDatePicker } from '../BookingDatePicker';
import { AdultsStepper } from '../AdultsStepper';
import { MealPlanPicker } from '../MealPlanPicker';
import { dayParts, formatClock } from './itinerary-format';

export type ItineraryTotals = { subtotalAmount?: number; addonsAmount?: number; totalAmount?: number };
export interface LabeledEvent extends TimedEvent { title: string }
export interface StayOption { id: string; name: string; from: string; to: string }

type StepKey = 'provider' | 'service' | 'specialist' | 'when';
const PAGE = 6;
const DURATION_CHOICES = [30, 60, 90, 120, 180, 240];

/** The service a child points at, reduced to what this sheet needs (from a list item or a saved child). */
interface ChosenService {
  id: string;
  name: string;
  serviceDefinitionId?: string;
  value: number;
  currency: string;
  durationMinutes?: number | null;
  bookingUiMode: ChildBookingDraft['bookingUiMode'];
  requiresSpecialist: boolean;
  requiresCustomerAddress: boolean;
}

function usePagedList<T>(baseUrl: string | null) {
  const [offset, setOffset] = useState(0);
  const [items, setItems] = useState<T[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [nonce, setNonce] = useState(0);
  useEffect(() => { setOffset(0); setItems([]); setTotal(null); }, [baseUrl]);
  useEffect(() => {
    if (!baseUrl) return;
    let cancelled = false;
    setLoading(true);
    setError(false);
    fetch(`${baseUrl}&offset=${offset}&take=${PAGE}`, { cache: 'no-store' })
      .then((response) => { if (!response.ok) throw new Error(String(response.status)); return response.json(); })
      .then((data) => {
        if (cancelled) return;
        const page: T[] = Array.isArray(data?.items) ? data.items : [];
        setItems((previous) => (offset === 0 ? page : [...previous, ...page]));
        setHasMore(Boolean(data?.hasMore));
        setTotal(typeof data?.total === 'number' ? data.total : null);
      })
      .catch(() => { if (!cancelled) setError(true); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [baseUrl, offset, nonce]);
  return { items, hasMore, total, loading, error, loadMore: () => setOffset((value) => value + PAGE), retry: () => setNonce((value) => value + 1) };
}

function useDebounced(value: string, delayMs = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(timer);
  }, [value, delayMs]);
  return debounced;
}

function chosenFromChild(child: ChildBookingDraft, locale: string): ChosenService | null {
  if (!child.serviceId) return null;
  return {
    id: child.serviceId,
    name: pickTranslation(child.serviceNameTranslations, locale),
    serviceDefinitionId: child.serviceDefinitionId,
    value: Number(child.subtotalAmount ?? 0),
    currency: child.currency ?? 'USD',
    durationMinutes: child.durationMinutes ?? null,
    bookingUiMode: child.bookingUiMode ?? 'default_slot',
    requiresSpecialist: Boolean(child.requiresSpecialist),
    requiresCustomerAddress: Boolean(child.requiresCustomerAddress),
  };
}

export function AddonBookingSheet(props: {
  open: boolean;
  onClose: () => void;
  locale: string;
  calendar: BookingCalendar;
  draftId: string;
  addon: ProviderTypeAddonItem;
  /** The saved child being changed; absent when adding a new one. */
  editing?: ChildBookingDraft;
  initialDate: string;
  tripDays: string[];
  events: LabeledEvent[];
  stays: StayOption[];
  city?: string | null;
  country?: string | null;
  onSaved: (child: ChildBookingDraft, totals?: ItineraryTotals) => void;
}) {
  const { open, onClose, locale, calendar, draftId, addon, editing, initialDate, tripDays, events, stays, city, country, onSaved } = props;
  const t = useTranslations('BookingItinerary');
  const tBooking = useTranslations('Booking');

  const [model, setModel] = useState<ChildBookingDraft>(() => editing
    ? { ...editing }
    : { providerTypeId: addon.providerTypeId, bookingUiMode: 'default_slot', requiresSpecialist: false, selectedDate: initialDate, adults: 1 });
  const [service, setService] = useState<ChosenService | null>(() => (editing ? chosenFromChild(editing, locale) : null));
  const [providerLabel, setProviderLabel] = useState<{ name: string; imageUrl?: string | null } | null>(() => editing?.providerId
    ? { name: pickTranslation(editing.providerNameTranslations, locale), imageUrl: editing.providerImageUrl }
    : null);
  const [specialistName, setSpecialistName] = useState<string | null>(null);
  const [step, setStep] = useState<StepKey>(editing ? 'when' : 'provider');
  const [saving, setSaving] = useState(false);
  const [showOtherDate, setShowOtherDate] = useState(false);
  const [pickedDuration, setPickedDuration] = useState<number | null>(() => {
    const from = clockToMinutes(editing?.selectedTimeFrom);
    const to = clockToMinutes(editing?.selectedTimeTo);
    return from != null && to != null && to > from ? to - from : null;
  });
  const [serviceForm, setServiceForm] = useState<any>(null);

  // City scope, as on desktop: start at the main provider's city when it has providers of this type.
  const [cities, setCities] = useState<string[]>([]);
  const [citiesReady, setCitiesReady] = useState(false);
  const [selectedCity, setSelectedCity] = useState(city ?? '');
  const [scope, setScope] = useState<'city' | 'country'>('city');
  useEffect(() => {
    let cancelled = false;
    fetch(`/api/booking-pro/catalog/addon-cities?providerTypeId=${encodeURIComponent(addon.providerTypeId)}`, { cache: 'no-store' })
      .then((response) => (response.ok ? response.json() : { cities: [] }))
      .then((data) => {
        if (cancelled) return;
        const list: string[] = Array.isArray(data?.cities) ? data.cities : [];
        setCities(list);
        setSelectedCity((current) => list.find((item) => item.toLowerCase() === current.trim().toLowerCase()) ?? list[0] ?? '');
      })
      .catch(() => undefined)
      .finally(() => { if (!cancelled) setCitiesReady(true); });
    return () => { cancelled = true; };
  }, [addon.providerTypeId]);

  const [providerSearch, setProviderSearch] = useState('');
  const [serviceSearch, setServiceSearch] = useState('');
  const debouncedProviderSearch = useDebounced(providerSearch);
  const debouncedServiceSearch = useDebounced(serviceSearch);
  const providerUrl = citiesReady
    ? `/api/booking-pro/catalog/providers?locale=${encodeURIComponent(locale)}&providerTypeId=${encodeURIComponent(addon.providerTypeId)}&context=addon${scope === 'country' && country ? `&country=${encodeURIComponent(country)}` : `&city=${encodeURIComponent(selectedCity)}`}&search=${encodeURIComponent(debouncedProviderSearch)}`
    : null;
  const providers = usePagedList<ProviderCardItem>(step === 'provider' ? providerUrl : null);
  const servicesUrl = model.providerId
    ? `/api/booking-pro/catalog/services?locale=${encodeURIComponent(locale)}&providerId=${encodeURIComponent(model.providerId)}&search=${encodeURIComponent(debouncedServiceSearch)}`
    : null;
  const services = usePagedList<ServiceCardItem>(step === 'service' ? servicesUrl : null);
  const specialistsUrl = model.providerId && model.serviceId && service?.requiresSpecialist
    ? `/api/booking-pro/catalog/specialists?locale=${encodeURIComponent(locale)}&providerId=${encodeURIComponent(model.providerId)}&serviceId=${encodeURIComponent(model.serviceId)}&search=`
    : null;
  const specialists = usePagedList<SpecialistCardItem>(step === 'specialist' ? specialistsUrl : null);

  const steps: StepKey[] = ['provider', 'service', ...(service?.requiresSpecialist ? ['specialist' as const] : []), 'when'];
  const stepIndex = Math.max(0, steps.indexOf(step));
  const stepLabel = (key: StepKey) => (key === 'provider' ? t('stepProvider') : key === 'service' ? t('stepService') : key === 'specialist' ? t('stepSpecialist')
    : service?.bookingUiMode === 'date_range' ? t('stepStay') : service?.bookingUiMode === 'custom_form' ? t('stepForm') : t('stepWhen'));

  function pickProvider(item: ProviderCardItem) {
    setProviderLabel({ name: item.name, imageUrl: item.imageUrl });
    setService(null);
    setSpecialistName(null);
    setModel((current) => ({ ...current, providerId: item.id, serviceId: undefined, serviceDefinitionId: undefined, specialistId: undefined, formSubmissionId: undefined }));
  }
  function pickService(item: ServiceCardItem) {
    const mode = item.bookingUiMode ?? 'default_slot';
    setService({
      id: item.id, name: item.name, serviceDefinitionId: item.serviceDefinitionId, value: Number(item.value ?? 0), currency: item.currency,
      durationMinutes: item.durationMinutes, bookingUiMode: mode, requiresSpecialist: Boolean(item.requiresSpecialist), requiresCustomerAddress: Boolean(item.requiresCustomerAddress),
    });
    setSpecialistName(null);
    setModel((current) => {
      const day = dayOf(current.selectedDate ?? current.selectedDateFrom) ?? initialDate;
      const base = { ...current, serviceId: item.id, serviceDefinitionId: item.serviceDefinitionId, bookingUiMode: mode, requiresSpecialist: Boolean(item.requiresSpecialist), subtotalAmount: Number(item.value ?? 0), currency: item.currency, specialistId: undefined, formSubmissionId: undefined };
      if (mode === 'date_range') {
        const from = dayOf(current.selectedDateFrom) ?? day;
        const to = dayOf(current.selectedDateTo);
        return { ...base, selectedDate: undefined, selectedTime: undefined, selectedTimeFrom: undefined, selectedTimeTo: undefined, selectedDateFrom: from, selectedDateTo: to && to > from ? to : addDays(from, 1) };
      }
      return { ...base, selectedDate: day, selectedDateFrom: day, selectedDateTo: day };
    });
  }

  // Auto-advance only when there is provably a single option and the customer is not searching.
  const autoAdvanced = useRef<Set<StepKey>>(new Set());
  useEffect(() => {
    if (editing || step !== 'provider' || providers.loading || debouncedProviderSearch || autoAdvanced.current.has('provider')) return;
    if (providers.items.length === 1 && !providers.hasMore && (providers.total == null || providers.total === 1)) {
      autoAdvanced.current.add('provider');
      pickProvider(providers.items[0]);
      setStep('service');
    }
  }, [providers.items, providers.loading, providers.hasMore, providers.total, step, editing, debouncedProviderSearch, pickProvider]);
  useEffect(() => {
    if (editing || step !== 'service' || services.loading || debouncedServiceSearch || autoAdvanced.current.has('service')) return;
    if (services.items.length === 1 && !services.hasMore && (services.total == null || services.total === 1)) {
      autoAdvanced.current.add('service');
      const only = services.items[0];
      pickService(only);
      setStep(only.requiresSpecialist ? 'specialist' : 'when');
    }
  }, [services.items, services.loading, services.hasMore, services.total, step, editing, debouncedServiceSearch, pickService]);

  // Custom-form add-ons collect their details through the admin-built form.
  useEffect(() => {
    if (step !== 'when' || service?.bookingUiMode !== 'custom_form' || !service.serviceDefinitionId) { setServiceForm(null); return; }
    let cancelled = false;
    fetch(`/api/form-builder/service-form?serviceDefinitionId=${encodeURIComponent(service.serviceDefinitionId)}&usageScope=child_addon_booking`, { cache: 'no-store' })
      .then((response) => (response.ok ? response.json() : { form: null }))
      .then((data) => { if (!cancelled) setServiceForm(data?.form ?? null); })
      .catch(() => { if (!cancelled) setServiceForm(null); });
    return () => { cancelled = true; };
  }, [step, service?.bookingUiMode, service?.serviceDefinitionId]);

  const mode = service?.bookingUiMode ?? 'default_slot';
  const selectedDay = dayOf(model.selectedDate) ?? initialDate;
  const startMinutes = clockToMinutes(model.selectedTimeFrom);
  const duration = service?.durationMinutes && service.durationMinutes > 0 ? service.durationMinutes : (pickedDuration ?? 60);
  const editingKey = editing?.id;
  const dayEvents = useMemo(() => events.filter((event) => event.date === selectedDay && event.id !== editingKey).sort((a, b) => a.start - b.start), [events, selectedDay, editingKey]);
  const clash = startMinutes != null ? firstClash(dayEvents, selectedDay, startMinutes, startMinutes + duration) as LabeledEvent | null : null;
  const dayChoices = useMemo(() => (tripDays.includes(selectedDay) ? tripDays : [...tripDays, selectedDay].sort()), [tripDays, selectedDay]);
  const staysForDay = stays.filter((stay) => stay.from <= selectedDay && selectedDay <= stay.to);
  const location = (model.metadata as any)?.serviceLocation as string | undefined;
  const nights = stayNights(model.selectedDateFrom, model.selectedDateTo);
  const rangeValid = Boolean(model.selectedDateFrom && model.selectedDateTo && model.selectedDateTo > model.selectedDateFrom);

  function setStart(minutes: number) {
    const end = Math.min(23 * 60 + 59, minutes + duration);
    setModel((current) => ({ ...current, selectedTime: minutesToClock(minutes), selectedTimeFrom: minutesToClock(minutes), selectedTimeTo: minutesToClock(end) }));
  }
  function setDuration(minutes: number) {
    setPickedDuration(minutes);
    if (startMinutes != null) {
      setModel((current) => ({ ...current, selectedTimeTo: minutesToClock(Math.min(23 * 60 + 59, startMinutes + minutes)) }));
    }
  }
  function setDay(day: string) {
    setModel((current) => ({ ...current, selectedDate: day, selectedDateFrom: day, selectedDateTo: day }));
  }
  function setLocation(value: 'stay' | 'other', stayName?: string) {
    setModel((current) => ({ ...current, metadata: { ...(current.metadata ?? {}), serviceLocation: value, serviceLocationNote: value === 'stay' ? stayName ?? null : null } }));
  }

  const stepComplete: Record<StepKey, boolean> = {
    provider: Boolean(model.providerId),
    service: Boolean(model.serviceId && service),
    specialist: !service?.requiresSpecialist || Boolean(model.specialistId),
    when: mode === 'date_range' ? rangeValid
      : mode === 'custom_form' ? Boolean(model.formSubmissionId)
        : Boolean(dayOf(model.selectedDate) && startMinutes != null && (!service?.requiresCustomerAddress || location)),
  };
  const isLast = stepIndex === steps.length - 1;
  const canAdvance = stepComplete[step] && !saving;

  async function save() {
    if (!service || !model.providerId) return;
    setSaving(true);
    try {
      const response = await fetch('/api/booking-pro/child-booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ draftId, child: model }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        const code = String(data?.error ?? '');
        toast.error(t.has(`errors.${code}`) ? t(`errors.${code}` as any) : t('errors.generic'));
        return;
      }
      onSaved({
        ...model,
        id: data?.item?.id ?? model.id,
        status: 'Completed',
        subtotalAmount: service.value,
        currency: service.currency,
        providerNameTranslations: { [locale]: providerLabel?.name ?? '' },
        serviceNameTranslations: { [locale]: service.name },
        providerImageUrl: providerLabel?.imageUrl ?? null,
        durationMinutes: service.durationMinutes ?? null,
        requiresCustomerAddress: service.requiresCustomerAddress,
      }, data?.totals);
    } catch {
      toast.error(t('errors.generic'));
    } finally {
      setSaving(false);
    }
  }

  function advance() {
    if (!canAdvance) return;
    if (isLast) { void save(); return; }
    setStep(steps[stepIndex + 1]);
  }
  function goBack() {
    if (stepIndex === 0) { onClose(); return; }
    setStep(steps[stepIndex - 1]);
  }

  const money = (value: number) => formatCurrencyAmount(value, service?.currency ?? 'USD', locale, { maximumFractionDigits: 0 });
  const priceCaption = !service ? t('noSelectionYet') : mode === 'date_range' ? t('nightsLine', { nights, price: money(service.value) }) : `${service.name} · ${t('perBooking')}`;
  const priceValue = service ? money(mode === 'date_range' ? service.value * nights : service.value) : '—';

  const chip = (selected: boolean) => `flex shrink-0 flex-col items-center justify-center gap-0.5 rounded-2xl border-[1.5px] px-3 py-2 text-center transition ${selected ? 'border-[#083f30] bg-[#083f30] text-white' : 'border-slate-200 bg-white text-slate-900'}`;
  const option = (selected: boolean) => `flex w-full items-center gap-3 rounded-2xl border-[1.5px] p-3 text-start transition ${selected ? 'border-[#083f30] bg-[#083f30]/5' : 'border-slate-200 bg-white'}`;
  const radioDot = (selected: boolean) => (<span aria-hidden className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${selected ? 'border-[#083f30] bg-[#083f30] text-white' : 'border-slate-300'}`}>{selected ? <Check className="h-3 w-3"/> : null}</span>);
  const listStatus = (list: { loading: boolean; error: boolean; items: unknown[]; retry: () => void }, empty: string) => (
    list.error ? (<div role="alert" className="flex items-center justify-between rounded-2xl bg-red-50 p-3 text-sm text-red-800">{t('loadFailed')}<button type="button" onClick={list.retry} className="min-h-11 rounded-xl px-3 font-bold">{t('retry')}</button></div>)
      : list.loading && !list.items.length ? (<div className="flex items-center gap-2 p-3 text-sm text-slate-500"><Loader2 className="h-4 w-4 animate-spin"/>{t('loading')}</div>)
        : !list.items.length ? (<div className="rounded-2xl border border-dashed border-slate-300 p-4 text-sm text-slate-600">{empty}</div>) : null);

  return (<BookingDialog open={open} title={addon.label} onClose={onClose}>
    <div className="flex min-h-[60dvh] flex-col" data-testid="addon-booking-sheet">
      <span aria-hidden className="mx-auto mt-2.5 h-1.5 w-11 rounded-full bg-slate-200 sm:hidden"/>
      <div className="flex items-center gap-3 px-4 pt-3">
        <button type="button" onClick={goBack} aria-label={stepIndex === 0 ? t('close') : t('back')} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-900"><ArrowLeft className="h-5 w-5 rtl:rotate-180"/></button>
        <div className="min-w-0 flex-1">
          <div className="truncate text-base font-extrabold text-slate-900">{editing ? `${addon.label} · ${t('saveChanges')}` : addon.label}</div>
          <div className="truncate text-xs text-slate-500">{mode === 'date_range' ? (providerLabel?.name ?? addon.label) : dayParts(selectedDay, locale, calendar).long}</div>
        </div>
        <button type="button" onClick={onClose} aria-label={t('close')} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-900"><X className="h-5 w-5"/></button>
      </div>
      <ol className="grid gap-2 px-4 pt-3" style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}>
        {steps.map((key, index) => (<li key={key} className="flex flex-col gap-1.5" aria-current={key === step ? 'step' : undefined}>
          <span className={`h-1 rounded-full ${index <= stepIndex ? 'bg-[#083f30]' : 'bg-slate-200'}`}/>
          <span className={`truncate text-[11px] font-bold ${key === step ? 'text-slate-900' : 'text-slate-500'}`}>{stepLabel(key)}</span>
        </li>))}
      </ol>

      <div className="flex-1 space-y-3 px-4 pb-4 pt-4">
        {step === 'provider' ? (<>
          {cities.length > 1 || (city && country) ? (<div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
            {cities.map((item) => (<button key={item} type="button" aria-pressed={scope === 'city' && selectedCity === item} onClick={() => { setScope('city'); setSelectedCity(item); }} className={`min-h-10 shrink-0 rounded-full border px-4 text-sm font-bold ${scope === 'city' && selectedCity === item ? 'border-[#083f30] bg-[#083f30] text-white' : 'border-slate-200 bg-white text-slate-800'}`}><MapPin className="me-1 inline h-3.5 w-3.5"/>{item}</button>))}
            {country ? (<button type="button" aria-pressed={scope === 'country'} onClick={() => setScope('country')} className={`min-h-10 shrink-0 rounded-full border px-4 text-sm font-bold ${scope === 'country' ? 'border-[#083f30] bg-[#083f30] text-white' : 'border-slate-200 bg-white text-slate-800'}`}>{t('allInCountry', { country })}</button>) : null}
          </div>) : null}
          <label className="flex h-11 items-center gap-2 rounded-full bg-slate-100 px-4 text-slate-500">
            <Search className="h-4 w-4 shrink-0" aria-hidden/>
            <span className="sr-only">{t('searchProviders')}</span>
            <input value={providerSearch} onChange={(event) => setProviderSearch(event.target.value)} placeholder={t('searchProviders')} className="min-w-0 flex-1 bg-transparent text-sm text-slate-900 outline-none"/>
          </label>
          {listStatus(providers, t('noProviders'))}
          {providers.items.map((item) => {
            const selected = model.providerId === item.id;
            const image = resolveHomeMediaUrl(item.imageUrl);
            return (<button key={item.id} type="button" aria-pressed={selected} onClick={() => { pickProvider(item); setStep('service'); }} className={option(selected)}>
              <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-slate-100">{image ? <ImageWithFallback fill sizes="56px" src={image} alt="" className="object-cover"/> : null}</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-extrabold text-slate-900">{item.name}</span>
                <span className="block truncate text-xs text-slate-500">{[item.city, item.country].filter(Boolean).join('، ')}</span>
              </span>
              {radioDot(selected)}
            </button>);
          })}
          {providers.hasMore ? (<button type="button" disabled={providers.loading} onClick={providers.loadMore} className="min-h-11 w-full rounded-2xl border border-slate-200 text-sm font-bold text-slate-700">{providers.loading ? t('loading') : t('loadMore')}</button>) : null}
        </>) : null}

        {step === 'service' ? (<>
          {providerLabel ? <div className="text-sm font-bold text-slate-600">{providerLabel.name}</div> : null}
          <label className="flex h-11 items-center gap-2 rounded-full bg-slate-100 px-4 text-slate-500">
            <Search className="h-4 w-4 shrink-0" aria-hidden/>
            <span className="sr-only">{t('searchServices')}</span>
            <input value={serviceSearch} onChange={(event) => setServiceSearch(event.target.value)} placeholder={t('searchServices')} className="min-w-0 flex-1 bg-transparent text-sm text-slate-900 outline-none"/>
          </label>
          {listStatus(services, t('noServices'))}
          {services.items.map((item) => {
            const selected = model.serviceId === item.id;
            return (<button key={item.id} type="button" aria-pressed={selected} onClick={() => { pickService(item); setStep(item.requiresSpecialist ? 'specialist' : 'when'); }} className={option(selected)}>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-extrabold text-slate-900">{item.name}</span>
                <span className="block text-xs text-slate-500">{[item.durationMinutes ? t('durationMinutes', { count: item.durationMinutes }) : null, item.bookingUiMode === 'date_range' ? t('perNight') : null].filter(Boolean).join(' · ')}</span>
              </span>
              <span className="shrink-0 text-sm font-extrabold text-slate-900">{formatCurrencyAmount(item.value, item.currency, locale, { maximumFractionDigits: 0 })}</span>
              {radioDot(selected)}
            </button>);
          })}
          {services.hasMore ? (<button type="button" disabled={services.loading} onClick={services.loadMore} className="min-h-11 w-full rounded-2xl border border-slate-200 text-sm font-bold text-slate-700">{services.loading ? t('loading') : t('loadMore')}</button>) : null}
        </>) : null}

        {step === 'specialist' ? (<>
          {listStatus(specialists, t('noSpecialists'))}
          {specialists.items.map((item) => {
            const selected = model.specialistId === item.id;
            return (<button key={item.id} type="button" aria-pressed={selected} onClick={() => { setSpecialistName(item.name); setModel((current) => ({ ...current, specialistId: item.id })); }} className={option(selected)}>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-extrabold text-slate-900">{item.name}</span>
                <span className="block text-xs text-slate-500">{[item.title || item.specialty, item.languages?.join('، ')].filter(Boolean).join(' · ')}</span>
              </span>
              {radioDot(selected)}
            </button>);
          })}
          {specialists.hasMore ? (<button type="button" disabled={specialists.loading} onClick={specialists.loadMore} className="min-h-11 w-full rounded-2xl border border-slate-200 text-sm font-bold text-slate-700">{specialists.loading ? t('loading') : t('loadMore')}</button>) : null}
          {specialistName ? <div className="sr-only" aria-live="polite">{specialistName}</div> : null}
        </>) : null}

        {step === 'when' && mode !== 'date_range' ? (<>
          <div className="text-sm font-extrabold text-slate-900">{t('whichDay')}</div>
          <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1" role="group" aria-label={t('whichDay')}>
            {dayChoices.map((day) => {
              const parts = dayParts(day, locale, calendar);
              const selected = day === selectedDay;
              return (<button key={day} type="button" aria-pressed={selected} onClick={() => setDay(day)} className={`${chip(selected)} min-h-16 w-[72px]`}>
                <span className="text-[11px]">{parts.weekday}</span>
                <span className="text-sm font-extrabold">{parts.short}</span>
              </button>);
            })}
            <button type="button" aria-expanded={showOtherDate} onClick={() => setShowOtherDate((value) => !value)} className={`${chip(false)} min-h-16 w-[72px] text-xs font-bold`}>{t('otherDate')}</button>
          </div>
          {showOtherDate ? (<BookingDatePicker value={selectedDay} calendar={calendar} label={t('pickDate')} onChange={(value) => { const day = dayOf(value); if (day) setDay(day); }}/>) : null}
          {dayEvents.length ? (<div className="rounded-2xl bg-slate-100 p-3">
            <div className="text-xs font-extrabold text-slate-500">{t('dayPlan')}</div>
            <ul className="mt-1 space-y-0.5 text-xs text-slate-800">
              {dayEvents.map((event) => (<li key={event.id}><span className="font-bold">{formatClock(event.start, locale)}–{formatClock(event.end, locale)}</span> · {event.title}</li>))}
            </ul>
          </div>) : null}

          {mode === 'default_slot' ? (<>
            <div className="text-sm font-extrabold text-slate-900">{t('startTime')}</div>
            <div className="grid grid-cols-4 gap-2" role="group" aria-label={t('startTime')}>
              {ITINERARY_START_TIMES.map((minutes) => {
                const selected = startMinutes === minutes;
                const clashes = Boolean(firstClash(dayEvents, selectedDay, minutes, minutes + duration));
                return (<button key={minutes} type="button" data-time={minutesToClock(minutes)} aria-pressed={selected} onClick={() => setStart(minutes)} className={`flex min-h-12 flex-col items-center justify-center rounded-xl border-[1.5px] text-sm font-extrabold ${selected ? 'border-[#083f30] bg-[#083f30] text-white' : clashes ? 'border-amber-400 bg-white text-slate-900' : 'border-slate-200 bg-white text-slate-900'}`}>
                  {formatClock(minutes, locale)}
                  {clashes ? <span className={`text-[10px] font-bold ${selected ? 'text-white' : 'text-amber-800'}`}>{t('overlapTag')}</span> : null}
                </button>);
              })}
            </div>
            {!service?.durationMinutes ? (<>
              <div className="text-sm font-extrabold text-slate-900">{t('duration')}</div>
              <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1" role="group" aria-label={t('duration')}>
                {DURATION_CHOICES.map((minutes) => (<button key={minutes} type="button" aria-pressed={duration === minutes} onClick={() => setDuration(minutes)} className={`${chip(duration === minutes)} min-h-11 px-4 text-sm font-bold`}>{t('durationMinutes', { count: minutes })}</button>))}
              </div>
            </>) : null}
            {clash ? (<div role="alert" className="flex gap-2 rounded-2xl bg-amber-50 p-3 text-xs leading-6 text-amber-900"><AlertTriangle className="mt-1 h-4 w-4 shrink-0" aria-hidden/><span>{t('clashWarning', { title: clash.title, time: formatClock(clash.start, locale) })}</span></div>) : null}
            <div className="border-t border-slate-100 pt-3">
              <AdultsStepper label={t('guests')} value={model.adults ?? 1} size="md" labelClassName="text-sm font-extrabold text-slate-900" onChange={(adults) => setModel((current) => ({ ...current, adults }))}/>
            </div>
            {service?.requiresCustomerAddress ? (<div className="space-y-2 border-t border-slate-100 pt-3">
              <div className="text-sm font-extrabold text-slate-900">{t('location')}</div>
              {staysForDay.length ? staysForDay.map((stay) => (<button key={stay.id} type="button" aria-pressed={location === 'stay'} onClick={() => setLocation('stay', stay.name)} className={option(location === 'stay')}>
                <span className="min-w-0 flex-1"><span className="block text-sm font-extrabold">{t('atMyStay')}</span><span className="block text-xs text-slate-500">{t('atMyStayHint', { name: stay.name })}</span></span>
                {radioDot(location === 'stay')}
              </button>)) : (<div className="rounded-2xl bg-slate-50 p-3 text-xs text-slate-600">{t('noStayForLocation')}</div>)}
              <button type="button" aria-pressed={location === 'other'} onClick={() => setLocation('other')} className={option(location === 'other')}>
                <span className="min-w-0 flex-1"><span className="block text-sm font-extrabold">{t('otherAddress')}</span><span className="block text-xs text-slate-500">{t('otherAddressHint')}</span></span>
                {radioDot(location === 'other')}
              </button>
            </div>) : null}
          </>) : null}

          {mode === 'custom_form' ? (serviceForm ? (<div className="rounded-2xl border border-slate-200 p-3">
            {model.formSubmissionId ? <div className="mb-2 rounded-xl bg-emerald-50 p-2 text-xs font-bold text-emerald-900">{t('formSaved')}</div> : null}
            <DynamicServiceForm form={serviceForm} initialValues={{}} locales={[locale]} submitLabel={t('saveForm')} onSubmit={async (values) => {
              const response = await fetch('/api/form-builder/submissions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ formVersionId: serviceForm.formVersionId, serviceDefinitionId: service?.serviceDefinitionId, bookingDraftId: draftId, status: 'submitted', payload: values }),
              });
              const data = await response.json().catch(() => ({}));
              if (!response.ok || !data?.submissionId) { toast.error(t('errors.generic')); return; }
              setModel((current) => ({ ...current, formSubmissionId: data.submissionId }));
            }}/>
          </div>) : (<div className="flex items-center gap-2 p-3 text-sm text-slate-500"><Loader2 className="h-4 w-4 animate-spin"/>{t('loading')}</div>)) : null}
        </>) : null}

        {step === 'when' && mode === 'date_range' ? (<>
          <div className="text-sm font-extrabold text-slate-900">{t('checkIn')}</div>
          <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1" role="group" aria-label={t('checkIn')}>
            {tripDays.map((day) => {
              const parts = dayParts(day, locale, calendar);
              const selected = model.selectedDateFrom === day;
              return (<button key={day} type="button" aria-pressed={selected} onClick={() => setModel((current) => ({ ...current, selectedDateFrom: day, selectedDateTo: current.selectedDateTo && current.selectedDateTo > day ? current.selectedDateTo : addDays(day, 1) }))} className={`${chip(selected)} min-h-16 w-[72px]`}>
                <span className="text-[11px]">{parts.weekday}</span>
                <span className="text-sm font-extrabold">{parts.short}</span>
              </button>);
            })}
          </div>
          <div className="grid grid-cols-1 gap-3">
            <BookingDatePicker value={model.selectedDateFrom} calendar={calendar} label={t('checkIn')} onChange={(value) => { const day = dayOf(value); if (day) setModel((current) => ({ ...current, selectedDateFrom: day })); }}/>
            <BookingDatePicker value={model.selectedDateTo} calendar={calendar} label={t('checkOut')} onChange={(value) => { const day = dayOf(value); if (day) setModel((current) => ({ ...current, selectedDateTo: day })); }}/>
          </div>
          {rangeValid
            ? (<div className="rounded-2xl bg-[#083f30]/5 p-3 text-sm font-bold text-[#083f30]">{t('nights', { count: nights })} · {t('dateRange', { from: dayParts(model.selectedDateFrom!, locale, calendar).long, to: dayParts(model.selectedDateTo!, locale, calendar).long })}</div>)
            : (<div role="alert" className="rounded-2xl bg-red-50 p-3 text-xs font-bold text-red-800">{t('checkoutAfterCheckin')}</div>)}
          <AdultsStepper label={tBooking('adults')} value={model.adults ?? 1} size="md" labelClassName="text-sm font-extrabold text-slate-900" onChange={(adults) => setModel((current) => ({ ...current, adults }))}/>
          {model.serviceId ? <MealPlanPicker serviceId={model.serviceId} value={(model.metadata as any)?.mealPlan ?? null} onChange={(code) => setModel((current) => ({ ...current, metadata: { ...(current.metadata ?? {}), mealPlan: code } }))}/> : null}
        </>) : null}
      </div>

      <div className="sticky bottom-0 flex items-center gap-3 border-t border-slate-200 bg-white px-4 pb-5 pt-3">
        <div className="min-w-0 flex-1">
          <div className="truncate text-xs text-slate-500">{priceCaption}</div>
          <div className="truncate text-base font-extrabold text-slate-900">{priceValue}</div>
        </div>
        <button type="button" disabled={!canAdvance} onClick={advance} className={`flex min-h-12 shrink-0 items-center gap-2 rounded-full px-6 text-sm font-extrabold ${canAdvance ? 'bg-[#083f30] text-white' : 'bg-slate-200 text-slate-500'}`}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin"/> : null}
          {saving ? t('saving') : !isLast ? t('continue') : editing ? t('saveChanges') : t('addToItinerary')}
        </button>
      </div>
    </div>
  </BookingDialog>);
}
