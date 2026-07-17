'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, CheckCircle2, ChevronRight, CreditCard, FileStack, Layers3, RefreshCcw, ShieldCheck } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter, useSearchParams } from 'next/navigation';
import { DynamicServiceForm } from '@/features/form-builder/components/DynamicServiceForm';
import type { BookingDraftState, ChildBookingDraft, ProviderCardItem, ProviderTypeAddonItem, ServiceCardItem, SpecialistCardItem, UploadRequirementItem } from '../types';
import { ChildAddonBookingCard } from './ChildAddonBookingCard';
import { PaymentMethodsPanel } from './PaymentMethodsPanel';
import { DecisionStack } from './step-service/DecisionStack';
import { autoSelectId, canContinueService, type SlotKey } from '../lib/decision-stack';
import { cascadeFor } from '../lib/cascade';
import { PersianDateTimePicker } from '@/components/date-time/PersianDateTimePicker';
import { formatBookingDate, isReasonableBookingIsoDate, normalizeBookingCalendar, toIsoDate } from '../lib/calendar';
import { RichTextPreview } from '@/features/booking/components/rich-text-preview';
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
        }
        catch {
            // keep plain text response
        }
        throw new Error(message);
    }
    return response.json();
}
const steps = [
    { key: 1, labelKey: 'stepService' },
    { key: 2, labelKey: 'stepSchedule' },
    { key: 3, labelKey: 'stepAddOns' },
    { key: 4, labelKey: 'stepFiles' },
    { key: 5, labelKey: 'stepReviewPay' },
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
    providers: Array<{
        id: string;
        name: string;
        city?: string | null;
        country?: string | null;
        image?: string | null;
        rating?: number;
        reviewCount?: number;
    }>;
    services: Array<{
        id: string;
        providerId: string;
        serviceDefinitionId: string;
        name: string;
        description?: string | null;
        image?: string | null;
        durationMinutes?: number;
        slotIntervalMinutes?: number;
        price: number;
        currency: string;
    }>;
    specialists: Array<{
        id: string;
        name: string;
        title?: string | null;
        image?: string | null;
        rating?: number;
        reviewCount?: number;
    }>;
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
/**
 * Groups digits and localises the currency. The collapsed step-1 row makes this the only
 * price on screen, so "IRR 500000000" is no longer good enough to read at a glance.
 */
function useMoneyFormatter(locale: string) {
    return useMemo(() => (value?: number | null, currency?: string | null) => {
        const amount = Number(value ?? 0);
        const code = String(currency || '').trim().toUpperCase();
        if (!Number.isFinite(amount))
            return '';
        try {
            return new Intl.NumberFormat(locale, { style: 'currency', currency: code || 'USD', maximumFractionDigits: 0 }).format(amount);
        }
        catch {
            // Unknown/invalid ISO code — still group the digits rather than dumping them raw.
            return `${code} ${new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(amount)}`.trim();
        }
    }, [locale]);
}
function useDebouncedValue<T>(value: T, delayMs = 350) {
    const [debounced, setDebounced] = useState(value);
    useEffect(() => {
        const timer = window.setTimeout(() => setDebounced(value), delayMs);
        return () => window.clearTimeout(timer);
    }, [value, delayMs]);
    return debounced;
}

const DRAFT_PATCH_KEYS: Array<keyof BookingDraftState> = [
    'providerId',
    'serviceId',
    'serviceDefinitionId',
    'specialistId',
    'requiresSpecialist',
    'bookingUiMode',
    'selectedDate',
    'selectedDateFrom',
    'selectedDateTo',
    'selectedTime',
    'selectedTimeFrom',
    'selectedTimeTo',
    'adults',
    'children',
    'infants',
    'rooms',
    'currentStep',
    'paymentMethod',
    'currency',
    'subtotalAmount',
    'addonsAmount',
    'totalAmount',
    'useLsevin',
    'notes',
    'formSubmissionId',
];

const DRAFT_METADATA_KEYS = new Set([
    'couponCode',
    'appliedCouponCode',
    'appliedCouponId',
    'appliedCouponSource',
    'appliedDiscountType',
    'appliedDiscountValue',
    'appliedDiscountAmount',
    'couponTitle',
    'customerCouponId',
    'bookingUiMode',
    'requiresSpecialist',
    'selectedDateFrom',
    'selectedDateTo',
    'serviceDefinitionId',
    'adults',
    'children',
    'infants',
    'rooms',
]);

function compactDraftPatch(patch: Partial<BookingDraftState>): Partial<BookingDraftState> {
    const compact: Partial<BookingDraftState> = {};
    for (const key of DRAFT_PATCH_KEYS) {
        const value = patch[key];
        if (value !== undefined) {
            (compact as any)[key] = value;
        }
    }

    if (patch.metadata && typeof patch.metadata === 'object') {
        const metadata = Object.fromEntries(
            Object.entries(patch.metadata).filter(([key, value]) => {
                if (!DRAFT_METADATA_KEYS.has(key)) return false;
                if (value === undefined) return false;
                if (typeof value === 'string') return value.length <= 500 && !value.startsWith('data:');
                return ['number', 'boolean'].includes(typeof value) || value === null;
            })
        );
        if (Object.keys(metadata).length > 0) {
            compact.metadata = metadata;
        }
    }

    return compact;
}

function getPaymentActionUrl(result: any) {
    const actionUrl = String(result?.actionUrl || result?.redirectUrl || '').trim();
    return actionUrl && !actionUrl.startsWith('javascript:') ? actionUrl : '';
}
export function BookingWizard() {
    const tBooking = useTranslations("Booking");
    const locale = useLocale();
    const router = useRouter();
    const searchParams = useSearchParams();
    const seededProviderId = searchParams.get('providerId') ?? searchParams.get('id') ?? undefined;
    const seededServiceId = searchParams.get('serviceId') ?? undefined;
    const seededSpecialistId = searchParams.get('specialistId') ?? undefined;
    const hasSeedSelection = Boolean(seededProviderId || seededServiceId || seededSpecialistId);
    const defaultCalendar = localeToCalendar(locale);
    const formatMoney = useMoneyFormatter(locale);
    const [draft, setDraft] = useState<BookingDraftState | null>(null);
    const [resumeChoiceRequired, setResumeChoiceRequired] = useState(false);
    const [loadingDraft, setLoadingDraft] = useState(true);
    const [seedEntryResolved, setSeedEntryResolved] = useState(!hasSeedSelection);
    const [providerSearch, setProviderSearch] = useState('');
    const [serviceSearch, setServiceSearch] = useState('');
    const [specialistSearch, setSpecialistSearch] = useState('');
    const providerSearchQuery = useDebouncedValue(providerSearch);
    const serviceSearchQuery = useDebouncedValue(serviceSearch);
    const specialistSearchQuery = useDebouncedValue(specialistSearch);
    const [providerOffset, setProviderOffset] = useState(0);
    const [serviceOffset, setServiceOffset] = useState(0);
    const [specialistOffset, setSpecialistOffset] = useState(0);
    const [providers, setProviders] = useState<ProviderCardItem[]>([]);
    const [services, setServices] = useState<ServiceCardItem[]>([]);
    const [specialists, setSpecialists] = useState<SpecialistCardItem[]>([]);
    const [providerHasMore, setProviderHasMore] = useState(false);
    const [serviceHasMore, setServiceHasMore] = useState(false);
    const [specialistHasMore, setSpecialistHasMore] = useState(false);
    const [providersLoading, setProvidersLoading] = useState(false);
    const [servicesLoading, setServicesLoading] = useState(false);
    const [specialistsLoading, setSpecialistsLoading] = useState(false);
    // Exact server-side counts. `items.length` cannot stand in for these: it is capped by
    // `take` and narrowed by search, so it can neither prove "only option" nor size the
    // search threshold honestly.
    const [providerTotal, setProviderTotal] = useState(0);
    const [serviceTotal, setServiceTotal] = useState(0);
    const [specialistTotal, setSpecialistTotal] = useState(0);
    // The chosen entity, kept independently of whichever page the list happens to show —
    // a seeded provider outside the first page would otherwise render as "not selected".
    const [resolvedProvider, setResolvedProvider] = useState<ProviderCardItem | null>(null);
    const [resolvedService, setResolvedService] = useState<ServiceCardItem | null>(null);
    const [resolvedSpecialist, setResolvedSpecialist] = useState<SpecialistCardItem | null>(null);
    // Once a user opens a picker, that slot is theirs: never auto-select into it.
    const [touchedSlots, setTouchedSlots] = useState<Record<SlotKey, boolean>>({ provider: false, service: false, specialist: false });
    const [entryFailed, setEntryFailed] = useState(false);
    const [entryAttempt, setEntryAttempt] = useState(0);
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
    const providerRequestSeq = useRef(0);
    const serviceRequestSeq = useRef(0);
    const specialistRequestSeq = useRef(0);
    const serviceModeRequestSeq = useRef(0);
    const availabilityDatesRequestSeq = useRef(0);
    const timeSlotsRequestSeq = useRef(0);
    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const { draft } = await getJson<{
                    draft: BookingDraftState | null;
                }>('/api/booking-pro/draft');
                if (cancelled)
                    return;
                if (draft) {
                    const hasExistingSelection = Boolean(draft.providerId || draft.serviceId || draft.childBookings?.length || draft.uploadFiles?.length);
                    if (hasExistingSelection && !hasSeedSelection) {
                        setDraft(draft);
                        setResumeChoiceRequired(true);
                    }
                    else {
                        setDraft({ ...draft, providerId: seededProviderId ?? draft.providerId, serviceId: seededServiceId ?? draft.serviceId, specialistId: seededSpecialistId ?? draft.specialistId });
                        setResumeChoiceRequired(false);
                    }
                }
                else {
                    const created = await getJson<{
                        draft: BookingDraftState;
                    }>('/api/booking-pro/draft', { method: 'POST' });
                    setDraft({ ...created.draft, providerId: seededProviderId, serviceId: seededServiceId, specialistId: seededSpecialistId });
                }
            }
            catch (e: any) {
                setError(e.message || tBooking('failedToLoadBookingDraft'));
            }
            finally {
                setLoadingDraft(false);
            }
        })();
        return () => { cancelled = true; };
    }, []);
    useEffect(() => {
        const code = String(draft?.metadata?.couponCode ??
            draft?.metadata?.appliedCouponCode ??
            '');
        setCouponCode(code);
    }, [draft?.id, draft?.metadata?.couponCode, draft?.metadata?.appliedCouponCode]);
    const rawCurrentStep = draft?.currentStep ?? 1;
    const currentStep = draft && !draft.useLsevin && (rawCurrentStep === 3 || rawCurrentStep === 4) ? 5 : rawCurrentStep;
    const wantsLsevinSupport = Boolean(draft?.useLsevin);
    const visibleSteps = useMemo(() => wantsLsevinSupport ? steps : steps.filter((step) => step.key <= 2 || step.key === 5), [wantsLsevinSupport]);
    useEffect(() => {
        if (!draft?.id || !hasSeedSelection || resumeChoiceRequired) {
            if (!hasSeedSelection) setSeedEntryResolved(true);
            return;
        }
        let cancelled = false;
        setSeedEntryResolved(false);
        setEntryFailed(false);
        getJson<BookingEntryResolution>(`/api/booking-pro/entry?locale=${locale}&providerId=${encodeURIComponent(seededProviderId ?? '')}&serviceId=${encodeURIComponent(seededServiceId ?? '')}&specialistId=${encodeURIComponent(seededSpecialistId ?? '')}`)
            .then((entry) => {
            if (cancelled)
                return;
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
            const selectedProvider = mappedProviders.find((item) => item.id === entry.selectedProviderId);
            // A seeded specialist is only trustworthy if entry — which filters staff by the
            // resolved provider and service definition — actually returned them. Otherwise the
            // link pairs a specialist with a service they do not perform, and confirming it
            // would strand the user on a schedule step whose availability is always empty.
            const seededSpecialistIsValid = Boolean(entry.selectedSpecialistId && mappedSpecialists.some((item) => item.id === entry.selectedSpecialistId));
            const selectedSpecialist = seededSpecialistIsValid ? mappedSpecialists.find((item) => item.id === entry.selectedSpecialistId) : undefined;
            setResolvedProvider(selectedProvider ?? null);
            setResolvedService(selectedService ?? null);
            setResolvedSpecialist(selectedSpecialist ?? null);
            const patch: Partial<BookingDraftState> = {
                providerId: entry.selectedProviderId ?? null as any,
                serviceId: entry.selectedServiceId ?? null as any,
                specialistId: selectedSpecialist?.id ?? null as any,
                serviceDefinitionId: selectedService?.serviceDefinitionId ?? null as any,
                currency: selectedService?.currency,
                subtotalAmount: selectedService?.value,
                currentStep: 1,
            };
            setDraft((prev) => ({ ...(prev as BookingDraftState), ...patch }));
            patchDraft(patch).catch((e) => setError(e.message));
        })
            .catch((e) => {
            if (cancelled)
                return;
            // Do not silently drop the seed into a cold-start picker: the link's whole intent
            // is the service it names. Surface the failure and offer a retry.
            setEntryFailed(true);
            setError(e.message);
        })
            .finally(() => {
            if (!cancelled)
                setSeedEntryResolved(true);
        });
        return () => { cancelled = true; };
    }, [draft?.id, hasSeedSelection, seededProviderId, seededServiceId, seededSpecialistId, locale, resumeChoiceRequired, entryAttempt]);
    useEffect(() => {
        if (!draft || currentStep !== 1 || resumeChoiceRequired || !seedEntryResolved) {
            return;
        }
        const requestId = ++providerRequestSeq.current;
        let cancelled = false;
        setProvidersLoading(true);
        const params = new URLSearchParams({
            locale,
            search: providerSearchQuery,
            offset: String(providerOffset),
            take: '8',
        });
        // Never pass providerId — a list filtered by its own selection can only return the
        // item you are trying to replace. Filter by the service *definition* rather than the
        // provider_services row, which belongs to exactly one provider and would collapse
        // this list to a single option by construction.
        if (draft.serviceDefinitionId) params.set('serviceDefinitionId', draft.serviceDefinitionId);
        // Only a *seeded* specialist narrows the providers: the cascade runs
        // provider -> service -> specialist, so filtering this list by a specialist chosen
        // downstream would let an auto-selected staff member silently lock out every other
        // clinic. A seeded one is the visitor's stated intent, so it counts.
        if (seededSpecialistId) params.set('specialistId', seededSpecialistId);
        getJson<{
            items: ProviderCardItem[];
            total: number;
            hasMore: boolean;
        }>(`/api/booking-pro/catalog/providers?${params.toString()}`)
            .then((data) => {
            if (cancelled || providerRequestSeq.current !== requestId)
                return;
            setProviders((prev) => (providerOffset === 0 ? data.items : [...prev, ...data.items]));
            setProviderHasMore(data.hasMore);
            setProviderTotal(data.total);
        })
            .catch((e) => { if (!cancelled && providerRequestSeq.current === requestId) setError(e.message); })
            .finally(() => { if (!cancelled && providerRequestSeq.current === requestId) setProvidersLoading(false); });
        return () => { cancelled = true; };
    }, [draft?.id, draft?.serviceDefinitionId, seededSpecialistId, currentStep, providerSearchQuery, providerOffset, locale, resumeChoiceRequired, seedEntryResolved]);
    useEffect(() => {
        if ((!draft?.providerId && !draft?.serviceId && !draft?.specialistId) || currentStep !== 1 || resumeChoiceRequired || !seedEntryResolved) {
            return;
        }
        const requestId = ++serviceRequestSeq.current;
        let cancelled = false;
        setServicesLoading(true);
        const params = new URLSearchParams({
            locale,
            search: serviceSearchQuery,
            offset: String(serviceOffset),
            take: '8',
        });
        if (draft.providerId) params.set('providerId', draft.providerId);
        // Never pass serviceId: repository.listServices filters `ps.id = serviceId`, which
        // would return only the service the user is trying to change away from.
        // Specialist is downstream of service — only a seeded one narrows this list.
        if (seededSpecialistId) params.set('specialistId', seededSpecialistId);
        getJson<{
            items: ServiceCardItem[];
            total: number;
            hasMore: boolean;
        }>(`/api/booking-pro/catalog/services?${params.toString()}`)
            .then((data) => {
            if (cancelled || serviceRequestSeq.current !== requestId)
                return;
            setServices((prev) => (serviceOffset === 0 ? data.items : [...prev, ...data.items]));
            setServiceHasMore(data.hasMore);
            setServiceTotal(data.total);
        })
            .catch((e) => { if (!cancelled && serviceRequestSeq.current === requestId) setError(e.message); })
            .finally(() => { if (!cancelled && serviceRequestSeq.current === requestId) setServicesLoading(false); });
        return () => { cancelled = true; };
    }, [draft?.providerId, seededSpecialistId, currentStep, serviceSearchQuery, serviceOffset, locale, resumeChoiceRequired, seedEntryResolved]);
    useEffect(() => {
        if ((!draft?.providerId && !draft?.serviceId && !draft?.specialistId) || !draft?.requiresSpecialist || currentStep !== 1 || resumeChoiceRequired || !seedEntryResolved) {
            return;
        }
        const requestId = ++specialistRequestSeq.current;
        let cancelled = false;
        setSpecialistsLoading(true);
        const params = new URLSearchParams({
            locale,
            search: specialistSearchQuery,
            offset: String(specialistOffset),
            take: '8',
        });
        if (draft.providerId) params.set('providerId', draft.providerId);
        if (draft.serviceId) params.set('serviceId', draft.serviceId);
        // Never pass specialistId: listSpecialists filters `s.id = specialistId`.
        getJson<{
            items: SpecialistCardItem[];
            total: number;
            hasMore: boolean;
        }>(`/api/booking-pro/catalog/specialists?${params.toString()}`)
            .then((data) => {
            if (cancelled || specialistRequestSeq.current !== requestId)
                return;
            setSpecialists((prev) => (specialistOffset === 0 ? data.items : [...prev, ...data.items]));
            setSpecialistHasMore(data.hasMore);
            setSpecialistTotal(data.total);
        })
            .catch((e) => { if (!cancelled && specialistRequestSeq.current === requestId) setError(e.message); })
            .finally(() => { if (!cancelled && specialistRequestSeq.current === requestId) setSpecialistsLoading(false); });
        return () => { cancelled = true; };
    }, [draft?.providerId, draft?.serviceId, draft?.requiresSpecialist, currentStep, specialistSearchQuery, specialistOffset, locale, resumeChoiceRequired, seedEntryResolved]);
    useEffect(() => {
        if (!draft?.serviceId || resumeChoiceRequired)
            return;
        const serviceId = draft.serviceId;
        const requestId = ++serviceModeRequestSeq.current;
        let cancelled = false;
        getJson<{
            item: {
                service_definition_id: string;
                booking_ui_mode: string;
                requires_specialist: boolean;
                value: number;
                currency: string;
            };
        }>(`/api/booking-pro/service-mode?serviceId=${serviceId}`)
            .then(async ({ item }) => {
            if (cancelled || serviceModeRequestSeq.current !== requestId)
                return;
            setDraft((prev) => prev?.serviceId === serviceId ? ({
                ...prev,
                serviceDefinitionId: item.service_definition_id,
                bookingUiMode: item.booking_ui_mode as any,
                requiresSpecialist: item.requires_specialist,
                specialistId: item.requires_specialist ? prev.specialistId : undefined,
                currency: item.currency,
                subtotalAmount: Number(item.value ?? 0),
            }) : prev);
            if (item.booking_ui_mode === 'custom_form') {
                const formData = await getJson<{
                    form: any | null;
                }>(`/api/form-builder/service-form?serviceDefinitionId=${item.service_definition_id}&usageScope=main_booking&locale=${locale}`);
                if (!cancelled && serviceModeRequestSeq.current === requestId)
                    setMainServiceForm(formData.form);
            }
            else {
                setMainServiceForm(null);
            }
        })
            .catch((e) => { if (!cancelled && serviceModeRequestSeq.current === requestId) setError(e.message); });
        getJson<{
            items: ProviderTypeAddonItem[];
        }>(`/api/booking-pro/addon-provider-types?serviceId=${serviceId}&locale=${locale}`)
            .then((data) => { if (!cancelled && serviceModeRequestSeq.current === requestId) setAddonProviderTypes(data.items); })
            .catch((e) => { if (!cancelled && serviceModeRequestSeq.current === requestId) setError(e.message); });
        getJson<{
            items: UploadRequirementItem[];
        }>(`/api/booking-pro/uploads/requirements?serviceId=${serviceId}&locale=${locale}`)
            .then((data) => { if (!cancelled && serviceModeRequestSeq.current === requestId) setUploadRequirements(data.items); })
            .catch((e) => { if (!cancelled && serviceModeRequestSeq.current === requestId) setError(e.message); });
        return () => { cancelled = true; };
    }, [draft?.serviceId, locale, resumeChoiceRequired]);
    useEffect(() => {
        if (!draft?.providerId || !draft?.serviceId || draft.bookingUiMode !== 'default_slot' || resumeChoiceRequired) {
            setAvailableDates([]);
            setTimeSlots([]);
            return;
        }
        const requestId = ++availabilityDatesRequestSeq.current;
        let cancelled = false;
        setScheduleLoading(true);
        const params = new URLSearchParams({
            locale,
            calendar,
            providerId: draft.providerId,
            serviceId: draft.serviceId,
        });
        if (draft.specialistId)
            params.set('specialistId', draft.specialistId);
        getJson<{
            dates: AvailableDateItem[];
        }>(`/api/booking-pro/availability/dates?${params.toString()}`)
            .then((data) => {
            if (cancelled || availabilityDatesRequestSeq.current !== requestId)
                return;
            const dates = data.dates ?? [];
            setAvailableDates(dates);
            const selectedIsStillAvailable = Boolean(draft.selectedDate && dates.some((item) => item.date === draft.selectedDate && item.available));
            if (!selectedIsStillAvailable) {
                const today = new Date().toISOString().slice(0, 10);
                const tomorrowDate = new Date();
                tomorrowDate.setDate(tomorrowDate.getDate() + 1);
                const tomorrow = tomorrowDate.toISOString().slice(0, 10);
                const preferred = dates.find((item) => item.available && item.date === today)
                    ?? dates.find((item) => item.available && item.date === tomorrow)
                    ?? dates.find((item) => item.available);
                if (preferred) {
                    patchDraft({ selectedDate: preferred.date, selectedDateFrom: preferred.date as any, selectedDateTo: preferred.date as any }).catch((e) => setError(e.message));
                }
            }
        })
            .catch((e) => { if (!cancelled && availabilityDatesRequestSeq.current === requestId) setError(e.message); })
            .finally(() => { if (!cancelled && availabilityDatesRequestSeq.current === requestId)
            setScheduleLoading(false); });
        return () => { cancelled = true; };
    }, [draft?.providerId, draft?.serviceId, draft?.specialistId, draft?.bookingUiMode, locale, calendar, resumeChoiceRequired]);
    useEffect(() => {
        if (!draft?.providerId || !draft?.serviceId || !draft?.selectedDate || !isReasonableBookingIsoDate(draft.selectedDate) || draft.bookingUiMode !== 'default_slot' || resumeChoiceRequired) {
            setTimeSlots([]);
            return;
        }
        const requestId = ++timeSlotsRequestSeq.current;
        let cancelled = false;
        const params = new URLSearchParams({
            locale,
            providerId: draft.providerId,
            serviceId: draft.serviceId,
            selectedDate: draft.selectedDate,
        });
        if (draft.specialistId)
            params.set('specialistId', draft.specialistId);
        getJson<{
            timeSlots: TimeSlotItem[];
        }>(`/api/booking-pro/availability/timeslots?${params.toString()}`)
            .then((data) => { if (!cancelled && timeSlotsRequestSeq.current === requestId)
            setTimeSlots(data.timeSlots ?? []); })
            .catch((e) => { if (!cancelled && timeSlotsRequestSeq.current === requestId) setError(e.message); });
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
            .then((data) => { if (!cancelled)
            setDateRangeAvailability(data); })
            .catch((e) => setError(e.message))
            .finally(() => { if (!cancelled)
            setRangeAvailabilityLoading(false); });
        return () => { cancelled = true; };
    }, [draft?.providerId, draft?.serviceId, draft?.bookingUiMode, draft?.selectedDateFrom, draft?.selectedDateTo, draft?.rooms, resumeChoiceRequired]);
    async function patchDraft(patch: Partial<BookingDraftState>) {
        if (!draft)
            return;
        const compactPatch = compactDraftPatch(patch);
        const payload = { ...compactPatch, draftId: draft.id };
        const response = await getJson<{
            draft?: BookingDraftState;
            totals?: {
                subtotalAmount: number;
                addonsAmount: number;
                totalAmount: number;
            };
        }>('/api/booking-pro/draft', {
            method: 'PATCH',
            body: JSON.stringify(payload),
        });
        setDraft((prev) => ({ ...(prev as BookingDraftState), ...patch, ...(response.totals ?? {}) }));
    }
    // Prefer the resolved entity over the current list page: the list is paginated and
    // cross-filtered, so a valid selection is routinely absent from it.
    const chosenProvider = useMemo(() => (resolvedProvider?.id === draft?.providerId ? resolvedProvider : undefined) ?? providers.find((p) => p.id === draft?.providerId), [resolvedProvider, providers, draft?.providerId]);
    const chosenService = useMemo(() => (resolvedService?.id === draft?.serviceId ? resolvedService : undefined) ?? services.find((p) => p.id === draft?.serviceId), [resolvedService, services, draft?.serviceId]);
    const chosenSpecialist = useMemo(() => (resolvedSpecialist?.id === draft?.specialistId ? resolvedSpecialist : undefined) ?? specialists.find((p) => p.id === draft?.specialistId), [resolvedSpecialist, specialists, draft?.specialistId]);
    // Keep the resolved cache in step with whatever the lists learn, so a selection made
    // from a picker survives the list moving on to another page.
    useEffect(() => {
        const found = providers.find((p) => p.id === draft?.providerId);
        if (found && found.id !== resolvedProvider?.id) setResolvedProvider(found);
    }, [providers, draft?.providerId, resolvedProvider?.id]);
    useEffect(() => {
        const found = services.find((p) => p.id === draft?.serviceId);
        if (found && found.id !== resolvedService?.id) setResolvedService(found);
    }, [services, draft?.serviceId, resolvedService?.id]);
    useEffect(() => {
        const found = specialists.find((p) => p.id === draft?.specialistId);
        if (found && found.id !== resolvedSpecialist?.id) setResolvedSpecialist(found);
    }, [specialists, draft?.specialistId, resolvedSpecialist?.id]);
    const childMap = useMemo(() => Object.fromEntries((draft?.childBookings ?? []).map((child) => [child.providerTypeId, child])), [draft?.childBookings]);
    const allRequiredUploadsPresent = useMemo(() => {
        const requiredIds = uploadRequirements.filter((x) => x.isRequired).map((x) => x.id);
        const uploadedIds = new Set((draft?.uploadFiles ?? []).map((x) => x.requirementId));
        return requiredIds.every((id) => uploadedIds.has(id));
    }, [uploadRequirements, draft?.uploadFiles]);
    const allChildBookingsCompleted = useMemo(() => addonProviderTypes.every((addon) => !addon.isRequired || childMap[addon.providerTypeId]), [addonProviderTypes, childMap]);
    function handlePick(slot: SlotKey, patch: Partial<BookingDraftState>) {
        if (!draft)
            return;
        if (slot === 'provider') {
            setServiceOffset(0);
            setSpecialistOffset(0);
            setServiceSearch('');
            setSpecialistSearch('');
            setServices([]);
            setSpecialists([]);
            setResolvedSpecialist(null);
            // Always stale: even when the service is carried across, it is a different
            // provider_services row at the new provider.
            setResolvedService(null);
        }
        if (slot === 'service') {
            setSpecialistOffset(0);
            setSpecialistSearch('');
            setSpecialists([]);
            setResolvedSpecialist(null);
            setAvailableDates([]);
            setTimeSlots([]);
        }
        setDraft((prev) => ({ ...(prev as BookingDraftState), ...patch }));
        patchDraft(patch).catch((e) => setError(e.message));
    }
    // Auto-confirm only what is provably the single option. Anything looser — a search that
    // narrowed to one, a first page of many, a slot the user opened — would be a silent guess
    // about money.
    useEffect(() => {
        if (!draft || currentStep !== 1 || resumeChoiceRequired || !seedEntryResolved)
            return;
        const pick = autoSelectId({
            ready: seedEntryResolved && !providersLoading,
            loading: providersLoading,
            search: providerSearchQuery,
            offset: providerOffset,
            touched: touchedSlots.provider,
            options: providers,
            total: providerTotal,
            hasMore: providerHasMore,
            selectedId: draft.providerId,
        });
        if (pick) {
            const item = providers.find((p) => p.id === pick)!;
            handlePick('provider', cascadeFor('provider', item, draft));
        }
    }, [draft?.providerId, draft?.serviceDefinitionId, providers, providerTotal, providerHasMore, providersLoading, providerSearchQuery, providerOffset, touchedSlots.provider, currentStep, resumeChoiceRequired, seedEntryResolved]);
    useEffect(() => {
        if (!draft || currentStep !== 1 || resumeChoiceRequired || !seedEntryResolved || !draft.providerId)
            return;
        const pick = autoSelectId({
            ready: seedEntryResolved && !servicesLoading,
            loading: servicesLoading,
            search: serviceSearchQuery,
            offset: serviceOffset,
            touched: touchedSlots.service,
            options: services,
            total: serviceTotal,
            hasMore: serviceHasMore,
            selectedId: draft.serviceId,
        });
        if (pick) {
            const item = services.find((p) => p.id === pick)!;
            handlePick('service', cascadeFor('service', item, draft));
        }
    }, [draft?.providerId, draft?.serviceId, services, serviceTotal, serviceHasMore, servicesLoading, serviceSearchQuery, serviceOffset, touchedSlots.service, currentStep, resumeChoiceRequired, seedEntryResolved]);
    useEffect(() => {
        // `requiresSpecialist === true`, not truthiness: it is undefined until /service-mode
        // lands, and auto-selecting then would set a specialistId that the service-mode
        // handler immediately clears for a service that never needed one.
        if (!draft || currentStep !== 1 || resumeChoiceRequired || !seedEntryResolved || draft.requiresSpecialist !== true)
            return;
        const pick = autoSelectId({
            ready: seedEntryResolved && !specialistsLoading,
            loading: specialistsLoading,
            search: specialistSearchQuery,
            offset: specialistOffset,
            touched: touchedSlots.specialist,
            options: specialists,
            total: specialistTotal,
            hasMore: specialistHasMore,
            selectedId: draft.specialistId,
        });
        if (pick) {
            const item = specialists.find((p) => p.id === pick)!;
            handlePick('specialist', cascadeFor('specialist', item, draft));
        }
    }, [draft?.serviceId, draft?.specialistId, draft?.requiresSpecialist, specialists, specialistTotal, specialistHasMore, specialistsLoading, specialistSearchQuery, specialistOffset, touchedSlots.specialist, currentStep, resumeChoiceRequired, seedEntryResolved]);
    const canContinueServiceStep = canContinueService({ draft: draft ?? { providerId: null, serviceId: null, specialistId: null, requiresSpecialist: undefined } as any });
    const canContinueScheduleStep = Boolean(draft && (draft.bookingUiMode === 'custom_form'
        ? draft.formSubmissionId
        : draft.bookingUiMode === 'date_range'
            ? draft.selectedDateFrom && draft.selectedDateTo && dateRangeAvailability?.available !== false
            : draft.selectedDate && draft.selectedTimeFrom && draft.selectedTimeTo));
    const canContinueAddonsStep = allChildBookingsCompleted;
    const canContinueFilesStep = allRequiredUploadsPresent;
    function goNext() {
        if (!draft)
            return;
        const next = currentStep === 2 && !draft.useLsevin ? 5 : Math.min(currentStep + 1, 5);
        patchDraft({ currentStep: next }).catch((e) => setError(e.message));
    }
    function goBack() {
        if (!draft)
            return;
        if (currentStep === 1) {
            router.back();
            return;
        }
        const previous = currentStep === 5 && !draft.useLsevin ? 2 : currentStep - 1;
        patchDraft({ currentStep: previous }).catch((e) => setError(e.message));
    }
    async function refreshDraftAfterPriceChange() {
        const result = await getJson<{
            draft: BookingDraftState | null;
        }>('/api/booking-pro/draft');
        if (result.draft)
            setDraft(result.draft);
    }
    async function handleApplyCoupon() {
        if (!draft?.id || !couponCode.trim())
            return;
        setCouponLoading(true);
        setError(null);
        try {
            await getJson('/api/booking-pro/coupon', {
                method: 'POST',
                body: JSON.stringify({ draftId: draft.id, couponCode: couponCode.trim() }),
            });
            await refreshDraftAfterPriceChange();
        }
        catch (e: any) {
            setError(e.message || tBooking('failedToApplyCoupon'));
        }
        finally {
            setCouponLoading(false);
        }
    }
    async function handleRemoveCoupon() {
        if (!draft?.id)
            return;
        setCouponLoading(true);
        setError(null);
        try {
            await getJson('/api/booking-pro/coupon', {
                method: 'DELETE',
                body: JSON.stringify({ draftId: draft.id }),
            });
            setCouponCode('');
            await refreshDraftAfterPriceChange();
        }
        catch (e: any) {
            setError(e.message || tBooking('failedToRemoveCoupon'));
        }
        finally {
            setCouponLoading(false);
        }
    }
    async function startPaymentForBooking(bookingId: string) {
        const result = await getJson('/api/booking-pro/payments/create-intent', {
            method: 'POST',
            body: JSON.stringify({
                bookingId,
                paymentMethodCode: draft?.paymentMethod || 'gateway_card',
                returnUrl: typeof window !== 'undefined' ? window.location.href : undefined,
            }),
        });
        setPaymentIntentResult(result);
        const actionUrl = getPaymentActionUrl(result);
        if (actionUrl && typeof window !== 'undefined') {
            window.location.assign(actionUrl);
        }
        return result;
    }
    async function handleCheckout() {
        if (!draft?.id)
            return;
        setSubmitting(true);
        setError(null);
        try {
            const result = await getJson('/api/booking-pro/checkout', {
                method: 'POST',
                body: JSON.stringify({ draftId: draft.id, paymentMethod: draft.paymentMethod || 'gateway_card' }),
            });
            setCheckoutResult(result);
            const dueNow = Number((result as any)?.dueNowAmount ?? (result as any)?.totalAmount ?? 0);
            const paymentStatus = String((result as any)?.paymentStatus ?? '').toLowerCase();
            if (dueNow > 0 && paymentStatus !== 'notrequired') {
                await startPaymentForBooking((result as any).bookingId);
            }
        }
        catch (e: any) {
            setError(e.message || tBooking('checkoutFailed'));
        }
        finally {
            setSubmitting(false);
        }
    }
    async function handleCreatePaymentIntent() {
        if (!checkoutResult?.bookingId)
            return;
        setSubmitting(true);
        setError(null);
        try {
            await startPaymentForBooking(checkoutResult.bookingId);
        }
        catch (e: any) {
            setError(e.message || tBooking('failedToStartPayment'));
        }
        finally {
            setSubmitting(false);
        }
    }
    const continueDisabled = (currentStep === 1 && !canContinueServiceStep) ||
        (currentStep === 2 && !canContinueScheduleStep) ||
        (currentStep === 3 && !canContinueAddonsStep) ||
        (currentStep === 4 && !canContinueFilesStep) ||
        (currentStep === 5 && submitting);
    function handlePrimaryAction() {
        if (currentStep === 5) {
            if (checkoutResult?.bookingId)
                handleCreatePaymentIntent();
            else
                handleCheckout();
            return;
        }
        goNext();
    }
    if (loadingDraft || !draft) {
        return <div className="min-h-screen bg-slate-50 p-6 text-sm text-slate-500">{tBooking("loadingBooking")}</div>;
    }
    if (resumeChoiceRequired) {
        return (<div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
        <div className="mx-auto max-w-2xl rounded-[28px] border border-slate-200 bg-white p-8 shadow-2xl">
          <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[#083f30] text-white"><RefreshCcw className="h-6 w-6"/></div>
          <h1 className="text-2xl font-bold text-slate-900">{tBooking("continueYourPendingBooking")}</h1>
          <p className="mt-2 text-sm text-slate-600">{tBooking("onlyOneActiveBookingDraftExistsPerUserYou")}</p>
          <div className="mt-6 rounded-3xl border border-[#083f30]/10 bg-[#083f30]/5 p-5">
            <div className="text-sm text-slate-700">{tBooking("currentDraftStep")}<span className="font-bold text-[#083f30]">{tBooking(visibleSteps.find((s) => s.key === currentStep)?.labelKey ?? steps.find((s) => s.key === currentStep)?.labelKey ?? 'stepService')}</span></div>
            <div className="mt-2 text-sm text-slate-600">{tBooking("provider2")}{draft.providerId || tBooking('notSelected')}{tBooking("service3")}{draft.serviceId || tBooking('notSelected')}{tBooking("addOnSubBookings")}{draft.childBookings.length}</div>
          </div>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <button className="flex-1 rounded-2xl bg-[#083f30] px-5 py-3 font-bold text-white shadow-lg" onClick={() => setResumeChoiceRequired(false)}>{tBooking("continuePendingBooking")}</button>
            <button className="flex-1 rounded-2xl border border-slate-200 bg-white px-5 py-3 font-bold text-slate-700" onClick={async () => { await getJson('/api/booking-pro/draft', { method: 'PATCH', body: JSON.stringify({ action: 'abandon' }) }); const created = await getJson<{
            draft: BookingDraftState;
        }>('/api/booking-pro/draft', { method: 'POST' }); setDraft(created.draft); setResumeChoiceRequired(false); }}>{tBooking("discardAndStartNew")}</button>
          </div>
        </div>
      </div>);
    }
    // pb clears the sticky action bar *and* the global BottomTabBar stacked beneath it.
    return (<div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 pb-44 lg:pb-10">
      <div className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto max-w-6xl px-5 py-4">
          <div className="mb-4 flex items-center gap-3">
            <button onClick={goBack} className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-700"><ArrowLeft className="h-5 w-5"/></button>
            <div>
              <h1 className="text-xl font-bold text-slate-900">{tBooking("bookWithLSevin")}</h1>
              <p className="text-sm text-slate-500">{tBooking("draftFirstBookingWithChildAddOnSubBookings")}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto">
            {visibleSteps.map((step, index) => (<div key={step.key} className="flex items-center gap-2">
                <div className={`flex h-9 min-w-9 items-center justify-center rounded-full text-sm font-bold ${currentStep >= step.key ? 'bg-[#083f30] text-white' : 'bg-slate-200 text-slate-500'}`}>{currentStep > step.key ? <CheckCircle2 className="h-4 w-4"/> : step.key}</div>
                <div className={`text-sm font-medium ${currentStep >= step.key ? 'text-[#083f30]' : 'text-slate-500'}`}>{tBooking(step.labelKey)}</div>
                {index < visibleSteps.length - 1 ? <div className={`mx-2 h-0.5 w-10 ${currentStep > step.key ? 'bg-[#083f30]' : 'bg-slate-200'}`}/> : null}
              </div>))}
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-6xl gap-6 px-5 py-6 lg:grid-cols-[1fr_360px]">
        {/* min-w-0: grid items default to min-width:auto, so a single unshrinkable descendant
            widens the whole column and scrolls the page sideways. */}
        <div className="min-w-0 space-y-6">
          {error ? <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div> : null}

          {currentStep === 1 ? (<DecisionStack draft={draft} entryResolved={seedEntryResolved} entryFailed={entryFailed} onRetryEntry={() => { setEntryFailed(false); setEntryAttempt((x) => x + 1); }} seeded={{ providerId: seededProviderId, serviceId: seededServiceId, specialistId: seededSpecialistId }} onPick={handlePick} onSlotTouched={(slot) => setTouchedSlots((prev) => ({ ...prev, [slot]: true }))} formatMoney={formatMoney} formatDate={(iso) => formatBookingDate(iso, { locale, calendar })} provider={{
                items: providers,
                total: providerTotal,
                hasMore: providerHasMore,
                loading: providersLoading || !seedEntryResolved,
                search: providerSearch,
                onSearchChange: (v) => { setProviderOffset(0); setProviders([]); setProviderHasMore(false); setProviderSearch(v); },
                onLoadMore: () => setProviderOffset((x) => x + 8),
                resolved: chosenProvider ?? null,
            }} service={{
                items: services,
                total: serviceTotal,
                hasMore: serviceHasMore,
                loading: servicesLoading || !seedEntryResolved,
                search: serviceSearch,
                onSearchChange: (v) => { setServiceOffset(0); setServices([]); setServiceHasMore(false); setServiceSearch(v); },
                onLoadMore: () => setServiceOffset((x) => x + 8),
                resolved: chosenService ?? null,
            }} specialist={{
                items: specialists,
                total: specialistTotal,
                hasMore: specialistHasMore,
                loading: specialistsLoading || !seedEntryResolved,
                search: specialistSearch,
                onSearchChange: (v) => { setSpecialistOffset(0); setSpecialists([]); setSpecialistHasMore(false); setSpecialistSearch(v); },
                onLoadMore: () => setSpecialistOffset((x) => x + 8),
                resolved: chosenSpecialist ?? null,
            }}/>) : null}

          {currentStep === 2 ? (<div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-lg">
              <h2 className="mb-4 text-xl font-bold text-slate-900">{tBooking("scheduleAndBookingDetails")}</h2>
              {draft.bookingUiMode === 'default_slot' ? (<div className="space-y-6">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-slate-700">{tBooking("calendar")}</div>
                      <div className="mt-2 flex rounded-2xl bg-slate-100 p-1">
                        {(['gregorian', 'jalali'] as const).map((item) => (<button key={item} type="button" onClick={() => setCalendar(item)} className={`rounded-xl px-4 py-2 text-sm font-bold ${calendar === item ? 'bg-white text-[#083f30] shadow-sm' : 'text-slate-500'}`}>
                            {item === 'gregorian' ? tBooking('gregorian') : tBooking('jalaliPersian')}
                          </button>))}
                      </div>
                    </div>

                    <div className="min-w-[260px] text-sm font-semibold text-slate-700">
                      <span>{calendar === 'jalali' ? tBooking('selectJalaliDate') : tBooking('selectGregorianDate')}</span>
                      <div className="mt-2">
                        {calendar === 'jalali' ? (<PersianDateTimePicker value={isReasonableBookingIsoDate(draft.selectedDate) ? draft.selectedDate : ''} mode="date" onChange={(value) => {
                        const iso = toIsoDate(String(value || '').slice(0, 10));
                        if (!iso || !isReasonableBookingIsoDate(iso)) {
                            setError(tBooking('pleaseSelectAValidBookingDate'));
                            return;
                        }
                        const next = { ...draft, selectedDate: iso, selectedDateFrom: iso, selectedDateTo: iso, selectedTime: undefined, selectedTimeFrom: undefined, selectedTimeTo: undefined };
                        setDraft(next);
                        patchDraft(next).catch((er) => setError(er.message));
                    }}/>) : (<input type="date" value={isReasonableBookingIsoDate(draft.selectedDate) ? draft.selectedDate ?? '' : ''} onChange={(e) => {
                        const iso = toIsoDate(e.target.value);
                        if (!iso || !isReasonableBookingIsoDate(iso)) {
                            setError(tBooking('pleaseSelectAValidBookingDate'));
                            return;
                        }
                        const next = { ...draft, selectedDate: iso, selectedDateFrom: iso, selectedDateTo: iso, selectedTime: undefined, selectedTimeFrom: undefined, selectedTimeTo: undefined };
                        setDraft(next);
                        patchDraft(next).catch((er) => setError(er.message));
                    }} className="h-12 w-full rounded-2xl border border-slate-200 px-4 outline-none focus:border-[#155e75]"/>)}
                      </div>
                      {!isReasonableBookingIsoDate(draft.selectedDate) && draft.selectedDate ? (<p className="mt-2 text-xs text-red-600">{tBooking("thisDraftContainsAnOldInvalidConvertedDatePlease")}</p>) : null}
                    </div>
                  </div>

                  <div>
                    <div className="mb-3 flex items-center justify-between">
                      <div className="text-sm font-bold text-slate-900">{tBooking("availableDates")}</div>
                      {scheduleLoading ? <div className="text-xs text-slate-500">{tBooking("loadingAvailability")}</div> : null}
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {availableDates.filter((item) => item.available).slice(0, 18).map((item) => (<button key={item.date} type="button" onClick={() => {
                        const next = { ...draft, selectedDate: item.date, selectedDateFrom: item.date, selectedDateTo: item.date, selectedTime: undefined, selectedTimeFrom: undefined, selectedTimeTo: undefined };
                        setDraft(next);
                        patchDraft(next).catch((er) => setError(er.message));
                    }} className={`rounded-2xl border p-4 text-left transition ${draft.selectedDate === item.date ? 'border-[#083f30] bg-[#083f30]/5' : 'border-slate-200 bg-white hover:border-[#155e75]'}`}>
                          <div className="text-sm font-bold text-slate-900">{item.displayDate}</div>
                          <div className="mt-1 text-xs text-slate-500">{item.day} · {item.date}</div>
                        </button>))}
                    </div>
                    {!scheduleLoading && availableDates.filter((item) => item.available).length === 0 ? (<div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">{tBooking("noAvailableDatesFoundForThisProviderServiceSpecialist")}</div>) : null}
                  </div>

                  {draft.selectedDate ? (<div>
                      <div className="mb-3 text-sm font-bold text-slate-900">{tBooking("availableTimeSlotsFor")}{formatBookingDate(draft.selectedDate, { locale, calendar })}</div>
                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        {timeSlots.map((slot) => {
                        const selected = draft.selectedTimeFrom === slot.time && draft.selectedTimeTo === slot.endTime;
                        return (<button key={`${slot.time}-${slot.endTime}`} type="button" disabled={!slot.available} onClick={() => {
                                const fallbackEnd = slot.endTime || addMinutes(slot.time, chosenService?.durationMinutes ?? 30);
                                const next = { ...draft, selectedTime: slot.time, selectedTimeFrom: slot.time, selectedTimeTo: fallbackEnd };
                                setDraft(next);
                                patchDraft(next).catch((er) => setError(er.message));
                            }} className={`rounded-2xl border p-4 text-left transition ${selected ? 'border-[#083f30] bg-[#083f30]/5' : 'border-slate-200 bg-white'} ${slot.available ? 'hover:border-[#155e75]' : 'cursor-not-allowed opacity-40'}`}>
                              <div className="text-sm font-bold text-slate-900">{slot.label}</div>
                              <div className="mt-1 text-xs text-slate-500">{tBooking("toTime", { time: slot.endLabel })}</div>
                              {typeof slot.remainingCapacity === 'number' && !draft.specialistId ? (<div className="mt-2 text-[11px] font-semibold text-slate-500">{slot.remainingCapacity}{tBooking("capacityLeft")}</div>) : null}
                            </button>);
                    })}
                      </div>
                    </div>) : null}
                </div>) : null}

              {draft.bookingUiMode === 'date_range' ? (<div className="grid gap-4 md:grid-cols-4">
                  <label className="text-sm font-semibold text-slate-700">{tBooking("fromDate")}{calendar === 'jalali' ? (<PersianDateTimePicker value={isReasonableBookingIsoDate(draft.selectedDateFrom) ? draft.selectedDateFrom : ''} onChange={(value) => { const iso = toIsoDate(String(value || '').slice(0, 10)); if (!iso)
                    return; const next = { ...draft, selectedDateFrom: iso }; setDraft(next); patchDraft(next).catch((er) => setError(er.message)); }} className="mt-2"/>) : (<input type="date" value={isReasonableBookingIsoDate(draft.selectedDateFrom) ? draft.selectedDateFrom ?? '' : ''} onChange={(e) => { const next = { ...draft, selectedDateFrom: e.target.value }; setDraft(next); patchDraft(next).catch((er) => setError(er.message)); }} className="mt-2 h-12 w-full rounded-2xl border border-slate-200 px-4 outline-none focus:border-[#155e75]"/>)}
                  </label>
                  <label className="text-sm font-semibold text-slate-700">{tBooking("toDate")}{calendar === 'jalali' ? (<PersianDateTimePicker value={isReasonableBookingIsoDate(draft.selectedDateTo) ? draft.selectedDateTo : ''} onChange={(value) => { const iso = toIsoDate(String(value || '').slice(0, 10)); if (!iso)
                    return; const next = { ...draft, selectedDateTo: iso }; setDraft(next); patchDraft(next).catch((er) => setError(er.message)); }} className="mt-2"/>) : (<input type="date" value={isReasonableBookingIsoDate(draft.selectedDateTo) ? draft.selectedDateTo ?? '' : ''} onChange={(e) => { const next = { ...draft, selectedDateTo: e.target.value }; setDraft(next); patchDraft(next).catch((er) => setError(er.message)); }} className="mt-2 h-12 w-full rounded-2xl border border-slate-200 px-4 outline-none focus:border-[#155e75]"/>)}
                  </label>
                  <label className="text-sm font-semibold text-slate-700">{tBooking("adults")}<input type="number" min={1} value={draft.adults ?? 1} onChange={(e) => { const next = { ...draft, adults: Number(e.target.value || 1) }; setDraft(next); patchDraft(next).catch((er) => setError(er.message)); }} className="mt-2 h-12 w-full rounded-2xl border border-slate-200 px-4 outline-none focus:border-[#155e75]"/></label>
                  <label className="text-sm font-semibold text-slate-700">{tBooking("rooms")}<input type="number" min={1} value={draft.rooms ?? 1} onChange={(e) => { const next = { ...draft, rooms: Number(e.target.value || 1) }; setDraft(next); patchDraft(next).catch((er) => setError(er.message)); }} className="mt-2 h-12 w-full rounded-2xl border border-slate-200 px-4 outline-none focus:border-[#155e75]"/></label>
                  <div className="md:col-span-4">
                    {rangeAvailabilityLoading ? (<div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">{tBooking("checkingServiceResourceAvailability")}</div>) : dateRangeAvailability ? (<div className={`rounded-2xl border p-4 text-sm ${dateRangeAvailability.available ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-red-200 bg-red-50 text-red-700'}`}>
                        {dateRangeAvailability.available
                        ? tBooking('availableMinimumRemainingCapacity', { capacity: dateRangeAvailability.remainingCapacity })
                        : dateRangeAvailability.message || tBooking('thisDateRangeIsNotAvailable')}
                        {!dateRangeAvailability.available && dateRangeAvailability.unavailableDates?.length ? (<div className="mt-2 text-xs">{tBooking("unavailableDates")}{dateRangeAvailability.unavailableDates.join(', ')}</div>) : null}
                      </div>) : (<div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">{tBooking("selectDatesAndUnitsToCheckServiceResourceAvailability")}</div>)}
                  </div>
                </div>) : null}

              {draft.bookingUiMode === 'custom_form' && mainServiceForm ? (<DynamicServiceForm form={mainServiceForm} locales={[locale]} onSubmit={async (values) => {
                    const res = await getJson<{
                        submissionId: string;
                    }>('/api/form-builder/submissions', {
                        method: 'POST',
                        body: JSON.stringify({
                            formVersionId: mainServiceForm.formVersionId,
                            serviceDefinitionId: draft.serviceDefinitionId,
                            bookingDraftId: draft.id,
                            status: 'submitted',
                            payload: values,
                        }),
                    });
                    const next = { ...draft, formSubmissionId: res.submissionId };
                    setDraft(next);
                    patchDraft({ formSubmissionId: res.submissionId }).catch((er) => setError(er.message));
                }} submitLabel={tBooking("saveFormAndContinue")}/>) : null}

              <div className="mt-6 rounded-3xl border border-[#083f30]/15 bg-[#083f30]/5 p-5">
                <label className="flex cursor-pointer items-start gap-3">
                  <input type="checkbox" checked={Boolean(draft.useLsevin)} onChange={(event) => {
                const useLsevin = event.target.checked;
                const next = { ...draft, useLsevin, currentStep: 2 };
                setDraft(next);
                patchDraft({ useLsevin, currentStep: 2 }).catch((er) => setError(er.message));
            }} className="mt-1 h-5 w-5 rounded border-slate-300 text-[#083f30] focus:ring-[#083f30]"/>
                  <span>
                    <span className="block text-sm font-bold text-slate-900">{tBooking("iWantLSevinToArrangeExtraSupportServicesFor")}</span>
                    <span className="mt-1 block text-xs leading-5 text-slate-600">{tBooking("chooseThisIfYouWantHelpWithRelatedServices")}</span>
                  </span>
                </label>
              </div>
            </div>) : null}

          {currentStep === 3 ? (<div className="space-y-4">
              <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-lg">
                <h2 className="text-xl font-bold text-slate-900">{tBooking("addOnSubBookings2")}</h2>
                <p className="mt-2 text-sm text-slate-600">{tBooking("everySelectedProviderTypeAddOnStartsAnEmbedded")}</p>
              </div>
              {addonProviderTypes.map((addon) => (<ChildAddonBookingCard key={addon.providerTypeId} locale={locale} draftId={draft.id!} addon={addon} value={childMap[addon.providerTypeId]} onChange={(next) => setDraft((prev) => ({ ...(prev as BookingDraftState), childBookings: [...(prev?.childBookings ?? []).filter((x) => x.providerTypeId !== next.providerTypeId), next] }))} onSaved={(next, totals) => setDraft((prev) => ({ ...(prev as BookingDraftState), childBookings: [...(prev?.childBookings ?? []).filter((x) => x.providerTypeId !== next.providerTypeId), next], ...(totals ?? {}) }))}/>))}
            </div>) : null}

          {currentStep === 4 ? (<div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-lg">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#083f30]/10 text-[#083f30]"><FileStack className="h-5 w-5"/></div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">{tBooking("requiredFiles")}</h2>
                  <p className="text-sm text-slate-600">{tBooking("theseRequirementsComeFromTheSelectedServiceDefinitionUse")}</p>
                </div>
              </div>
              <div className="space-y-4">
                {uploadRequirements.map((item) => {
                const existing = (draft.uploadFiles ?? []).find((x) => x.requirementId === item.id);
                return (<div key={item.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                      <div className="mb-2 text-sm font-bold text-slate-900">{item.title} {item.isRequired ? <span className="text-red-500">*</span> : null}</div>
                      {item.description ? <RichTextPreview content={item.description} className="mb-3 text-xs text-slate-500"/> : null}
                      <input type="text" value={existing?.fileUrl ?? existing?.mediaIds ?? ''} onChange={(e) => {
                        const nextFiles = [
                            ...(draft.uploadFiles ?? []).filter((x) => x.requirementId !== item.id),
                            { requirementId: item.id, title: item.title, fileUrl: e.target.value, mediaIds: e.target.value },
                        ];
                        const next = { ...draft, uploadFiles: nextFiles };
                        setDraft(next);
                    }} placeholder={tBooking("useRHFSingleMediaPickerFieldRHFMultiMediaPickerFieldHiddenValueHere")} className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 outline-none focus:border-[#155e75]"/>
                    </div>);
            })}
              </div>
              <button type="button" onClick={() => getJson('/api/booking-pro/draft', { method: 'PATCH', body: JSON.stringify({ action: 'documents', draftId: draft.id, documents: draft.uploadFiles }) }).then(() => { }).catch((e) => setError(e.message))} className="mt-5 rounded-2xl bg-[#083f30] px-5 py-3 text-sm font-bold text-white shadow-lg">{tBooking("saveFileSelections")}</button>
            </div>) : null}

          {currentStep === 5 ? (<div className="space-y-4">
              <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-lg">
                <h2 className="text-xl font-bold text-slate-900">{tBooking("reviewAndPay")}</h2>
                <div className="mt-4 space-y-3 text-sm text-slate-700">
                  <div className="flex justify-between"><span>{tBooking("mainBooking")}</span><span>{chosenProvider?.name} / {chosenService?.name}{chosenSpecialist ? ` / ${chosenSpecialist.name}` : ''}</span></div>
                  <div className="flex justify-between"><span>{tBooking("mainSubtotal")}</span><span>{draft.currency} {draft.subtotalAmount ?? 0}</span></div>
                  {draft.useLsevin ? <>
                    <div className="flex justify-between"><span>{tBooking("addOnSubBookings2")}</span><span>{draft.childBookings.length}</span></div>
                    <div className="flex justify-between"><span>{tBooking("addOnSubtotal")}</span><span>{draft.currency} {draft.addonsAmount ?? 0}</span></div>
                  </> : <div className="rounded-2xl bg-slate-50 p-3 text-xs text-slate-600">{tBooking("extraLSevinSupportServicesWereNotRequestedForThis")}</div>}
                  {Number(draft.metadata?.appliedDiscountAmount ?? 0) > 0 ? (<div className="flex justify-between text-green-700"><span>{tBooking("couponDiscount")}{String(draft.metadata?.appliedCouponCode ?? draft.metadata?.couponCode ?? '')})</span><span>-{draft.currency} {Number(draft.metadata?.appliedDiscountAmount ?? 0)}</span></div>) : null}
                  <div className="flex justify-between border-t border-slate-200 pt-3 text-base font-bold text-slate-900"><span>{tBooking("totalAfterDiscounts")}</span><span>{draft.currency} {draft.totalAmount ?? 0}</span></div>
                  <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="text-sm font-semibold text-slate-700">{tBooking("coupon")}</div>
                    <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                      <input value={couponCode} onChange={(event) => setCouponCode(event.target.value)} placeholder={tBooking("enterCouponCode")} className="h-11 flex-1 rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none focus:border-[#155e75]"/>
                      <button type="button" disabled={couponLoading || !couponCode.trim()} onClick={handleApplyCoupon} className="rounded-2xl bg-[#083f30] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{tBooking("apply")}</button>
                      {draft.metadata?.appliedCouponCode || draft.metadata?.couponCode ? (<button type="button" disabled={couponLoading} onClick={handleRemoveCoupon} className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 disabled:opacity-50">{tBooking("remove")}</button>) : null}
                    </div>
                    {draft.metadata?.couponTitle ? <div className="mt-2 text-xs text-green-700">{tBooking("applied")}{String(draft.metadata.couponTitle)}</div> : null}
                  </div>
                  <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div>
                      <div className="text-sm font-semibold text-slate-700">{tBooking("paymentMethod2")}</div>
                      <div className="mt-2">
                        <PaymentMethodsPanel selected={draft.paymentMethod ?? 'gateway_card'} onChange={(code) => {
                const next = { ...draft, paymentMethod: code };
                setDraft(next);
                patchDraft({ paymentMethod: code }).catch((er) => setError(er.message));
            }}/>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              {checkoutResult ? (<div className="rounded-[28px] border border-green-200 bg-green-50 p-6 text-green-800 shadow-lg">
                  <div className="text-lg font-bold">{tBooking("bookingSubmitted")}</div>
                  <div className="mt-2 text-sm">{tBooking("bookingID2")}{checkoutResult.bookingId}</div>
                  <div className="text-sm">{tBooking("paymentStatus")}{checkoutResult.paymentStatus}</div>
                  <button type="button" onClick={handleCreatePaymentIntent} className="mt-4 rounded-2xl bg-[#083f30] px-4 py-3 text-sm font-semibold text-white">{tBooking("continueToPayment")}</button>
                </div>) : null}

              {paymentIntentResult ? (<div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-lg">
                  <div className="text-lg font-bold text-slate-900">{tBooking("paymentAction")}</div>
                  <div className="mt-2 text-sm text-slate-600">{tBooking("method")}{paymentIntentResult.method}</div>
                  <div className="text-sm text-slate-600">{tBooking("status2")}{paymentIntentResult.status}</div>
                  {paymentIntentResult.instructions ? <div className="mt-3 rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">{paymentIntentResult.instructions}</div> : null}
                  {paymentIntentResult.actionUrl ? <a href={paymentIntentResult.actionUrl} className="mt-4 inline-flex rounded-2xl bg-[#083f30] px-4 py-3 text-sm font-semibold text-white">{tBooking("openGatewayAction")}</a> : null}
                </div>) : null}
            </div>) : null}
        </div>

        <aside className="min-w-0 space-y-4">
          {/* On mobile the decision rows already state the selections and the sticky bar
              carries the total, so this rail would only repeat them below the fold. */}
          <div className="hidden rounded-[28px] border border-slate-200 bg-white p-5 shadow-lg lg:block">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#eacb7f] text-[#083f30]"><ShieldCheck className="h-5 w-5"/></div>
              <div>
                <div className="font-bold text-slate-900">{tBooking("currentDraft")}</div>
                <div className="text-xs text-slate-500">{tBooking("onlyOneActivePendingBookingIsKeptForThis")}</div>
              </div>
            </div>
            <div className="space-y-2 text-sm text-slate-600">
              <div>{tBooking("provider2")}<span className="font-semibold text-slate-900">{chosenProvider?.name ?? tBooking('notSelected')}</span></div>
              <div>{tBooking("service2")}<span className="font-semibold text-slate-900">{chosenService?.name ?? tBooking('notSelected')}</span></div>
              <div>{tBooking("specialist2")}<span className="font-semibold text-slate-900">{draft.requiresSpecialist ? (chosenSpecialist?.name ?? tBooking('notSelected')) : tBooking('notRequired')}</span></div>
              <div>{tBooking("mode")}<span className="font-semibold text-slate-900">{draft.bookingUiMode ?? 'default_slot'}</span></div>
            </div>
            <div className="mt-5 rounded-2xl bg-slate-50 p-4">
              <div className="flex justify-between text-sm"><span>{tBooking("mainSubtotal")}</span><span>{draft.currency ?? 'USD'} {draft.subtotalAmount ?? 0}</span></div>
              {draft.useLsevin ? <div className="mt-1 flex justify-between text-sm"><span>{tBooking("addOnsSubtotal")}</span><span>{draft.currency ?? 'USD'} {draft.addonsAmount ?? 0}</span></div> : null}
              <div className="mt-3 flex justify-between border-t border-slate-200 pt-3 text-base font-bold text-slate-900"><span>{tBooking("total")}</span><span>{draft.currency ?? 'USD'} {draft.totalAmount ?? ((draft.subtotalAmount ?? 0) + (draft.addonsAmount ?? 0))}</span></div>
            </div>
          </div>

          {/* Desktop keeps the CTA in the rail; mobile gets the sticky bar below. */}
          <div className="hidden rounded-[28px] border border-slate-200 bg-white p-5 shadow-lg lg:block">
            <div className="mb-4 text-sm font-bold uppercase tracking-wide text-slate-500">{tBooking("continue")}</div>
            <button type="button" disabled={continueDisabled} onClick={handlePrimaryAction} className={`flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-4 text-sm font-bold shadow-lg ${continueDisabled ? 'bg-slate-200 text-slate-500' : 'bg-[#083f30] text-white'}`}>
              {currentStep === 5 ? <CreditCard className="h-4 w-4"/> : <ChevronRight className="h-4 w-4"/>}
              {currentStep === 5 ? tBooking('submitCombinedCheckout') : tBooking('continue')}
            </button>
            {currentStep === 3 ? <div className="mt-3 text-xs text-slate-500">{tBooking("requiredAddOnProviderTypesMustBeCompletedBefore")}</div> : null}
          </div>
        </aside>
      </div>

      {/* The primary action was stranded at the bottom of the page on the very viewport this
          route is named for. Sits at bottom-20 to clear the global BottomTabBar
          (mobile-components.tsx:24 — fixed bottom-0, 77px tall, z-50), which would otherwise
          cover it exactly. */}
      <div className="fixed inset-x-0 bottom-20 z-40 border-y border-slate-200 bg-white/95 px-5 py-3 backdrop-blur-xl lg:hidden">
        <div className="mx-auto flex max-w-6xl items-center gap-3">
          <div className="min-w-0 flex-1">
            <div className="text-[11px] text-slate-500">{tBooking('total')}</div>
            <div className="truncate text-sm font-bold text-slate-900">{formatMoney(draft.totalAmount ?? ((draft.subtotalAmount ?? 0) + (draft.addonsAmount ?? 0)), draft.currency)}</div>
          </div>
          <button type="button" disabled={continueDisabled} onClick={handlePrimaryAction} className={`flex shrink-0 items-center justify-center gap-2 rounded-2xl px-6 py-3.5 text-sm font-bold shadow-lg ${continueDisabled ? 'bg-slate-200 text-slate-500' : 'bg-[#083f30] text-white'}`}>
            {currentStep === 5 ? <CreditCard className="h-4 w-4"/> : <ChevronRight className="h-4 w-4"/>}
            {currentStep === 5 ? tBooking('submitCombinedCheckout') : tBooking('continue')}
          </button>
        </div>
      </div>
    </div>);
}
