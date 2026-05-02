'use client';

import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, CheckCircle2, ChevronRight, CreditCard, FileStack, Layers3, RefreshCcw, ShieldCheck } from 'lucide-react';
import { useLocale } from 'next-intl';
import { useRouter, useSearchParams } from 'next/navigation';
import { DynamicServiceForm } from '@/features/form-builder/components/DynamicServiceForm';
import type { BookingDraftState, ChildBookingDraft, ProviderCardItem, ProviderTypeAddonItem, ServiceCardItem, SpecialistCardItem, UploadRequirementItem } from '../types';
import { ChildAddonBookingCard } from './ChildAddonBookingCard';
import { PaymentMethodsPanel } from './PaymentMethodsPanel';
import { EntityCard, providerMeta, serviceMeta } from './EntityCard';
import { SearchLoadMoreList } from './SearchLoadMoreList';
import { PersianDateTimePicker } from '@/components/date-time/PersianDateTimePicker';
import { formatBookingDate, isReasonableBookingIsoDate, normalizeBookingCalendar, toIsoDate } from '../lib/calendar';

async function getJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
    cache: 'no-store',
  });
  if (!response.ok) {
    const text = await response.text();
    let message = text || `Request failed: ${url}`;
    try {
      const json = JSON.parse(text);
      message = json?.error || json?.message || message;
    } catch {
      // keep plain text response
    }
    throw new Error(message);
  }
  return response.json();
}

const steps = [
  { key: 1, label: 'Service' },
  { key: 2, label: 'Schedule' },
  { key: 3, label: 'Add-ons' },
  { key: 4, label: 'Files' },
  { key: 5, label: 'Review & Pay' },
] as const;

type AvailableDateItem = {
  date: string;
  day: string;
  displayDate: string;
  available: boolean;
};

type TimeSlotItem = {
  time: string;
  endTime: string;
  label: string;
  endLabel: string;
  available: boolean;
  remainingCapacity?: number;
};

type DateRangeAvailability = {
  available: boolean;
  startDate: string;
  endDate: string;
  requestedUnits: number;
  remainingCapacity: number;
  unavailableDates: string[];
  message?: string;
};

type BookingEntryResolution = {
  selectedProviderId: string | null;
  selectedServiceId: string | null;
  selectedSpecialistId: string | null;
  providers: Array<{ id: string; name: string; city?: string | null; country?: string | null; image?: string | null; rating?: number; reviewCount?: number }>;
  services: Array<{ id: string; providerId: string; serviceDefinitionId: string; name: string; description?: string | null; image?: string | null; durationMinutes?: number; slotIntervalMinutes?: number; price: number; currency: string }>;
  specialists: Array<{ id: string; name: string; title?: string | null; image?: string | null; rating?: number; reviewCount?: number }>;
};

function localeToCalendar(locale: string) {
  return normalizeBookingCalendar(undefined, locale);
}

function addMinutes(time: string, minutes: number) {
  const [h = '0', m = '0'] = String(time || '00:00').split(':');
  const total = Number(h) * 60 + Number(m) + Math.max(1, Number(minutes || 30));
  const next = ((total % 1440) + 1440) % 1440;
  return `${String(Math.floor(next / 60)).padStart(2, '0')}:${String(next % 60).padStart(2, '0')}`;
}
 
export function BookingWizard() {
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const seededProviderId = searchParams.get('providerId') ?? searchParams.get('id') ?? undefined;
  const seededServiceId = searchParams.get('serviceId') ?? undefined;
  const seededSpecialistId = searchParams.get('specialistId') ?? undefined;
  const hasSeedSelection = Boolean(seededProviderId || seededServiceId || seededSpecialistId);
  const defaultCalendar = localeToCalendar(locale);

  const [draft, setDraft] = useState<BookingDraftState | null>(null);
  const [resumeChoiceRequired, setResumeChoiceRequired] = useState(false);
  const [loadingDraft, setLoadingDraft] = useState(true);
  const [providerSearch, setProviderSearch] = useState('');
  const [serviceSearch, setServiceSearch] = useState('');
  const [specialistSearch, setSpecialistSearch] = useState('');
  const [providerOffset, setProviderOffset] = useState(0);
  const [serviceOffset, setServiceOffset] = useState(0);
  const [specialistOffset, setSpecialistOffset] = useState(0);
  const [providers, setProviders] = useState<ProviderCardItem[]>([]);
  const [services, setServices] = useState<ServiceCardItem[]>([]);
  const [specialists, setSpecialists] = useState<SpecialistCardItem[]>([]);
  const [providerHasMore, setProviderHasMore] = useState(false);
  const [serviceHasMore, setServiceHasMore] = useState(false);
  const [specialistHasMore, setSpecialistHasMore] = useState(false);
  const [addonProviderTypes, setAddonProviderTypes] = useState<ProviderTypeAddonItem[]>([]);
  const [uploadRequirements, setUploadRequirements] = useState<UploadRequirementItem[]>([]);
  const [availableDates, setAvailableDates] = useState<AvailableDateItem[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlotItem[]>([]);
  const [dateRangeAvailability, setDateRangeAvailability] = useState<DateRangeAvailability | null>(null);
  const [rangeAvailabilityLoading, setRangeAvailabilityLoading] = useState(false);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [calendar, setCalendar] = useState<'gregorian' | 'jalali'>(defaultCalendar);
  const [mainServiceForm, setMainServiceForm] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [checkoutResult, setCheckoutResult] = useState<any>(null);
  const [paymentIntentResult, setPaymentIntentResult] = useState<any>(null);
  const [couponCode, setCouponCode] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { draft } = await getJson<{ draft: BookingDraftState | null }>('/api/booking-pro/draft');
        if (cancelled) return;
        if (draft) {
          const hasExistingSelection = Boolean(draft.providerId || draft.serviceId || draft.childBookings?.length || draft.uploadFiles?.length);
          if (hasExistingSelection && !hasSeedSelection) {
            setDraft(draft);
            setResumeChoiceRequired(true);
          } else {
            setDraft({ ...draft, providerId: seededProviderId ?? draft.providerId, serviceId: seededServiceId ?? draft.serviceId, specialistId: seededSpecialistId ?? draft.specialistId });
            setResumeChoiceRequired(false);
          }
        } else {
          const created = await getJson<{ draft: BookingDraftState }>('/api/booking-pro/draft', { method: 'POST' });
          setDraft({ ...created.draft, providerId: seededProviderId, serviceId: seededServiceId, specialistId: seededSpecialistId });
        }
      } catch (e: any) {
        setError(e.message || 'Failed to load booking draft');
      } finally {
        setLoadingDraft(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const code = String(
      draft?.metadata?.couponCode ??
      draft?.metadata?.appliedCouponCode ??
      ''
    );
    setCouponCode(code);
  }, [draft?.id, draft?.metadata?.couponCode, draft?.metadata?.appliedCouponCode]);

  const rawCurrentStep = draft?.currentStep ?? 1;
  const currentStep = draft && !draft.useLsevin && (rawCurrentStep === 3 || rawCurrentStep === 4) ? 5 : rawCurrentStep;
  const wantsLsevinSupport = Boolean(draft?.useLsevin);
  const visibleSteps = useMemo(
    () => wantsLsevinSupport ? steps : steps.filter((step) => step.key <= 2 || step.key === 5),
    [wantsLsevinSupport],
  );

  useEffect(() => {
    if (!draft?.id || !hasSeedSelection || resumeChoiceRequired) return;
    let cancelled = false;

    getJson<BookingEntryResolution>(
      `/api/booking-pro/entry?locale=${locale}&providerId=${encodeURIComponent(seededProviderId ?? '')}&serviceId=${encodeURIComponent(seededServiceId ?? '')}&specialistId=${encodeURIComponent(seededSpecialistId ?? '')}`
    )
      .then((entry) => {
        if (cancelled) return;

        const mappedProviders: ProviderCardItem[] = entry.providers.map((item) => ({
          id: item.id,
          name: item.name,
          city: item.city,
          country: item.country,
          imageUrl: item.image,
          rating: item.rating,
          reviewCount: item.reviewCount,
        }));

        const mappedServices: ServiceCardItem[] = entry.services.map((item) => ({
          id: item.id,
          serviceDefinitionId: item.serviceDefinitionId,
          name: item.name,
          description: item.description ?? undefined,
          imageUrl: item.image,
          currency: item.currency,
          value: item.price,
          durationMinutes: item.durationMinutes,
          slotIntervalMinutes: item.slotIntervalMinutes,
        }));

        const mappedSpecialists: SpecialistCardItem[] = entry.specialists.map((item) => ({
          id: item.id,
          name: item.name,
          title: item.title ?? undefined,
          imageUrl: item.image,
          rating: item.rating,
          reviewCount: item.reviewCount,
        }));

        setProviders(mappedProviders);
        setServices(mappedServices);
        setSpecialists(mappedSpecialists);

        const selectedService = mappedServices.find((item) => item.id === entry.selectedServiceId);
        const patch: Partial<BookingDraftState> = {
          providerId: entry.selectedProviderId ?? undefined,
          serviceId: entry.selectedServiceId ?? undefined,
          specialistId: entry.selectedSpecialistId ?? undefined,
          serviceDefinitionId: selectedService?.serviceDefinitionId,
          currency: selectedService?.currency,
          subtotalAmount: selectedService?.value,
          currentStep: 1,
        };

        setDraft((prev) => ({ ...(prev as BookingDraftState), ...patch }));
        patchDraft(patch).catch((e) => setError(e.message));
      })
      .catch((e) => setError(e.message));

    return () => { cancelled = true; };
  }, [draft?.id, hasSeedSelection, seededProviderId, seededServiceId, seededSpecialistId, locale, resumeChoiceRequired]);

  useEffect(() => {
    if (!draft || resumeChoiceRequired || hasSeedSelection) return;
    getJson<{ items: ProviderCardItem[]; hasMore: boolean }>(`/api/booking-pro/catalog/providers?locale=${locale}&search=${encodeURIComponent(providerSearch)}&offset=${providerOffset}&take=3`)
      .then((data) => {
        setProviders((prev) => (providerOffset === 0 ? data.items : [...prev, ...data.items]));
        setProviderHasMore(data.hasMore);
      })
      .catch((e) => setError(e.message));
  }, [draft?.id, providerSearch, providerOffset, locale, resumeChoiceRequired]);

  useEffect(() => {
    if (!draft?.providerId || resumeChoiceRequired || hasSeedSelection) return;
    getJson<{ items: ServiceCardItem[]; hasMore: boolean }>(`/api/booking-pro/catalog/services?locale=${locale}&providerId=${draft.providerId}&search=${encodeURIComponent(serviceSearch)}&offset=${serviceOffset}&take=3`)
      .then((data) => {
        setServices((prev) => (serviceOffset === 0 ? data.items : [...prev, ...data.items]));
        setServiceHasMore(data.hasMore);
      })
      .catch((e) => setError(e.message));
  }, [draft?.providerId, serviceSearch, serviceOffset, locale, resumeChoiceRequired]);

  useEffect(() => {
    if (!draft?.providerId || !draft?.serviceId || !draft?.requiresSpecialist || resumeChoiceRequired || hasSeedSelection) return;
    getJson<{ items: SpecialistCardItem[]; hasMore: boolean }>(`/api/booking-pro/catalog/specialists?locale=${locale}&providerId=${draft.providerId}&serviceId=${draft.serviceId}&search=${encodeURIComponent(specialistSearch)}&offset=${specialistOffset}&take=3`)
      .then((data) => {
        setSpecialists((prev) => (specialistOffset === 0 ? data.items : [...prev, ...data.items]));
        setSpecialistHasMore(data.hasMore);
      })
      .catch((e) => setError(e.message));
  }, [draft?.providerId, draft?.serviceId, draft?.requiresSpecialist, specialistSearch, specialistOffset, locale, resumeChoiceRequired]);

  useEffect(() => {
    if (!draft?.serviceId || resumeChoiceRequired) return;
    getJson<{ item: { service_definition_id: string; booking_ui_mode: string; requires_specialist: boolean; value: number; currency: string } }>(`/api/booking-pro/service-mode?serviceId=${draft.serviceId}`)
      .then(async ({ item }) => {
        const next: BookingDraftState = {
          ...(draft as BookingDraftState),
          serviceDefinitionId: item.service_definition_id,
          bookingUiMode: item.booking_ui_mode as any,
          requiresSpecialist: item.requires_specialist,
          currency: item.currency,
          subtotalAmount: Number(item.value ?? 0),
        };
        setDraft(next);
        if (item.booking_ui_mode === 'custom_form') {
          const formData = await getJson<{ form: any | null }>(`/api/form-builder/service-form?serviceDefinitionId=${item.service_definition_id}&usageScope=main_booking`);
          setMainServiceForm(formData.form);
        } else {
          setMainServiceForm(null);
        }
      })
      .catch((e) => setError(e.message));

    getJson<{ items: ProviderTypeAddonItem[] }>(`/api/booking-pro/addon-provider-types?serviceId=${draft.serviceId}&locale=${locale}`)
      .then((data) => setAddonProviderTypes(data.items))
      .catch((e) => setError(e.message));

    getJson<{ items: UploadRequirementItem[] }>(`/api/booking-pro/uploads/requirements?serviceId=${draft.serviceId}&locale=${locale}`)
      .then((data) => setUploadRequirements(data.items))
      .catch((e) => setError(e.message));
  }, [draft?.serviceId, locale, resumeChoiceRequired]);

  useEffect(() => {
    if (!draft?.providerId || !draft?.serviceId || draft.bookingUiMode !== 'default_slot' || resumeChoiceRequired) {
      setAvailableDates([]);
      setTimeSlots([]);
      return;
    }

    let cancelled = false;
    setScheduleLoading(true);
    const params = new URLSearchParams({
      locale,
      calendar,
      providerId: draft.providerId,
      serviceId: draft.serviceId,
    });
    if (draft.specialistId) params.set('specialistId', draft.specialistId);

    getJson<{ dates: AvailableDateItem[] }>(`/api/booking-pro/availability/dates?${params.toString()}`)
      .then((data) => { if (!cancelled) setAvailableDates(data.dates ?? []); })
      .catch((e) => setError(e.message))
      .finally(() => { if (!cancelled) setScheduleLoading(false); });

    return () => { cancelled = true; };
  }, [draft?.providerId, draft?.serviceId, draft?.specialistId, draft?.bookingUiMode, locale, calendar, resumeChoiceRequired]);

  useEffect(() => {
    if (!draft?.providerId || !draft?.serviceId || !draft?.selectedDate || !isReasonableBookingIsoDate(draft.selectedDate) || draft.bookingUiMode !== 'default_slot' || resumeChoiceRequired) {
      setTimeSlots([]);
      return;
    }

    let cancelled = false;
    const params = new URLSearchParams({
      locale,
      providerId: draft.providerId,
      serviceId: draft.serviceId,
      selectedDate: draft.selectedDate,
    });
    if (draft.specialistId) params.set('specialistId', draft.specialistId);

    getJson<{ timeSlots: TimeSlotItem[] }>(`/api/booking-pro/availability/timeslots?${params.toString()}`)
      .then((data) => { if (!cancelled) setTimeSlots(data.timeSlots ?? []); })
      .catch((e) => setError(e.message));

    return () => { cancelled = true; };
  }, [draft?.providerId, draft?.serviceId, draft?.specialistId, draft?.selectedDate, draft?.bookingUiMode, locale, resumeChoiceRequired]);

  useEffect(() => {
    if (!draft?.providerId || !draft?.serviceId || draft.bookingUiMode !== 'date_range' || !draft.selectedDateFrom || !draft.selectedDateTo || !isReasonableBookingIsoDate(draft.selectedDateFrom) || !isReasonableBookingIsoDate(draft.selectedDateTo) || resumeChoiceRequired) {
      setDateRangeAvailability(null);
      return;
    }

    let cancelled = false;
    setRangeAvailabilityLoading(true);
    const params = new URLSearchParams({
      providerId: draft.providerId,
      serviceId: draft.serviceId,
      startDate: draft.selectedDateFrom,
      endDate: draft.selectedDateTo,
      requestedUnits: String(Math.max(1, Number(draft.rooms || 1))),
    });

    getJson<DateRangeAvailability>(`/api/booking-pro/availability/range?${params.toString()}`)
      .then((data) => { if (!cancelled) setDateRangeAvailability(data); })
      .catch((e) => setError(e.message))
      .finally(() => { if (!cancelled) setRangeAvailabilityLoading(false); });

    return () => { cancelled = true; };
  }, [draft?.providerId, draft?.serviceId, draft?.bookingUiMode, draft?.selectedDateFrom, draft?.selectedDateTo, draft?.rooms, resumeChoiceRequired]);

  async function patchDraft(patch: Partial<BookingDraftState>) {
    if (!draft) return;
    const payload = { ...patch, draftId: draft.id };
    const response = await getJson<{ draft?: BookingDraftState; totals?: { subtotalAmount: number; addonsAmount: number; totalAmount: number } }>('/api/booking-pro/draft', {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    setDraft((prev) => ({ ...(prev as BookingDraftState), ...patch, ...(response.totals ?? {}) }));
  }

  const chosenProvider = useMemo(() => providers.find((p) => p.id === draft?.providerId), [providers, draft?.providerId]);
  const chosenService = useMemo(() => services.find((p) => p.id === draft?.serviceId), [services, draft?.serviceId]);
  const chosenSpecialist = useMemo(() => specialists.find((p) => p.id === draft?.specialistId), [specialists, draft?.specialistId]);

  const childMap = useMemo(() => Object.fromEntries((draft?.childBookings ?? []).map((child) => [child.providerTypeId, child])), [draft?.childBookings]);
  const allRequiredUploadsPresent = useMemo(() => {
    const requiredIds = uploadRequirements.filter((x) => x.isRequired).map((x) => x.id);
    const uploadedIds = new Set((draft?.uploadFiles ?? []).map((x) => x.requirementId));
    return requiredIds.every((id) => uploadedIds.has(id));
  }, [uploadRequirements, draft?.uploadFiles]);
  const allChildBookingsCompleted = useMemo(() => addonProviderTypes.every((addon) => !addon.isRequired || childMap[addon.providerTypeId]), [addonProviderTypes, childMap]);

  const canContinueServiceStep = Boolean(draft?.providerId && draft?.serviceId && (!draft?.requiresSpecialist || draft?.specialistId));
  const canContinueScheduleStep = Boolean(
    draft && (
      draft.bookingUiMode === 'custom_form'
        ? draft.formSubmissionId
        : draft.bookingUiMode === 'date_range'
          ? draft.selectedDateFrom && draft.selectedDateTo && dateRangeAvailability?.available !== false
          : draft.selectedDate && draft.selectedTimeFrom && draft.selectedTimeTo
    )
  );
  const canContinueAddonsStep = allChildBookingsCompleted;
  const canContinueFilesStep = allRequiredUploadsPresent;

  function goNext() {
    if (!draft) return;
    const next = currentStep === 2 && !draft.useLsevin ? 5 : Math.min(currentStep + 1, 5);
    patchDraft({ currentStep: next }).catch((e) => setError(e.message));
  }

  function goBack() {
    if (!draft) return;
    if (currentStep === 1) {
      router.back();
      return;
    }
    const previous = currentStep === 5 && !draft.useLsevin ? 2 : currentStep - 1;
    patchDraft({ currentStep: previous }).catch((e) => setError(e.message));
  }

  async function refreshDraftAfterPriceChange() {
    const result = await getJson<{ draft: BookingDraftState | null }>('/api/booking-pro/draft');
    if (result.draft) setDraft(result.draft);
  }

  async function handleApplyCoupon() {
    if (!draft?.id || !couponCode.trim()) return;
    setCouponLoading(true);
    setError(null);
    try {
      await getJson('/api/booking-pro/coupon', {
        method: 'POST',
        body: JSON.stringify({ draftId: draft.id, couponCode: couponCode.trim() }),
      });
      await refreshDraftAfterPriceChange();
    } catch (e: any) {
      setError(e.message || 'Failed to apply coupon');
    } finally {
      setCouponLoading(false);
    }
  }

  async function handleRemoveCoupon() {
    if (!draft?.id) return;
    setCouponLoading(true);
    setError(null);
    try {
      await getJson('/api/booking-pro/coupon', {
        method: 'DELETE',
        body: JSON.stringify({ draftId: draft.id }),
      });
      setCouponCode('');
      await refreshDraftAfterPriceChange();
    } catch (e: any) {
      setError(e.message || 'Failed to remove coupon');
    } finally {
      setCouponLoading(false);
    }
  }

  async function handleCheckout() {
    if (!draft?.id) return;
    setSubmitting(true);
    setError(null);
    try {
      const result = await getJson('/api/booking-pro/checkout', {
        method: 'POST',
        body: JSON.stringify({ draftId: draft.id, paymentMethod: draft.paymentMethod || 'card' }),
      });
      setCheckoutResult(result);
    } catch (e: any) {
      setError(e.message || 'Checkout failed');
    } finally {
      setSubmitting(false);
    }
  }


async function handleCreatePaymentIntent() {
  if (!checkoutResult?.bookingId) return;
  setSubmitting(true);
  setError(null);
  try {
    const result = await getJson('/api/booking-pro/payments/create-intent', {
      method: 'POST',
      body: JSON.stringify({
        bookingId: checkoutResult.bookingId,
        paymentMethodCode: draft.paymentMethod || 'card',
        returnUrl: typeof window !== 'undefined' ? window.location.href : undefined,
      }),
    });
    setPaymentIntentResult(result);
  } catch (e: any) {
    setError(e.message || 'Failed to start payment');
  } finally {
    setSubmitting(false);
  }
}

  if (loadingDraft || !draft) {
    return <div className="min-h-screen bg-slate-50 p-6 text-sm text-slate-500">Loading booking…</div>;
  }

  if (resumeChoiceRequired) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
        <div className="mx-auto max-w-2xl rounded-[28px] border border-slate-200 bg-white p-8 shadow-2xl">
          <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[#083f30] text-white"><RefreshCcw className="h-6 w-6" /></div>
          <h1 className="text-2xl font-bold text-slate-900">Continue your pending booking?</h1>
          <p className="mt-2 text-sm text-slate-600">Only one active booking draft exists per user. You can continue where you left off or discard it and start a fresh booking.</p>
          <div className="mt-6 rounded-3xl border border-[#083f30]/10 bg-[#083f30]/5 p-5">
            <div className="text-sm text-slate-700">Current draft step: <span className="font-bold text-[#083f30]">{visibleSteps.find((s) => s.key === currentStep)?.label ?? steps.find((s) => s.key === currentStep)?.label}</span></div>
            <div className="mt-2 text-sm text-slate-600">Provider: {draft.providerId || 'Not selected'} · Service: {draft.serviceId || 'Not selected'} · Add-on sub-bookings: {draft.childBookings.length}</div>
          </div>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <button className="flex-1 rounded-2xl bg-[#083f30] px-5 py-3 font-bold text-white shadow-lg" onClick={() => setResumeChoiceRequired(false)}>Continue pending booking</button>
            <button className="flex-1 rounded-2xl border border-slate-200 bg-white px-5 py-3 font-bold text-slate-700" onClick={async () => { await getJson('/api/booking-pro/draft', { method: 'PATCH', body: JSON.stringify({ action: 'abandon' }) }); const created = await getJson<{ draft: BookingDraftState }>('/api/booking-pro/draft', { method: 'POST' }); setDraft(created.draft); setResumeChoiceRequired(false); }}>Discard and start new</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 pb-28">
      <div className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto max-w-6xl px-5 py-4">
          <div className="mb-4 flex items-center gap-3">
            <button onClick={goBack} className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-700"><ArrowLeft className="h-5 w-5" /></button>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Book with LSevin</h1>
              <p className="text-sm text-slate-500">Draft-first booking with child add-on sub-bookings and one combined checkout.</p>
            </div>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto">
            {visibleSteps.map((step, index) => (
              <div key={step.key} className="flex items-center gap-2">
                <div className={`flex h-9 min-w-9 items-center justify-center rounded-full text-sm font-bold ${currentStep >= step.key ? 'bg-[#083f30] text-white' : 'bg-slate-200 text-slate-500'}`}>{currentStep > step.key ? <CheckCircle2 className="h-4 w-4" /> : step.key}</div>
                <div className={`text-sm font-medium ${currentStep >= step.key ? 'text-[#083f30]' : 'text-slate-500'}`}>{step.label}</div>
                {index < visibleSteps.length - 1 ? <div className={`mx-2 h-0.5 w-10 ${currentStep > step.key ? 'bg-[#083f30]' : 'bg-slate-200'}`} /> : null}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-6xl gap-6 px-5 py-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          {error ? <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div> : null}

          {currentStep === 1 ? (
            <div className="space-y-6">
              <SearchLoadMoreList
                title="Providers"
                search={providerSearch}
                onSearchChange={(v) => { setProviderOffset(0); setProviderSearch(v); }}
                items={providers}
                hasMore={providerHasMore}
                emptyText="No providers found"
                onLoadMore={() => setProviderOffset((x) => x + 3)}
                renderItem={(item) => (
                  <EntityCard
                    title={item.name}
                    subtitle={[item.city, item.country].filter(Boolean).join(', ')}
                    description={item.description}
                    imageUrl={item.imageUrl}
                    selected={draft.providerId === item.id}
                    featured={Boolean(item.featuredScore || item.isSponsored)}
                    meta={providerMeta(item)}
                    onClick={() => {
                      setServiceOffset(0);
                      setSpecialistOffset(0);
                      setServices([]);
                      setSpecialists([]);
                      const next = { ...draft, providerId: item.id, serviceId: undefined, specialistId: undefined, currentStep: 1 };
                      setDraft(next);
                      patchDraft(next).catch((e) => setError(e.message));
                    }}
                  />
                )}
              />

              {draft.providerId ? (
                <SearchLoadMoreList
                  title="Services"
                  search={serviceSearch}
                  onSearchChange={(v) => { setServiceOffset(0); setServiceSearch(v); }}
                  items={services}
                  hasMore={serviceHasMore}
                  emptyText="No services found"
                  onLoadMore={() => setServiceOffset((x) => x + 3)}
                  renderItem={(item) => (
                    <EntityCard
                      title={item.name}
                      subtitle={`${item.currency} ${item.value}`}
                      description={item.description}
                      imageUrl={item.imageUrl}
                      selected={draft.serviceId === item.id}
                      featured={Boolean(item.isPopular)}
                      meta={serviceMeta(item)}
                      onClick={() => {
                        const next = { ...draft, serviceId: item.id, serviceDefinitionId: item.serviceDefinitionId, specialistId: undefined, requiresSpecialist: item.requiresSpecialist, bookingUiMode: item.bookingUiMode, subtotalAmount: item.value, currency: item.currency };
                        setDraft(next);
                        patchDraft(next).catch((e) => setError(e.message));
                      }}
                    />
                  )}
                />
              ) : null}

              {draft.providerId && draft.serviceId && draft.requiresSpecialist ? (
                <SearchLoadMoreList
                  title="Specialists"
                  search={specialistSearch}
                  onSearchChange={(v) => { setSpecialistOffset(0); setSpecialistSearch(v); }}
                  items={specialists}
                  hasMore={specialistHasMore}
                  emptyText="No specialists found"
                  onLoadMore={() => setSpecialistOffset((x) => x + 3)}
                  renderItem={(item) => (
                    <EntityCard
                      title={item.name}
                      subtitle={item.title || item.specialty || undefined}
                      description={item.nextAvailableLabel || item.experience || undefined}
                      imageUrl={item.imageUrl}
                      selected={draft.specialistId === item.id}
                      meta={serviceMeta({ rating: item.rating, reviewCount: item.reviewCount, successRate: item.successRate })}
                      onClick={() => {
                        const next = { ...draft, specialistId: item.id };
                        setDraft(next);
                        patchDraft(next).catch((e) => setError(e.message));
                      }}
                    />
                  )}
                />
              ) : null}
            </div>
          ) : null}

          {currentStep === 2 ? (
            <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-lg">
              <h2 className="mb-4 text-xl font-bold text-slate-900">Schedule and booking details</h2>
              {draft.bookingUiMode === 'default_slot' ? (
                <div className="space-y-6">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-slate-700">Calendar</div>
                      <div className="mt-2 flex rounded-2xl bg-slate-100 p-1">
                        {(['gregorian', 'jalali'] as const).map((item) => (
                          <button
                            key={item}
                            type="button"
                            onClick={() => setCalendar(item)}
                            className={`rounded-xl px-4 py-2 text-sm font-bold ${calendar === item ? 'bg-white text-[#083f30] shadow-sm' : 'text-slate-500'}`}
                          >
                            {item === 'gregorian' ? 'Gregorian' : 'Jalali / Persian'}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="min-w-[260px] text-sm font-semibold text-slate-700">
                      <span>{calendar === 'jalali' ? 'Select Jalali date' : 'Select Gregorian date'}</span>
                      <div className="mt-2">
                        {calendar === 'jalali' ? (
                          <PersianDateTimePicker
                            value={isReasonableBookingIsoDate(draft.selectedDate) ? draft.selectedDate : ''}
                            mode="date"
                            onChange={(value) => {
                              const iso = toIsoDate(String(value || '').slice(0, 10));
                              if (!iso || !isReasonableBookingIsoDate(iso)) { setError('Please select a valid booking date.'); return; }
                              const next = { ...draft, selectedDate: iso, selectedDateFrom: iso, selectedDateTo: iso, selectedTime: undefined, selectedTimeFrom: undefined, selectedTimeTo: undefined };
                              setDraft(next);
                              patchDraft(next).catch((er) => setError(er.message));
                            }}
                          />
                        ) : (
                          <input
                            type="date"
                            value={isReasonableBookingIsoDate(draft.selectedDate) ? draft.selectedDate ?? '' : ''}
                            onChange={(e) => {
                              const iso = toIsoDate(e.target.value);
                              if (!iso || !isReasonableBookingIsoDate(iso)) { setError('Please select a valid booking date.'); return; }
                              const next = { ...draft, selectedDate: iso, selectedDateFrom: iso, selectedDateTo: iso, selectedTime: undefined, selectedTimeFrom: undefined, selectedTimeTo: undefined };
                              setDraft(next);
                              patchDraft(next).catch((er) => setError(er.message));
                            }}
                            className="h-12 w-full rounded-2xl border border-slate-200 px-4 outline-none focus:border-[#155e75]"
                          />
                        )}
                      </div>
                      {!isReasonableBookingIsoDate(draft.selectedDate) && draft.selectedDate ? (
                        <p className="mt-2 text-xs text-red-600">This draft contains an old invalid converted date. Please reselect the date.</p>
                      ) : null}
                    </div>
                  </div>

                  <div>
                    <div className="mb-3 flex items-center justify-between">
                      <div className="text-sm font-bold text-slate-900">Available dates</div>
                      {scheduleLoading ? <div className="text-xs text-slate-500">Loading availability…</div> : null}
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {availableDates.filter((item) => item.available).slice(0, 18).map((item) => (
                        <button
                          key={item.date}
                          type="button"
                          onClick={() => {
                            const next = { ...draft, selectedDate: item.date, selectedDateFrom: item.date, selectedDateTo: item.date, selectedTime: undefined, selectedTimeFrom: undefined, selectedTimeTo: undefined };
                            setDraft(next);
                            patchDraft(next).catch((er) => setError(er.message));
                          }}
                          className={`rounded-2xl border p-4 text-left transition ${draft.selectedDate === item.date ? 'border-[#083f30] bg-[#083f30]/5' : 'border-slate-200 bg-white hover:border-[#155e75]'}`}
                        >
                          <div className="text-sm font-bold text-slate-900">{item.displayDate}</div>
                          <div className="mt-1 text-xs text-slate-500">{item.day} · {item.date}</div>
                        </button>
                      ))}
                    </div>
                    {!scheduleLoading && availableDates.filter((item) => item.available).length === 0 ? (
                      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">No available dates found for this provider/service/specialist. Check generic availability, provider operating hours, service availability, resources, and staff availability in admin.</div>
                    ) : null}
                  </div>

                  {draft.selectedDate ? (
                    <div>
                      <div className="mb-3 text-sm font-bold text-slate-900">Available time slots for {formatBookingDate(draft.selectedDate, { locale, calendar })}</div>
                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        {timeSlots.map((slot) => {
                          const selected = draft.selectedTimeFrom === slot.time && draft.selectedTimeTo === slot.endTime;
                          return (
                            <button
                              key={`${slot.time}-${slot.endTime}`}
                              type="button"
                              disabled={!slot.available}
                              onClick={() => {
                                const fallbackEnd = slot.endTime || addMinutes(slot.time, chosenService?.durationMinutes ?? 30);
                                const next = { ...draft, selectedTime: slot.time, selectedTimeFrom: slot.time, selectedTimeTo: fallbackEnd };
                                setDraft(next);
                                patchDraft(next).catch((er) => setError(er.message));
                              }}
                              className={`rounded-2xl border p-4 text-left transition ${selected ? 'border-[#083f30] bg-[#083f30]/5' : 'border-slate-200 bg-white'} ${slot.available ? 'hover:border-[#155e75]' : 'cursor-not-allowed opacity-40'}`}
                            >
                              <div className="text-sm font-bold text-slate-900">{slot.label}</div>
                              <div className="mt-1 text-xs text-slate-500">to {slot.endLabel}</div>
                              {typeof slot.remainingCapacity === 'number' && !draft.specialistId ? (
                                <div className="mt-2 text-[11px] font-semibold text-slate-500">{slot.remainingCapacity} capacity left</div>
                              ) : null}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : null}

              {draft.bookingUiMode === 'date_range' ? (
                <div className="grid gap-4 md:grid-cols-4">
                  <label className="text-sm font-semibold text-slate-700">From date
                    {calendar === 'jalali' ? (
                      <PersianDateTimePicker value={isReasonableBookingIsoDate(draft.selectedDateFrom) ? draft.selectedDateFrom : ''} onChange={(value) => { const iso = toIsoDate(String(value || '').slice(0, 10)); if (!iso) return; const next = { ...draft, selectedDateFrom: iso }; setDraft(next); patchDraft(next).catch((er) => setError(er.message)); }} className="mt-2" />
                    ) : (
                      <input type="date" value={isReasonableBookingIsoDate(draft.selectedDateFrom) ? draft.selectedDateFrom ?? '' : ''} onChange={(e) => { const next = { ...draft, selectedDateFrom: e.target.value }; setDraft(next); patchDraft(next).catch((er) => setError(er.message)); }} className="mt-2 h-12 w-full rounded-2xl border border-slate-200 px-4 outline-none focus:border-[#155e75]" />
                    )}
                  </label>
                  <label className="text-sm font-semibold text-slate-700">To date
                    {calendar === 'jalali' ? (
                      <PersianDateTimePicker value={isReasonableBookingIsoDate(draft.selectedDateTo) ? draft.selectedDateTo : ''} onChange={(value) => { const iso = toIsoDate(String(value || '').slice(0, 10)); if (!iso) return; const next = { ...draft, selectedDateTo: iso }; setDraft(next); patchDraft(next).catch((er) => setError(er.message)); }} className="mt-2" />
                    ) : (
                      <input type="date" value={isReasonableBookingIsoDate(draft.selectedDateTo) ? draft.selectedDateTo ?? '' : ''} onChange={(e) => { const next = { ...draft, selectedDateTo: e.target.value }; setDraft(next); patchDraft(next).catch((er) => setError(er.message)); }} className="mt-2 h-12 w-full rounded-2xl border border-slate-200 px-4 outline-none focus:border-[#155e75]" />
                    )}
                  </label>
                  <label className="text-sm font-semibold text-slate-700">Adults<input type="number" min={1} value={draft.adults ?? 1} onChange={(e) => { const next = { ...draft, adults: Number(e.target.value || 1) }; setDraft(next); patchDraft(next).catch((er) => setError(er.message)); }} className="mt-2 h-12 w-full rounded-2xl border border-slate-200 px-4 outline-none focus:border-[#155e75]" /></label>
                  <label className="text-sm font-semibold text-slate-700">Rooms<input type="number" min={1} value={draft.rooms ?? 1} onChange={(e) => { const next = { ...draft, rooms: Number(e.target.value || 1) }; setDraft(next); patchDraft(next).catch((er) => setError(er.message)); }} className="mt-2 h-12 w-full rounded-2xl border border-slate-200 px-4 outline-none focus:border-[#155e75]" /></label>
                  <div className="md:col-span-4">
                    {rangeAvailabilityLoading ? (
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">Checking service/resource availability…</div>
                    ) : dateRangeAvailability ? (
                      <div className={`rounded-2xl border p-4 text-sm ${dateRangeAvailability.available ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-red-200 bg-red-50 text-red-700'}`}>
                        {dateRangeAvailability.available
                          ? `Available. Minimum remaining capacity: ${dateRangeAvailability.remainingCapacity}.`
                          : dateRangeAvailability.message || 'This date range is not available.'}
                        {!dateRangeAvailability.available && dateRangeAvailability.unavailableDates?.length ? (
                          <div className="mt-2 text-xs">Unavailable dates: {dateRangeAvailability.unavailableDates.join(', ')}</div>
                        ) : null}
                      </div>
                    ) : (
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">Select dates and units to check service/resource availability.</div>
                    )}
                  </div>
                </div>
              ) : null}

              {draft.bookingUiMode === 'custom_form' && mainServiceForm ? (
                <DynamicServiceForm
                  form={mainServiceForm}
                  locales={[locale]}
                  onSubmit={async (values) => {
                    const res = await getJson<{ submissionId: string }>('/api/form-builder/submissions', {
                      method: 'POST',
                      body: JSON.stringify({
                        formVersionId: mainServiceForm.formVersionId,
                        serviceDefinitionId: draft.serviceDefinitionId,
                        bookingDraftId: draft.id,
                        status: 'submitted',
                        payload: values,
                      }),
                    });
                    const next = { ...draft, formSubmissionId: res.submissionId, metadata: { ...(draft.metadata ?? {}), formValues: values } };
                    setDraft(next);
                    patchDraft(next).catch((er) => setError(er.message));
                  }}
                  submitLabel="Save form and continue"
                />
              ) : null}

              <div className="mt-6 rounded-3xl border border-[#083f30]/15 bg-[#083f30]/5 p-5">
                <label className="flex cursor-pointer items-start gap-3">
                  <input
                    type="checkbox"
                    checked={Boolean(draft.useLsevin)}
                    onChange={(event) => {
                      const useLsevin = event.target.checked;
                      const next = { ...draft, useLsevin, currentStep: 2 };
                      setDraft(next);
                      patchDraft({ useLsevin, currentStep: 2 }).catch((er) => setError(er.message));
                    }}
                    className="mt-1 h-5 w-5 rounded border-slate-300 text-[#083f30] focus:ring-[#083f30]"
                  />
                  <span>
                    <span className="block text-sm font-bold text-slate-900">I want LSevin to arrange extra support services for this booking.</span>
                    <span className="mt-1 block text-xs leading-5 text-slate-600">Choose this if you want help with related services such as hotel, transfer, insurance, concierge, translation, or other add-ons. If you leave it unchecked, we will skip add-ons and files and go directly to review and payment.</span>
                  </span>
                </label>
              </div>
            </div>
          ) : null}

          {currentStep === 3 ? (
            <div className="space-y-4">
              <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-lg">
                <h2 className="text-xl font-bold text-slate-900">Add-on sub-bookings</h2>
                <p className="mt-2 text-sm text-slate-600">Every selected provider-type add-on starts an embedded child booking. Add-ons do not open add-ons of their own.</p>
              </div>
              {addonProviderTypes.map((addon) => (
                <ChildAddonBookingCard
                  key={addon.providerTypeId}
                  locale={locale}
                  draftId={draft.id!}
                  addon={addon}
                  value={childMap[addon.providerTypeId]}
                  onChange={(next) => setDraft((prev) => ({ ...(prev as BookingDraftState), childBookings: [...(prev?.childBookings ?? []).filter((x) => x.providerTypeId !== next.providerTypeId), next] }))}
                  onSaved={(next, totals) => setDraft((prev) => ({ ...(prev as BookingDraftState), childBookings: [...(prev?.childBookings ?? []).filter((x) => x.providerTypeId !== next.providerTypeId), next], ...(totals ?? {}) }))}
                />
              ))}
            </div>
          ) : null}

          {currentStep === 4 ? (
            <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-lg">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#083f30]/10 text-[#083f30]"><FileStack className="h-5 w-5" /></div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Required files</h2>
                  <p className="text-sm text-slate-600">These requirements come from the selected service definition. Use your media picker and store ids/urls in the fields below.</p>
                </div>
              </div>
              <div className="space-y-4">
                {uploadRequirements.map((item) => {
                  const existing = (draft.uploadFiles ?? []).find((x) => x.requirementId === item.id);
                  return (
                    <div key={item.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                      <div className="mb-2 text-sm font-bold text-slate-900">{item.title} {item.isRequired ? <span className="text-red-500">*</span> : null}</div>
                      {item.description ? <div className="mb-3 text-xs text-slate-500">{item.description}</div> : null}
                      <input
                        type="text"
                        value={existing?.fileUrl ?? existing?.mediaIds ?? ''}
                        onChange={(e) => {
                          const nextFiles = [
                            ...(draft.uploadFiles ?? []).filter((x) => x.requirementId !== item.id),
                            { requirementId: item.id, title: item.title, fileUrl: e.target.value, mediaIds: e.target.value },
                          ];
                          const next = { ...draft, uploadFiles: nextFiles };
                          setDraft(next);
                        }}
                        placeholder="Use RHFSingleMediaPickerField / RHFMultiMediaPickerField hidden value here"
                        className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 outline-none focus:border-[#155e75]"
                      />
                    </div>
                  );
                })}
              </div>
              <button type="button" onClick={() => getJson('/api/booking-pro/draft', { method: 'PATCH', body: JSON.stringify({ action: 'documents', draftId: draft.id, documents: draft.uploadFiles }) }).then(() => {}).catch((e) => setError(e.message))} className="mt-5 rounded-2xl bg-[#083f30] px-5 py-3 text-sm font-bold text-white shadow-lg">Save file selections</button>
            </div>
          ) : null}

          {currentStep === 5 ? (
            <div className="space-y-4">
              <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-lg">
                <h2 className="text-xl font-bold text-slate-900">Review and pay</h2>
                <div className="mt-4 space-y-3 text-sm text-slate-700">
                  <div className="flex justify-between"><span>Main booking</span><span>{chosenProvider?.name} / {chosenService?.name}{chosenSpecialist ? ` / ${chosenSpecialist.name}` : ''}</span></div>
                  <div className="flex justify-between"><span>Main subtotal</span><span>{draft.currency} {draft.subtotalAmount ?? 0}</span></div>
                  {draft.useLsevin ? <>
                    <div className="flex justify-between"><span>Add-on sub-bookings</span><span>{draft.childBookings.length}</span></div>
                    <div className="flex justify-between"><span>Add-on subtotal</span><span>{draft.currency} {draft.addonsAmount ?? 0}</span></div>
                  </> : <div className="rounded-2xl bg-slate-50 p-3 text-xs text-slate-600">Extra LSevin support services were not requested for this booking.</div>}
                  {Number(draft.metadata?.appliedDiscountAmount ?? 0) > 0 ? (
                    <div className="flex justify-between text-green-700"><span>Coupon discount ({String(draft.metadata?.appliedCouponCode ?? draft.metadata?.couponCode ?? '')})</span><span>-{draft.currency} {Number(draft.metadata?.appliedDiscountAmount ?? 0)}</span></div>
                  ) : null}
                  <div className="flex justify-between border-t border-slate-200 pt-3 text-base font-bold text-slate-900"><span>Total after discounts</span><span>{draft.currency} {draft.totalAmount ?? 0}</span></div>
                  <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="text-sm font-semibold text-slate-700">Coupon</div>
                    <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                      <input
                        value={couponCode}
                        onChange={(event) => setCouponCode(event.target.value)}
                        placeholder="Enter coupon code"
                        className="h-11 flex-1 rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none focus:border-[#155e75]"
                      />
                      <button type="button" disabled={couponLoading || !couponCode.trim()} onClick={handleApplyCoupon} className="rounded-2xl bg-[#083f30] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">Apply</button>
                      {draft.metadata?.appliedCouponCode || draft.metadata?.couponCode ? (
                        <button type="button" disabled={couponLoading} onClick={handleRemoveCoupon} className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 disabled:opacity-50">Remove</button>
                      ) : null}
                    </div>
                    {draft.metadata?.couponTitle ? <div className="mt-2 text-xs text-green-700">Applied: {String(draft.metadata.couponTitle)}</div> : null}
                  </div>
                  <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div>
                      <div className="text-sm font-semibold text-slate-700">Payment method</div>
                      <div className="mt-2">
                        <PaymentMethodsPanel
                          selected={draft.paymentMethod ?? 'card'}
                          onChange={(code) => {
                            const next = { ...draft, paymentMethod: code };
                            setDraft(next);
                            patchDraft(next).catch((er) => setError(er.message));
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              {checkoutResult ? (
                <div className="rounded-[28px] border border-green-200 bg-green-50 p-6 text-green-800 shadow-lg">
                  <div className="text-lg font-bold">Booking submitted</div>
                  <div className="mt-2 text-sm">Booking ID: {checkoutResult.bookingId}</div>
                  <div className="text-sm">Payment status: {checkoutResult.paymentStatus}</div>
                  <button type="button" onClick={handleCreatePaymentIntent} className="mt-4 rounded-2xl bg-[#083f30] px-4 py-3 text-sm font-semibold text-white">Continue to payment</button>
                </div>
              ) : null}

              {paymentIntentResult ? (
                <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-lg">
                  <div className="text-lg font-bold text-slate-900">Payment action</div>
                  <div className="mt-2 text-sm text-slate-600">Method: {paymentIntentResult.method}</div>
                  <div className="text-sm text-slate-600">Status: {paymentIntentResult.status}</div>
                  {paymentIntentResult.instructions ? <div className="mt-3 rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">{paymentIntentResult.instructions}</div> : null}
                  {paymentIntentResult.actionUrl ? <a href={paymentIntentResult.actionUrl} className="mt-4 inline-flex rounded-2xl bg-[#083f30] px-4 py-3 text-sm font-semibold text-white">Open gateway action</a> : null}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>

        <aside className="space-y-4">
          <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-lg">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#eacb7f] text-[#083f30]"><ShieldCheck className="h-5 w-5" /></div>
              <div>
                <div className="font-bold text-slate-900">Current draft</div>
                <div className="text-xs text-slate-500">Only one active pending booking is kept for this user.</div>
              </div>
            </div>
            <div className="space-y-2 text-sm text-slate-600">
              <div>Provider: <span className="font-semibold text-slate-900">{chosenProvider?.name ?? 'Not selected'}</span></div>
              <div>Service: <span className="font-semibold text-slate-900">{chosenService?.name ?? 'Not selected'}</span></div>
              <div>Specialist: <span className="font-semibold text-slate-900">{draft.requiresSpecialist ? (chosenSpecialist?.name ?? 'Not selected') : 'Not required'}</span></div>
              <div>Mode: <span className="font-semibold text-slate-900">{draft.bookingUiMode ?? 'default_slot'}</span></div>
            </div>
            <div className="mt-5 rounded-2xl bg-slate-50 p-4">
              <div className="flex justify-between text-sm"><span>Main subtotal</span><span>{draft.currency ?? 'USD'} {draft.subtotalAmount ?? 0}</span></div>
              {draft.useLsevin ? <div className="mt-1 flex justify-between text-sm"><span>Add-ons subtotal</span><span>{draft.currency ?? 'USD'} {draft.addonsAmount ?? 0}</span></div> : null}
              <div className="mt-3 flex justify-between border-t border-slate-200 pt-3 text-base font-bold text-slate-900"><span>Total</span><span>{draft.currency ?? 'USD'} {draft.totalAmount ?? ((draft.subtotalAmount ?? 0) + (draft.addonsAmount ?? 0))}</span></div>
            </div>
          </div>

          <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-lg">
            <div className="mb-4 text-sm font-bold uppercase tracking-wide text-slate-500">Continue</div>
            <button
              type="button"
              disabled={
                (currentStep === 1 && !canContinueServiceStep) ||
                (currentStep === 2 && !canContinueScheduleStep) ||
                (currentStep === 3 && !canContinueAddonsStep) ||
                (currentStep === 4 && !canContinueFilesStep) ||
                (currentStep === 5 && submitting)
              }
              onClick={() => currentStep === 5 ? handleCheckout() : goNext()}
              className={`flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-4 text-sm font-bold shadow-lg ${((currentStep === 1 && !canContinueServiceStep) || (currentStep === 2 && !canContinueScheduleStep) || (currentStep === 3 && !canContinueAddonsStep) || (currentStep === 4 && !canContinueFilesStep) || (currentStep === 5 && submitting)) ? 'bg-slate-200 text-slate-500' : 'bg-[#083f30] text-white'}`}
            >
              {currentStep === 5 ? <CreditCard className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              {currentStep === 5 ? 'Submit combined checkout' : 'Continue'}
            </button>
            {currentStep === 3 ? <div className="mt-3 text-xs text-slate-500">Required add-on provider types must be completed before checkout.</div> : null}
          </div>
        </aside>
      </div>
    </div>
  );
}
